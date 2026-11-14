# PauseLink Web App & Supabase Real-Time Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform PauseLink into a full-stack, cross-platform ecosystem by adding a Next.js 15 web application that shares the same Supabase PostgreSQL database instances with the native Android app, keeping scans, history, and settings synchronized simultaneously via Postgres Change Data Capture (CDC) over WebSockets.

**Architecture:** Turborepo monorepo structuring `apps/web` (Next.js 15, Tailwind, shadcn/ui), `apps/android` (Kotlin Compose + Room + supabase-kt), `packages/types` (shared JSON/DTO models), and `packages/supabase-config` (PostgreSQL DDL, RLS, and Realtime publications). The system supports anonymous-first sessions with instant 6-digit device pairing.

**Tech Stack:** Next.js 15 (React 19), TypeScript, Supabase (PostgreSQL 16, Auth, Realtime CDC), Tailwind CSS, shadcn/ui, TanStack Query, Turborepo, Kotlin 2.2.10, Jetpack Compose, Room, Dagger Hilt, `supabase-kt`.

**Spec:** [`docs/superpowers/specs/2026-11-14-pauselink-web-supabase-sync-design.md`](file:///Users/adwaitpratapsingh/PAUSELINK/docs/superpowers/specs/2026-11-14-pauselink-web-supabase-sync-design.md)

---

## Global Constraints

- **Offline-First Android Preservation**: Android `:analyzer` remains a pure Kotlin/JVM engine with zero network dependencies. Scans are saved to Room DB first; cloud sync runs as an asynchronous background worker.
- **Zero URL Fetching/Expansion**: Neither the Web app nor Android will ever perform HTTP requests or DNS queries to user-submitted target URLs.
- **Privacy & Minimization**: Raw URLs and raw message text are never stored in unencrypted server logs. `report_json` contains only sanitized display URLs, findings, and evidence.
- **Row Level Security (RLS)**: Every database query in PostgreSQL must be guarded by `auth.uid() = user_id`.

## Review Focus

1. **Anonymous Session Linking**: If an Android user scans 5 links anonymously and then pairs their device with the web console via a 6-digit code, all 5 scans must be safely linked to the shared profile without data loss or duplicate records.
2. **WebSocket Disconnect / Reconnect Storm**: When a mobile device recovers from airplane mode, it must batch-flush pending local Room scans without overwhelming the Supabase connection or creating race conditions.
3. **Simultaneous Delete Cascade**: Deleting a scan record on Web must instantly emit a CDC `DELETE` payload that removes the corresponding entity in Android's local Room database in <100ms.
4. **Adversarial URL Input on Web**: The Web heuristic analyzer must be ReDoS-resistant and enforce a 10,000-character input cap identical to `:analyzer`.
5. **Zero-Permission Boundary**: Android's `AndroidManifest.xml` must continue to forbid `android.permission.INTERNET` from bleeding into the core `:analyzer` engine.

---

## Task Breakdown

### Task 1: Workspace & Monorepo Scaffolding (Turborepo)

**Files:**
- Create: `package.json`
- Create: `turbo.json`
- Create: `pnpm-workspace.yaml`
- Modify: `.gitignore`
- Move existing Android project files to: `apps/android/`

- [ ] **Step 1: Check existing workspace git status and dependencies**
  Ensure working directory is clean before moving files.
- [ ] **Step 2: Create Turborepo configuration**
  Create root `package.json` configured for `pnpm` workspaces, root `turbo.json`, and `pnpm-workspace.yaml` defining `apps/*` and `packages/*`.
- [ ] **Step 3: Move Android codebase to `apps/android`**
  Move `app/`, `analyzer/`, `build.gradle.kts`, `settings.gradle.kts`, `gradle/`, `gradlew`, `gradlew.bat`, `gradle.properties` into `apps/android/`.
- [ ] **Step 4: Update paths and verify Android compilation**
  Run `./gradlew :analyzer:test` and `./gradlew :app:assembleDebug` inside `apps/android` to confirm zero regression.
- [ ] **Step 5: Commit monorepo structure**
  `git commit -m "chore: scaffold Turborepo monorepo with apps/android"`

---

### Task 2: Shared Types Package (`packages/types`)

**Files:**
- Create: `packages/types/package.json`
- Create: `packages/types/tsconfig.json`
- Create: `packages/types/src/index.ts`
- Create: `packages/types/src/models.ts`
- Test: `packages/types/tests/types.test.ts`

- [ ] **Step 1: Write types package configuration**
  Setup `package.json` (`@pauselink/types`) with TypeScript build scripts.
- [ ] **Step 2: Define domain DTOs matching Kotlin models**
  Define `InputSource`, `Severity`, `Confidence`, `RiskBand`, `RuleId`, `EvidenceKey`, `EvidenceDto`, `FindingDto`, `LinkReportDto`, `AnalysisReportDto`, `ScanRecord`, `ProfileRecord`.
- [ ] **Step 3: Write type validation test**
  Write unit tests verifying JSON serialization and deserialization of a full `AnalysisReportDto` fixture.
- [ ] **Step 4: Build package**
  Run `pnpm --filter @pauselink/types build` and verify output in `dist/`.
- [ ] **Step 5: Commit shared types**
  `git commit -m "feat(types): create shared cross-platform DTO contracts"`

---

### Task 3: Supabase Schema, RLS & Pairing Migrations (`packages/supabase-config`)

**Files:**
- Create: `packages/supabase-config/package.json`
- Create: `packages/supabase-config/migrations/20261114000001_initial_schema.sql`
- Create: `packages/supabase-config/migrations/20261114000002_device_pairing.sql`
- Create: `packages/supabase-config/seed.sql`
- Test: `packages/supabase-config/tests/rls.test.sql`

- [ ] **Step 1: Write PostgreSQL DDL migrations**
  Create tables: `profiles`, `scans`, and enable `supabase_realtime` publications.
- [ ] **Step 2: Write Row Level Security (RLS) policies**
  Enforce `auth.uid() = user_id` for all operations on `scans` and `profiles`.
- [ ] **Step 3: Implement device pairing stored procedure**
  Write SQL RPC `generate_pairing_code()` and `link_device_with_code(code)` to safely transfer/merge anonymous device sessions into authenticated accounts.
- [ ] **Step 4: Write verification test for RLS**
  Verify that user A cannot select or delete user B's scans.
- [ ] **Step 5: Commit Supabase configuration**
  `git commit -m "feat(db): add Supabase PostgreSQL migrations, RLS policies, and pairing RPC"`

---

### Task 4: Next.js 15 Web Application Foundation (`apps/web`)

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/lib/supabase/client.ts`
- Create: `apps/web/lib/supabase/server.ts`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/globals.css`

- [ ] **Step 1: Scaffold Next.js 15 application**
  Initialize Next.js 15 with App Router, React 19, TypeScript, and Tailwind CSS.
- [ ] **Step 2: Install Supabase and UI dependencies**
  Install `@supabase/supabase-js`, `@supabase/ssr`, `@tanstack/react-query`, `lucide-react`, `clsx`, `tailwind-merge`.
- [ ] **Step 3: Implement Supabase client instances**
  Create SSR-compatible browser client (`lib/supabase/client.ts`) and server client (`lib/supabase/server.ts`).
- [ ] **Step 4: Build Material 3 inspired dark/light theme shell**
  Implement root layout, navigation bar, and brand badges matching PauseLink's aesthetic.
- [ ] **Step 5: Verify web app boots**
  Run `pnpm --filter web build` and ensure zero compilation errors.
- [ ] **Step 6: Commit web scaffolding**
  `git commit -m "feat(web): scaffold Next.js 15 application with Supabase client"`

---

### Task 5: Web Threat Analysis Engine (`apps/web/lib/analyzer`)

**Files:**
- Create: `apps/web/lib/analyzer/TextSanitizer.ts`
- Create: `apps/web/lib/analyzer/UrlExtractor.ts`
- Create: `apps/web/lib/analyzer/TldRegistry.ts`
- Create: `apps/web/lib/analyzer/Scorer.ts`
- Test: `apps/web/tests/analyzer.test.ts`

- [ ] **Step 1: Write failing test using `extraction_edge.csv` test vectors**
  Test edge cases: B10-B13, brackets `(a_(b))`, quotes, 12-link limit, file extensions (`.zip`, `.mov`).
- [ ] **Step 2: Implement linear `UrlExtractor` and `TextSanitizer` in TypeScript**
  Replicate `:analyzer` logic with $O(N)$ linear scan, zero backtracking, and invisible Unicode detection.
- [ ] **Step 3: Implement deterministic threat scoring**
  Calculate risk scores and categorical bands (`NO_WARNING_SIGNS`, `NOTICE`, `CAUTION`, `STRONG_WARNING`).
- [ ] **Step 4: Run tests and verify 100% vector parity with Kotlin engine**
  Execute `pnpm --filter web test` and confirm all test cases pass.
- [ ] **Step 5: Commit web analyzer**
  `git commit -m "feat(web): implement deterministic TypeScript URL analyzer with test parity"`

---

### Task 6: Real-Time Threat Console & Live History (`apps/web/app/(dashboard)`)

**Files:**
- Create: `apps/web/hooks/useRealtimeScans.ts`
- Create: `apps/web/components/ScanTerminal.tsx`
- Create: `apps/web/components/LiveHistoryTable.tsx`
- Create: `apps/web/components/FindingDetailDialog.tsx`
- Create: `apps/web/app/(dashboard)/page.tsx`
- Create: `apps/web/app/(dashboard)/history/page.tsx`

- [ ] **Step 1: Implement `useRealtimeScans` hook**
  Subscribe to Supabase Realtime Postgres CDC (`postgres_changes` on `public.scans`) for live INSERTs and DELETEs.
- [ ] **Step 2: Build interactive `ScanTerminal`**
  Input area with instant local evaluation, risk band indicator, finding summary, and "Sync to Cloud" trigger.
- [ ] **Step 3: Build reactive `LiveHistoryTable`**
  Table showing past scans with origin pill (`Android` or `Web`), timestamps, risk badges, and instant deletion.
- [ ] **Step 4: Build `FindingDetailDialog`**
  Detailed modal displaying sanitized display URL, evidence table, and educational explanations.
- [ ] **Step 5: Commit dashboard and real-time console**
  `git commit -m "feat(web): build real-time threat console and reactive scan history"`

---

### Task 7: Device Pairing & Account Upgrade Flow (`apps/web/app/pair`)

**Files:**
- Create: `apps/web/app/pair/page.tsx`
- Create: `apps/web/app/login/page.tsx`
- Create: `apps/web/components/PairingCodeInput.tsx`

- [ ] **Step 1: Build 6-digit Device Pairing Screen (`/pair`)**
  Input form for pairing desktop browser with mobile Android device via pairing code.
- [ ] **Step 2: Wire `link_device_with_code` RPC call**
  Upon entering code, call Supabase RPC to link the session and redirect to dashboard.
- [ ] **Step 3: Build Magic Link & Google Sign-in page**
  Enable users to convert anonymous session to permanent authenticated profile.
- [ ] **Step 4: Commit pairing flow**
  `git commit -m "feat(web): implement 6-digit device pairing and auth upgrade"`

---

### Task 8: Android Cloud Sync Integration (`apps/android`)

**Files:**
- Modify: `apps/android/gradle/libs.versions.toml`
- Modify: `apps/android/app/build.gradle.kts`
- Modify: `apps/android/app/src/main/AndroidManifest.xml` (optional network permission with runtime opt-in)
- Create: `apps/android/app/src/main/java/com/clickretina/pauselink/di/SupabaseModule.kt`
- Create: `apps/android/app/src/main/java/com/clickretina/pauselink/data/sync/SupabaseRealtimeManager.kt`
- Create: `apps/android/app/src/main/java/com/clickretina/pauselink/data/sync/SyncWorker.kt`
- Create: `apps/android/app/src/main/java/com/clickretina/pauselink/ui/settings/PairingDialog.kt`

- [ ] **Step 1: Add verified `supabase-kt` dependencies**
  Add `io.github.jan-tennert.supabase:postgrest-kt`, `realtime-kt`, `auth-kt` (v3.1.1) to `libs.versions.toml`.
- [ ] **Step 2: Create Hilt `SupabaseModule`**
  Provide configured `SupabaseClient` with anonymous authentication provider.
- [ ] **Step 3: Implement `SupabaseRealtimeManager`**
  Listen to Postgres CDC changes; when a scan is deleted on Web, remove it from local Room DB; when inserted on Web, upsert to Room DB.
- [ ] **Step 4: Implement background `SyncWorker`**
  Flush pending unsynced local Room scans to Supabase when network is active.
- [ ] **Step 5: Add Device Pairing Code generator in Android Settings**
  Generate 6-digit pairing code via Supabase RPC and display in Material 3 dialog.
- [ ] **Step 6: Run Android unit tests & verify build**
  Execute `./gradlew :app:testDebugUnitTest :app:assembleDebug` inside `apps/android/`.
- [ ] **Step 7: Commit Android sync layer**
  `git commit -m "feat(android): integrate supabase-kt real-time sync and device pairing"`

---

### Task 9: End-to-End Cross-Platform Verification & Documentation

**Files:**
- Create: `docs/CROSS_PLATFORM_SETUP.md`
- Modify: `README.md`

- [ ] **Step 1: Execute full verification suite**
  - Web: `pnpm --filter web test && pnpm --filter web build`
  - Android: `cd apps/android && ./gradlew :analyzer:test :app:testDebugUnitTest :app:assembleDebug :app:lintDebug`
- [ ] **Step 2: Write cross-platform developer guide**
  Document local Supabase setup with Docker, environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`), and running the web + mobile stack side-by-side.
- [ ] **Step 3: Update root `README.md`**
  Add Web Console showcase, architecture diagrams, and monorepo build instructions.
- [ ] **Step 4: Final commit and push**
  `git commit -m "docs: add cross-platform setup guide and update project README"`
