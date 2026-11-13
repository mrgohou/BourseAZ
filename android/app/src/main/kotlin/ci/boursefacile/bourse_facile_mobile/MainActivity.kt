package ci.boursefacile.bourse_facile_mobile

import android.graphics.RectF
import com.tom_roush.pdfbox.android.PDFBoxResourceLoader
import com.tom_roush.pdfbox.pdmodel.PDDocument
import com.tom_roush.pdfbox.text.PDFTextStripper
import com.tom_roush.pdfbox.text.PDFTextStripperByArea
import com.tom_roush.pdfbox.text.TextPosition
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.util.concurrent.Executors

class MainActivity : FlutterActivity() {
    private val worker = Executors.newSingleThreadExecutor()
    override fun configureFlutterEngine(engine: FlutterEngine) {
        super.configureFlutterEngine(engine)
        PDFBoxResourceLoader.init(applicationContext)
        MethodChannel(engine.dartExecutor.binaryMessenger, "ci.boursefacile/documents").setMethodCallHandler { call, result ->
            if (call.method != "extractPdf") { result.notImplemented(); return@setMethodCallHandler }
            val bytes = call.arguments as? ByteArray
            if (bytes == null || bytes.size > 18000000) { result.error("PDF", "Document invalide", null); return@setMethodCallHandler }
            worker.execute {
                try {
                    val output = extract(bytes)
                    runOnUiThread { result.success(output) }
                } catch (e: Exception) {
                    runOnUiThread { result.error("PDF", "Le document ne permet pas une extraction fiable", null) }
                }
            }
        }
    }
    private fun extract(bytes: ByteArray): Map<String, Any> = PDDocument.load(bytes).use { doc ->
        if (doc.numberOfPages > 350) throw IllegalArgumentException("Too many pages")
        val stripper = PDFTextStripper().apply { sortByPosition = true; endPage = minOf(doc.numberOfPages, 100) }
        val text = stripper.getText(doc).take(900000)
        val rows = mutableMapOf<String, Map<String, String>>()
        // BOC: extract named columns by PDF coordinates, never by guessing numeric order.
        var tablePage = -1
        for (pageIndex in 0 until minOf(doc.numberOfPages, 6)) {
            val page = doc.getPage(pageIndex)
            if (kotlin.math.abs(page.mediaBox.width - 595.44f) > 3f) continue
            val headerArea = PDFTextStripperByArea()
            headerArea.addRegion("head", RectF(355f, 65f, 585f, 110f)); headerArea.extractRegions(page)
            val header = headerArea.getTextForRegion("head")
            if (header.contains("dividende", true) && header.contains("PER")) tablePage = pageIndex
            if (tablePage < 0 || pageIndex > tablePage + 1) continue
            val glyphs = mutableListOf<TextPosition>()
            val collector = object : PDFTextStripper() {
                override fun writeString(value: String, positions: MutableList<TextPosition>) { glyphs.addAll(positions) }
            }
            collector.startPage = pageIndex + 1; collector.endPage = pageIndex + 1
            collector.getText(doc)
            val symbolGlyphs = glyphs.filter { it.xDirAdj >= 35 && it.xDirAdj < 65 }
            val lines = symbolGlyphs.groupBy { kotlin.math.round(it.yDirAdj * 2) / 2 }
            val areas = PDFTextStripperByArea().apply { sortByPosition = true }
            val candidates = mutableListOf<String>()
            for ((_, positions) in lines) {
                val symbol = positions.sortedBy { it.xDirAdj }.joinToString("") { it.unicode }.trim()
                if (!symbol.matches(Regex("[A-Z]{3,5}")) || symbol in listOf("CODE", "TITRE", "TOTAL")) continue
                val y = positions.first().yDirAdj
                if ((pageIndex == tablePage && y < 110) || y > 810) continue
                candidates.add(symbol)
                fun register(key: String, left: Float, right: Float, below: Float = 2f) {
                    areas.addRegion("$symbol-$key", RectF(left, y - 7, right, y + below))
                }
                register("previous",164f,195f); register("price",222f,250f); register("change",251f,282f)
                register("ytd",408f,449f); register("dividend",450f,492f); register("dividendDate",492f,530f)
                register("yield",530f,558f); register("per",558f,585f)
                register("sector",16f,33f,11f); register("name",66f,163f,10f)
            }
            if (candidates.isEmpty()) continue
            // A single page pass extracts all named cells; no repeated PDF parsing per ratio.
            areas.extractRegions(page)
            for (symbol in candidates) {
                fun cell(key: String): String = areas.getTextForRegion("$symbol-$key").replace(Regex("\\s+"), " ").trim()
                val change = cell("change").replace("%", "").trim()
                if (!change.matches(Regex("-?[0-9]+,[0-9]+"))) continue
                rows[symbol] = mapOf("previous" to cell("previous"), "price" to cell("price"), "change" to change,
                    "ytd" to cell("ytd").replace("%", "").trim(), "dividend" to cell("dividend"),
                    "dividendDate" to cell("dividendDate"), "yield" to cell("yield").replace("%", "").trim(),
                    "per" to cell("per"), "sector" to cell("sector"), "name" to cell("name"))
            }
        }
        mapOf("text" to text, "rows" to rows)
    }
    override fun onDestroy() { worker.shutdown(); super.onDestroy() }
}
