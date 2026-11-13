# Local build patch

Original package: url_launcher_android-6.3.33, obtained from pub.dev and pinned by pubspec.lock.
Original android/build.gradle.kts SHA-256: b7c15441541ac8a7d80d63780fb9128a518ac3067f70816e853a2c88ea8e8e45.

The sole upstream source change replaces the FlutterExtension Kotlin DSL accessor for compileSdk with the same integer provided by the app in rootProject.extra["bourseCompileSdkVersion"]. The value comes from Flutter itself. Dart code, native implementation, dependencies and licensing are unchanged. This avoids a reproducible FlutterExtension classpath failure with this Flutter/Gradle toolchain. The original LICENSE is preserved. Remove the override after validating an upstream toolchain fix.
