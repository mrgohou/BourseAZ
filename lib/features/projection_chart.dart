import 'dart:math' as math;
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../core/accents.dart';

String _amount(num value) =>
    NumberFormat.decimalPattern('fr_FR').format(value.round());

// Annual observations only. The zero baseline and both series share one scale.
class ProjectionPlotData {
  final List<double> values;
  final List<double>? contributed;
  ProjectionPlotData(List<double> values, {List<double>? contributed})
    : values = List.unmodifiable(values),
      contributed = contributed == null ? null : List.unmodifiable(contributed);
  bool get available =>
      values.isNotEmpty &&
      values.every((n) => n.isFinite && n >= 0) &&
      (contributed == null ||
          contributed!.length == values.length &&
              contributed!.every((n) => n.isFinite && n >= 0));
  double get maximum =>
      available ? [...values, ...?contributed].fold<double>(0, math.max) : 0;
  double xAt(int index, double width) {
    final inset = math.min(16.0, width / 4);
    return values.length <= 1
        ? width / 2
        : inset + index * (width - 2 * inset) / (values.length - 1);
  }

  int indexAt(double x, double width) {
    if (values.length <= 1 || width <= 0) return 0;
    final inset = math.min(16.0, width / 4);
    return (((x - inset) / (width - 2 * inset)) * (values.length - 1))
        .round()
        .clamp(0, values.length - 1);
  }

  double yAt(double value, double height) =>
      height - 8 - (maximum == 0 ? 0 : value / maximum * (height - 16));
}

class ProjectionChart extends StatefulWidget {
  final List<double> values;
  final List<double>? contributed;
  const ProjectionChart(this.values, {super.key, this.contributed});
  @override
  State<ProjectionChart> createState() => _ProjectionChartState();
}

