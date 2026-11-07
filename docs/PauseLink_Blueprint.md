# PauseLink: Technical Blueprint (Sections A-I)

Companion file: `AGENTS.md` (Section J, the Antigravity handoff). Copy it to the repo root.

## Evidence legend and honesty notes

I ran no new web searches for this blueprint (to protect your free-plan quota). Therefore:

- **[F]** = Android/Kotlin fact I am confident about from general knowledge. Still confirm against official docs when you implement.
- **[REC]** = my design recommendation. These are decisions, not facts.
- **[VERIFY]** = must be checked before use. Every library/tool version is in this category. I have not guessed any version number.
- Code blocks are **illustrative skeletons**, not compiled code. The coding agent must compile and test them.
- The rule weights, thresholds and word lists are **initial calibrations**. They are meant to be tuned against the test corpus, and they are not evidence-based accuracy claims.
- Nothing here claims PauseLink detects every scam. It surfaces explainable warning signs. It cannot prove a link is safe or malicious.

Placeholder package: `com.yourname.pauselink`. **Replace before generating code.**

---

# A. PRODUCT REQUIREMENTS DOCUMENT (PRD)

## A1. Problem statement

People receive links and messages (SMS, WhatsApp, email, QR codes) and must decide in seconds whether to tap. Most tools either give a bare verdict, require a cloud round-trip (so the suspicious link or message is sent to a third party), or live inside a paid security suite. The user learns nothing, so the next variant fools them again.

**PauseLink's job:** in under a second, on the device, with no network, show *which specific warning signs* a link or message has, *why each matters*, and *how it could be harmless*, without ever opening the link.

## A2. Target users

| Persona | Need |
|---|---|
| Everyday user | Share a suspicious message to PauseLink from any app and get a plain-language explanation. |
| "Family IT person" | Check what a relative forwarded; understand the reason, so they can explain it. |
| Privacy-conscious user | Wants analysis that never leaves the phone. |
| Reviewer (hiring manager) | Wants to see clean architecture, a real analysis engine, tests and platform integration. |

## A3. Primary use cases

1. **UC1:** Share a link from any app to PauseLink via the Android share sheet.
2. **UC2:** Share or select message text containing links (share sheet or the text-selection menu).
3. **UC3:** Paste a link or message into PauseLink.
4. **UC4:** Scan a QR code and analyse its payload.
5. **UC5:** Review past checks (local history).
6. **UC6:** Drill into one finding to learn what it means and how it could be a false alarm.

## A4. MVP scope

**In MVP**

| ID | Feature |
|---|---|
| F-01 | Share-sheet target (`text/plain`) and text-selection target (`PROCESS_TEXT`) |
| F-02 | Paste / type input on Home |
| F-03 | Deterministic on-device analyzer (25 rules, see Section E) |
| F-04 | Result screen: overall band, per-link findings, message findings, limitations notice |
| F-05 | Finding detail: what we saw, why it matters, how it could be harmless, what to do |
| F-06 | QR scanning (camera) with payload-type handling |
| F-07 | Local history (privacy-minimised), delete one / clear all, retention |
| F-08 | Settings (save history, retention days, theme) and Privacy information screen |
| F-09 | Copy link (original, from memory only) and copy defanged link |
| F-10 | No `INTERNET` permission in the MVP build (verified by test, see F4) |

**Post-MVP (do not build now)**

- QR from an image (Photo Picker plus ML Kit image barcode scanning).
- CameraX-based scanner for devices without Google Play services.
- Downloadable local reputation list (hash-prefix) and Safe Browsing Update API (adds `INTERNET`; licensing is non-commercial only).
- "Trusted domains" list (user-suppressed findings).
- Practice/quiz mode; shareable explanation card; Hindi/regional lexicons; app lock; encrypted database (SQLCipher or Keystore-wrapped keys); refanging of `hxxp://example[.]com` input; suspicious-TLD rule; Baseline Profiles/Macrobenchmark.

**Explicitly excluded (and why)**

| Excluded | Reason |
|---|---|
| Reading SMS (`READ_SMS`/`RECEIVE_SMS`) | Play restricts these to default handlers [F]; high rejection risk. |
| Notification listener, Accessibility service | Sensitive, malware-associated, Play review risk, large privacy surface. |
| Registering as an `ACTION_VIEW` http(s) link handler | Would put PauseLink in the path of opening links; scope creep and risk. |
| Any remote fetch, redirect expansion, URL preview, WebView | SSRF/privacy risk and violates "never open links". |
| Certificate/WHOIS/DNS checks | Requires network access to the suspect host. |
| Accounts, cloud sync, analytics, crash-reporting SDKs | No backend, no data collection. |
| LLM / "AI" scoring | Not deterministic or explainable; out of brief. |
| A "Safe" verdict | PauseLink cannot prove safety. |
| Blocking links or scanning installed apps | Not an antivirus. |

## A5. Product principles (they constrain every decision)

1. **Never** say "safe", "malicious", "scam detected" or "virus". Say "warning signs", "can indicate", "often used in".
2. Every warning names the rule that fired and shows the evidence.
3. Every warning also says how it could be harmless.
4. Nothing leaves the device. Nothing is opened.
5. Default to the least-data option.

## A6. Success criteria (portfolio-oriented)

- `./gradlew :analyzer:test :app:testDebugUnitTest :app:assembleDebug` passes from a clean checkout.
- Analyzer module has zero Android dependencies (enforced by Gradle structure).
- Every rule has positive, negative, boundary and false-positive-guard tests.
- Merged release manifest declares no `INTERNET` permission (automated test).
- A reviewer can understand the architecture from `docs/ARCHITECTURE.md` in 10 minutes.

---

# B. SOFTWARE ARCHITECTURE DOCUMENT (SAD)

## B1. Locked technology decisions (ADR summary)

| # | Decision | Alternatives considered | Reasoning |
|---|---|---|---|
| ADR-01 | **Kotlin + Jetpack Compose + Material 3** | XML views | Current standard; hiring managers expect Compose. |
| ADR-02 | **Two Gradle modules: `:analyzer` (pure Kotlin/JVM) and `:app`** | Single module; many feature modules | A pure-JVM module makes "analyzer has no Android/UI dependency" a *compile-time guarantee* and makes tests fast (no emulator). More modules would be ceremony for this size. |
| ADR-03 | **MVVM with unidirectional data flow**: each screen has a `ViewModel` exposing `StateFlow<UiState>` and receiving events via functions | MVI framework, Redux libs | Idiomatic Android; no extra library. |
| ADR-04 | **"Clean-lite"**: analyzer is the domain core; `app/domain` holds only repository interfaces and one use case | Full Clean Architecture with use case per action | Layers only where they pay off. Most screens call a repository directly via the ViewModel. |
| ADR-05 | **Hilt** for DI | Koin; manual DI | Widely requested in job postings; compile-time checked. Cost: KSP setup. Manual DI would be enough functionally; Hilt is chosen for portfolio signal [REC]. |
| ADR-06 | **Room for history, one table, report stored as JSON column** | Normalised child tables | No relational queries needed in the MVP. Child tables would be ceremony. Relations (`@Relation`) are better showcased in the *Kept* project. Documented trade-off. |
| ADR-07 | **DataStore (Preferences)** for settings | SharedPreferences | Async, Flow-based, current recommendation [F]. |
| ADR-08 | **Navigation Compose with type-safe routes** (`@Serializable` route classes) | String routes; Navigation 3 | Type-safe routes are in Navigation 2.8+ [F, VERIFY]. Navigation 3 is newer; use it only if the generated project template already uses it and docs are clear [VERIFY]. Default: Navigation Compose 2.x. |
| ADR-09 | **Coroutines + Flow**; analyzer is a *synchronous pure function*, wrapped with `withContext(Dispatchers.Default)` in the use case | Making the analyzer `suspend` | Keeps the analyzer trivial to test and free of coroutines. |
| ADR-10 | **Two activities sharing one Compose root**: `MainActivity` (launcher) and `ShareReceiverActivity` (exported, SEND and PROCESS_TEXT) | Single activity with `singleTop` | A share target should return the user to the app they came from when they press Back or Done. A separate activity in the caller's task gives that behaviour for free [F: default launch mode runs in the caller's task]. |
| ADR-11 | **QR via Google code scanner (`play-services-code-scanner`)** behind a `QrScanner` interface | CameraX + ML Kit bundled | Minimal code, no own camera UI, and it avoids requesting the `CAMERA` permission because Play services handles the camera UI [F, VERIFY]. Cost: requires Google Play services; the first use may need a module download. Interface allows a CameraX implementation later. |
| ADR-12 | **No networking libraries in MVP** | Retrofit/OkHttp | There is nothing to fetch. |
| ADR-13 | **kotlinx.serialization** for the stored report JSON and nav routes | Gson/Moshi | One serialization stack; Kotlin-native. |
| ADR-14 | **Results held in an in-memory `AnalysisSessionStore`**, not passed through navigation arguments | Putting text into nav args | Avoids large/sensitive data in nav state and the saved-state bundle. |
| ADR-15 | **Own URL parser, punycode codec and confusable folding**, not Guava/ICU4J/OkHttp | Libraries | Full control and testability; avoids heavy dependencies and library normalisation silently "fixing" the very tricks we want to detect. Trade-off: documented limits (Section E). |
| ADR-16 | **Bundled public suffix list** parsed by own code | Library | Needed for registrable-domain logic. Licence and update date recorded (E4). |

## B2. Layering and dependency rule

```
┌───────────────────────────── :app ─────────────────────────────┐
│ ui (Compose screens, ViewModels)                               │
│   │ depends on                                                 │
│ domain (interfaces: HistoryRepository, SettingsRepository,     │
│         QrScanner; AnalyzeInputUseCase)                        │
│   ▲ implemented by                                             │
│ data (Room, DataStore, session store)   platform (intents, QR, │
│                                         clipboard, logger)     │
└───────────────────────────────┬────────────────────────────────┘
                                │ depends on
                      ┌─────────▼──────────┐
                      │ :analyzer (JVM)    │  no android.*, no Compose, no Room
                      └────────────────────┘
```

Rules: `:analyzer` knows nothing about `:app`. `ui` never touches Room or DataStore directly. `platform` is the only place that touches `Intent`, ML Kit and `ClipboardManager`.

## B3. Data flow (share → result)

