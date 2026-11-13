import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../core/accents.dart';
import 'motion.dart';

class PageHeading extends StatelessWidget {
  final String title, subtitle;
  final String? eyebrow;
  const PageHeading(this.title, this.subtitle, {super.key, this.eyebrow});
  @override
  Widget build(BuildContext c) => Padding(
    padding: const EdgeInsets.only(bottom: 24),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (eyebrow != null) ...[
          Text(
            eyebrow!,
            style: Theme.of(c).textTheme.labelMedium?.copyWith(
              color: Theme.of(c).colorScheme.onSurfaceVariant,
              letterSpacing: .5,
            ),
          ),
          const SizedBox(height: 8),
        ],
        Text(title, style: Theme.of(c).textTheme.headlineLarge),
        const SizedBox(height: 8),
        Text(
          subtitle,
          style: Theme.of(c).textTheme.bodyMedium?.copyWith(
            color: Theme.of(c).colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    ),
  );
}

class ChangeBadge extends StatelessWidget {
  final double change;
  const ChangeBadge(this.change, {super.key});
  @override
  Widget build(BuildContext c) {
    final s = Theme.of(c).colorScheme;
    final color = change < 0 ? s.error : s.primary;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
      decoration: BoxDecoration(
        color: change < 0 ? s.errorContainer : s.secondaryContainer,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            change < 0
                ? Icons.south_east_rounded
                : change > 0
                ? Icons.north_east_rounded
                : Icons.east_rounded,
            size: 14,
            color: color,
          ),
          const SizedBox(width: 4),
          Text(
            '${change > 0 ? '+' : ''}${change.toStringAsFixed(2)} %',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: color,
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
          ),
        ],
      ),
    );
  }
}

class ActionTile extends StatefulWidget {
  final IconData icon;
  final String title, subtitle;
  final VoidCallback onTap;
  final AccentTone? tone;
  final FriendlySymbol? symbol;
  const ActionTile({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.tone,
    this.symbol,
  });
  @override
  State<ActionTile> createState() => _ActionTileState();
}

class _ActionTileState extends State<ActionTile> {
  bool pressed = false;
  @override
  Widget build(BuildContext c) {
    final scheme = Theme.of(c).colorScheme;
    final color = widget.tone == null
        ? scheme.onSecondaryContainer
        : Accents.ink(c, widget.tone!);
    return AnimatedScale(
      scale: pressed && !MediaQuery.disableAnimationsOf(c) ? .98 : 1,
      duration: MediaQuery.disableAnimationsOf(c)
          ? Duration.zero
          : const Duration(milliseconds: 120),
      curve: Curves.easeOutCubic,
      child: Card(
        color: widget.tone == null ? null : Accents.surface(c, widget.tone!),
        child: InkWell(
          onTap: widget.onTap,
          onHighlightChanged: (v) {
            if (mounted) setState(() => pressed = v);
          },
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: 44,
                  height: 44,
                  child: widget.symbol != null
                      ? FriendlyIcon(widget.symbol!)
                      : DecoratedBox(
                          decoration: BoxDecoration(
                            color: widget.tone == null
                                ? scheme.secondaryContainer
                                : scheme.surface.withValues(alpha: .6),
                            borderRadius: BorderRadius.circular(15),
                          ),
                          child: Icon(widget.icon, size: 22, color: color),
                        ),
                ),
                const SizedBox(height: 16),
                Text(widget.title, style: Theme.of(c).textTheme.titleMedium),
                const SizedBox(height: 4),
                ConstrainedBox(
                  constraints: const BoxConstraints(minHeight: 36),
                  child: Text(
                    widget.subtitle,
                    style: Theme.of(c).textTheme.bodySmall?.copyWith(
                      color: widget.tone == null ? null : color,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class AdaptiveTiles extends StatelessWidget {
  final List<Widget> children;
  const AdaptiveTiles({super.key, required this.children});
  @override
  Widget build(BuildContext c) => LayoutBuilder(
    builder: (c, box) {
      final columns = box.maxWidth >= 600
          ? 4
          : box.maxWidth < 300 || MediaQuery.textScalerOf(c).scale(16) > 23
          ? 1
          : 2;
      return Column(
        children: [
          for (var row = 0; row < children.length; row += columns)
            Padding(
              padding: EdgeInsets.only(
                bottom: row + columns < children.length ? 12 : 0,
              ),
              child: IntrinsicHeight(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    for (var col = 0; col < columns; col++) ...[
                      if (col > 0) const SizedBox(width: 12),
                      Expanded(
                        child: row + col < children.length
                            ? children[row + col]
                            : const SizedBox.shrink(),
                      ),
                    ],
                  ],
                ),
              ),
            ),
        ],
      );
    },
  );
}

class ProgressSummary extends StatelessWidget {
  final int completed, total;
  final String title;
  final Widget? action;
  const ProgressSummary({
    super.key,
    required this.completed,
    required this.total,
    required this.title,
    this.action,
  });
  @override
  Widget build(BuildContext c) {
    final value = total == 0 ? 0.0 : (completed / total).clamp(0.0, 1.0);
    final scale = MediaQuery.textScalerOf(c).scale(16) / 16;
    final ring = Semantics(
      label: '$completed leçons validées sur $total',
      child: SizedBox(
        width: 92 * scale.clamp(1.0, 1.6),
        height: 92 * scale.clamp(1.0, 1.6),
        child: Stack(
          alignment: Alignment.center,
          children: [
            SizedBox.expand(
              child: ExcludeSemantics(
                child: TweenAnimationBuilder<double>(
                  tween: Tween(begin: 0, end: value),
                  duration: MediaQuery.disableAnimationsOf(c)
                      ? Duration.zero
                      : const Duration(milliseconds: 440),
                  curve: Curves.easeOutCubic,
                  builder: (c, progress, child) => CircularProgressIndicator(
                    value: progress,
                    strokeWidth: 8,
                    strokeCap: StrokeCap.round,
                    color: Brand.ink,
                    backgroundColor: Colors.white.withValues(alpha: .75),
                  ),
                ),
              ),
            ),
            ExcludeSemantics(
              child: Text(
                '${(value * 100).round()} %',
                style: const TextStyle(
                  fontSize: 19,
                  fontWeight: FontWeight.w700,
                  color: Brand.ink,
                ),
              ),
            ),
          ],
        ),
      ),
    );
    final text = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 20,
            height: 1.3,
            fontWeight: FontWeight.w700,
            color: Brand.ink,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          '$completed / $total leçons validées',
          style: const TextStyle(color: Brand.ink),
        ),
      ],
    );
    return Card(
      color: Brand.lime,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (scale > 1.3) ...[
              ring,
              const SizedBox(height: 20),
              text,
            ] else
              Row(
                children: [
                  Expanded(child: text),
                  const SizedBox(width: 18),
                  ring,
                ],
              ),
            if (action != null) ...[
              const SizedBox(height: 18),
              Theme(data: Brand.theme(Brightness.light), child: action!),
            ],
          ],
        ),
      ),
    );
  }
}
