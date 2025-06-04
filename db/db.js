const { createClient } = require('@supabase/supabase-js');

// إنشاء العميل مع إعدادات محسنة لتجنب مشاكل Edge Functions
const supabase = createClient(
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        },
        realtime: {
            params: {
                eventsPerSecond: 10
            }
        },
        global: {
            headers: {
                'x-client-info': 'supabase-js-blog@2.49.8'
            }
        }
    }
);

module.exports = supabase;