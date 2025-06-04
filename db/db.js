const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Explicitly load the .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Check if environment variables are loaded
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase environment variables are not loaded correctly:');
    console.error('SUPABASE_URL:', supabaseUrl ? 'defined' : 'undefined');
    console.error('SUPABASE_ANON_KEY:', supabaseKey ? 'defined' : 'undefined');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;