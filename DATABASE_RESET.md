# 🗑️ GearGuard - Database Reset & Rebuild

This file contains two SQL queries:
1. **DELETE_ALL.sql** - Completely wipe all data and tables
2. **REBUILD_ALL.sql** - Recreate everything from scratch

---

## ⚠️ WARNING - READ THIS FIRST!

**These queries will PERMANENTLY DELETE all your data!**

- All tables will be dropped
- All data will be lost
- All users, equipment, requests, teams will be deleted
- This CANNOT be undone!

**Only use this if you want to start completely fresh!**

---

# 🗑️ PART 1: DELETE EVERYTHING

Copy this SQL and run it in Supabase SQL Editor to delete all tables and data.

## 📝 DELETE_ALL.sql

```sql
-- ============================================================================
-- GEARGUARD - DELETE ALL TABLES AND DATA
-- ============================================================================
-- ⚠️ WARNING: This will permanently delete EVERYTHING!
-- ============================================================================

-- Drop all triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_requests_updated_at ON requests;
DROP TRIGGER IF EXISTS update_equipment_updated_at ON equipment;

-- Drop all functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop all tables (in correct order to respect foreign keys)
DROP TABLE IF EXISTS requests CASCADE;
DROP TABLE IF EXISTS equipment CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

-- ============================================================================
-- ✅ ALL TABLES AND DATA DELETED!
-- ============================================================================
/*
  Everything has been removed:
  - ✅ All tables dropped
  - ✅ All data deleted
  - ✅ All triggers removed
  - ✅ All functions removed
  
  Next step: Run REBUILD_ALL.sql to recreate everything
*/
```

---

# 🔨 PART 2: REBUILD EVERYTHING

After deleting, copy this SQL and run it to recreate all tables, add sample data, and set up your manager account.

## 📝 REBUILD_ALL.sql

