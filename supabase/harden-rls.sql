-- Harden Supabase Row Level Security (RLS) policies for profiles and user_configs tables.

-- ============================================================================
-- 1. Profiles Table Policies
-- ============================================================================

-- Clean up all existing policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;

-- Create hardened SELECT policy (authenticated users can only view their own profile)
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Create hardened INSERT policy (authenticated users can only insert their own profile)
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create hardened UPDATE policy (authenticated users can only update their own profile)
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- ============================================================================
-- 2. User Configs Table Policies
-- ============================================================================

-- Clean up the broad public ALL policy
DROP POLICY IF EXISTS "Users can manage their own configs" ON public.user_configs;

-- Create hardened SELECT policy (authenticated users can only view their own configurations)
CREATE POLICY "user_configs_select_own" ON public.user_configs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create hardened INSERT policy (authenticated users can only insert their own configurations)
CREATE POLICY "user_configs_insert_own" ON public.user_configs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create hardened UPDATE policy (authenticated users can only update their own configurations)
CREATE POLICY "user_configs_update_own" ON public.user_configs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create hardened DELETE policy (authenticated users can only delete their own configurations)
CREATE POLICY "user_configs_delete_own" ON public.user_configs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