1. `ShareReceiverActivity` receives `ACTION_SEND` or `PROCESS_TEXT`.
2. `IntentInputExtractor` (platform) validates and returns `AnalysisInput` (text capped, source set).
3. `PauseLinkRoot(initialInput)` starts the flow and calls `AnalyzeViewModel.analyze(input)`.
4. `AnalyzeInputUseCase` runs `ThreatAnalyzer.analyze` on `Dispatchers.Default`, stores the report in `AnalysisSessionStore` (returns `sessionId`), and, if "Save history" is on, persists a *sanitised* copy via `HistoryRepository`.
5. UI navigates to `Result(sessionId)` and renders `AnalysisReport`.
6. On process death, `Result` finds no session and shows the "no longer available" state (history copy opens by `historyId` instead).

## B4. Offline-first meaning here

Everything works with no network, because the MVP never uses the network. "Offline-first" is therefore a *property to protect* (no `INTERNET` permission), not a sync problem. Possible exception: the first QR scan may require Play services to fetch the scanner module [VERIFY]. This must be shown honestly in the UI and README.

## B5. Concurrency and state rules

- ViewModels expose `StateFlow<UiState>` (sealed interface) and collect with `collectAsStateWithLifecycle()`.
- History list: `Flow<List<HistoryItem>>` from Room, `stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), initial)`.
- One-off UI effects (snackbar, navigation) use a `Channel`/`SharedFlow` of events, not state fields.
- Dispatchers injected (`@DefaultDispatcher`, `@IoDispatcher`) so tests can replace them.

---

# C. COMPLETE MVP FEATURE SPECIFICATION

## C1. Navigation map

```
Launcher → MainActivity → Home ──► Result(sessionId) ──► FindingDetail(sessionId, linkIndex?, ruleId)
                           │
                           ├──► QR scan (system UI via code scanner) ──► Result
                           ├──► History ──► Result(historyId)
                           └──► Settings ──► Privacy

Share / Text-selection → ShareReceiverActivity → (auto-analyse) → Result → Done = finish()
```

Type-safe routes: `Home`, `History`, `Settings`, `Privacy`, `Result(sessionId: String?, historyId: Long?)` (exactly one non-null), `FindingDetail(sessionId: String?, historyId: Long?, linkIndex: Int, ruleCode: String)`. `linkIndex = -1` means a message-level finding.

## C2. Screens, states, interactions

### 1. Home
- **Content:** title; large text field ("Paste a link or message"); **Paste** icon button (explicit user action reads clipboard; never auto-read on launch) and **Check** button; **Scan QR code** button; "Recent checks" (last 3) with "See all"; a dismissible tip card "You can also share a link to PauseLink from any app" (shown until dismissed; flag in DataStore).
- **States:** Empty input → Check disabled. Input > 10,000 chars → accepted, inline notice "Only the first 10,000 characters will be checked". No history → recent section replaced by a short empty-state sentence.
- **Interactions:** Check → analyse → Result. Long-press on a recent item → delete.
- **Errors:** Clipboard empty → snackbar "Clipboard is empty".

### 2. Analyzing (transient)
- Analysis is expected under ~50 ms. Show a progress indicator only if work exceeds 300 ms, to avoid flicker. State `Analyzing` exists for correctness. Failure (unexpected exception) → `Error` state with "Something went wrong analysing this. Nothing was sent anywhere." and a **Back** button. Never log the input.

### 3. Result
- **Header card:** risk band label and icon (never colour alone), one-line summary ("2 warning signs found in 1 link"), and the fixed line **"PauseLink looks for warning signs. It cannot confirm a link is safe or unsafe."**
- **Band wording (locked):**

| Band | Title | Meaning |
|---|---|---|
| NO_WARNING_SIGNS | "No warning signs found" | Rules found nothing; this is **not** a safety guarantee. |
| NOTICE | "A few things to note" | Minor signs; often harmless. |
| CAUTION | "Be careful" | Several or notable signs. |
| STRONG_WARNING | "Strong warning signs" | Multiple or high-impact signs. Don't enter passwords or payments. |

- **Links section:** one card per link (max 10 analysed): domain with the registrable part emphasised and the rest muted, the link as non-clickable text (never auto-linked), band chip, findings list.
- **Message section:** message-level findings (urgency, payment request, etc.).
- **Notes:** `NO_LINKS_FOUND`, `INPUT_TRUNCATED`, `LINKS_LIMIT_REACHED(n)`, `QR_NOT_A_LINK(type)`.
- **Actions:** Copy link, Copy defanged link, Done/Back. **No "Open link" button.**
- **Empty/edge states:** no links and no findings → "No links found" note; session expired → "This result is no longer available" with a Home button.

### 4. Finding detail
Sections in fixed order: **What we noticed** (title plus evidence table), **Why it matters**, **Could this be harmless?**, **What you can do**, **About this check** (rule code like `U007`, confidence label, "this is a heuristic").
Evidence values are rendered with `SafeDisplay` (invisible/bidi characters shown as visible tokens such as `‹U+202E›`).

### 5. QR scanning
- Tap **Scan QR code** → launch code scanner UI (system-provided).
- Success → `AnalysisInput(payload, QR_CODE)` → analyse → Result.
- Cancelled → return silently to Home.
- Unavailable (no Play services / module missing) → dialog "QR scanning needs Google Play services on this device. You can paste the link instead."
- Failure → snackbar with generic message.
- Payload types handled: URL; UPI payment URI; `tel:`, `sms:`, `smsto:`, Wi-Fi config; other text → analysed as text.

### 6. History
- List grouped by day; item: band chip, primary domain (sanitised), link count, source icon, time.
- Swipe-to-delete with **Undo** snackbar; overflow "Clear all" (confirmation dialog).
- Empty state: "No checks yet" with explanation; if history is turned off: "History is off. Turn it on in Settings."
- Tap → Result(historyId). Stored reports show a small banner "Saved result (analysis v{n})".

### 7. Settings
Save history (toggle, default on); Keep history for 7/30/90 days (default 30); Theme (System/Light/Dark); Clear history; Privacy information; About (version, licences list).
Turning "Save history" off does **not** delete existing items; it offers "Delete existing history too?".

### 8. Privacy information (static)
Plain-language statements (these must remain true; each has an automated or documented check):

1. "PauseLink never opens or contacts the links you check." *(no INTERNET permission; no WebView)*
2. "Your text is analysed on your device. It is not sent anywhere."
3. "We store: a shortened version of each link (no query or username), the warning signs found, the time. We do **not** store your message text."
4. "History is excluded from Android backups."
5. "Limits: results are heuristics. New or well-disguised scams can score as 'no warning signs'. Legitimate links can trigger warnings."

## C3. Accessibility requirements

TalkBack labels on all icons; band conveyed by text and icon as well as colour; touch targets ≥ 48dp; supports 200% font scale without clipping; dark theme; focus order top-to-bottom; finding cards are single semantic nodes with `onClickLabel`.

## C4. Empty / loading / error summary

| Screen | Empty | Loading | Error |
|---|---|---|---|
| Home | no recents | none | clipboard empty |
| Result | no links | >300 ms indicator | session expired; unexpected failure |
| History | no items / history off | initial Room load | n/a (Room failure → generic) |
| QR | n/a | system UI | cancelled / unavailable / failure |
| Settings | n/a | DataStore load | write failure → snackbar |

---

# D. DATA MODELS AND PROJECT STRUCTURE

## D1. Directory tree

```
pauselink/
├─ AGENTS.md                      (Section J)
├─ README.md
├─ settings.gradle.kts
├─ build.gradle.kts
├─ gradle/libs.versions.toml      (all versions VERIFY)
├─ docs/
│  ├─ ARCHITECTURE.md
│  ├─ THREAT_MODEL.md
│  ├─ ANALYSIS_RULES.md           (generated or hand-kept rule catalog)
│  ├─ VERSIONS.md                 (record of verified versions and dates)
│  ├─ decisions/ADR-01-... .md
│  └─ screenshots/
├─ analyzer/                      (pure Kotlin/JVM)
│  ├─ build.gradle.kts
│  └─ src/
│     ├─ main/kotlin/com/yourname/pauselink/analyzer/
│     │  ├─ ThreatAnalyzer.kt
│     │  ├─ DefaultThreatAnalyzer.kt
│     │  ├─ AnalyzerConfig.kt
│     │  ├─ model/      AnalysisInput, AnalysisReport, LinkReport, Finding, Evidence,
│     │  │              RuleId, Severity, Confidence, RiskBand, ReportNote
│     │  ├─ extract/    UrlExtractor, DefaultUrlExtractor, TextSanitizer
│     │  ├─ parse/      UrlParser, HostParser, IpAddressParser, Punycode, PublicSuffixList
│     │  ├─ unicode/    ScriptClassifier, ConfusableFolder, InvisibleChars
│     │  ├─ data/       BrandRegistry, ShortenerList, Lexicon
│     │  ├─ rules/      UrlRule, MessageRule, RuleSet, url/*.kt, message/*.kt, qr/*.kt
│     │  └─ scoring/    Scorer, ScoringConfig
│     ├─ main/resources/pauselink/
│     │  public_suffix_list.dat, PSL_VERSION.txt, brands.json,
│     │  shorteners.txt, lexicon_en.json, confusables.tsv
│     └─ test/
│        ├─ kotlin/...    (mirrors main, one test class per rule)
│        └─ resources/testdata/ urls_benign.csv, urls_suspicious.csv,
│                               messages.csv, idn_punycode.csv, extraction_edge.csv
└─ app/
   └─ src/
      ├─ main/
      │  ├─ AndroidManifest.xml
      │  ├─ kotlin/com/yourname/pauselink/
      │  │  ├─ PauseLinkApplication.kt        (@HiltAndroidApp)
      │  │  ├─ MainActivity.kt
      │  │  ├─ ShareReceiverActivity.kt
      │  │  ├─ PauseLinkRoot.kt                (shared Compose root)
      │  │  ├─ di/          AnalyzerModule, DatabaseModule, DispatchersModule, PlatformModule
      │  │  ├─ navigation/  Routes.kt, PauseLinkNavHost.kt
      │  │  ├─ domain/      HistoryRepository, SettingsRepository, QrScanner,
      │  │  │               AnalyzeInputUseCase, model/(HistoryItem, AppSettings, ...)
      │  │  ├─ data/
      │  │  │  ├─ db/        PauseLinkDatabase, HistoryEntity, HistoryDao, Converters(if needed)
      │  │  │  ├─ history/   HistoryRepositoryImpl, HistoryMapper
      │  │  │  ├─ settings/  SettingsRepositoryImpl
      │  │  │  └─ session/   AnalysisSessionStore
      │  │  ├─ platform/    IntentInputExtractor, GmsQrScanner, ClipboardHelper, AppLogger
      │  │  └─ ui/
      │  │     ├─ theme/  components/(RiskBadge, DomainText, FindingCard, EmptyState)
      │  │     ├─ home/  result/  finding/  history/  settings/  privacy/
      │  │     └─ text/   FindingTextResolver, SafeDisplay, Defang
      │  └─ res/values/  strings.xml, findings_strings.xml
      ├─ test/           ViewModel, use case, mapper, resolver, security tests
      └─ androidTest/    Room, Compose UI, share-intent, manifest tests
```

