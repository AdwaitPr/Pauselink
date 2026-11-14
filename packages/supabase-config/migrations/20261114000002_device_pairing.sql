-- Add Pairing Code columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS pairing_code VARCHAR(6),
ADD COLUMN IF NOT EXISTS pairing_code_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_pairing ON public.profiles(pairing_code)
WHERE pairing_code IS NOT NULL;

-- Function: Generate a 6-digit device pairing code valid for 10 minutes
CREATE OR REPLACE FUNCTION public.generate_pairing_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
BEGIN
    -- Generate 6 digit numeric code
    new_code := LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');

    UPDATE public.profiles
    SET pairing_code = new_code,
        pairing_code_expires_at = NOW() + INTERVAL '10 minutes',
        updated_at = NOW()
    WHERE id = auth.uid();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found for authenticated user';
    END IF;

    RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Link another device using a valid 6-digit code, transferring scans
CREATE OR REPLACE FUNCTION public.link_device_with_code(code_input TEXT)
RETURNS JSONB AS $$
DECLARE
    target_user_id UUID;
    transferred_count INT;
BEGIN
    -- Locate valid unexpired pairing code
    SELECT id INTO target_user_id
    FROM public.profiles
    WHERE pairing_code = code_input
      AND pairing_code_expires_at > NOW();

    IF target_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired pairing code');
    END IF;

    -- If the target is the same user, simply acknowledge
    IF target_user_id = auth.uid() THEN
        RETURN jsonb_build_object('success', true, 'message', 'Already paired to this account');
    END IF;

    -- Transfer all scans from the target device profile to the current session user
    UPDATE public.scans
    SET user_id = auth.uid()
    WHERE user_id = target_user_id;
    GET DIAGNOSTICS transferred_count = ROW_COUNT;

    -- Invalidate the pairing code
    UPDATE public.profiles
    SET pairing_code = NULL,
        pairing_code_expires_at = NULL,
        updated_at = NOW()
    WHERE id = target_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'transferred_scans', transferred_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
