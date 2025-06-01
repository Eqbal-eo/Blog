require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Checking database connection...\n');

// Verify environment variables
console.log('📋 Environment Variables:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Present' : '❌ Missing');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Present' : '❌ Missing');
console.log();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.log('❌ Environment variables not defined! Make sure .env file exists');
    process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

(async () => {
    try {
        console.log('🔍 Checking required tables...\n');
        
        const tables = [
            { name: 'users', icon: '👤', desc: 'Users' },
            { name: 'blog_requests', icon: '📝', desc: 'Blog Requests' },
            { name: 'invite_codes', icon: '🎫', desc: 'Invite Codes' },
            { name: 'posts', icon: '📰', desc: 'Posts' },
            { name: 'settings', icon: '⚙️', desc: 'Settings' },
            { name: 'notifications', icon: '🔔', desc: 'Notifications' }
        ];
        
        const results = [];
        
        for (const table of tables) {
            try {
                const { data, error } = await supabase
                    .from(table.name)
                    .select('*')
                    .limit(1);
                
                if (error) {
                    console.log(`${table.icon} Table ${table.desc} (${table.name}): ❌ Not found`);
                    console.log(`   Reason: ${error.message}\n`);
                    results.push({ table: table.name, exists: false, error: error.message });
                } else {
                    console.log(`${table.icon} Table ${table.desc} (${table.name}): ✅ Found`);
                    results.push({ table: table.name, exists: true });
                }
            } catch (err) {
                console.log(`${table.icon} Table ${table.desc} (${table.name}): ❌ Error - ${err.message}\n`);
                results.push({ table: table.name, exists: false, error: err.message });
            }
        }
        
        console.log('\n📊 Results Summary:');
        const existing = results.filter(r => r.exists);
        const missing = results.filter(r => !r.exists);
        
        console.log(`✅ Existing tables: ${existing.length}`);
        console.log(`❌ Missing tables: ${missing.length}`);
        
        if (missing.length > 0) {
            console.log('\n🚨 Missing tables that need to be created:');
            missing.forEach(m => console.log(`   - ${m.table}`));
            console.log('\n💡 You need to execute database_schema.sql in Supabase dashboard');
        }
        
    } catch (err) {
        console.log('❌ General error:', err.message);
    }
})();
