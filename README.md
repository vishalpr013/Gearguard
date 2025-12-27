# GearGuard - Real-Time Maintenance Intelligence Platform

A production-ready maintenance management system with live synchronization across all users. Built with React, Supabase, and real-time database subscriptions.

## Features

### Core Functionality
- **Real-Time Kanban Board**: Drag-and-drop request management with instant synchronization
- **Equipment Dashboard**: Live monitoring of asset health, breakdown statistics, and risk indicators
- **Maintenance Calendar**: Schedule and track preventive maintenance tasks
- **State Machine Workflow**: Enforced status transitions (New → In Progress → Repaired → Scrap)
- **Automatic Team Assignment**: Requests automatically inherit team from equipment
- **High-Risk Detection**: Automatic flagging based on breakdown count and repair time

### Technical Implementation
- **Zero Polling**: All state updates via Supabase Realtime subscriptions
- **Role-Based Access**: Managers see all data, Technicians see team-specific data
- **Edge Functions**: Business logic runs serverless with JWT validation
- **TypeScript**: Full type safety across frontend and database schema
- **Row Level Security**: PostgreSQL policies enforce data access rules

## Quick Start

### Prerequisites
- Node.js 18+ installed
- Supabase account with a project

### Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   The `.env` file is already configured with Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

3. **Create Demo Users**

   In your Supabase Dashboard, go to Authentication > Users and create:

   **Manager Account:**
   - Email: `manager@gearguard.com`
   - Password: Choose a secure password
   - After creation, add to public.users table:
     ```sql
     INSERT INTO users (id, email, full_name, role, team_id)
     VALUES (
       'auth_user_id_from_dashboard',
       'manager@gearguard.com',
       'System Manager',
       'manager',
       NULL
     );
     ```

   **Technician Account (Team Alpha):**
   - Email: `tech.alpha@gearguard.com`
   - Password: Choose a secure password
   - After creation, add to public.users table:
     ```sql
     INSERT INTO users (id, email, full_name, role, team_id)
     VALUES (
       'auth_user_id_from_dashboard',
       'tech.alpha@gearguard.com',
       'Tech Alpha',
       'technician',
       '11111111-1111-1111-1111-111111111111'
     );
     ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Access the Application**
   - Open browser to `http://localhost:5173`
   - Sign in with one of the demo accounts

## Architecture

### Database Schema

**teams** - Maintenance teams
- `id` (uuid, primary key)
- `name` (text)

**users** - System users (extends auth.users)
- `id` (uuid, references auth.users)
- `email` (text)
- `role` (manager | technician)
- `team_id` (references teams)
- `full_name` (text)

**equipment** - Assets being maintained
- `id` (uuid, primary key)
- `name` (text)
- `assigned_team_id` (references teams)
- `is_scrapped` (boolean)
- `warranty_expiry` (date)

**requests** - Maintenance requests
- `id` (uuid, primary key)
- `equipment_id` (references equipment)
- `team_id` (references teams, auto-filled)
- `type` (Corrective | Preventive)
- `status` (New | In Progress | Repaired | Scrap)
- `duration_hours` (numeric)
- `scheduled_date` (date)

### Edge Functions

**create-request** - Creates maintenance requests with auto-fill
- Auto-populates `team_id` from equipment
- Validates equipment exists
- Enforces authentication

**update-request-status** - Manages state transitions
- Validates state machine rules
- Requires `duration_hours` for Repaired status
- Auto-scraps equipment when request reaches Scrap status

**equipment-analytics** - Computes risk metrics
- Breakdown count per equipment
- Average repair time
- High-risk flag (>3 breakdowns OR >24h avg repair)
- Active request count

### Real-Time Synchronization

All tables have real-time subscriptions:
- Equipment changes propagate instantly
- Request updates trigger Kanban board updates
- Team changes reflect immediately
- Zero manual refresh required

## Usage Guide

### Kanban Board
1. View all requests organized by status columns
2. Drag requests between columns to update status
3. System validates state transitions automatically
4. High-risk equipment marked with red warning icon
5. All users see updates in real-time

### Equipment Dashboard
1. Monitor all equipment health metrics
2. View breakdown counts and repair time averages
3. Identify high-risk assets requiring attention
4. Track active request counts per asset
5. Auto-refreshes every 10 seconds

### Maintenance Calendar
1. View all scheduled preventive maintenance
2. Click any date to schedule new maintenance
3. See upcoming tasks in the sidebar
4. Create requests directly from calendar

## Security Model

### Row Level Security Policies

**Managers:**
- Full read/write access to all tables
- Can create teams, equipment, and users
- See all requests across all teams

**Technicians:**
- Read access to own team's data only
- Can create and update requests for team equipment
- Cannot access other teams' data

### Authentication Flow
1. User signs in via Supabase Auth
2. JWT token validated on all API calls
3. Edge Functions verify user identity
4. RLS policies enforce data access rules
5. Real-time subscriptions respect RLS policies

## Production Deployment

### Build for Production
```bash
npm run build
```

### Deployment Checklist
- [ ] Configure production Supabase project
- [ ] Update environment variables
- [ ] Create production user accounts
- [ ] Set up proper backup strategy
- [ ] Configure monitoring and alerts
- [ ] Test real-time synchronization
- [ ] Verify RLS policies are enforced

## Troubleshooting

### Real-time not working
- Check Supabase project status
- Verify browser WebSocket connections
- Confirm RLS policies allow data access

### Authentication issues
- Ensure users exist in both auth.users and public.users
- Verify JWT token is being sent with requests
- Check RLS policies for user's role

### State transition errors
- Review state machine rules in update-request-status
- Ensure duration_hours provided for Repaired status
- Verify user has permission to update request

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Edge Functions**: Deno runtime
- **Build Tool**: Vite
- **Icons**: Lucide React

## License

Built for production use. Customize as needed for your organization.
