# AGENTS.md: PauseLink implementation instructions (for Antigravity)

You are implementing **PauseLink**, a native Android app. The design is already decided in `docs/PauseLink_Blueprint.md` (the blueprint). Your job is to implement it **one milestone at a time**, verify each milestone, and stop. Do not redesign, do not add features, and do not reopen decisions listed below.

## 0. How to work

1. Read the whole blueprint once. Then work **only on the milestone the human names** (Section H of the blueprint, M0-M12).
2. Before writing code for a milestone, write a short plan: files you will create or change, and the tests you will add. Keep the plan to 15 lines or fewer.
3. Implement in small steps. **Compile after every logical step** (`./gradlew :analyzer:compileKotlin`, `./gradlew :app:compileDebugKotlin`). Fix errors before continuing.
4. For `:analyzer` work, write the tests **first or together** with the rule or class.
5. Run the milestone's verification commands (Section 5). All must pass.
6. Make one git commit at the end of the milestone: `M<n>: <short title>`. Do not start the next milestone.
7. Report back using the template in Section 7.

If something in the blueprint is ambiguous or contradicts itself, **ask the human** (Section 6 lists the only pre-approved open items). Do not guess silently.

## 1. Locked decisions (do not change)

- Kotlin only. Jetpack Compose + Material 3. Single source of truth for UI state: `StateFlow<UiState>` in ViewModels, collected with `collectAsStateWithLifecycle()`.
- Two Gradle modules: `:analyzer` (pure Kotlin/JVM, **no `android.*`, no Compose, no Room, no Hilt**) and `:app`.
- DI: Hilt (KSP). Persistence: Room (single `history` table, report stored as JSON). Settings: DataStore Preferences.
- Navigation: Navigation Compose with type-safe (`@Serializable`) routes. Use Navigation 3 only if the Android Studio template already does and the human agrees.
- Serialization: kotlinx.serialization only.
- Two activities sharing one Compose root: `MainActivity` (launcher) and `ShareReceiverActivity` (exported; filters: `ACTION_SEND text/plain` and `ACTION_PROCESS_TEXT text/plain` only).
- QR: Google code scanner (`play-services-code-scanner`) behind the `QrScanner` interface.
- `minSdk` 26. `compileSdk`/`targetSdk`: the latest stable level supported by the installed Android Studio (confirm with the human; do not guess).
- Own URL parser, own punycode codec, own confusable folding, bundled public suffix list. **Do not add** Guava, ICU4J, OkHttp, Apache Commons, or `android.util.Patterns` for parsing.
- Rules return **data only** (`Finding`). All user-visible wording lives in `app/src/main/res/values/findings_strings.xml`, keyed `finding_<CODE>_{title,summary,why,harmless,action}`.
- Rule codes, weights, thresholds and band wording are those in blueprint Sections E7, E9 and C2. Do not renumber rule codes.

## 2. Hard prohibitions

- **No `INTERNET` permission.** No network code of any kind: no `HttpURLConnection`, OkHttp, Retrofit, WebView, Custom Tabs, `URL.openConnection`, DNS lookups, or `Intent.ACTION_VIEW` on analysed links.
- **Never open, fetch, expand or preview a link.** Link text is never clickable. There is no "Open link" button.
- **Never log** raw input, URLs, hosts, paths, queries, message text, QR payloads, clipboard contents or evidence values. Use only `AppLogger`, which accepts rule codes, counts, durations and exception class names. No `Log.*`, `println`, or Timber outside `AppLogger`.
- No analytics, crash reporting, ads, accounts, cloud services, or paid APIs.
- No SMS, notification-listener, accessibility or contacts permissions. No `ACTION_VIEW` intent filter.
- Never use the words "safe", "malicious", "scam detected" or "virus" as a verdict in UI text. The only allowed uses are inside the fixed disclaimer ("cannot confirm a link is safe or unsafe") and the Privacy screen limits text.
- Never present a heuristic result as proof. The fixed disclaimer must appear on every Result screen.
- No real malicious URLs anywhere (code, tests, docs, comments). Test data uses only `example.com`, `example.net`, `example.org`, `.example`, `.test`, `.invalid`, `192.0.2.0/24`, `2001:db8::/32`.
- Do not generate the whole app at once. Do not implement features outside the current milestone.

## 3. Dependency and version rules

