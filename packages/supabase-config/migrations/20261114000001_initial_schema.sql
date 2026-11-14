-- 1. Create Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    device_sync_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Trigger to automatically provision a profile row when a new auth user signs in (including anonymous users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, is_anonymous)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE((NEW.raw_app_meta_data->>'provider') = 'anonymous', FALSE)
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Create Scans table
CREATE TABLE IF NOT EXISTS public.scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK (source IN ('SHARED_TEXT', 'PROCESS_TEXT', 'PASTED', 'QR_CODE', 'WEB_PASTE')),
    input_text TEXT NOT NULL,
    overall_score INT NOT NULL,
    risk_band TEXT NOT NULL CHECK (risk_band IN ('NO_WARNING_SIGNS', 'NOTICE', 'CAUTION', 'STRONG_WARNING')),
    links_count INT NOT NULL DEFAULT 0,
    report_json JSONB NOT NULL,
    device_origin TEXT NOT NULL CHECK (device_origin IN ('ANDROID', 'WEB')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scans_user_created ON public.scans(user_id, created_at DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own profile"
    ON public.profiles FOR ALL
    USING (auth.uid() = id);

CREATE POLICY "Users can access their own scans"
    ON public.scans FOR ALL
    USING (auth.uid() = user_id);

-- 5. Enable Realtime Change Data Capture (CDC)
ALTER PUBLICATION supabase_realtime ADD TABLE public.scans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