## D2. Analyzer domain models (Kotlin)

```kotlin
// analyzer/model
enum class InputSource { SHARED_TEXT, PROCESS_TEXT, PASTED, QR_CODE }

data class AnalysisInput(val text: String, val source: InputSource)

enum class Severity { INFO, LOW, MEDIUM, HIGH }
enum class Confidence { LOW, MEDIUM, HIGH }          // how reliable the rule is, not how risky
enum class RiskBand { NO_WARNING_SIGNS, NOTICE, CAUTION, STRONG_WARNING }

/** Stable codes. Never renumber; the UI and stored history depend on them. */
enum class RuleId(val code: String) {
    INSECURE_SCHEME("U001"), IP_ADDRESS_HOST("U002"), USERINFO_IN_URL("U003"),
    PUNYCODE_DOMAIN("U004"), MIXED_SCRIPT_LABEL("U005"), CONFUSABLE_CHARACTERS("U006"),
    BRAND_LOOKALIKE("U007"), BRAND_IN_HOST("U008"), DOMAIN_IN_SUBDOMAIN("U009"),
    COMPLEX_HOST("U010"), URL_SHORTENER("U011"), UNUSUAL_PORT("U012"),
    REDIRECT_PARAMETER("U013"), HIDDEN_CHARACTERS("U014"), ENCODED_HOST("U015"),
    UNEXPECTED_SCHEME("U016"), SENSITIVE_WORDS("U017"),
    URGENCY_LANGUAGE("M001"), PAYMENT_REQUEST("M002"), CREDENTIAL_REQUEST("M003"),
    THREAT_LANGUAGE("M004"), REWARD_LURE("M005"), SENDER_LINK_MISMATCH("M006"),
    QR_PAYMENT_REQUEST("Q001"), QR_ACTION_PAYLOAD("Q002");
}

enum class EvidenceKey {
    OBSERVED_HOST, DECODED_HOST, REGISTRABLE_DOMAIN, SCHEME, PORT, SCRIPTS, CHARACTERS,
    MATCHED_BRAND, OFFICIAL_DOMAIN, MATCH_KIND, LABEL_COUNT, SERVICE, PARAM_NAME,
    IP_FORM, PHRASE, WORD, PAYLOAD_TYPE, USERINFO_PRESENT
}
@Serializable data class Evidence(val key: EvidenceKey, val value: String)

@Serializable
data class Finding(
    val ruleId: RuleId,
    val severity: Severity,
    val confidence: Confidence,
    val score: Int,                       // contribution; 0 for INFO / unpartnered corroborating
    val evidence: List<Evidence>,
)

@Serializable data class RiskAssessment(val score: Int, val band: RiskBand)

@Serializable
data class LinkReport(
    val displayUrl: String,               // sanitised: no userinfo/query/fragment, truncated
    val host: String?,                    // ascii host (may be punycode)
    val decodedHost: String?,             // unicode form for display (escaped by UI)
    val registrableDomain: String?,
    val findings: List<Finding>,
    val assessment: RiskAssessment,
    @Transient val rawUrl: String? = null // in memory only, never persisted
)

@Serializable
sealed interface ReportNote {
    @Serializable data object NoLinksFound : ReportNote
    @Serializable data object InputTruncated : ReportNote
    @Serializable data class LinksLimitReached(val analysed: Int, val found: Int) : ReportNote
    @Serializable data class QrNotALink(val payloadType: String) : ReportNote
}

@Serializable
data class AnalysisReport(
    val source: InputSource,
    val links: List<LinkReport>,
    val messageFindings: List<Finding>,
    val overall: RiskAssessment,
    val notes: List<ReportNote>,
    val analyzerVersion: Int,
)
```

Extraction/parse models (internal to `:analyzer`, not persisted):

```kotlin
enum class LinkKind { SCHEME_PREFIXED, WWW_PREFIXED, BARE_DOMAIN, QR_PAYLOAD }

data class ExtractedUrl(val raw: String, val kind: LinkKind, val start: Int, val end: Int)

data class ParsedUrl(
    val scheme: String?,
    val userInfo: String?,
    val hostAscii: String,                // punycode form, lowercase, no trailing dot
    val hostUnicode: String,              // decoded form
    val labels: List<String>,             // ascii labels
    val ip: IpHost?,                      // non-null when host is an IP in any notation
    val port: Int?,
    val path: String, val query: String?, val fragment: String?,
    val registrableDomain: String?, val publicSuffix: String?,
    val subdomainLabels: List<String>,
    val hadHiddenChars: Boolean,
    val hostWasPercentEncoded: Boolean,
)
data class IpHost(val canonical: String, val form: IpForm, val isPrivateOrReserved: Boolean)
enum class IpForm { DOTTED_DECIMAL, DECIMAL_INTEGER, HEX, OCTAL, MIXED, IPV6 }

sealed interface ParseResult {
    data class Parsed(val url: ParsedUrl) : ParseResult
    data class Rejected(val reason: RejectReason) : ParseResult
}
enum class RejectReason { EMPTY, NO_HOST, INVALID_PORT, INVALID_HOST_CHARACTERS, TOO_LONG, MALFORMED_PUNYCODE }
```

## D3. Analyzer interfaces and rule structure

```kotlin
interface ThreatAnalyzer { fun analyze(input: AnalysisInput): AnalysisReport }

interface UrlExtractor { fun extract(text: String): ExtractionResult }
data class ExtractionResult(val urls: List<ExtractedUrl>, val truncatedInput: Boolean, val skippedLinks: Int)

interface UrlParser { fun parse(raw: String): ParseResult }

/** Context handed to link-level rules. Immutable. */
class LinkContext(
    val url: ParsedUrl,
    val extracted: ExtractedUrl,
    val message: MessageSignals?,         // null for QR / pure URL inputs
    val config: AnalyzerConfig,
)
/** Context for rules about the whole text. */
class MessageContext(val normalizedText: String, val links: List<LinkContext>, val source: InputSource, val config: AnalyzerConfig)

interface UrlRule {
    val id: RuleId
    /** true = only counts when another non-corroborating finding exists in the same scope. */
    val corroborating: Boolean get() = false
    fun evaluate(ctx: LinkContext): Finding?      // at most one finding per rule per link
}
interface MessageRule {
    val id: RuleId
    val corroborating: Boolean get() = false
    fun evaluate(ctx: MessageContext): Finding?
}
```

Rule example (shape to copy for all rules):

```kotlin
class UrlShortenerRule(private val shorteners: ShortenerList) : UrlRule {
    override val id = RuleId.URL_SHORTENER
    override fun evaluate(ctx: LinkContext): Finding? {
        val domain = ctx.url.registrableDomain ?: return null
        if (!shorteners.contains(domain)) return null
        return Finding(
            ruleId = id, severity = Severity.LOW, confidence = Confidence.HIGH, score = 10,
            evidence = listOf(Evidence(EvidenceKey.SERVICE, domain)),
        )
    }
}
```
Rules **return data only**. Titles and explanations live in the app's string resources, keyed by `RuleId.code` (Section E8).

Analyzer orchestration (pseudocode):

```kotlin
class DefaultThreatAnalyzer(
    private val extractor: UrlExtractor, private val parser: UrlParser,
    private val urlRules: List<UrlRule>, private val messageRules: List<MessageRule>,
    private val scorer: Scorer, private val config: AnalyzerConfig,
) : ThreatAnalyzer {
    override fun analyze(input: AnalysisInput): AnalysisReport {
        val text = TextSanitizer.prepare(input.text, config.maxInputChars)        // truncates, keeps flags
        val extraction = if (input.source == QR_CODE) QrPayload.classify(text) else extractor.extract(text.value)
        val links = extraction.urls.take(config.maxLinks).mapNotNull { e ->
            when (val r = parser.parse(e.raw)) {
                is Parsed   -> LinkContext(r.url, e, MessageSignals.from(text), config)
                is Rejected -> null          // counted in notes; never throws
            }
        }
        val linkReports = links.map { ctx -> scorer.scoreLink(ctx, urlRules.mapNotNull { it.evaluate(ctx) }) }
        val msgFindings = messageRules.mapNotNull { it.evaluate(MessageContext(text.value, links, input.source, config)) }
        return scorer.assemble(input.source, linkReports, msgFindings, notes(...), ANALYZER_VERSION)
    }
}
```
Determinism rules: no randomness, no clock, no I/O, stable ordering (severity desc, score desc, rule code asc).

## D4. App domain and Room

```kotlin
// app/domain
interface HistoryRepository {
    fun observeHistory(): Flow<List<HistoryItem>>
    fun observeRecent(limit: Int): Flow<List<HistoryItem>>
    suspend fun getReport(historyId: Long): AnalysisReport?
    suspend fun save(report: AnalysisReport): Long
    suspend fun delete(historyId: Long)
    suspend fun restore(item: HistoryItem, report: AnalysisReport)   // for Undo
    suspend fun clear()
    suspend fun pruneOlderThan(cutoffEpochMs: Long): Int
}
data class HistoryItem(
    val id: Long, val createdAtEpochMs: Long, val source: InputSource,
    val band: RiskBand, val score: Int, val primaryHost: String?, val linkCount: Int,
)

interface SettingsRepository {
    val settings: Flow<AppSettings>
    suspend fun setSaveHistory(enabled: Boolean)
    suspend fun setRetentionDays(days: Int)
    suspend fun setTheme(theme: ThemeMode)
    suspend fun dismissShareTip()
}
data class AppSettings(
    val saveHistory: Boolean = true, val retentionDays: Int = 30,
    val theme: ThemeMode = ThemeMode.SYSTEM, val shareTipDismissed: Boolean = false,
)
enum class ThemeMode { SYSTEM, LIGHT, DARK }

interface QrScanner { suspend fun scan(): QrScanResult }
sealed interface QrScanResult {
    data class Success(val payload: String) : QrScanResult
    data object Cancelled : QrScanResult
    data object Unavailable : QrScanResult
    data class Failure(val kind: String) : QrScanResult    // kind = exception class name only
}
```

