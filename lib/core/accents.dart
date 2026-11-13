import 'package:flutter/material.dart';

// Secondary accents only. Brand green, layout, typography and error colors stay independent.
enum AccentTone { blue, pink, brown, yellow }

abstract final class Accents {
  static Color surface(BuildContext c, AccentTone tone) =>
      surfaceFor(Theme.of(c).brightness, tone);
  static Color ink(BuildContext c, AccentTone tone) =>
      inkFor(Theme.of(c).brightness, tone);
  static Color surfaceFor(Brightness mode, AccentTone tone) =>
      (mode == Brightness.dark
      ? const [
          Color(0xFF203A4A),
          Color(0xFF452F3A),
          Color(0xFF40362D),
          Color(0xFF403C24),
        ]
      : const [
          Color(0xFFE3F2FC),
          Color(0xFFFBE9F0),
          Color(0xFFF2E9DF),
          Color(0xFFFFF5CD),
        ])[tone.index];
  static Color inkFor(Brightness mode, AccentTone tone) =>
      (mode == Brightness.dark
      ? const [
          Color(0xFFB4DDF5),
          Color(0xFFF6C3D7),
          Color(0xFFEBD1B8),
          Color(0xFFF4E19C),
        ]
      : const [
          Color(0xFF235674),
          Color(0xFF81445E),
          Color(0xFF705035),
          Color(0xFF705A12),
        ])[tone.index];
  static ButtonStyle button(BuildContext c, AccentTone tone) => ButtonStyle(
    backgroundColor: WidgetStateProperty.resolveWith(
      (states) =>
          states.contains(WidgetState.disabled) ? null : surface(c, tone),
    ),
    foregroundColor: WidgetStateProperty.resolveWith(
      (states) => states.contains(WidgetState.disabled) ? null : ink(c, tone),
    ),
  );
}
