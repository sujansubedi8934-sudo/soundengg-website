-- ============================================================================
-- SoundEngg Security Hardening Migration
-- Prevent Client-Side Privilege Escalation on public.profiles
-- Created: 2026-10-15
-- ============================================================================

-- Function to block normal authenticated clients from modifying entitlement columns
CREATE OR REPLACE FUNCTION public.protect_profile_subscription_columns()
RETURNS trigger AS $$
BEGIN
    -- Check if the request is coming from an authenticated client (end-user token)
    IF auth.role() = 'authenticated' THEN
        -- Prevent client-side modification of billing and entitlement columns
        IF (NEW.is_pro IS DISTINCT FROM OLD.is_pro) OR
           (NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier) OR
           (NEW.subscription_expires_at IS DISTINCT FROM OLD.subscription_expires_at) OR
           (NEW.subscription_provider IS DISTINCT FROM OLD.subscription_provider) OR
           (NEW.subscription_status IS DISTINCT FROM OLD.subscription_status) OR
           (NEW.has_used_trial IS DISTINCT FROM OLD.has_used_trial) THEN
            RAISE EXCEPTION 'Security Violation: Subscription and entitlement fields cannot be modified client-side.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to public.profiles
DROP TRIGGER IF EXISTS trg_protect_profile_subscription_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_subscription_columns
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_subscription_columns();

COMMENT ON FUNCTION public.protect_profile_subscription_columns() IS 
'Prevents authenticated clients from elevating themselves to Pro/Lifetime. Entitlements must be granted via service_role Edge Functions or Admin.';
