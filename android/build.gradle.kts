// Make Flutter's extension types visible to all Kotlin DSL Android modules.
plugins {
    id("dev.flutter.flutter-gradle-plugin") apply false
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}
subprojects {
    project.evaluationDependsOn(":app")
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}

// Match native library tasks to an explicitly requested ARM64-only APK.
subprojects {
    plugins.withId("com.android.library") {
        extensions.getByType<com.android.build.api.variant.LibraryAndroidComponentsExtension>().finalizeDsl { androidDsl ->
            if (project.findProperty("target-platform") == "android-arm64") {
                androidDsl.defaultConfig.ndk.abiFilters.clear()
                androidDsl.defaultConfig.ndk.abiFilters.add("arm64-v8a")
            }
        }
    }
}
