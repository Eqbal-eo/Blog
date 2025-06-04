require('dotenv').config();
const supabase = require('./db/db');

async function checkSupabaseStatus() {
    console.log('🔍 فحص حالة خدمات Supabase...\n');
    
    const timestamp = new Date().toLocaleString('ar-SA', {
        timeZone: 'Asia/Riyadh',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    console.log('⏰ الوقت الحالي:', timestamp);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const tests = [
        {
            name: 'اتصال قاعدة البيانات الأساسي',
            test: async () => {
                const { data, error } = await supabase.from('users').select('count').limit(1);
                return { success: !error, error };
            }
        },
        {
            name: 'جلب المستخدمين',
            test: async () => {
                const { data, error } = await supabase.from('users').select('username').limit(1);
                return { success: !error && data, error };
            }
        },
        {
            name: 'جلب طلبات المدونات',
            test: async () => {
                const { data, error } = await supabase.from('blog_requests').select('id').limit(1);
                return { success: !error, error };
            }
        },
        {
            name: 'اختبار البحث بالشروط',
            test: async () => {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('role', 'admin')
                    .limit(1);
                return { success: !error, error };
            }
        }
    ];
    
    let allWorking = true;
    
    for (const test of tests) {
        try {
            const result = await test.test();
            const status = result.success ? '✅' : '❌';
            console.log(`${status} ${test.name}`);
            
            if (!result.success) {
                allWorking = false;
                console.log(`   خطأ: ${result.error?.message || 'غير محدد'}`);
                
                // تحقق من نوع الخطأ
                if (result.error?.message?.includes('edge')) {
                    console.log('   🔍 المشكلة متعلقة بـ Edge Functions');
                } else if (result.error?.message?.includes('function')) {
                    console.log('   🔍 المشكلة متعلقة بالوظائف المخصصة');
                }
            }
        } catch (error) {
            allWorking = false;
            console.log(`❌ ${test.name}`);
            console.log(`   خطأ عام: ${error.message}`);
        }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (allWorking) {
        console.log('🎉 جميع الخدمات تعمل بشكل طبيعي!');
        console.log('💡 يمكن إزالة التحذير من شريط التنقل');
    } else {
        console.log('⚠️ بعض الخدمات لا تزال تواجه مشاكل');
        console.log('💭 يُنصح بالإبقاء على التحذير في شريط التنقل');
    }
    
    console.log('\n📱 لمتابعة حالة Supabase الرسمية:');
    console.log('🔗 https://status.supabase.com');
    
    return allWorking;
}

// تشغيل الفحص
if (require.main === module) {
    checkSupabaseStatus().then((allWorking) => {
        process.exit(allWorking ? 0 : 1);
    }).catch((error) => {
        console.error('❌ فشل في تشغيل فحص الحالة:', error);
        process.exit(1);
    });
}

module.exports = { checkSupabaseStatus };
