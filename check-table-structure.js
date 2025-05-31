require('dotenv').config();
const supabase = require('./db/db');

async function checkTableStructure() {
    try {
        console.log('🔍 التحقق من هيكل جدول invite_codes...');
        
        // محاولة إدراج اختبار لرؤية الأخطاء
        const { error } = await supabase
            .from('invite_codes')
            .insert([{
                code: 'TEST123',
                email: 'test@example.com',
                blog_request_id: 1,
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                is_used: false
            }]);
            
        if (error) {
            console.error('❌ خطأ في الإدراج الاختباري:', error);
            console.log('📋 تفاصيل الخطأ:', error.message);
            if (error.details) console.log('📋 تفاصيل إضافية:', error.details);
        } else {
            console.log('✅ تم الإدراج بنجاح');
            
            // حذف السجل الاختباري
            await supabase
                .from('invite_codes')
                .delete()
                .eq('code', 'TEST123');
            console.log('🗑️ تم حذف السجل الاختباري');
        }
        
    } catch (error) {
        console.error('❌ خطأ عام:', error);
    }
}

checkTableStructure().then(() => {
    console.log('🏁 انتهاء الفحص');
    process.exit(0);
});
