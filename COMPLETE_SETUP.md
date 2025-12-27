# 🚀 GearGuard - Complete One-Click Setup

This file contains a **single SQL query** that will set up your entire GearGuard application.

## 📋 What This SQL Does:

1. ✅ Creates user profiles for all authenticated users
2. ✅ Promotes **ONLY YOUR EMAIL** to **manager** role (others stay as technicians)
3. ✅ Inserts sample equipment (5 items)
4. ✅ Inserts sample teams (2 teams)
5. ✅ Sets up automatic user profile creation for future signups

---

## 🎯 Instructions:

### **Step 1:** Copy the SQL below
### **Step 2:** Go to Supabase SQL Editor
- URL: https://supabase.com/dashboard/project/hcksqblptemepdewhgmq/sql/new
- Click "New query"

### **Step 3:** Paste and Run
- Paste the entire SQL
- **IMPORTANT**: Change `vishalprajapati9427@gmail.com` to your actual email in STEP 2
- Click **"Run"** button (or press Ctrl+Enter)
- Wait for **"Success"** message

### **Step 4:** Refresh Your App
- Go to http://localhost:5174
- Press **F5** to refresh
- You should now see everything working!

---

## 📝 Complete Setup SQL:

```sql
-- ============================================================================
-- GEARGUARD COMPLETE SETUP - ONE-CLICK INSTALLATION
-- ============================================================================
-- This SQL sets up everything you need to start using GearGuard immediately
-- Run this in Supabase SQL Editor and then refresh your app!
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Create user profiles for all authenticated users (as technicians)
-- ----------------------------------------------------------------------------
-- This creates profiles for anyone who has signed up but doesn't have a profile yet
INSERT INTO users (id, email, full_name, role, team_id)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
  'technician',
  NULL
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL
ON CONFLICT (id) DO UPDATE 
SET full_name = COALESCE(EXCLUDED.full_name, users.full_name);

-- ----------------------------------------------------------------------------
-- STEP 2: Promote ONLY YOUR EMAIL to manager
-- ----------------------------------------------------------------------------
-- ⚠️ IMPORTANT: Replace 'YOUR_EMAIL@gmail.com' with your actual email address!
UPDATE users 
SET role = 'manager' 
WHERE email = 'vishalprajapati9427@gmail.com';

-- ----------------------------------------------------------------------------
-- STEP 3: Insert sample teams
-- ----------------------------------------------------------------------------
INSERT INTO teams (id, name)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Maintenance Team Alpha'),
  ('22222222-2222-2222-2222-222222222222', 'Maintenance Team Beta')
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- STEP 4: Insert sample equipment
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
  )
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- STEP 5: Set up automatic user profile creation (for future signups)
-- ----------------------------------------------------------------------------
-- This trigger automatically creates a user profile whenever someone signs up

-- Create the function
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

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- STEP 6: Fix RLS policy to allow profile creation during signup
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow user profile creation during signup" ON users;
CREATE POLICY "Allow user profile creation during signup"
  ON users FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ============================================================================
-- ✅ SETUP COMPLETE!
-- ============================================================================
/*
  What was created:
  - ✅ User profiles for all authenticated users (default: technician)
  - ✅ ONE manager (your email only)
  - ✅ 2 sample teams (Maintenance Team Alpha & Beta)
  - ✅ 5 sample equipment items
  - ✅ Automatic user profile creation trigger for future signups
  - ✅ Fixed RLS policies for seamless signup
  
  Next steps:
  1. Refresh your app (press F5)
  2. You should see:
     - Your name and "👔 Manager" badge in the header
     - 5 equipment items in Equipment Dashboard
     - Empty Kanban board (ready to add maintenance requests)
  3. Start using GearGuard!
  
  To create a maintenance request:
  1. Go to Calendar view
  2. Click on a date
  3. Create a new maintenance request
  
  Or use the Edge Functions to create requests programmatically!
*/

-- Verify setup (optional - check what was created)
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Teams' as table_name, COUNT(*) as count FROM teams
UNION ALL
SELECT 'Equipment' as table_name, COUNT(*) as count FROM equipment;
```

---

## ✅ Expected Results:

After running the SQL, you should see a success message showing:

| table_name | count |
|------------|-------|
| Users      | 2     |
| Teams      | 2     |
| Equipment  | 5     |

---

## 🎉 After Setup:

1. **Refresh your app** (F5)
2. You should see:
   - ✅ Your name in the header (instead of "User")
   - ✅ **"👔 Manager"** badge (instead of "Technician")
   - ✅ **5 equipment items** in Equipment Dashboard
   - ✅ **Empty Kanban board** (ready to create requests)

---

## 🚀 What to Do Next:

### **Create Your First Maintenance Request:**

1. Go to **Calendar** view
2. Click on any date
3. Fill in the form:
   - Select an equipment
   - Choose request type (Corrective/Preventive)
   - Add title and description
4. Submit!

The request will appear on the Kanban board instantly! ⚡

---

## 🔧 Troubleshooting:

### Still seeing "User" and "Technician"?
- Make sure you refreshed the page (F5)
- Try signing out and signing back in
- Check that the SQL ran successfully

### Still no equipment showing?
- Check the SQL results - you should see "5" for Equipment count
- Go to Supabase Table Editor → equipment table
- Verify 5 rows exist

### Can't create requests?
- Make sure you're logged in as a manager
- Equipment must exist first
- Check browser console for errors (F12)

---

## 📞 Need Help?

If you encounter any issues:
1. Check the browser console (F12 → Console tab)
2. Check Supabase logs (Dashboard → Logs)
3. Verify all tables exist in Table Editor

---

**Made with ❤️ for GearGuard - Real-Time Maintenance Intelligence**
