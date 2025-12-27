/*
  ============================================================================
  GearGuard - Complete Database Setup
  ============================================================================
  
  This single SQL file sets up the entire database including:
  - All tables (teams, users, equipment, requests)
  - Indexes for performance
  - Row Level Security (RLS) policies
  - Sample data (teams and equipment)
  
  HOW TO USE:
  1. Go to Supabase Dashboard: https://supabase.com/dashboard
  2. Select your project: GearGuard
  3. Click "SQL Editor" in the left sidebar
  4. Click "New query"
  5. Copy and paste this ENTIRE file
  6. Click "Run" (or press Ctrl+Enter)
  7. Wait for "Success" message
  
  After running this SQL, you can:
  - Sign up new users in your app
  - Sign in and use all features
  
  ============================================================================
*/

-- ============================================================================
-- STEP 1: CREATE TABLES
-- ============================================================================

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('manager', 'technician')),
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create equipment table
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

-- Create requests table
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

-- ============================================================================
-- STEP 2: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_team_id ON users(team_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_equipment_team_id ON equipment(assigned_team_id);
CREATE INDEX IF NOT EXISTS idx_equipment_scrapped ON equipment(is_scrapped);
CREATE INDEX IF NOT EXISTS idx_requests_equipment_id ON requests(equipment_id);
CREATE INDEX IF NOT EXISTS idx_requests_team_id ON requests(team_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_scheduled_date ON requests(scheduled_date);

-- ============================================================================
-- STEP 3: CREATE FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
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

-- ============================================================================
-- STEP 4: ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: CREATE RLS POLICIES FOR TEAMS
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can view teams" ON teams;
CREATE POLICY "Authenticated users can view teams"
  ON teams FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Managers can insert teams" ON teams;
CREATE POLICY "Managers can insert teams"
  ON teams FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'manager'
    )
  );

DROP POLICY IF EXISTS "Managers can update teams" ON teams;
CREATE POLICY "Managers can update teams"
  ON teams FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'manager'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'manager'
    )
  );

-- ============================================================================
-- STEP 6: CREATE RLS POLICIES FOR USERS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view team members" ON users;
CREATE POLICY "Users can view team members"
  ON users FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Managers can view all users" ON users;
CREATE POLICY "Managers can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'manager'
    )
  );

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Managers can insert users" ON users;
CREATE POLICY "Managers can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'manager'
    )
  );

DROP POLICY IF EXISTS "Managers can update all users" ON users;
CREATE POLICY "Managers can update all users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'manager'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'manager'
    )
  );

-- ============================================================================
-- STEP 7: CREATE RLS POLICIES FOR EQUIPMENT
-- ============================================================================

DROP POLICY IF EXISTS "Managers can view all equipment" ON equipment;
CREATE POLICY "Managers can view all equipment"
  ON equipment FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'manager'
    )
  );

DROP POLICY IF EXISTS "Technicians can view team equipment" ON equipment;
CREATE POLICY "Technicians can view team equipment"
  ON equipment FOR SELECT
  TO authenticated
  USING (
    assigned_team_id IN (
      SELECT team_id FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Managers can insert equipment" ON equipment;
CREATE POLICY "Managers can insert equipment"
  ON equipment FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'manager'
    )
  );

DROP POLICY IF EXISTS "Managers can update equipment" ON equipment;
CREATE POLICY "Managers can update equipment"
  ON equipment FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'manager'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'manager'
    )
  );

-- ============================================================================
-- STEP 8: CREATE RLS POLICIES FOR REQUESTS
-- ============================================================================

DROP POLICY IF EXISTS "Managers can view all requests" ON requests;
CREATE POLICY "Managers can view all requests"
  ON requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'manager'
    )
  );

DROP POLICY IF EXISTS "Technicians can view team requests" ON requests;
CREATE POLICY "Technicians can view team requests"
  ON requests FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authenticated users can insert requests" ON requests;
CREATE POLICY "Authenticated users can insert requests"
  ON requests FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "Managers can update all requests" ON requests;
CREATE POLICY "Managers can update all requests"
  ON requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'manager'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'manager'
    )
  );

DROP POLICY IF EXISTS "Technicians can update team requests" ON requests;
CREATE POLICY "Technicians can update team requests"
  ON requests FOR UPDATE
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    team_id IN (
      SELECT team_id FROM users WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 9: INSERT SAMPLE DATA
-- ============================================================================

-- Insert sample teams
INSERT INTO teams (id, name)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Maintenance Team Alpha'),
  ('22222222-2222-2222-2222-222222222222', 'Maintenance Team Beta')
ON CONFLICT (id) DO NOTHING;

-- Insert sample equipment
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
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
/*
  ✅ Database setup is complete!
  
  What was created:
  - ✅ 4 tables: teams, users, equipment, requests
  - ✅ 8 indexes for performance
  - ✅ Row Level Security policies
  - ✅ 2 sample teams
  - ✅ 5 sample equipment items
  
  Next steps:
  1. Go to your app: http://localhost:5173
  2. Click "Sign Up" to create your first account
  3. Enter your name, email, and password
  4. Start using GearGuard!
  
  Note: New users are created as "technician" role by default.
  If you need a manager account, you can update the role in Supabase:
  - Go to Table Editor → users → find your user → change role to 'manager'
*/
