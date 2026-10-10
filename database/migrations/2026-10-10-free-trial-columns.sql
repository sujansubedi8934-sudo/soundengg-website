-- ============================================================================
-- SoundEngg Supabase Migration: 7-Day Free Trial Support
-- Created: 2026-10-10
-- Purpose: Add trial_started_at and trial_expires_at timestamps to public.profiles
-- ============================================================================

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS has_used_trial BOOLEAN DEFAULT FALSE;

-- Index for rapid verification of active trials during authentication handshake
CREATE INDEX IF NOT EXISTS idx_profiles_trial_expires_at ON public.profiles (trial_expires_at);

-- Comment for table schema documentation
COMMENT ON COLUMN public.profiles.trial_started_at IS 'Timestamp when the user initiated their 7-day free trial';
COMMENT ON COLUMN public.profiles.trial_expires_at IS 'Timestamp when the 7-day free trial concludes';
COMMENT ON COLUMN public.profiles.trial_ends_at IS 'Alias timestamp when the 7-day free trial concludes';
COMMENT ON COLUMN public.profiles.has_used_trial IS 'Whether the user has already redeemed their 7-day free trial';
