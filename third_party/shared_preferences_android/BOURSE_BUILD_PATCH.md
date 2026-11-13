# Local build patch

Original package: shared_preferences_android-2.5.4, obtained from pub.dev and pinned by pubspec.lock.
Original android/build.gradle.kts SHA-256: 0542a6d41f23c2d3b92a674eef72ce4378d86f68e130d11a357e4e1feb4bf698.

The sole upstream source change replaces the FlutterExtension Kotlin DSL accessor for compileSdk with the same integer provided by the app in rootProject.extra["bourseCompileSdkVersion"]. The value comes from Flutter itself. Dart code, native implementation, dependencies and licensing are unchanged. This avoids a reproducible FlutterExtension classpath failure with this Flutter/Gradle toolchain. The original LICENSE is preserved. Remove the override after validating an upstream toolchain fix.
