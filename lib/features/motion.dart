import 'package:flutter/material.dart';

enum FriendlySymbol { market, wallet, calendar, news, book, reward }

// One shared local atlas, decoded once by Flutter's ImageCache. No remote dependency.
class FriendlyIcon extends StatelessWidget {
  final FriendlySymbol symbol;
  final double size;
  const FriendlyIcon(this.symbol, {super.key, this.size = 44});
  @override
  Widget build(BuildContext c) {
    final col = symbol.index % 3, row = symbol.index ~/ 3;
    final fallback = [
      Icons.bar_chart_rounded,
      Icons.account_balance_wallet_outlined,
      Icons.event_available_outlined,
      Icons.newspaper_outlined,
      Icons.menu_book_rounded,
      Icons.emoji_events_outlined,
    ][symbol.index];
    return SizedBox.square(
      dimension: size,
      child: ExcludeSemantics(
        child: Image.asset(
          'assets/icons/friendly-atlas.png',
          width: size * 3,
          height: size * 2,
          fit: BoxFit.fill,
          filterQuality: FilterQuality.medium,
          frameBuilder: (c, child, frame, synchronous) => frame == null
              ? Center(child: Icon(fallback, size: size * .6))
              : ClipRect(
                  child: OverflowBox(
                    alignment: Alignment.topLeft,
                    minWidth: size * 3,
                    maxWidth: size * 3,
                    minHeight: size * 2,
                    maxHeight: size * 2,
                    child: Transform.translate(
                      offset: Offset(-col * size, -row * size),
                      child: child,
                    ),
                  ),
                ),
          errorBuilder: (c, error, trace) =>
              Center(child: Icon(fallback, size: size * .6)),
        ),
      ),
    );
  }
}

// Short, one-shot feedback. Never loops or delays an action; reduced motion is immediate.
class FriendlyReveal extends StatelessWidget {
  final Widget child;
  final bool success;
  const FriendlyReveal({super.key, required this.child, this.success = false});
  @override
  Widget build(BuildContext c) => TweenAnimationBuilder<double>(
    tween: Tween(begin: 0, end: 1),
    duration: MediaQuery.disableAnimationsOf(c)
        ? Duration.zero
        : Duration(milliseconds: success ? 340 : 220),
    curve: success ? Curves.easeOutBack : Curves.easeOutCubic,
    builder: (c, value, child) => Transform.translate(
      offset: Offset(0, (1 - value) * 6),
      child: Transform.scale(scale: .96 + value * .04, child: child),
    ),
    child: child,
  );
}
