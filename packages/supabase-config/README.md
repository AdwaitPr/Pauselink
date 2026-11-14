# Supabase Database Configuration & Migrations

This package contains the PostgreSQL DDL migrations, Row Level Security (RLS) policies, and stored procedures for the PauseLink ecosystem.

## Migrations
- `20261114000001_initial_schema.sql`: Core `profiles` and `scans` tables with RLS and Postgres CDC enabled.
- `20261114000002_device_pairing.sql`: 6-digit device pairing code generator and atomic device link RPC.

## Applying Migrations
### Using Supabase Cloud Dashboard:
1. Open your Supabase Project -> **SQL Editor**.
2. Run `20261114000001_initial_schema.sql`.
3. Run `20261114000002_device_pairing.sql`.

### Using Supabase CLI:
```bash
supabase link --project-ref <your-project-id>
supabase db push
```
