# GearGuard Setup Guide

This guide will help you set up GearGuard with demo data for immediate testing.

## Step 1: Create Demo User Accounts

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard → Authentication → Users
2. Click "Add user" and create the following accounts:

**Manager Account:**
```
Email: manager@gearguard.com
Password: Demo123!@# (or your choice)
Auto Confirm User: Yes
```

**Technician Alpha Account:**
```
Email: tech.alpha@gearguard.com
Password: Demo123!@# (or your choice)
Auto Confirm User: Yes
```

**Technician Beta Account:**
```
Email: tech.beta@gearguard.com
Password: Demo123!@# (or your choice)
Auto Confirm User: Yes
```

### Option B: Using Supabase SQL Editor

Run this in your Supabase SQL Editor (after creating auth users):

```sql
-- After creating users in Supabase Auth Dashboard, get their IDs and run:
-- Replace 'MANAGER_AUTH_ID', 'TECH_ALPHA_AUTH_ID', 'TECH_BETA_AUTH_ID' with actual IDs

INSERT INTO users (id, email, full_name, role, team_id)
VALUES
  ('MANAGER_AUTH_ID', 'manager@gearguard.com', 'System Manager', 'manager', NULL),
  ('TECH_ALPHA_AUTH_ID', 'tech.alpha@gearguard.com', 'Tech Alpha', 'technician', '11111111-1111-1111-1111-111111111111'),
  ('TECH_BETA_AUTH_ID', 'tech.beta@gearguard.com', 'Tech Beta', 'technician', '22222222-2222-2222-2222-222222222222');
```

## Step 2: Add Sample Maintenance Requests

Run this in Supabase SQL Editor to create sample requests (replace USER_ID with actual manager ID):

```sql
-- Sample maintenance requests demonstrating different scenarios
INSERT INTO requests (equipment_id, team_id, type, status, title, description, duration_hours, created_by)
VALUES
  -- New requests
  (
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'Corrective',
    'New',
    'Air Compressor Pressure Drop',
    'Compressor not maintaining target pressure. Requires inspection.',
    NULL,
    'MANAGER_AUTH_ID'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    'Preventive',
    'New',
    'CNC Machine Scheduled Maintenance',
    'Quarterly maintenance and calibration check.',
    NULL,
    'MANAGER_AUTH_ID'
  ),

  -- In Progress requests
  (
    '55555555-5555-5555-5555-555555555555',
    '22222222-2222-2222-2222-222222222222',
    'Corrective',
    'In Progress',
    'Hydraulic Press Leak',
    'Hydraulic fluid leak detected at main cylinder seal.',
    NULL,
    'MANAGER_AUTH_ID'
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    '22222222-2222-2222-2222-222222222222',
    'Preventive',
    'In Progress',
    'Conveyor Belt Lubrication',
    'Monthly lubrication and tension adjustment.',
    NULL,
    'MANAGER_AUTH_ID'
  ),

  -- Repaired requests (with duration)
  (
    '77777777-7777-7777-7777-777777777777',
    '11111111-1111-1111-1111-111111111111',
    'Corrective',
    'Repaired',
    'Forklift Battery Replacement',
    'Old battery replaced with new unit.',
    3.5,
    'MANAGER_AUTH_ID'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'Corrective',
    'Repaired',
    'Compressor Motor Overheating',
    'Replaced cooling fan and cleaned filters.',
    5.0,
    'MANAGER_AUTH_ID'
  ),

  -- Scheduled preventive maintenance
  (
    '44444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    'Preventive',
    'New',
    'CNC Machine Annual Service',
    'Annual comprehensive service and recalibration.',
    NULL,
    'MANAGER_AUTH_ID'
  );

-- Update scheduled_date for preventive maintenance
UPDATE requests
SET scheduled_date = CURRENT_DATE + INTERVAL '7 days'
WHERE type = 'Preventive' AND status = 'New'
LIMIT 1;

UPDATE requests
SET scheduled_date = CURRENT_DATE + INTERVAL '14 days'
WHERE type = 'Preventive' AND status = 'New'
AND scheduled_date IS NULL
LIMIT 1;
```

## Step 3: Verify Installation

### Test Real-Time Sync

1. Open the application in two different browser windows
2. Sign in as different users (e.g., manager and technician)
3. In one window, drag a request to a different status column
4. Observe the change appear instantly in the other window

### Test Role-Based Access

1. Sign in as Manager:
   - Should see all equipment and requests
   - Can access all teams' data

2. Sign in as Technician:
   - Should only see assigned team's equipment
   - Can only view/edit team's requests

### Test State Machine

1. Try to drag a request from "New" directly to "Repaired"
   - Should be prevented (invalid transition)

2. Drag from "New" to "In Progress"
   - Should work and prompt for duration if moving to Repaired

3. Try to move to "Repaired" without entering duration
   - Should show error message

### Test Analytics

1. Go to Equipment Dashboard
2. Verify breakdown counts and repair times display
3. Equipment with >3 breakdowns should show high-risk indicator

### Test Calendar

1. Go to Calendar view
2. Click on a future date
3. Create a preventive maintenance request
4. Verify it appears on the calendar date

## Common Issues

### "Equipment not found" when creating request
- Ensure equipment exists in database
- Verify user has permission to view equipment (check team assignment)

### Real-time updates not working
- Check browser console for WebSocket errors
- Verify Supabase project is active
- Ensure RLS policies are correctly configured

### Cannot update request status
- Verify user is authenticated
- Check that state transition is valid
- Ensure Edge Functions are deployed

### User cannot see any data
- Verify user exists in both auth.users and public.users tables
- Check team_id assignment for technicians
- Review RLS policies

## Next Steps

1. **Customize Equipment**: Add your actual equipment in the Equipment Dashboard
2. **Adjust Teams**: Modify team structure to match your organization
3. **Configure Risk Thresholds**: Modify analytics Edge Function for custom risk criteria
4. **Add More Users**: Create additional manager and technician accounts
5. **Test Workflows**: Run through complete maintenance request lifecycle

## Production Considerations

Before deploying to production:

1. **Security**
   - Change all demo passwords
   - Review and test RLS policies thoroughly
   - Enable MFA for admin accounts
   - Set up API rate limiting

2. **Monitoring**
   - Configure Supabase alerts
   - Set up error tracking (e.g., Sentry)
   - Monitor Edge Function performance
   - Track database query performance

3. **Backup**
   - Configure automated database backups
   - Test backup restoration process
   - Document disaster recovery procedures

4. **Performance**
   - Review database indexes
   - Monitor real-time connection counts
   - Optimize Edge Function cold starts
   - Consider CDN for static assets

## Support

For issues or questions:
1. Check the main README.md
2. Review Supabase documentation
3. Check browser console for errors
4. Verify all Edge Functions are deployed

Happy Maintaining!
