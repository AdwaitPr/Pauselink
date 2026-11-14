-- Seed script for local development and testing
-- Insert sample test profile and scan if testing locally with Supabase CLI

DO $$
DECLARE
    test_user_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- Ensure test profile exists
    INSERT INTO public.profiles (id, email, is_anonymous, device_sync_enabled)
    VALUES (test_user_id, 'testuser@pauselink.example', FALSE, TRUE)
    ON CONFLICT (id) DO NOTHING;

    -- Insert sample scan
    INSERT INTO public.scans (
        id, user_id, source, input_text, overall_score, risk_band, links_count, report_json, device_origin
    )
    VALUES (
        '11111111-1111-1111-1111-111111111111',
        test_user_id,
        'WEB_PASTE',
        'http://192.0.2.1/login',
        10,
        'NOTICE',
        1,
        '{
            "source": "WEB_PASTE",
            "links": [
                {
                    "displayUrl": "http://192.0.2.1/login",
                    "host": "192.0.2.1",
                    "decodedHost": "192.0.2.1",
                    "registrableDomain": null,
                    "findings": [
                        {
                            "ruleId": "U001",
                            "severity": "LOW",
                            "confidence": "HIGH",
                            "score": 10,
                            "evidence": [{"key": "SCHEME", "value": "http"}]
                        }
                    ],
                    "assessment": {"score": 10, "band": "NOTICE"}
                }
            ],
            "messageFindings": [],
            "overall": {"score": 10, "band": "NOTICE"},
            "notes": [],
            "analyzerVersion": 1
        }'::jsonb,
        'WEB'
    )
    ON CONFLICT (id) DO NOTHING;
END $$;