class _ProjectionChartState extends State<ProjectionChart> {
  int? selected;
  bool bars = false;
  @override
  void didUpdateWidget(covariant ProjectionChart oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!listEquals(oldWidget.values, widget.values) ||
        !listEquals(oldWidget.contributed, widget.contributed)) {
      selected = null;
    }
  }

  @override
  Widget build(BuildContext c) {
    final data = ProjectionPlotData(
      widget.values,
      contributed: widget.contributed,
    );
    if (!data.available) {
      return const Text(
        'Graphique indisponible : données annuelles manquantes ou invalides.',
      );
    }
    final year = (selected ?? data.values.length - 1).clamp(
      0,
      data.values.length - 1,
    );
    final s = Theme.of(c).colorScheme;
    final valueColor = bars ? Accents.ink(c, AccentTone.blue) : s.primary;
    final grossColor = Accents.ink(c, AccentTone.brown);
    final compact = NumberFormat.compact(locale: 'fr_FR');
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: s.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: s.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final mode in [false, true])
                ChoiceChip(
                  label: Text(mode ? 'Barres' : 'Courbe'),
                  selected: bars == mode,
                  selectedColor: Accents.surface(c, AccentTone.blue),
                  labelStyle: TextStyle(
                    color: bars == mode
                        ? Accents.ink(c, AccentTone.blue)
                        : s.onSurface,
                  ),
                  onSelected: (_) => setState(() => bars = mode),
                ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            'FCFA · simulation annuelle',
            style: Theme.of(c).textTheme.bodySmall,
          ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width:
                    48 *
                    (MediaQuery.textScalerOf(c).scale(16) / 16).clamp(1.0, 2.4),
                height: 160,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    for (final v in [data.maximum, data.maximum / 2, 0])
                      Text(
                        compact.format(v),
                        style: Theme.of(c).textTheme.bodySmall,
                      ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  children: [
                    LayoutBuilder(
                      builder: (c, box) => GestureDetector(
                        behavior: HitTestBehavior.opaque,
                        onTapDown: (details) => setState(
                          () => selected = data.indexAt(
                            details.localPosition.dx,
                            box.maxWidth,
                          ),
                        ),
                        child: Semantics(
                          image: true,
                          label:
                              'Simulation annuelle, ${data.values.length} observations. Échelle depuis zéro. Utilise le curseur pour lire les valeurs.',
                          child: SizedBox(
                            height: 160,
                            width: double.infinity,
                            child: CustomPaint(
                              painter: _ProjectionPainter(
                                data,
                                year,
                                bars,
                                valueColor,
                                grossColor,
                                Accents.surface(c, AccentTone.blue),
                                s.outlineVariant,
                                s.surface,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Flexible(
                          child: Text(
                            'An 0',
                            style: Theme.of(c).textTheme.bodySmall,
                          ),
                        ),
                        if (data.values.length > 1)
                          Flexible(
                            child: Text(
                              'An ${data.values.length - 1}',
                              style: Theme.of(c).textTheme.bodySmall,
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 14,
            runSpacing: 8,
            children: [
              _legend(c, valueColor, 'Valeur simulée', false),
              if (data.contributed != null)
                _legend(c, grossColor, 'Versements bruts', true),
            ],
          ),
          SliderTheme(
            data: SliderTheme.of(c).copyWith(
              activeTrackColor: valueColor,
              inactiveTrackColor: s.surfaceContainerHighest,
              thumbColor: valueColor,
            ),
            child: Slider(
              value: year.toDouble(),
              min: 0,
              max: (data.values.length - 1).toDouble(),
              divisions: data.values.length > 1 ? data.values.length - 1 : null,
              label: 'Année $year',
              semanticFormatterCallback: (v) =>
                  'Année ${v.round()}, ${_amount(data.values[v.round()])} FCFA',
              onChanged: data.values.length > 1
                  ? (v) => setState(() => selected = v.round())
                  : null,
            ),
          ),
          Semantics(
            liveRegion: true,
            child: Text(
              'Année $year · ${_amount(data.values[year])} FCFA',
              style: Theme.of(c).textTheme.titleMedium,
            ),
          ),
          if (data.contributed != null) ...[
            const SizedBox(height: 4),
            Text(
              'Versements bruts : ${_amount(data.contributed![year])} FCFA',
              style: Theme.of(c).textTheme.bodySmall,
            ),
          ],
          const SizedBox(height: 8),
          Text(
            'Hypothèses de simulation, pas un historique de cours.',
            style: Theme.of(c).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }

  Widget _legend(BuildContext c, Color color, String label, bool dashed) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Text(
        dashed ? '┄' : '━',
        style: TextStyle(color: color, fontWeight: FontWeight.w800),
      ),
      const SizedBox(width: 6),
      Flexible(child: Text(label, style: Theme.of(c).textTheme.bodySmall)),
    ],
  );
}

class _ProjectionPainter extends CustomPainter {
  final ProjectionPlotData data;
  final int selected;
  final bool bars;
  final Color valueColor, grossColor, fill, grid, surface;
  _ProjectionPainter(
    this.data,
    this.selected,
    this.bars,
    this.valueColor,
    this.grossColor,
    this.fill,
    this.grid,
    this.surface,
  );
  @override
  void paint(Canvas canvas, Size size) {
    if (size.width <= 0 || size.height <= 16) return;
    canvas.save();
    canvas.clipRect(Offset.zero & size);
    final baseline = data.yAt(0, size.height);
    for (final n in [0.0, data.maximum / 2, data.maximum]) {
      final y = data.yAt(n, size.height);
      canvas.drawLine(
        Offset(0, y),
        Offset(size.width, y),
        Paint()
          ..color = grid
          ..strokeWidth = 1,
      );
    }
    final points = [
      for (var i = 0; i < data.values.length; i++)
        Offset(data.xAt(i, size.width), data.yAt(data.values[i], size.height)),
    ];
    final path = Path()..moveTo(points.first.dx, points.first.dy);
    for (final p in points.skip(1)) {
      path.lineTo(p.dx, p.dy);
    }
    if (bars) {
      final width = (size.width / math.max(1, points.length) * .6).clamp(
        1.0,
        24.0,
      );
      for (var i = 0; i < points.length; i++) {
        final p = points[i];
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            Rect.fromLTRB(p.dx - width / 2, p.dy, p.dx + width / 2, baseline),
            const Radius.circular(6),
          ),
          Paint()..color = i == selected ? valueColor : fill,
        );
        if (i != selected) {
          canvas.drawRRect(
            RRect.fromRectAndRadius(
              Rect.fromLTRB(p.dx - width / 2, p.dy, p.dx + width / 2, baseline),
              const Radius.circular(6),
            ),
            Paint()
              ..color = valueColor
              ..style = PaintingStyle.stroke
              ..strokeWidth = 1,
          );
        }
      }
    } else {
      final area = Path.from(path)
        ..lineTo(points.last.dx, baseline)
        ..lineTo(points.first.dx, baseline)
        ..close();
      canvas.drawPath(
        area,
        Paint()
          ..shader = LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [fill, fill.withValues(alpha: .08)],
          ).createShader(Offset.zero & size),
      );
      canvas.drawPath(
        path,
        Paint()
          ..color = valueColor
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2.5
          ..strokeCap = StrokeCap.round
          ..strokeJoin = StrokeJoin.round,
      );
    }
    if (data.contributed != null) {
      final gross = Path()
        ..moveTo(
          data.xAt(0, size.width),
          data.yAt(data.contributed!.first, size.height),
        );
      for (var i = 1; i < data.contributed!.length; i++) {
        gross.lineTo(
          data.xAt(i, size.width),
          data.yAt(data.contributed![i], size.height),
        );
      }
      for (final metric in gross.computeMetrics()) {
        for (double distance = 0; distance < metric.length; distance += 9) {
          canvas.drawPath(
            metric.extractPath(distance, math.min(distance + 5, metric.length)),
            Paint()
              ..color = grossColor
              ..style = PaintingStyle.stroke
              ..strokeWidth = 2,
          );
        }
      }
    }
    final point = points[selected];
    for (double y = 0; y < size.height; y += 8) {
      canvas.drawLine(
        Offset(point.dx, y),
        Offset(point.dx, math.min(y + 4, size.height)),
        Paint()
          ..color = grid
          ..strokeWidth = 1,
      );
    }
    canvas.drawCircle(point, 5, Paint()..color = surface);
    canvas.drawCircle(
      point,
      5,
      Paint()
        ..color = valueColor
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.5,
    );
    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _ProjectionPainter old) =>
      selected != old.selected ||
      bars != old.bars ||
      !listEquals(data.values, old.data.values) ||
      !listEquals(data.contributed, old.data.contributed) ||
      valueColor != old.valueColor ||
      grossColor != old.grossColor ||
      fill != old.fill ||
      grid != old.grid ||
      surface != old.surface;
}
