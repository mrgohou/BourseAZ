# Local build patch

Original package: google_sign_in_android-7.2.19, obtained from pub.dev and pinned by pubspec.lock.
Original android/build.gradle.kts SHA-256: 3c0740c0669fc685c541a6a179902b8e7ff08006c742a3f7a249005de9b2b1fb.

The sole upstream source change replaces the FlutterExtension Kotlin DSL accessor for compileSdk with the same integer provided by the app in rootProject.extra["bourseCompileSdkVersion"]. The value comes from Flutter itself. Dart code, native implementation, dependencies and licensing are unchanged. This avoids a reproducible FlutterExtension classpath failure with this Flutter/Gradle toolchain. The original LICENSE is preserved. Remove the override after validating an upstream toolchain fix.
