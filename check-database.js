require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 فحص الاتصال بقاعدة البيانات...\n');

// التحقق من متغيرات البيئة
console.log('📋 متغيرات البيئة:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ موجود' : '❌ غير موجود');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ موجود' : '❌ غير موجود');
console.log();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.log('❌ متغيرات البيئة غير مُعرفة! تأكد من وجود ملف .env');
    process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

(async () => {
    try {
        console.log('🔍 فحص الجداول المطلوبة...\n');
        
        const tables = [
            { name: 'users', icon: '👤', desc: 'المستخدمين' },
            { name: 'blog_requests', icon: '📝', desc: 'طلبات المدونات' },
            { name: 'invite_codes', icon: '🎫', desc: 'رموز الدعوة' },
            { name: 'posts', icon: '📰', desc: 'المقالات' },
            { name: 'settings', icon: '⚙️', desc: 'الإعدادات' },
            { name: 'notifications', icon: '🔔', desc: 'الإشعارات' }
        ];
        
        const results = [];
        
        for (const table of tables) {
            try {
                const { data, error } = await supabase
                    .from(table.name)
                    .select('*')
                    .limit(1);
                
                if (error) {
                    console.log(`${table.icon} جدول ${table.desc} (${table.name}): ❌ غير موجود`);
                    console.log(`   السبب: ${error.message}\n`);
                    results.push({ table: table.name, exists: false, error: error.message });
                } else {
                    console.log(`${table.icon} جدول ${table.desc} (${table.name}): ✅ موجود`);
                    results.push({ table: table.name, exists: true });
                }
            } catch (err) {
                console.log(`${table.icon} جدول ${table.desc} (${table.name}): ❌ خطأ - ${err.message}\n`);
                results.push({ table: table.name, exists: false, error: err.message });
            }
        }
        
        console.log('\n📊 ملخص النتائج:');
        const existing = results.filter(r => r.exists);
        const missing = results.filter(r => !r.exists);
        
        console.log(`✅ جداول موجودة: ${existing.length}`);
        console.log(`❌ جداول مفقودة: ${missing.length}`);
        
        if (missing.length > 0) {
            console.log('\n🚨 الجداول المفقودة التي تحتاج إنشاء:');
            missing.forEach(m => console.log(`   - ${m.table}`));
            console.log('\n💡 تحتاج لتنفيذ ملف database_schema.sql في لوحة تحكم Supabase');
        }
        
    } catch (err) {
        console.log('❌ خطأ عام:', err.message);
    }
})();
