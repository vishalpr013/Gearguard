-- Auto-create public.users profile when a new auth user is created
-- This ensures new users (including those requiring email confirmation) will have a profile row
-- so role-based UI immediately recognizes manager accounts.

CREATE OR REPLACE FUNCTION public.create_profile_from_auth_user()
RETURNS trigger AS $$
BEGIN
  -- Attempt to extract full_name and role from the auth.user meta fields
  -- Supabase stores raw user metadata in column raw_user_meta_data (json)
  -- Fallback to empty string / 'technician' if not present
  INSERT INTO public.users (id, email, full_name, role, team_id, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'full_name')::text, ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::text, 'technician'),
    NULL,
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS create_profile_on_auth_user_insert ON auth.users;
CREATE TRIGGER create_profile_on_auth_user_insert
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.create_profile_from_auth_user();

-- Note: This function uses SECURITY DEFINER. In Supabase this usually works as expected
-- because migrations run as a privileged DB role. When deploying to your Supabase DB,
-- apply this migration using the SQL editor in the Supabase dashboard so the function
-- is created with proper permissions.
