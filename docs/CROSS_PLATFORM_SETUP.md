# PauseLink Cross-Platform Setup & Architecture Guide

PauseLink is an offline-first, deterministic, explainable suspicious-link and message analysis platform featuring:
1. **Native Android Application** (`apps/android`): Jetpack Compose, Material 3, Hilt, Room, and a pure JVM deterministic analysis engine with zero network resolution.
2. **Next.js 15 Web Console** (`apps/web`): React 19, Tailwind CSS, real-time CDC updates, threat terminal, and audit history.
3. **Supabase Realtime Backend** (`packages/supabase-config`): PostgreSQL 16 schema with Row Level Security (RLS), Realtime CDC publications, and atomic 6-digit device pairing stored procedures.
4. **Shared Types Package** (`packages/types`): End-to-end type safety mapping Kotlin DTOs to TypeScript data contracts.

---

## 1. Monorepo Structure

```
PAUSELINK/
├── apps/
│   ├── android/                  # Native Android application & pure JVM analyzer
│   │   ├── analyzer/             # Pure Kotlin/JVM threat extraction engine (zero network)
│   │   ├── app/                  # Compose UI, Navigation, Hilt DI, Cloud Sync layer
│   │   └── build.gradle.kts
│   └── web/                      # Next.js 15 full-stack application
│       ├── app/                  # App Router: /, /history, /pair, /login
│       ├── components/           # ScanTerminal, LiveHistoryTable, FindingDetailDialog
│       ├── hooks/                # useRealtimeScans (Supabase CDC subscription)
│       └── lib/analyzer/         # TypeScript port with 100% test parity
├── packages/
│   ├── types/                    # Shared DTOs and models (@pauselink/types)
│   └── supabase-config/          # SQL migrations, RLS policies, pairing procedures
├── docs/                         # Architecture blueprint and specifications
└── turbo.json                    # Turborepo task pipeline
```

---

## 2. Supabase Configuration

### Step A: Database Migrations
Run the SQL migration scripts in order within your Supabase project (via Dashboard SQL Editor or Supabase CLI):

1. `packages/supabase-config/migrations/20261114000001_initial_schema.sql`
   - Creates `profiles` and `scans` tables.
   - Enforces RLS: users access only their own records (`auth.uid() = user_id`).
   - Configures Supabase Realtime publication on `scans` (`INSERT`, `UPDATE`, `DELETE`).
2. `packages/supabase-config/migrations/20261114000002_device_pairing.sql`
   - Provisions `generate_pairing_code()` (15-minute expiring 6-digit PIN).
   - Provisions `link_device_with_code(code)` (atomic ownership re-assignment).

### Step B: Environment Variables
Create `.env.local` in `apps/web/`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```
*(Note: If unconfigured, the Web Console runs in local offline demonstration mode with zero crashes).*

---

## 3. Running the Web Application

```bash
# Install dependencies across all monorepo workspaces
npm install

# Build shared types package
npm run build -w packages/types

# Run unit tests for TypeScript analyzer (100% vector parity)
npm run test -w apps/web

# Start Next.js 15 development server
npm run dev -w apps/web
```
Open [http://localhost:3000](http://localhost:3000) to access the Threat Console.

---

## 4. Running the Android Application

```bash
cd apps/android

# Run pure JVM analyzer test suite
./gradlew :analyzer:test

# Run unit tests and verify build
./gradlew :app:testDebugUnitTest :app:assembleDebug
```
The compiled APK will be at `apps/android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 5. Device Pairing & Real-Time Sync Protocol

1. Navigate to [http://localhost:3000/pair](http://localhost:3000/pair) on your desktop browser.
2. The Web Console generates an active 6-digit PIN (e.g. `849 201`).
3. Open **PauseLink** on your Android phone -> tap **Settings** -> tap **Pair with Web Console**.
4. Enter the 6-digit PIN and tap **Pair Device**.
5. Once paired:
   - Any link or message scanned on Android instantly appears on the Web Console via Supabase Realtime WebSockets.
   - Any threat analyzed on the Web Console immediately syncs to the mobile history.
