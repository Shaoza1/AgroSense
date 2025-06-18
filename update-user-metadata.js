/**
 * Script to update a user's metadata (e.g., add "role": "admin") in Supabase Auth using the Admin API.
 *
 * Usage:
 *   1. Set your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY as environment variables,
 *      or replace them directly in the script below.
 *   2. Run: `node update-user-metadata.js`
 */

import { createClient } from '@supabase/supabase-js';

// ---- CONFIGURATION ----

// You can set these as environment variables or hardcode them here.
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://oxknymbqlujijdseiowv.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94a255bWJxbHVqaWpkc2Vpb3d2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTY3OTU3OSwiZXhwIjoyMDY1MjU1NTc5fQ.Ouvq_29iFe7pnCcRiLVZuxyjz0RBmQXrokYMMsht3nU';

// The user ID (UUID) of the user whose metadata you want to update:
const USER_ID = '295f1202-b614-43c7-83ff-ceb2e1bdf94b'; // Replace with the actual user ID

// The metadata you want to set (this will MERGE with existing metadata)
const newMetadata = {
  role: 'admin'
};

// ---- END CONFIGURATION ----

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Update the user's metadata
  const { data, error } = await supabase.auth.admin.updateUserById(USER_ID, {
    user_metadata: newMetadata,
  });

  if (error) {
    console.error('Failed to update user metadata:', error);
    process.exit(1);
  }

  console.log('User metadata updated successfully:');
  console.dir(data, { depth: null });
}

main();