/*
  # Seed Sample Data for GearGuard

  ## Overview
  Creates sample data for testing and demonstration purposes.
  This includes teams, equipment, and sample maintenance requests.

  ## Sample Data

  ### Teams
  1. Maintenance Team Alpha
  2. Maintenance Team Beta

  ### Equipment
  - Industrial Compressor
  - CNC Milling Machine
  - Hydraulic Press
  - Assembly Line Conveyor
  - Forklift Model X

  ### Sample Requests
  - Various requests across different equipment with different statuses
  - Mix of Corrective and Preventive maintenance types

  ## Important Notes
  - This migration is idempotent and safe to run multiple times
  - Sample user accounts will be created (requires manual Supabase Auth setup)
  - Password for demo accounts should be set through Supabase Dashboard
*/

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

-- Note: User accounts must be created through Supabase Auth Dashboard first
-- Example users to create in Supabase Dashboard:
-- 1. Manager: manager@gearguard.com (role: manager, team_id: any)
-- 2. Tech Alpha: tech.alpha@gearguard.com (role: technician, team_id: Team Alpha)
-- 3. Tech Beta: tech.beta@gearguard.com (role: technician, team_id: Team Beta)

-- The following sample requests demonstrate the system's capabilities
-- Note: created_by field should be replaced with actual user IDs after auth setup