- **Never invent a version number.** Create the project from Android Studio's Empty Activity (Compose) template (human does this in M0), then keep the AGP, Kotlin and Compose set that the template produced.
- For every additional library, look up the current stable version in the official source (AndroidX release notes, Maven Google, library GitHub releases). If you cannot verify it, **stop and ask the human**. Record each verified version and the date in `docs/VERSIONS.md`.
- Use a version catalog (`gradle/libs.versions.toml`). Add dependencies one at a time and build after each.
- Use KSP, not kapt, unless KSP is unsupported for that processor (then ask).
- Allowed dependency list is blueprint Sections G3-G5. Anything else needs human approval.

## 4. Code and test standards

- Readable Kotlin over clever abstractions. No speculative interfaces, no use case per screen. Keep functions short; prefer immutable data classes and sealed types.
- Every public class in `:analyzer` has a KDoc line stating its purpose.
- Analyzer is deterministic: no randomness, clocks, I/O or global mutable state. Output ordering is stable.
- No regex with nested quantifiers. Extraction is a linear scan or a simple non-backtracking pattern. Adversarial-input tests are mandatory (blueprint F5).
- Each rule needs the test matrix in blueprint F2, named `rule_<CODE>_<case>`.
- Test data lives in `analyzer/src/test/resources/testdata/*.csv`. Use fixtures that inject a tiny public-suffix list, a fake brand (`ExampleBank`, official `examplebank.example`) and a fake shortener (`short.example`) so tests never depend on real brands.
- Prefer hand-written fakes to mocking frameworks.
- Keep Compose screens stateless where possible (state hoisting), with `@Preview` for each main state.
- Accessibility is part of "done": content descriptions, 48dp targets, text plus icon for risk bands, font-scale safe layouts.

## 5. Verification commands

Run what applies to the milestone, and report the actual output summary (pass/fail counts), not a guess:

```
./gradlew :analyzer:test
./gradlew :app:testDebugUnitTest
./gradlew :app:assembleDebug
./gradlew :app:lintDebug
./gradlew :app:connectedDebugAndroidTest     # needs a running emulator; ask the human to start one
```
If an emulator is not available, say so, list the instrumented tests you wrote but could not run, and give the human exact manual steps.

## 6. Pre-approved open items (ask the human; nothing else needs asking)

1. `applicationId` / base package (blueprint placeholder: `com.yourname.pauselink`).
2. Verified versions when you cannot confirm them from official sources.
3. Whether the generated template uses Navigation 3 or built-in Kotlin support under the newest AGP, and how to adapt (blueprint G1).
4. The brand list: brands and official domains must be verified by the human against each brand's official site before being added to `brands.json`. Until then, only the fake `ExampleBank` entry exists.
5. Whether `play-services-code-scanner` merges an `INTERNET` permission into the manifest; if it does, propose `tools:node="remove"`, and ask the human to test QR scanning on a real device or Play emulator.
6. Source and licence confirmation for `public_suffix_list.dat` and `confusables.tsv` (record download date and source in `PSL_VERSION.txt` and `docs/`).

## 7. Report template (end of every milestone)

```
Milestone: M<n> <title>
Status: DONE | BLOCKED
Files created/changed: <list>
Commands run and results: <command: result>
Tests added: <count, names of notable ones>
Acceptance criteria: <each one: met / not met + evidence>
Manual steps for the human: <numbered list>
Deviations from the blueprint: <none | list with reason>
Open questions: <none | list>
```

## 8. Stop conditions

Stop and report (status BLOCKED) if: a locked decision cannot be implemented as written; a required dependency version cannot be verified; tests fail and you cannot fix them within the milestone scope; you are tempted to add a feature, permission or library not in the blueprint.

## 9. First message the human should send

> Read `AGENTS.md` and `docs/PauseLink_Blueprint.md`. Do **not** write code yet. Reply with: (1) a 10-line summary of the architecture, (2) the list of items from AGENTS.md Section 6 you need from me, (3) your plan for **M1** only. Wait for my approval.

## 10. Per-milestone prompt template

> Implement **Milestone M<n>** from Section H of `docs/PauseLink_Blueprint.md` and nothing else. Follow `AGENTS.md`. Start with a plan (files and tests). Compile as you go. Run the verification commands listed for this milestone. Commit as `M<n>: <title>`. End with the report template. Do not start M<n+1>.

Suggested order: M0 (human), M1, M2, M3, M4, M5, M6, M7, M8, M9, M10, M11, M12.

## 11. Repository placement

Put this file at the repo root as `AGENTS.md`, and the blueprint at `docs/PauseLink_Blueprint.md`.
