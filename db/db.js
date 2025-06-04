const { createClient } = require('@supabase/supabase-js');

// إنشاء العميل مع إعدادات محسنة لتجنب مشاكل Edge Functions
const supabase = createClient(
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        },
        realtime: {
            params: {
                eventsPerSecond: 10
            }
        }
    }
);

module.exports = supabase;