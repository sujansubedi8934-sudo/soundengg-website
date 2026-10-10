-- ============================================================================
-- SoundEngg Supabase Migration: 7-Day Free Trial Support
-- Created: 2026-10-10
-- Purpose: Add subscription_status, trial_started_at, trial_expires_at, trial_ends_at, and has_used_trial to public.profiles
-- ============================================================================

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS has_used_trial BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_profiles_trial_expires_at ON public.profiles (trial_expires_at);
