import Flutter
import UIKit
import PDFKit

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {
  private let documentsQueue = DispatchQueue(label: "ci.boursefacile.documents")
  override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)
    guard let registrar = engineBridge.pluginRegistry.registrar(forPlugin: "OfficialDocuments") else { return }
    let channel = FlutterMethodChannel(name: "ci.boursefacile/documents", binaryMessenger: registrar.messenger())
    channel.setMethodCallHandler { [weak self] call, result in
      guard call.method == "extractPdf" else { result(FlutterMethodNotImplemented); return }
      guard let bytes = call.arguments as? FlutterStandardTypedData, bytes.data.count <= 18_000_000 else {
        result(FlutterError(code: "PDF", message: "Document invalide", details: nil)); return
      }
      self?.documentsQueue.async {
        guard let doc = PDFDocument(data: bytes.data), doc.pageCount <= 350 else {
          DispatchQueue.main.async { result(FlutterError(code: "PDF", message: "Lecture indisponible", details: nil)) }; return
        }
        var text = "", rows: [String: [String: String]] = [:], tablePage = -1
        for i in 0..<min(doc.pageCount, 100) {
          guard let page = doc.page(at: i) else { continue }
          if text.count < 900_000 { text += (page.string ?? "") + "\n" }
          if i >= 6 { continue }
          let bounds = page.bounds(for: .mediaBox)
          if abs(bounds.width - 595.44) > 3 { continue }
          func region(_ left: CGFloat, _ top: CGFloat, _ right: CGFloat, _ bottom: CGFloat) -> String {
            let rectangle = CGRect(x: left, y: bounds.height - bottom, width: right-left, height: bottom-top)
            return (page.selection(for: rectangle)?.string ?? "").replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression).trimmingCharacters(in: .whitespacesAndNewlines)
          }
          let header = region(355, 65, 585, 110)
          if header.lowercased().contains("dividende") && header.contains("PER") { tablePage = i }
          if tablePage < 0 || i > tablePage + 1 { continue }
          let symbols = page.selection(for: CGRect(x: 35, y: 0, width: 30, height: bounds.height))?.selectionsByLine() ?? []
          for selection in symbols {
            let symbol = (selection.string ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            guard symbol.range(of: "^[A-Z]{3,5}$", options: .regularExpression) != nil, !["CODE", "TITRE", "TOTAL"].contains(symbol) else { continue }
            let box = selection.bounds(for: page), top = bounds.height - box.maxY - 1, bottom = bounds.height - box.minY + 1
            if (i == tablePage && top < 110) || top > 810 { continue }
            func cell(_ l: CGFloat, _ r: CGFloat, _ below: CGFloat = 0) -> String { region(l, top, r, bottom + below) }
            let change = cell(251, 282).replacingOccurrences(of: "%", with: "").trimmingCharacters(in: .whitespaces)
            guard change.range(of: "^-?[0-9]+,[0-9]+$", options: .regularExpression) != nil else { continue }
            rows[symbol] = ["previous": cell(164,195), "price": cell(222,250), "change": change, "ytd": cell(408,449).replacingOccurrences(of: "%",with: ""), "dividend": cell(450,492), "dividendDate": cell(492,530), "yield": cell(530,558).replacingOccurrences(of: "%",with: ""), "per": cell(558,585), "sector": cell(16,33,9), "name": cell(66,163,9)]
          }
        }
        DispatchQueue.main.async { result(["text": String(text.prefix(900_000)), "rows": rows]) }
      }
    }
  }
}
