# PauseLink Verified Dependency & Toolchain Versions

This document tracks toolchain and dependency versions verified and locked for PauseLink.
Never guess or invent version numbers; record verified versions, sources, and dates here.

## Base Configuration

| Property | Value | Notes |
|---|---|---|
| Application ID / Namespace | `com.clickretina.pauselink` | Approved in M0 baseline |
| minSdk | 26 | Android 8.0 Oreo+ |
| compileSdk | 37 | Latest stable in Android Studio template |
| targetSdk | 37 | Latest stable in Android Studio template |
| Gradle Wrapper | 9.6.0 | Verified in baseline |
| Android Gradle Plugin (AGP) | 9.5.1 | Template default |
| Kotlin | 2.2.10 | Template default |
| Java / Daemon Toolchain | OpenJDK 25.0.4 | Android Studio bundled JBR |

## Core Libraries & Plugins

| Library / Plugin | Version | Verification Source & Date |
|---|---|---|
| Compose BOM | 2026.02.01 | Android Studio Template (2026-11-07) |
| AndroidX Compose Material Icons Core | (managed via Compose BOM) | Google Maven (2026-11-07) |
| AndroidX Core KTX | 1.19.1 | Android Studio Template (2026-11-07) |
| AndroidX Lifecycle Runtime KTX | 2.11.0 | Android Studio Template (2026-11-07) |
| AndroidX Lifecycle Runtime Compose | 2.11.0 | Google Maven (2026-11-07) |
| AndroidX Activity Compose | 1.13.0 | Android Studio Template (2026-11-07) |
| AndroidX Navigation Compose | 2.8.9 | Google Maven (2026-11-07) — Type-safe `@Serializable` routes |
| Kotlinx Serialization JSON | 1.8.0 | Maven Central (2026-11-07) |
| KSP (Kotlin Symbol Processing) | 2.2.10-2.0.2 | Maven Central (2026-11-07) — Dedicated match for Kotlin 2.2.10 |
| Dagger Hilt Android & Compiler | 2.60.1 | Maven Central (2026-11-07) — Verified with AGP 9.5.1 & KSP |
| AndroidX Hilt Navigation Compose | 1.2.0 | Google Maven (2026-11-07) |
| Kotlinx Coroutines Android & Test | 1.10.1 | Maven Central (2026-11-07) |
| JUnit (JVM unit test) | 4.13.2 | Maven Central (2026-11-07) |
| AndroidX JUnit (Test Ext) | 1.3.0 | Google Maven (2026-11-07) |
| AndroidX Espresso Core | 3.7.0 | Google Maven (2026-11-07) |