```kotlin
@Entity(tableName = "history", indices = [Index("createdAtEpochMs")])
data class HistoryEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val createdAtEpochMs: Long,
    val source: String,            // InputSource.name
    val overallBand: String,       // RiskBand.name
    val overallScore: Int,
    val primaryHost: String?,      // denormalised for list display
    val linkCount: Int,
    val analyzerVersion: Int,
    val reportJson: String,        // AnalysisReport serialised; rawUrl is @Transient so it is never written
)

@Dao interface HistoryDao {
    @Query("SELECT id, createdAtEpochMs, source, overallBand, overallScore, primaryHost, linkCount FROM history ORDER BY createdAtEpochMs DESC")
    fun observeAll(): Flow<List<HistoryListRow>>
    @Query("SELECT reportJson FROM history WHERE id = :id") suspend fun reportJson(id: Long): String?
    @Insert suspend fun insert(e: HistoryEntity): Long
    @Query("DELETE FROM history WHERE id = :id") suspend fun delete(id: Long)
    @Query("DELETE FROM history") suspend fun clear()
    @Query("DELETE FROM history WHERE createdAtEpochMs < :cutoff") suspend fun pruneOlderThan(cutoff: Long): Int
}
```
- `@Database(entities = [HistoryEntity::class], version = 1, exportSchema = true)`; set the schema export directory (needed for migration tests) [F].
- **Relationships:** none in MVP (ADR-06). Documented in the ADR.
- **Sanitisation before saving (`HistoryMapper.toStorable`):** `displayUrl` is built without userinfo, query and fragment; path truncated to 60 chars; message cue evidence stores only the *canonical lexicon phrase* and never the user's raw text; `rawUrl` is dropped.
- The undo flow holds the deleted `AnalysisReport` in memory in the ViewModel for a few seconds.

Use case and store:

```kotlin
class AnalyzeInputUseCase @Inject constructor(
    private val analyzer: ThreatAnalyzer, private val sessions: AnalysisSessionStore,
    private val history: HistoryRepository, private val settings: SettingsRepository,
    @DefaultDispatcher private val dispatcher: CoroutineDispatcher,
) {
    suspend operator fun invoke(input: AnalysisInput): AnalysisOutcome {
        val report = withContext(dispatcher) { analyzer.analyze(input) }
        val sessionId = sessions.put(report)                       // in-memory, LRU of 8
        val s = settings.settings.first()
        val historyId = if (s.saveHistory) history.save(report) else null
        return AnalysisOutcome(sessionId, historyId, report)
    }
}
```

---

# E. ANALYSIS-ENGINE TECHNICAL SPECIFICATION

## E1. Pipeline

```
raw text
 → TextSanitizer (cap length, strip/flag invisible & bidi chars, normalise whitespace)
 → UrlExtractor (find candidates)
 → UrlParser (structure, host normalisation, IDN, IP forms, PSL)
 → Rules (per link; per message)
 → Scorer (per link score → overall band; corroboration logic)
 → AnalysisReport
```

Limits (config, defaults): `maxInputChars = 10_000`, `maxLinks = 10`, `maxUrlLength = 2_048`, `maxHostLength = 253` [F: DNS limit]. All input-size limits protect against hostile shares.

## E2. Text sanitising

- Truncate to `maxInputChars` and set `InputTruncated`.
- Detect (do not silently delete) invisible/format characters: U+200B-U+200F, U+202A-U+202E, U+2060-U+2064, U+2066-U+2069, U+FEFF, and soft hyphen U+00AD. Record per-link `hadHiddenChars` *before* stripping for host comparison. The finding U014 is raised from that flag.
- Normalise line endings; do **not** lowercase the text (paths are case-sensitive).

## E3. URL extraction

Candidate types, in priority order:
1. `http://` / `https://` (case-insensitive scheme).
2. `www.` prefix.
3. **Bare domains** (`example.com/login`) only if the TLD is in the PSL ICANN section **and** the token has a dot-separated registrable form. Marked `BARE_DOMAIN` (lower confidence). Gotcha [F]: some file extensions are real TLDs (for example `.zip`, `.mov`), so `report.zip` can look like a domain. Rule: bare-domain candidates whose TLD is in a small "common file extension" set require a path or `www.` to count.

Termination and cleanup:
- A candidate ends at whitespace, `<`, `>`, `"`, or a control character.
- Strip trailing punctuation `.,;:!?` and unbalanced closing `)]}` and quotes; keep balanced parentheses (`https://example.com/a_(b)` keeps `(b)`).
- Strip surrounding `<...>`.
- Collapse duplicates (same raw text).
- **Implementation constraint:** linear scan or a simple, non-backtracking pattern. **No nested quantifiers.** Required test: 100,000 chars of adversarial text completes quickly (Section F5).

## E4. URL parsing and normalisation

Steps (RFC 3986-lite, strict and defensive):
1. Trim; reject if empty or longer than `maxUrlLength` (`TOO_LONG`).
2. Scheme: if absent (www/bare) assume `http` **for analysis only** and note `schemeAssumed` (so U001 does not fire on an assumed scheme).
3. Split authority: `userinfo@host:port`. Split at the *last* `@` in the authority [F: this matches browser behaviour for spoofing like `a@b@c`]. Handle IPv6 in brackets.
4. Host normalisation: percent-decode (set `hostWasPercentEncoded`), Unicode NFKC (`java.text.Normalizer`), lowercase with `Locale.ROOT`, strip one trailing dot, split labels.
   - **Limitation:** NFKC plus lowercasing approximates but is not identical to UTS #46 mapping used by browsers. Document it.
5. Each label: if it starts with `xn--`, decode via own **Punycode (RFC 3492)** implementation; on failure set `MALFORMED_PUNYCODE`. If it contains non-ASCII, encode to `xn--` form. Keep `hostAscii` and `hostUnicode`.
6. IP detection: dotted decimal; single decimal integer (`http://3221225985/`); hex (`0xC0.0x00.0x02.0x01`); octal parts; mixed (inet_aton-style); IPv6 literal. Classify private/loopback/link-local/documentation ranges (`isPrivateOrReserved`).
7. Port: 1-65535 else `INVALID_PORT`.
8. **Public suffix list:** parse the bundled `public_suffix_list.dat` (rules, `*.` wildcards, `!` exceptions). Registrable domain = public suffix + one label. Use ICANN + PRIVATE sections together so user-content hosts such as `name.<private-suffix>` count as distinct registrable domains (avoids treating `evil.<hosting-site>` as owned by the host). Record the PSL download date in `PSL_VERSION.txt`. PSL licence is MPL-2.0 [F, VERIFY]: keep the file unmodified and credit it in the About screen.
9. Rejected parses never throw. They are counted, not shown as links.

## E5. IDN, punycode and confusables

