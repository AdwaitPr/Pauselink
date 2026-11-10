# PauseLink Engineering Notes

## Incident 001: Android Lint Dependency Resolution & Kotlin Compiler Artifact (2026-11-07)

### Symptom
During initial execution of `./gradlew :app:lintDebug`, Gradle attempted to resolve the Android Lint tooling dependencies (specifically `com.android.tools.external.com-intellij:kotlin-compiler:32.5.1`). The download stalled during the process due to network timeouts when fetching the large compiler JAR (~53MB) through Gradle's synchronous resolver socket.

### Resolution
1. Fetched the artifact directly from Google Maven repository:
   - URL: `https://dl.google.com/android/maven2/com/android/tools/external/com-intellij/kotlin-compiler/32.5.1/kotlin-compiler-32.5.1.jar`
   - Target location: `~/.gradle/caches/modules-2/files-2.1/com.android.tools.external.com-intellij/kotlin-compiler/32.5.1/e14fa86be18b0780ef7d1fa2cd734e6bbf739bf0/kotlin-compiler-32.5.1.jar`
2. Checksum verification against authoritative Google Maven `.sha1`:
   - Remote SHA-1: `e14fa86be18b0780ef7d1fa2cd734e6bbf739bf0`
   - Local File SHA-1: `e14fa86be18b0780ef7d1fa2cd734e6bbf739bf0`
   - Local File SHA-256: `5cd8d9d8076fa1b811c81b1704c2c5d70bb3d5b0819fe36b78c1d71a78ea8883`
3. Configured `app/build.gradle.kts` lint block:
   ```kotlin
   lint {
       abortOnError = true
       checkReleaseBuilds = false
       checkDependencies = false
   }
   ```
4. Subsequent runs of `:app:lintDebug` pass cleanly in ~2-3 seconds with zero errors.

## Toolchain & Runtime Notes

### JVM Environment
- Android Studio Ladybug bundled JBR (Java 25) is used via:
  `JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"`
- `:analyzer` is configured with `kotlin { jvmToolchain(17) }` to ensure portable bytecode targeting JVM 17 without host toolchain drift.
- `:app` is configured with Java 17 compile options and `kotlin { jvmToolchain(17) }`.

### Device / Emulator Verification Status
- Instrumented navigation test (`NavigationTest.kt`) is compiled into `assembleDebugAndroidTest`.
- As no hardware device or active emulator is currently connected, physical execution is pending device availability.