```sql
-- ============================================================================
-- GEARGUARD - COMPLETE REBUILD FROM SCRATCH
-- ============================================================================
-- This recreates all tables, adds sample data, and sets up your account
-- ⚠️ IMPORTANT: Change the email in STEP 8 to your actual email!
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Create teams table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- STEP 2: Create users table (extends auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('manager', 'technician')),
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- STEP 3: Create equipment table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  assigned_team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  is_scrapped boolean DEFAULT false,
  warranty_expiry date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- STEP 4: Create requests table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('Corrective', 'Preventive')),
  status text NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'In Progress', 'Repaired', 'Scrap')),
  duration_hours numeric,
  scheduled_date date,
  title text NOT NULL,
  description text DEFAULT '',
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- STEP 5: Create indexes for performance
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_team_id ON users(team_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_equipment_team_id ON equipment(assigned_team_id);
CREATE INDEX IF NOT EXISTS idx_equipment_scrapped ON equipment(is_scrapped);
CREATE INDEX IF NOT EXISTS idx_requests_equipment_id ON requests(equipment_id);
CREATE INDEX IF NOT EXISTS idx_requests_team_id ON requests(team_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_scheduled_date ON requests(scheduled_date);

-- ----------------------------------------------------------------------------
-- STEP 6: Create functions and triggers
-- ----------------------------------------------------------------------------
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_equipment_updated_at ON equipment;
CREATE TRIGGER update_equipment_updated_at
  BEFORE UPDATE ON equipment
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_requests_updated_at ON requests;
CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- STEP 7: Enable Row Level Security (RLS)
-- ----------------------------------------------------------------------------
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teams
DROP POLICY IF EXISTS "Authenticated users can view teams" ON teams;
CREATE POLICY "Authenticated users can view teams"
  ON teams FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Managers can insert teams" ON teams;
CREATE POLICY "Managers can insert teams"
  ON teams FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'manager')
  );

DROP POLICY IF EXISTS "Managers can update teams" ON teams;
CREATE POLICY "Managers can update teams"
  ON teams FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'manager')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'manager')
  );

-- RLS Policies for users
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view team members" ON users;
CREATE POLICY "Users can view team members"
  ON users FOR SELECT TO authenticated
  USING (team_id IN (SELECT team_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Managers can view all users" ON users;
CREATE POLICY "Managers can view all users"
  ON users FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'manager')
  );

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Managers can insert users" ON users;
CREATE POLICY "Managers can insert users"
  ON users FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'manager')
  );

DROP POLICY IF EXISTS "Managers can update all users" ON users;
CREATE POLICY "Managers can update all users"
  ON users FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'manager')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'manager')
  );

DROP POLICY IF EXISTS "Allow user profile creation during signup" ON users;
CREATE POLICY "Allow user profile creation during signup"
  ON users FOR INSERT TO anon, authenticated WITH CHECK (true);

-- RLS Policies for equipment
DROP POLICY IF EXISTS "Managers can view all equipment" ON equipment;
CREATE POLICY "Managers can view all equipment"
  ON equipment FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'manager')
  );

DROP POLICY IF EXISTS "Technicians can view team equipment" ON equipment;
CREATE POLICY "Technicians can view team equipment"
  ON equipment FOR SELECT TO authenticated
  USING (assigned_team_id IN (SELECT team_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Managers can insert equipment" ON equipment;
CREATE POLICY "Managers can insert equipment"
  ON equipment FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'manager')
  );

DROP POLICY IF EXISTS "Managers can update equipment" ON equipment;
CREATE POLICY "Managers can update equipment"
  ON equipment FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'manager')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'manager')
  );

-- RLS Policies for requests
DROP POLICY IF EXISTS "Managers can view all requests" ON requests;
CREATE POLICY "Managers can view all requests"
  ON requests FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'manager')
  );

DROP POLICY IF EXISTS "Technicians can view team requests" ON requests;
CREATE POLICY "Technicians can view team requests"
  ON requests FOR SELECT TO authenticated
  USING (team_id IN (SELECT team_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can insert requests" ON requests;
CREATE POLICY "Authenticated users can insert requests"
  ON requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Managers can update all requests" ON requests;
CREATE POLICY "Managers can update all requests"
  ON requests FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'manager')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'manager')
  );

DROP POLICY IF EXISTS "Technicians can update team requests" ON requests;
CREATE POLICY "Technicians can update team requests"
  ON requests FOR UPDATE TO authenticated
  USING (team_id IN (SELECT team_id FROM users WHERE id = auth.uid()))
  WITH CHECK (team_id IN (SELECT team_id FROM users WHERE id = auth.uid()));

-- ----------------------------------------------------------------------------
-- STEP 8: Insert sample teams
-- ----------------------------------------------------------------------------
INSERT INTO teams (id, name)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Maintenance Team Alpha'),
  ('22222222-2222-2222-2222-222222222222', 'Maintenance Team Beta');

-- ----------------------------------------------------------------------------
-- STEP 9: Insert sample equipment
-- ----------------------------------------------------------------------------
INSERT INTO equipment (id, name, description, assigned_team_id, is_scrapped, warranty_expiry)
VALUES
  (
    '33333333-3333-3333-3333-333333333333',
    'Industrial Compressor Unit A1',
    'Heavy-duty air compressor for production line',
    '11111111-1111-1111-1111-111111111111',
    false,
    '2025-12-31'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'CNC Milling Machine M200',
    '5-axis precision milling machine',
    '11111111-1111-1111-1111-111111111111',
    false,
    '2026-06-30'
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'Hydraulic Press HP500',
    '500-ton hydraulic press for metal forming',
    '22222222-2222-2222-2222-222222222222',
    false,
    '2025-03-15'
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    'Assembly Line Conveyor Belt',
    'Main production conveyor system',
    '22222222-2222-2222-2222-222222222222',
    false,
    '2024-12-31'
  ),
  (
    '77777777-7777-7777-7777-777777777777',
    'Forklift Model X-2000',
    'Electric forklift for warehouse operations',
    '11111111-1111-1111-1111-111111111111',
    false,
    '2025-09-30'
  );

-- ----------------------------------------------------------------------------
-- STEP 10: Create user profiles for all authenticated users
-- ----------------------------------------------------------------------------
INSERT INTO users (id, email, full_name, role, team_id)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
  'technician',
  NULL
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL;

-- ----------------------------------------------------------------------------
-- STEP 11: Promote YOUR EMAIL to manager
-- ----------------------------------------------------------------------------
-- ⚠️ IMPORTANT: Replace this email with YOUR actual email address!
UPDATE users 
SET role = 'manager' 
WHERE email = 'vishalprajapati9427@gmail.com';

-- ----------------------------------------------------------------------------
-- STEP 12: Set up automatic user profile creation (for future signups)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, team_id)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'technician',
    NULL
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- ✅ REBUILD COMPLETE!
-- ============================================================================
/*
  Everything has been recreated:
  - ✅ All tables created with proper structure
  - ✅ All indexes added for performance
  - ✅ Row Level Security enabled with policies
  - ✅ 2 sample teams created
  - ✅ 5 sample equipment items added
  - ✅ User profiles created for all auth users
  - ✅ Your email promoted to manager
  - ✅ Automatic profile creation trigger set up
  
  Next steps:
  1. Refresh your app (press F5)
  2. Sign in with your email
  3. You should see:
     - Your name and "👔 Manager" badge
     - 5 equipment items in Equipment Dashboard
     - Empty Kanban board (ready to create requests)
  4. Start using GearGuard!
*/

-- Verify setup
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Teams' as table_name, COUNT(*) as count FROM teams
UNION ALL
SELECT 'Equipment' as table_name, COUNT(*) as count FROM equipment;
```

---

## 🚀 How to Use:

### **Complete Reset Process:**

1. **Delete Everything:**
   - Copy `DELETE_ALL.sql` (from above)
   - Paste into Supabase SQL Editor
   - Click **"Run"**
   - Wait for success message

2. **Rebuild Everything:**
   - Copy `REBUILD_ALL.sql` (from above)
   - **IMPORTANT**: Change the email in STEP 11 to YOUR email
   - Paste into Supabase SQL Editor
   - Click **"Run"**
   - Wait for success message

3. **Refresh Your App:**
   - Go to http://localhost:5174
   - Press **F5**
   - Sign in with your email
   - Everything should work! ✨

---

## ✅ Expected Results After Rebuild:

| table_name | count |
|------------|-------|
| Users      | 1+    |
| Teams      | 2     |
| Equipment  | 5     |

(Users count depends on how many people have signed up)

---

## ⚠️ Important Notes:

1. **Delete query does NOT delete auth users** - they stay in `auth.users` table
2. **Rebuild query creates profiles** for all existing auth users
3. **Only YOUR email becomes manager** - all others are technicians
4. **Sample data is restored** - teams and equipment
5. **RLS policies are recreated** - security is maintained

---

**Ready to reset? Copy DELETE_ALL.sql first, then REBUILD_ALL.sql!** 🚀
