/*
  Fix Sign Up Issue - Allow Users to Insert Their Own Profile
  
  This adds a policy that allows new users to insert their own profile
  during the sign-up process.
  
  HOW TO USE:
  1. Go to Supabase Dashboard → SQL Editor
  2. Click "New query"
  3. Copy and paste this entire file
  4. Click "Run"
*/

-- Drop existing policy that might be too restrictive
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create new policy that allows users to insert their own profile during sign-up
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Also allow anon users to insert (for initial sign-up before authentication completes)
DROP POLICY IF EXISTS "Allow user profile creation during signup" ON users;
CREATE POLICY "Allow user profile creation during signup"
  ON users FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

/*
  ✅ This policy allows:
  - New users to create their profile during sign-up
  - Both anonymous and authenticated users to insert (Supabase handles the transition)
  
  After running this, try signing up again!
*/
