// Script to add a user as manager (creates profile if missing)
// Usage: node add-manager.js <email> <full-name>

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addManager(email, fullName) {
  console.log(`🔍 Looking up user: ${email}`);
  
  // First, check if user exists in auth.users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.log('⚠️  Cannot check auth users (need service_role key for this)');
    console.log('📝 Attempting to create/update profile in public.users table...');
  }

  // Try to get the auth user ID from public.users first
  const { data: existingUser, error: checkError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (existingUser) {
    // User profile exists, just update role
    console.log('✅ User profile found, updating role to manager...');
    
    const { data, error } = await supabase
      .from('users')
      .update({ role: 'manager' })
      .eq('email', email)
      .select();

    if (error) {
      console.error('❌ Error updating role:', error.message);
      process.exit(1);
    }

    console.log('✅ Successfully promoted to manager!');
    console.log('📊 Updated user:', data[0]);
    return;
  }

  // User doesn't exist in public.users
  console.log('⚠️  No user profile found in database');
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Make sure the user has signed up in your app first');
  console.log('2. Or run this SQL in Supabase Dashboard to create their profile manually:');
  console.log('');
  console.log('-- First, get the user ID from auth:');
  console.log(`SELECT id FROM auth.users WHERE email = '${email}';`);
  console.log('');
  console.log('-- Then insert the profile (replace USER_ID with the ID from above):');
  console.log(`INSERT INTO users (id, email, full_name, role, team_id)`);
  console.log(`VALUES ('USER_ID', '${email}', '${fullName}', 'manager', NULL);`);
}

const email = process.argv[2];
const fullName = process.argv[3] || 'User';

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: node add-manager.js <email> <full-name>');
  console.log('Example: node add-manager.js user@example.com "John Doe"');
  process.exit(1);
}

addManager(email, fullName);
