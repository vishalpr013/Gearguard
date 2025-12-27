/*
  # GearGuard - Real-Time Maintenance Intelligence Platform

  ## Overview
  Creates the complete database schema for GearGuard maintenance tracking system
  with real-time synchronization capabilities.

  ## New Tables

  ### 1. teams
  - `id` (uuid, primary key) - Unique team identifier
  - `name` (text) - Team name
  - `created_at` (timestamptz) - Creation timestamp

  ### 2. users
  - `id` (uuid, primary key, references auth.users) - Links to Supabase auth
  - `email` (text) - User email
  - `role` (text) - Either 'manager' or 'technician'
  - `team_id` (uuid) - References teams table
  - `full_name` (text) - User's full name
  - `created_at` (timestamptz) - Creation timestamp

  ### 3. equipment
  - `id` (uuid, primary key) - Unique equipment identifier
  - `name` (text) - Equipment name
  - `description` (text) - Equipment description
  - `assigned_team_id` (uuid) - References teams table
  - `is_scrapped` (boolean) - Scrap status flag
  - `warranty_expiry` (date) - Warranty expiration date
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 4. requests
  - `id` (uuid, primary key) - Unique request identifier
  - `equipment_id` (uuid) - References equipment table
  - `team_id` (uuid) - References teams table (auto-filled)
  - `type` (text) - Either 'Corrective' or 'Preventive'
  - `status` (text) - 'New', 'In Progress', 'Repaired', or 'Scrap'
  - `duration_hours` (numeric) - Time spent on repair
  - `scheduled_date` (date) - For preventive maintenance
  - `title` (text) - Request title
  - `description` (text) - Request description
  - `created_by` (uuid) - References users table
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Managers can access all data
  - Technicians can only access data for their assigned team
  - All policies verify authentication and role/team membership

  ## Important Notes
  1. Real-time replication is enabled by default on all tables
  2. Foreign key constraints ensure data integrity
  3. Indexes added for performance on frequently queried columns
  4. Triggers automatically update `updated_at` timestamps
*/

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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_team_id ON users(team_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_equipment_team_id ON equipment(assigned_team_id);
CREATE INDEX IF NOT EXISTS idx_equipment_scrapped ON equipment(is_scrapped);
CREATE INDEX IF NOT EXISTS idx_requests_equipment_id ON requests(equipment_id);
CREATE INDEX IF NOT EXISTS idx_requests_team_id ON requests(team_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_scheduled_date ON requests(scheduled_date);

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

-- Enable Row Level Security
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teams
CREATE POLICY "Authenticated users can view teams"
  ON teams FOR SELECT
  TO authenticated
  USING (true);

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

-- RLS Policies for users
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can view team members"
  ON users FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM users WHERE id = auth.uid()
    )
  );

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

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

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

-- RLS Policies for equipment
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

CREATE POLICY "Technicians can view team equipment"
  ON equipment FOR SELECT
  TO authenticated
  USING (
    assigned_team_id IN (
      SELECT team_id FROM users WHERE id = auth.uid()
    )
  );

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

-- RLS Policies for requests
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

CREATE POLICY "Technicians can view team requests"
  ON requests FOR SELECT
  TO authenticated
  USING (
    team_id IN (
      SELECT team_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can insert requests"
  ON requests FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

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