**Script classification:** `Character.UnicodeScript.of(codePoint)` (pure JVM). Ignore `COMMON` and `INHERITED` (digits, hyphen).
- **Mixed-script rule (U005)** fires when a *single label* contains Latin plus Cyrillic or Greek (or Armenian/Cherokee etc. from a small configured "confusable-prone" set).
- **Allowed combinations (false-positive guard)** [F, from UTS #39 "highly restrictive" idea]: Latin + Han + Hiragana + Katakana (Japanese); Latin + Han + Bopomofo; Latin + Han + Hangul. These do not trigger U005.

**Confusable folding (own, deliberately small):**
- `confusables.tsv`: a curated subset (a few hundred entries) mapping common look-alike code points to ASCII (e.g., Cyrillic а, е, о, р, с, х, у, і, ј, ѕ; Greek ο, α, ν; certain Latin extended). Generated or hand-seeded from Unicode's `confusables.txt` [VERIFY licence/terms before copying and keep attribution]. **Not a full UTS #39 implementation.** State this limitation in the docs.
- Two fold levels:
  1. `foldUnicode(label)`: non-ASCII → ASCII lookalike.
  2. `foldAscii(label)`: ASCII-lookalike normalisation: `0→o`, `1→l`, `rn→m`, `vv→w`, `|→l`, and `l`/`i` unified.
- Two labels are "visually confusable" when `foldAscii(foldUnicode(a)) == foldAscii(foldUnicode(b))` and `a != b`.

**Mapping:** U004 = punycode present; U005 = mixed script; U006 = confusable characters without brand match; U007 = brand lookalike (including fold match).

## E6. Brand and lookalike detection

`BrandRegistry` (data from `brands.json`):

```json
{ "brands": [
  { "id": "examplebank", "displayName": "ExampleBank",
    "tokens": ["examplebank", "example bank"],
    "officialDomains": ["examplebank.example"] } ] }
```
- **Seed carefully.** Every official domain must be verified manually against the brand's own site before it is committed. Start with a small, high-confidence list [REC]; wrong official domains create false alarms. Tests use a fake brand with `.example` domains (Section F7).
- Matching works on the **registrable label** (the SLD) and the registrable domain:
  - **Exact official domain** → no brand finding (this is the false-positive guard).
  - **U007 BRAND_LOOKALIKE**, kinds in descending strength:
    - `FOLD_MATCH`: label is visually confusable with a brand token (score 60, confidence MEDIUM).
    - `EDIT_DISTANCE_1`: Damerau-Levenshtein distance 1 and brand token length ≥ 6 (score 45).
    - `SAME_LABEL_DIFFERENT_SUFFIX`: label equals brand token but the registrable domain is not official (score 25, confidence LOW; owners often hold other TLDs).
  - **U008 BRAND_IN_HOST:** brand token appears in a subdomain label or as part of a hyphenated label of a non-official registrable domain (score 40, confidence MEDIUM).
  - **U009 DOMAIN_IN_SUBDOMAIN:** subdomain labels contain a *domain-like sequence* `label.<known TLD>` before the registrable domain (e.g., `something.com.other-site.tld`). Needs no brand list (score 40).
- Compare with the PSL-derived registrable domain, so a brand name used as a *subdomain of a hosting suffix* is not mistaken for ownership.

## E7. Rule catalogue (MVP)

`Corrob.` = corroborating (counts only alongside other non-corroborating findings). Scores are initial values to calibrate with the corpus.

| ID | Rule | Trigger | Severity | Score | Conf. | Main false-positive guard |
|---|---|---|---|---|---|---|
| U001 | INSECURE_SCHEME | explicit `http://` (not assumed) | LOW | 8 | HIGH | Not raised for assumed scheme; copy explains HTTPS alone does not mean safe. |
| U002 | IP_ADDRESS_HOST | host is IP in any notation | MEDIUM | 30 (8 if private/loopback) | HIGH | Private/reserved ranges downgraded. |
| U003 | USERINFO_IN_URL | `user@` before host | MEDIUM 25; HIGH 55 if userinfo looks like a domain (contains `.`) | 25/55 | HIGH | Plain `user:pass@` on internal hosts is rare in shared messages. |
| U004 | PUNYCODE_DOMAIN | any `xn--` label (from either input form) | LOW | 6 | HIGH | Legitimate IDNs exist; stays NOTICE-level alone. |
| U005 | MIXED_SCRIPT_LABEL | one label mixes Latin with Cyrillic/Greek/etc. | HIGH | 50 | HIGH | Allowed CJK combinations excluded. |
| U006 | CONFUSABLE_CHARACTERS | label has non-ASCII chars that fold to ASCII, no brand match | MEDIUM | 25 | MEDIUM | Single-script labels with no confusables never fire. |
| U007 | BRAND_LOOKALIKE | see E6 | HIGH/MEDIUM | 60/45/25 | MEDIUM/LOW | Official domain list; length ≥ 6 for edit distance. |
| U008 | BRAND_IN_HOST | brand token in subdomain/hyphenated label of non-official domain | HIGH | 40 | MEDIUM | Official domain exemption; PSL-aware. |
| U009 | DOMAIN_IN_SUBDOMAIN | domain-like sequence inside subdomain | HIGH | 40 | MEDIUM | Needs a real public-suffix label right before the actual registrable domain. |
| U010 | COMPLEX_HOST | ≥ 4 subdomain labels, or a label with ≥ 3 hyphens, or host > 60 chars | LOW | 10 | LOW | Low weight; many CDNs have deep hosts. |
| U011 | URL_SHORTENER | registrable domain in shortener list | LOW | 10 | HIGH | Informational: destination is hidden and PauseLink does not expand it. |
| U012 | UNUSUAL_PORT | port not 80/443 | LOW | 10 | MEDIUM | Default ports and absent ports ignored. |
| U013 | REDIRECT_PARAMETER | a query value is itself a URL on a different registrable domain | LOW | 10 | LOW | Many legitimate login flows do this. |
| U014 | HIDDEN_CHARACTERS | invisible or bidi control chars in the URL | MEDIUM | 25 | HIGH | Only inside URL span, not elsewhere in the message. |
| U015 | ENCODED_HOST | percent-encoding in the host | MEDIUM | 20 | HIGH | Hosts almost never need this. |
| U016 | UNEXPECTED_SCHEME | `javascript:`, `data:`, `file:`, `intent:` (QR payloads) | HIGH | 50 | HIGH | Only fires on scheme match; never executed. |
| U017 | SENSITIVE_WORDS | `login/verify/secure/account/update/kyc...` in host or path | LOW, **Corrob.** | 6 | LOW | Corroborating only; official domains exempt. |
| M001 | URGENCY_LANGUAGE | lexicon phrases ("within 24 hours", "act now", "final notice") | LOW, **Corrob.** | 10 | LOW | Corroborating only. |
| M002 | PAYMENT_REQUEST | lexicon ("processing fee", "pay now", "gift card", "UPI to receive") | MEDIUM | 20 | MEDIUM | Message-level cap (E9). |
| M003 | CREDENTIAL_REQUEST | lexicon ("verify your account", "enter your PIN", "update KYC") | MEDIUM | 25 | MEDIUM | **Negation guard:** suppress within a window after "do not", "never", "will not ask". |
| M004 | THREAT_LANGUAGE | lexicon ("account will be suspended/blocked", "legal action") | LOW | 15 | LOW | Message-level cap. |
| M005 | REWARD_LURE | lexicon ("you have won", "claim your prize", "refund pending") | LOW | 12 | LOW | Message-level cap. |
| M006 | SENDER_LINK_MISMATCH | message names a registry brand/token **and** a link's registrable domain is not official for it | MEDIUM | 35 | MEDIUM | Link-level finding (attached to that link); official domain exempt. |
| Q001 | QR_PAYMENT_REQUEST | QR payload is a payment URI (e.g., `upi://pay?...`) | LOW (educational) | 15 | HIGH | Explains: scanning to *pay*; you never need to scan to *receive* money. |
| Q002 | QR_ACTION_PAYLOAD | QR payload is `tel:`, `sms:`, `smsto:`, Wi-Fi | LOW | 10 | HIGH | Explains the action the code would trigger. |

Priority if time is short: build U001-U012, U014-U016, M001-M003, M006, Q001 first. U013, U017, M004, M005, Q002 can follow. **Post-MVP:** suspicious-TLD rule (high false-positive risk).

## E8. Explainability contract

Every `Finding` is data (rule id, severity, confidence, score, typed evidence). The app resolves text by key:

```
finding_<CODE>_title        "Link uses a look-alike domain"
finding_<CODE>_summary      one line with evidence placeholders
finding_<CODE>_why          why this matters
finding_<CODE>_harmless     how this could be a false alarm
finding_<CODE>_action       what you can do
```
`FindingTextResolver` maps a `Finding` to a `FindingText(title, summary, why, harmless, action)`. **Completeness test (required):** for every `RuleId`, all five string keys exist (so no rule can ship without an explanation).

Copy rules (lint by review): avoid "malicious", "scam", "fake", "dangerous" as facts. Use "can indicate", "is commonly used to". Example:

- *Title:* "The domain looks like a different name"
- *Why:* "Attackers sometimes register names that look like a well-known brand, for example by swapping a letter for a similar digit."
- *Harmless:* "Some organisations legitimately own several similar domains."
- *Action:* "Don't enter passwords or payment details. Open the organisation's official app or type its address yourself."

## E9. Scoring and band classification

```
linkScore   = min(100, Σ score(f) for f in link.findings)
messageScore= min(100, Σ score(f) for f in messageFindings)
corroborated= any link has a finding with severity ≥ LOW (non-corroborating)
if (!corroborated) messageScore = min(messageScore, 34)      // message cues alone cap at CAUTION
overall     = min(100, max(linkScore over links, 0) + messageScore)

Corroborating findings: emitted with score 0 and severity INFO if no partner finding exists in their scope.

Band: 0 → NO_WARNING_SIGNS | 1-19 → NOTICE | 20-49 → CAUTION | ≥50 → STRONG_WARNING
```
Rationale for the cap: legitimate bank alerts often contain urgency, fees and "verify" wording. Wording alone should never reach "Strong warning".
Per-link bands use the same thresholds on `linkScore`.

Worked examples (use as tests):
- Shortener alone: 10 → NOTICE.
- Shortener + urgency: 10 + 10 = 20 → CAUTION.
- Raw IP over HTTP: 8 + 30 = 38 → CAUTION.
- Fold-match brand lookalike: 60 → STRONG_WARNING.
- Payment wording + clean link: message 20, no corroboration → CAUTION.

## E10. False-positive management (summary)

1. Official-domain registry exemptions.
2. Corroborating rules and the message-only cap.
3. Low weights for weak signals; bands phrased neutrally at the low end.
4. Allowed script combinations; PSL-aware domain logic.
5. Negation guards for credential/OTP language.
6. Each finding shows its "Could this be harmless?" text and a confidence label.
7. The benign corpus must produce no `STRONG_WARNING` and at most a few `CAUTION` (thresholds are regression guards; the corpus is synthetic and small, not an accuracy measurement).

## E11. Explicit limits to show in docs and the UI

HTTPS presence is a fact about the *link text*; PauseLink cannot check certificates, so HTTPS is not evidence of safety. No reputation data: brand-new or well-crafted phishing on a clean-looking domain can score `NO_WARNING_SIGNS`. Compromised legitimate sites are undetectable. English-only lexicon. Shorteners are not expanded. Confusable coverage is partial. Lexicon rules can misfire on legitimate messages.

---

# F. TESTING AND SECURITY STRATEGY

## F1. Test pyramid

| Layer | Tooling | Where | Runs on |
|---|---|---|---|
| Analyzer unit tests (bulk of tests) | JUnit 4 (+Truth optional) | `:analyzer/src/test` | JVM, no emulator |
| ViewModel / use-case tests | JUnit 4, `kotlinx-coroutines-test`, Turbine (optional), hand-written fakes | `:app/src/test` | JVM |
| Room tests | `androidx.room:room-testing`, in-memory DB | `:app/src/androidTest` | emulator/device |
| Compose UI tests | `ui-test-junit4`, `createAndroidComposeRule` | `:app/src/androidTest` | emulator/device |
| Share/intent integration | `ActivityScenario.launch(intent)` | `:app/src/androidTest` | emulator/device |
| Security/privacy tests | JVM + instrumented | both | both |

Prefer fakes over mocking frameworks [REC]. Avoid MockK unless a fake becomes awkward.

## F2. Per-rule test matrix (mandatory)

For **every** rule in E7: (1) positive trigger; (2) negative (clean input); (3) boundary (e.g., exactly 3 vs 4 subdomain labels; edit distance 1 vs 2; brand token length 5 vs 6); (4) false-positive guard (e.g., official domain; allowed CJK mix; negated OTP text); (5) evidence correctness (keys/values); (6) score and severity exact. Name tests `rule_<CODE>_<case>` so a missing case is obvious.

## F3. Parsing, normalisation and IDN tests

Table-driven, from CSV in `test/resources/testdata`. Cover: uppercase scheme/host; trailing dot; default/explicit ports; `userinfo@host`; `a@b@c`; IPv6 literals; decimal/hex/octal IPs; percent-encoded host; empty host; over-long host/label (>63 chars per label [F]); labels starting/ending with hyphen; punycode round trip; malformed punycode; NFKC full-width input; `String` containing surrogate pairs; hidden/bidi characters; PSL cases (multi-label suffix, wildcard, exception, private-section suffix).

Punycode vectors (confirm against RFC 3492 section 7.1 and a trusted converter [VERIFY]): `bücher` ↔ `xn--bcher-kva`; `münchen` ↔ `xn--mnchen-3ya`.

## F4. Security and privacy tests (all automated where possible)

| Test | How |
|---|---|
| **No `INTERNET` permission** | Instrumented: `PackageManager.getPackageInfo(pkg, GET_PERMISSIONS)` must not list `android.permission.INTERNET`. Also a Gradle/JVM test parsing the merged manifest. If a dependency merges `INTERNET`, add `tools:node="remove"` and re-verify that QR scanning still works [VERIFY]. |
| No cleartext/network code | Source-scan test fails if `src/main` references `HttpURLConnection`, `OkHttp`, `WebView`, `java.net.URL(...).openConnection`, or `Intent.ACTION_VIEW` for analysed links. |
| **No sensitive logging** | Source-scan test: no direct `android.util.Log`, `println`, `Timber` outside `AppLogger`. `AppLogger` API accepts only `RuleId`, counts, durations, exception class names; unit-test its signature accepts no free-form `String` message from user data [REC]. |
| Backup exclusion | Manifest test: `allowBackup="false"` and `dataExtractionRules`/`fullBackupContent` exclude the database [F]. |
| Exported components | Only `ShareReceiverActivity` and the launcher activity are exported; `ShareReceiverActivity` filters are exactly SEND `text/plain` and PROCESS_TEXT `text/plain`. |
| Intent hardening | Instrumented: null extras, wrong extra types, 5 MB text, empty text, `EXTRA_STREAM` only → no crash; analysed input is capped at 10,000 chars; nothing is persisted if the user never reaches Result. |
| History minimisation | Unit: save a report built from a message with query string, userinfo and message text → stored JSON contains none of them. |
| No auto-link / no open | Compose test: link text node has no click action; no `ClickableText`/`LinkAnnotation`. |
| Process death | Instrumented: Result with a missing session id → expired state, no crash. |
| Safe display | Unit: `SafeDisplay` turns U+202E and zero-width characters into visible tokens. |

## F5. Robustness / adversarial tests

- Random and fuzz inputs: analyzer never throws and returns a report (seeded random generator so tests are deterministic).
- Pathological strings: 100,000 × `a`; 50,000 × `http://`; nested `((((` / `[[[[`; very long label; many `@`; must finish within a generous time budget (e.g., 2 s on a MacBook) [REC].
- Determinism: same input analysed twice yields equal reports; the order of findings is stable.

## F6. ViewModel, Room, UI, share tests

- **ViewModels:** `HomeViewModel` (input validation, recents), `ResultViewModel` (session found/expired/history path), `HistoryViewModel` (delete/undo/clear), `SettingsViewModel`. Assert state transitions with fakes and `StandardTestDispatcher`.
- **Use case:** history saved only when enabled; session id returned; analyzer exceptions surfaced as an error outcome.
- **Room:** insert/list ordering, delete, clear, prune by cutoff, JSON round-trip, `exportSchema` migration scaffold test.
- **Compose:** Home (button disabled when empty; paste), Result (band text and icon, limitations line, no open-link button), Finding detail (all five sections), History (empty, swipe delete, undo), Settings toggles; large-font and dark theme smoke tests.
- **Share:** launch `ShareReceiverActivity` with `ACTION_SEND` text containing a safe link → Result displayed with expected finding; `PROCESS_TEXT` equivalent; Back returns to caller (manual check in M8).

## F7. Safe test dataset

Rules: only reserved/documentation names (`example.com`, `example.net`, `example.org`, `.example`, `.test`, `.invalid`, TEST-NET `192.0.2.0/24`, IPv6 documentation `2001:db8::/32`). The tests never fetch anything. Test fixtures inject a tiny public-suffix list (`com`, `net`, `org`, `example`, `test`, `de`, `co.uk`, plus a fake private suffix `hosted.example`), a fake brand and a fake shortener, so results do not depend on the real PSL or real brands.

Fixture config:
- Brand `ExampleBank`: tokens `examplebank`, `example bank`; official `examplebank.example`.
- Shortener: `short.example`.

Format: `id,input,expectedBand,expectedRulesContainAll,notes`. `\uXXXX` means the character is written as an escape in the CSV loader.

**Benign (must not exceed the stated band):**

| ID | Input | Band | Rules |
|---|---|---|---|
| B01 | `https://example.com` | NO_WARNING_SIGNS | none |
| B02 | `Check https://example.com/docs?page=2#intro thanks` | NO_WARNING_SIGNS | none |
| B03 | `www.example.org/path` | NO_WARNING_SIGNS | none (assumed scheme, no U001) |
| B04 | `https://sub.example.com:443/` | NO_WARNING_SIGNS | none |
| B05 | `https://examplebank.example/login` | NO_WARNING_SIGNS | none (U017 emitted as INFO, score 0) |
| B06 | `Meeting at 5pm, see https://example.net/agenda` | NO_WARNING_SIGNS | none |
| B07 | `Your OTP is 123456. Do not share it with anyone.` | NO_WARNING_SIGNS | none (negation guard) |
| B08 | `ExampleBank statement ready: https://examplebank.example/statements` | NO_WARNING_SIGNS | none (official domain, M006 off) |
| B09 | `Do not share your OTP. ExampleBank will never ask for your PIN.` | NO_WARNING_SIGNS | none |
| B10 | `e.g. report.final and notes.txt` | NO_WARNING_SIGNS | no links found note |
| B11 | `(see https://example.com/a_(b))` | NO_WARNING_SIGNS | extraction keeps `(b)` |
| B12 | `Visit example.com.` | NO_WARNING_SIGNS | trailing dot removed |
| B13 | `HTTPS://EXAMPLE.COM/` | NO_WARNING_SIGNS | case normalised |
| B14 | `https://b\u00fccher.example/` | NOTICE | U004 only (single-script IDN stays low) |
| B15 | `https://xn--bcher-kva.example/` | NOTICE | U004 |
| B16 | `https://example.jp` with a Japanese label mixing Latin+Han, e.g. `https://example\u65e5\u672c.example/` | NOTICE | U004 only; **no U005** (allowed CJK combination) |

**Suspicious (expected rules must all appear; band exact):**

| ID | Input | Band | Rules |
|---|---|---|---|
| S01 | `http://example.com/` | NOTICE | U001 |
| S02 | `http://192.0.2.1/login` | CAUTION | U001, U002 |
| S03 | `http://[2001:db8::1]/` | CAUTION | U001, U002 |
| S04 | `http://3221225985/` (decimal form of 192.0.2.1) | CAUTION | U001, U002 (IP_FORM=DECIMAL_INTEGER) |
| S05 | `http://0xC0.0x00.0x02.0x01/` | CAUTION | U001, U002 (HEX) |
| S06 | `https://examplebank.example@host.test/` | STRONG_WARNING | U003 (55) |
| S07 | `https://user:pass@example.com:8443/` | CAUTION | U003, U012 |
| S08 | `https://examp1ebank.example/` | STRONG_WARNING | U007 (FOLD_MATCH) |
| S09 | `https://exarnplebank.example/` (rn→m) | STRONG_WARNING | U007 |
| S10 | `https://examplebnak.example/` (transposition) | CAUTION | U007 (EDIT_DISTANCE_1) |
| S11 | `https://examplebank.test/` | CAUTION | U007 (SAME_LABEL_DIFFERENT_SUFFIX) |
| S12 | `https://examplebank.example.account-check.test/` | STRONG_WARNING | U008, U009 |
| S13 | `https://login.examplebank.account-check.test/` | CAUTION | U008, U017 |
| S14 | `https://ex\u0430mplebank.example/` (Cyrillic а) | STRONG_WARNING | U005, U007, U004 |
| S15 | `https://\u0430\u0441\u0435.example/` (Cyrillic а, с, е) | CAUTION | U006, U004 |
| S16 | `https://example.com:8443/` | NOTICE | U012 |
| S17 | `https://example.com/redirect?url=https://example.net/x` | NOTICE | U013 |
| S18 | `https://a.b.c.d.e.example.com/` | NOTICE | U010 |
| S19 | `https://short.example/x` | NOTICE | U011 |
| S20 | `https://exam\u200Bple.com/` | CAUTION | U014 |
| S21 | `https://example.com/\u202Efile` | CAUTION | U014 |
| S22 | `https://example.com%2eexample.net/` | CAUTION | U015 |
| S23 | QR payload `javascript:void(0)` | STRONG_WARNING | U016 (never executed) |
| S24 | QR payload `intent://scan/#Intent;scheme=example;end` | STRONG_WARNING | U016 |
| S25 | `https://evil.hosted.example/` + brand token `evil` irrelevant | NO_WARNING_SIGNS | PSL private-suffix handling: registrable = `evil.hosted.example` |

**Message and QR cases:**

| ID | Input | Band | Rules |
|---|---|---|---|
| T01 | `URGENT: account suspended within 24 hours. Pay the fee now https://examplebank.test/pay` | STRONG_WARNING | U007, M001, M002, M004 |
| T02 | `Your parcel is held. Pay the customs fee: https://example.com/track` | CAUTION | M002 (cap applies) |
| T03 | `ExampleBank: verify KYC now https://example.net/kyc` | STRONG_WARNING | M003, M006, U017 |
| T04 | `Congratulations! You have won a prize. Claim at https://example.org/claim` | NOTICE | M005 |
| T05 | `Pay processing fee via UPI to receive your refund` | CAUTION | M002; note NO_LINKS_FOUND |
| T06 | QR payload `upi://pay?pa=name@bank.example&am=1` | NOTICE | Q001 |
| T07 | QR payload `tel:+10005550100` (obviously fictional) | NOTICE | Q002 |
| T08 | 12 links in one message | link count capped | `LINKS_LIMIT_REACHED(10, 12)` |
| T09 | empty / whitespace-only | NO_WARNING_SIGNS | note NO_LINKS_FOUND, no crash |

## F8. False-negative / false-positive considerations (to document)

False negatives are inherent. Examples to record in `ANALYSIS_RULES.md`: clean-looking new domains, phishing hosted on a legitimate platform, text-only scams ("call this number"), non-English lexicon, image-based scams. Add a `known_gaps.csv` where expected results are *deliberately* `NO_WARNING_SIGNS`, so the limits are tested and visible, not hidden. For false positives, track the share of the benign corpus above NOTICE as a regression metric.

## F9. Threat model (STRIDE-lite, put in `docs/THREAT_MODEL.md`)

| Threat | Mitigation |
|---|---|
| Hostile app sends giant/malformed share intents | Size caps, type-safe extraction, try/catch around extras, fuzz tests. |
| ReDoS / algorithmic blow-up | No nested-quantifier regex; linear scans; time-budget tests. |
| Display spoofing (bidi/invisible chars in the analysed URL) | `SafeDisplay` escapes; U014 finding. |
| Accidental link opening | No clickable link text; no `ACTION_VIEW`; no WebView; Copy only. |
| SSRF | No network access at all in MVP. |
| Sensitive data in logs/backups/recents | Logging policy, backup exclusion, minimised history; optional `FLAG_SECURE`/exclude from Recents is post-MVP. |
| Local database read on a compromised/rooted device | Honest limitation (below). Mitigated by minimisation; encryption is post-MVP. |
| Users over-trusting a "no warning" result | Fixed disclaimer; neutral wording; never "safe". |

**Never log:** raw input text; URLs, hosts, paths, queries; message content or snippets; QR payloads; clipboard contents; evidence values. **May log (debug builds only):** rule codes, counts, durations, exception class names.

**Honest limitations:** history is stored in an unencrypted app-private database (protected by Android's app sandbox, not by encryption); anything on a rooted device or taken via a full-device forensic image can be read; the clipboard is readable by the foreground app and, on newer Android versions, shows an access notice [F]; Play services (QR scanner) is outside PauseLink's control.

---

# G. DEPENDENCIES AND ENVIRONMENT SETUP

## G1. Versioning policy

I am **not** listing version numbers. Every version below is **[VERIFY]**. Safest procedure [REC]:

1. Create the project with Android Studio's **New Project → Empty Activity (Compose)** wizard. This yields a mutually compatible AGP/Kotlin/Compose/Gradle set for whichever stable Android Studio you install.
2. Add the `:analyzer` JVM module and the dependencies below via the **version catalog** (`gradle/libs.versions.toml`), one at a time, building after each.
3. Record the final verified versions and the date in `docs/VERSIONS.md`.

Where to verify: developer.android.com/jetpack/androidx/versions (AndroidX), the Compose BOM mapping page, Kotlin releases (kotlinlang.org), AGP release notes (developer.android.com/build/releases), Hilt releases (GitHub/Dagger docs), KSP releases (GitHub), ML Kit/Play services code scanner docs (developers.google.com/ml-kit), and Maven Google (maven.google.com).

Known compatibility rules to respect [F, VERIFY]: KSP version must match the Kotlin version prefix; with Kotlin 2.x the Compose compiler is applied by the Kotlin Compose Gradle plugin; Gradle and JDK requirements follow the AGP release notes; **newer AGP versions may change how the Kotlin plugin is applied (built-in Kotlin support). Follow the template generated by your Studio version rather than older tutorials [VERIFY].**

## G2. SDK configuration

| Setting | Value |
|---|---|
| `minSdk` | **26** [REC]: uniform notification/background behaviour, adaptive icons, large device coverage. Compose supports lower. |
| `compileSdk` / `targetSdk` | latest **stable** API level supported by your Studio at build time **[VERIFY]**; check Play's current target-API requirement before publishing. |
| JDK / Kotlin JVM toolchain | Use the JDK bundled with Android Studio or the version required by your AGP **[VERIFY]**. |
| Language | Kotlin only. |

## G3. Required dependencies (MVP)

| Artifact / plugin | Purpose | Module |
|---|---|---|
| Android Gradle Plugin; Kotlin plugin; Kotlin Compose plugin | build | app |
| `kotlin("jvm")` plugin | pure analyzer | analyzer |
| Kotlin serialization plugin + `kotlinx-serialization-json` | report JSON, type-safe nav | analyzer, app |
| KSP plugin | Room and Hilt compilers | app |
| `androidx.compose:compose-bom` + `material3`, `ui`, `ui-tooling-preview` | UI | app |
| `androidx.activity:activity-compose` | Compose host | app |
| `androidx.lifecycle:lifecycle-runtime-compose`, `lifecycle-viewmodel-compose` | `collectAsStateWithLifecycle`, ViewModels | app |
| `androidx.navigation:navigation-compose` | navigation | app |
| Hilt: `hilt-android` (+ KSP `hilt-compiler`), `androidx.hilt:hilt-navigation-compose` | DI | app |
| Room: `room-runtime`, `room-ktx` (check whether still separate) , KSP `room-compiler` | history | app |
| `androidx.datastore:datastore-preferences` | settings | app |
| `org.jetbrains.kotlinx:kotlinx-coroutines-android` | coroutines | app |
| `androidx.core:core-ktx` | extensions | app |
| `com.google.android.gms:play-services-code-scanner` | QR scanning | app |

## G4. Test dependencies

Required: `junit:junit`, `kotlinx-coroutines-test`, `androidx.test.ext:junit`, `androidx.test:runner`/`rules`, `androidx.compose.ui:ui-test-junit4`, `ui-test-manifest` (debug), `hilt-android-testing`, `androidx.room:room-testing`.
Optional: `com.google.truth:truth`, `app.cash.turbine:turbine`, Robolectric (only if you want JVM Compose/Room tests).

## G5. Optional (add only when needed)

`androidx.core:core-splashscreen`; Spotless/ktlint or detekt (style gate); JaCoCo (coverage report for README); LeakCanary (debug only); Baseline Profile / Macrobenchmark (post-MVP).

## G6. Avoid

| Avoid | Why |
|---|---|
| Retrofit / OkHttp / Ktor client | No networking in MVP. |
| Firebase, Crashlytics, any analytics/ads SDK | Violates data-collection principles. |
| WebView / Custom Tabs | Never opens links. |
| Gson, Moshi, Jackson | One serialization stack (kotlinx). |
| LiveData, RxJava | Use Flow. |
| Guava, ICU4J, Apache Commons for parsing | Weight, and normalisation that hides the tricks we detect. |
| `android.util.Patterns.WEB_URL`, `Linkify` for extraction | Not available in a pure JVM module; harder to test and reason about. |
| kapt for Hilt/Room | Prefer KSP [F, VERIFY current Hilt-KSP support]. |
| `material-icons-extended` | Large; use a few vector assets or the core set. |
| Jetpack `security-crypto` | Verify its current maintenance status before relying on it [VERIFY]. |
| Accessibility/notification-listener/SMS permissions | Excluded by scope. |

## G7. MacBook and Antigravity setup

1. Install the current **stable** Android Studio for macOS (Apple Silicon or Intel build as appropriate). Let it install the Android SDK, platform tools and emulator.
2. Create an emulator image **with Google Play** (needed for the QR scanner). Prefer an ARM64 image on Apple Silicon [F].
3. Ensure `ANDROID_HOME` points to the SDK; `local.properties` has `sdk.dir=...` (do not commit it; add to `.gitignore`).
4. Open the project in Android Studio **once** to let it sync and generate the Gradle wrapper; then Antigravity can run `./gradlew` from the terminal.
5. Commands the agent should use:
   - `./gradlew :analyzer:test`
   - `./gradlew :app:testDebugUnitTest`
   - `./gradlew :app:assembleDebug`
   - `./gradlew :app:lintDebug`
   - `./gradlew :app:connectedDebugAndroidTest` (needs a running emulator; the human should start it)
6. Initialise git before M1 and commit at the end of every milestone.

---

# H. MILESTONE-BASED IMPLEMENTATION PLAN

Complexity guess for a solo dev with AI assistance [H]: S ≈ 0.5-1 day, M ≈ 1-3 days, L ≈ 3-5 days. Plan for debugging and compile-fix time; AI output will need correction.

## M0. Pre-flight (human, not the agent)
- **Objective:** working toolchain and verified versions.
- **Tasks:** install Studio and emulator (G7); create the project with the wizard; run the template to confirm it builds; write the verified versions into `docs/VERSIONS.md`; decide `applicationId`; `git init`.
- **Acceptance:** template app runs on an emulator; `./gradlew assembleDebug` works from the terminal.

## M1. Project skeleton and navigation (first compiling app)  [M]
- **Objective:** compiling multi-module app with working navigation and placeholder screens.
- **Files:** `settings.gradle.kts`, `analyzer/build.gradle.kts`, `app/build.gradle.kts`, `libs.versions.toml`, `PauseLinkApplication`, `MainActivity`, `PauseLinkRoot`, `Routes.kt`, `PauseLinkNavHost`, `ui/theme/*`, `ui/home|history|settings|privacy` placeholders, `di/*`, `AppLogger`.
- **Tasks:** create `:analyzer` (kotlin("jvm")) with one trivial class and test; wire Hilt; Material 3 theme with light/dark; bottom/nav entry points (Home → History, Settings → Privacy); type-safe routes; `AGENTS.md` in root.
- **Acceptance:** `./gradlew :analyzer:test :app:testDebugUnitTest :app:assembleDebug` pass; app launches; navigating Home ↔ History ↔ Settings ↔ Privacy works; Back behaves.
- **Automated tests:** analyzer trivial test; Compose navigation test asserting each destination shows its title; a test that `:analyzer` has no `android` imports (source scan).
- **Manual:** run on emulator; rotate device; toggle dark mode.

## M2. Analyzer foundation: models, sanitising, extraction  [M]
- **Objective:** domain models plus input sanitising and URL extraction (no rules yet).
- **Files:** `analyzer/model/*`, `extract/*`, `AnalyzerConfig`, `TextSanitizer`.
- **Tasks:** implement D2 models; sanitiser (cap, hidden-char detection); extractor per E3 including trailing punctuation/parentheses; limits.
- **Acceptance:** `extraction_edge.csv` cases pass (B10-B13 plus angle brackets, quotes, 12 links, empty input).
- **Tests:** table-driven extraction tests; pathological-input timing test (F5).
- **Manual:** none (JVM only).

## M3. Parser: host normalisation, IDN/punycode, IP forms, PSL  [L]
- **Objective:** `UrlParser` that yields `ParsedUrl` for all supported forms.
- **Files:** `parse/*`, `unicode/ScriptClassifier`, `unicode/InvisibleChars`, `resources/pauselink/public_suffix_list.dat`, `PSL_VERSION.txt`.
- **Tasks:** authority splitting (last `@`); NFKC/lowercase; punycode encode/decode with RFC vectors; IP notations; PSL loader (wildcards/exceptions; ICANN+private); registrable-domain computation; injectable test PSL.
- **Acceptance:** all F3 parsing/IDN cases pass; malformed input never throws.
- **Tests:** `idn_punycode.csv`, PSL unit tests, IP form tests, fuzz test (seeded).
- **Manual:** none.

## M4. Rule batch A (structural) and scorer  [L]
- **Objective:** structural URL rules, scoring and `DefaultThreatAnalyzer` working end to end.
- **Files:** `rules/url/*` (U001-U004, U010-U012, U014-U016), `scoring/*`, `DefaultThreatAnalyzer`, `data/ShortenerList`, `shorteners.txt`.
- **Tasks:** implement rules as in D3; scorer with E9 logic; sorted deterministic output; QR payload classifier (types, schemes).
- **Acceptance:** matching rows of `urls_benign.csv` and `urls_suspicious.csv` pass (S01-S05, S07, S16, S18-S24, B01-B06, B14-B16); determinism test passes.
- **Tests:** per-rule matrix (F2) for these rules; scorer tests (bands, caps, corroboration).
- **Manual:** none.

## M5. First end-to-end slice (Home → Result)  [M]
- **Objective:** paste text on Home and see a real result.
- **Files:** `domain/AnalyzeInputUseCase`, `data/session/AnalysisSessionStore`, `AnalyzerModule`, `ui/home/*`, `ui/result/*`, `ui/text/FindingTextResolver`, `ui/text/SafeDisplay`, `ui/text/Defang`, `findings_strings.xml` (rules done so far).
- **Tasks:** Home screen states; `AnalyzeViewModel`; Result screen (header card, link cards, findings, notes, disclaimer, Copy actions); session expiry state; domain emphasis component.
- **Acceptance:** pasting `http://192.0.2.1/login` shows CAUTION with U001 and U002 findings and the disclaimer; no open-link control exists.
- **Tests:** ViewModel and use-case tests; Compose tests for Home and Result states; resolver completeness test (limited to implemented rules, full set enforced at M7).
- **Manual:** paste several samples from the corpus; test with large font and dark mode.

## M6. Rule batch B (brand/lookalike, message, QR)  [L]
- **Objective:** remaining rules.
- **Files:** `rules/url/*` (U005-U009, U013, U017), `rules/message/*`, `rules/qr/*`, `data/BrandRegistry`, `data/Lexicon`, `unicode/ConfusableFolder`, `confusables.tsv`, `brands.json`, `lexicon_en.json`.
- **Tasks:** E5/E6 logic; Damerau-Levenshtein helper; lexicon matcher with negation window; sender-mismatch rule; QR payment/action rules; link-level vs message-level evaluation.
- **Acceptance:** every row in F7 passes (benign, suspicious, T01-T09).
- **Tests:** full per-rule matrix; corpus regression test; "benign corpus has no STRONG and no CAUTION" assertion (adjust to the actual curated set).
- **Manual:** none; review rule outputs against `ANALYSIS_RULES.md`.

## M7. Finding detail and complete explanations  [M]
- **Objective:** every rule has complete, carefully worded explanations; detail screen done.
- **Files:** `ui/finding/*`, `findings_strings.xml` (all 25 rules × 5 keys), `FindingTextResolver`.
- **Tasks:** detail screen layout (E8 order); evidence table; "About this check" section; wording review against the copy rules.
- **Acceptance:** completeness test passes for all `RuleId`s; detail screen renders for each rule using fixtures.
- **Tests:** resolver tests; Compose test per section; screenshot-free text assertion that forbidden words ("malicious", "scam detected", "safe") don't appear in the resource file except in the explicit disclaimer.
- **Manual:** read every explanation aloud for tone and accuracy.

## M8. Share sheet and text-selection integration  [M]
- **Objective:** analyse content shared from other apps.
- **Files:** `ShareReceiverActivity`, `platform/IntentInputExtractor`, `AndroidManifest.xml`, `PauseLinkRoot` start-input support.
- **Tasks:** manifest filters (SEND `text/plain`, PROCESS_TEXT `text/plain`); validate and cap; extractor handling for `CharSequence` extras; Result "Done" finishes the activity in share mode; flag `exported="true"` explicitly [F: required on API 31+ for components with intent filters].
- **Acceptance:** sharing a link from the browser or Messages lists PauseLink; tapping it analyses and shows Result; Back returns to the source app; selecting text → "Check with PauseLink" appears in the selection menu (availability varies by app [F]).
- **Tests:** instrumented intent tests (F6), extractor unit tests (null/oversized/wrong type), manifest filter test.
- **Manual:** share from Chrome, Messages, WhatsApp (real device or emulator with those apps), plus text-selection menu.

## M9. QR scanning  [M]
- **Objective:** QR to Result.
- **Files:** `platform/GmsQrScanner`, `domain/QrScanner`, Home QR button, handling of result types, manifest metadata for pre-downloading the scanner module (check the docs) [VERIFY].
- **Tasks:** wrap `GmsBarcodeScanning` in a suspend function; map outcomes to `QrScanResult`; payload classification; error dialogs.
- **Acceptance:** scanning a QR generated from `https://example.com` shows Result; cancelling returns silently; with Play services missing, shows the Unavailable dialog; `INTERNET` permission test still passes.
- **Tests:** `QrScanner` fake in ViewModel tests; payload classification tests (S23, S24, T06, T07); manifest permission test.
- **Manual:** print or display QR codes (use a QR generator offline or a local tool) for: example URL, `upi://pay?...` sample, `tel:` sample, plain text.

## M10. History and settings  [L]
- **Objective:** local history with privacy minimisation, retention and settings.
- **Files:** `data/db/*`, `data/history/*`, `data/settings/*`, `DatabaseModule`, `ui/history/*`, `ui/settings/*`, `HistoryMapper`.
- **Tasks:** Room DB with schema export; entity/DAO/repository; mapper that sanitises; DataStore settings; prune on app start per retention; history UI with swipe-delete and Undo; clear all; "Save history" off flow; Result via `historyId`.
- **Acceptance:** analyses appear in History when enabled and don't when disabled; delete/undo/clear work; entries older than the retention window disappear at next launch; history item opens a Result with the stored findings.
- **Tests:** Room instrumented tests; repository tests; mapper minimisation test (F4); ViewModel tests (delete/undo); settings repository test.
- **Manual:** change retention; verify no query strings in stored data by inspecting the DB with Studio's App Inspection.

## M11. Privacy screen and security hardening  [M]
- **Objective:** claims in the Privacy screen are true and enforced.
- **Files:** `ui/privacy/*`, `AndroidManifest.xml`, backup rules XML, source-scan tests.
- **Tasks:** write privacy text (C2.8); `allowBackup="false"` and extraction rules; logging policy enforced (source-scan test); `AppLogger` API; remove debug logging; verify exported components.
- **Acceptance:** all F4 tests pass.
- **Tests:** F4 complete suite.
- **Manual:** confirm in Settings → Apps that PauseLink requests no permissions; verify backup rules with `adb shell bmgr`-style checks if desired [optional].

## M12. Polish, accessibility, release build, portfolio assets  [L]
- **Objective:** a presentable, documented app.
- **Tasks:** TalkBack pass; font-scale and dark-mode pass; adaptive icon; empty/error copy review; R8/minify release build (add keep rules only if serialization needs them); remove unused resources; README/ARCHITECTURE/THREAT_MODEL/ANALYSIS_RULES; screenshots; demo script (Section I).
- **Acceptance:** release build installs and runs all flows; lint has no errors; full test suite green; docs complete.
- **Tests:** Compose accessibility checks (content descriptions, touch targets) and a large-font smoke test.
- **Manual:** the demo script end to end on a real device.

---

# I. PORTFOLIO AND INTERVIEW PRESENTATION PLAN

## I1. What impresses an Android hiring manager

1. **Architecture with a reason.** A pure-JVM analyzer module that provably cannot import Android; a small, readable app layer; ADRs for each major decision (ADR-01 to ADR-16 above).
2. **A real algorithmic core, tested.** 25 explainable rules, scoring and false-positive logic, ~hundreds of table-driven tests, fuzz/pathological-input tests.
3. **Platform craft:** exported share target and PROCESS_TEXT with correct task/back behaviour; Play-services QR with graceful fallback; scoped privacy (no `INTERNET`, backup exclusion); Compose accessibility; process-death handling.
4. **Security thinking:** threat model, intent hardening, no-logging policy enforced by tests, honest limitations.
5. **Product judgement:** things deliberately excluded (SMS, accessibility, link opening, "safe" verdicts) and why.

## I2. Interview talking points (prepare 2-3 minute answers)

- Why a separate analyzer module, and what it bought you (speed, boundaries, testability).
- How you prevent false positives (official-domain registry, corroboration, message-only cap, allowed CJK mixes, negation guard).
- How punycode/confusable/mixed-script detection works and where it is incomplete.
- Why you didn't fetch or expand links (SSRF, privacy) and what you'd do post-MVP, and how you'd design it safely (allowlisted schemes, no redirects to private ranges, DNS rebinding protection, timeouts, size limits, user consent).
- Share-target design: activity choice, task behaviour, intent hardening.
- Why history stores a sanitised JSON report and not raw text; what's still exposed.
- Why one Room table instead of normalised tables.
- How you tested Android-specific behaviour without flakiness.
- What you'd change at scale (reputation lists, encrypted DB, CameraX path, localisation).

## I3. Meaningful test story to show

A README table: number of analyzer tests, rules covered, corpus size, and the explicit "known gaps" list. Do not claim accuracy; say "regression corpus", not "detection rate".

## I4. Documentation set

- **README.md:** one-paragraph pitch; screenshots/GIF; feature list; "What PauseLink does *not* do" (honest limits); architecture diagram; how to build/run/test (exact commands); rule catalog link; privacy stance; tech stack table; roadmap.
- **docs/ARCHITECTURE.md:** module diagram, data flow (B3), key decisions with links to ADRs, testing strategy.
- **docs/THREAT_MODEL.md:** F9 table, logging policy, limitations.
- **docs/ANALYSIS_RULES.md:** the E7 catalogue plus how to add a rule (checklist: rule class, test matrix, strings, catalog row).
- **docs/decisions/ADR-xx.md:** short (context, decision, consequences).
- **docs/VERSIONS.md:** verified dependency versions with dates.

## I5. Screenshots and demo script (all with safe example content)

Screenshots: Home (empty), Result for an IP link (CAUTION), Result for a brand lookalike (STRONG), Finding detail, Result for a clean example.com link showing the "not a guarantee" notice, History, Settings/Privacy, a share-sheet screenshot showing PauseLink in the chooser.

Two-minute demo (record a GIF/screen capture):
1. Share `http://192.0.2.1/login` from the browser → PauseLink → CAUTION with two explained findings.
2. Tap a finding → "What we noticed / Why / Could be harmless / What to do".
3. Paste the T01 message → STRONG, showing link findings and message cues together.
4. Scan a QR for `upi://pay?...` (sample) → educational note.
5. History → swipe delete → Undo.
6. Settings → Privacy: "no internet permission" and "what we store".

## I6. Limitations and future work (put these in the README)

Limitations: heuristics only; no reputation data; English-only lexicon; QR scanner needs Google Play services; unencrypted local history; partial confusable coverage; no certificate checks.
Future: QR from image; CameraX scanner; optional reputation list and Safe Browsing Update API (adds `INTERNET`, non-commercial use only, requires specific warning wording); safe, consent-based redirect expansion with strict SSRF controls; encrypted database; localisation (Hindi etc.); trusted-domains list; baseline profiles and macrobenchmarks.

## I7. Quality bar before calling it "done"

All tests green from a clean clone; no warnings about unused code; each public class has a clear purpose; no TODOs without an issue; README commands copy-paste correctly on a fresh MacBook; the Privacy screen statements each map to a test or documented check.
