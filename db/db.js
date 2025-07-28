// import supabase client
const { createClient } = require('@supabase/supabase-js'); //

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY); 

// Export the supabase client for use in other modules
module.exports = supabase;