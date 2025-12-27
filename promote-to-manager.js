// Simple script to promote a user to manager role
// Usage: node promote-to-manager.js <email>

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function promoteToManager(email) {
  console.log(`🔄 Updating role for: ${email}`);
  
  const { data, error } = await supabase
    .from('users')
    .update({ role: 'manager' })
    .eq('email', email)
    .select();

  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  if (data && data.length > 0) {
    console.log('✅ Successfully promoted to manager!');
    console.log('📊 Updated user:', data[0]);
  } else {
    console.log('⚠️  No user found with that email');
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: node promote-to-manager.js <email>');
  process.exit(1);
}

promoteToManager(email);
