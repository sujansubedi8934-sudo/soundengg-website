-- ============================================================================
-- SOUNDENGG AUTOMATED PALM EXPO 2026 DEPLOYMENT TRIGGERS
-- ============================================================================
-- INSTRUCTIONS: 
-- Go to your Supabase Dashboard -> SQL Editor -> click "New Query"
-- Paste this entire script and click "Run".
-- ============================================================================

-- 1. Create the lead capture table for PALM EXPO
create table if not exists public.palm_expo_leads (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    company text not null,
    email text not null unique,
    whatsapp text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable row level security and allow public anonymous inserts from the landing page
alter table public.palm_expo_leads enable row level security;
drop policy if exists "Allow public inserts" on public.palm_expo_leads;
create policy "Allow public inserts" on public.palm_expo_leads 
    for insert with check (true);

-- 3. Create the database trigger function to automate signups and upgrades
create or replace function public.process_palm_lead_and_upgrade()
returns trigger as $$
declare
    new_user_id uuid;
begin
    -- Check if a user with this email already exists in auth.users
    select id into new_user_id from auth.users where lower(email) = lower(new.email);

    if new_user_id is not null then
        -- USER EXISTS: Upgrade their existing public profile to 1-Month Pro instantly
        insert into public.profiles (
            id,
            email,
            full_name,
            company,
            is_pro,
            subscription_tier,
            subscription_expires_at,
            subscription_provider
        ) values (
            new_user_id,
            lower(new.email),
            new.name,
            new.company,
            true,
            'monthly',
            now() + interval '30 days',
            'palm_expo_2026'
        )
        on conflict (id) do update
        set
            full_name = new.name,
            company = new.company,
            is_pro = true,
            subscription_tier = 'monthly',
            subscription_expires_at = now() + interval '30 days',
            subscription_provider = 'palm_expo_2026';
    else
        -- USER DOES NOT EXIST: Pre-create their account in auth.users and public.profiles
        new_user_id := gen_random_uuid();

        -- A. Create auth.users entry with encrypted default password 'soundengg'
        insert into auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) values (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            lower(new.email),
            -- Encrypts 'soundengg' securely using pg-bcrypt (Supabase standard)
            extensions.crypt('soundengg', extensions.gen_salt('bf')),
            now(), -- Auto-confirms email so they do not have to check their inbox
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object('full_name', new.name, 'company', new.company),
            now(),
            now(),
            '',
            '',
            '',
            ''
        );

        -- B. Create pre-upgraded profile in public.profiles
        insert into public.profiles (
            id,
            email,
            full_name,
            company,
            is_pro,
            subscription_tier,
            subscription_expires_at,
            subscription_provider
        ) values (
            new_user_id,
            lower(new.email),
            new.name,
            new.company,
            true,
            'monthly',
            now() + interval '30 days',
            'palm_expo_2026'
        )
        on conflict (id) do update
        set
            full_name = new.name,
            company = new.company,
            is_pro = true,
            subscription_tier = 'monthly',
            subscription_expires_at = now() + interval '30 days',
            subscription_provider = 'palm_expo_2026';
    end if;

    return new;
end;
$$ language plpgsql security definer;

-- 4. Attach trigger to palm_expo_leads table to run automatically on every signup
drop trigger if exists on_palm_lead_inserted on public.palm_expo_leads;
create trigger on_palm_lead_inserted
    after insert on public.palm_expo_leads
    for each row
    execute function public.process_palm_lead_and_upgrade();
