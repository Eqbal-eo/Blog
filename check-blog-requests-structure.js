require('dotenv').config();
const supabase = require('./db/db');

async function checkBlogRequestsStructure() {
    try {
        console.log('🔍 التحقق من هيكل جدول blog_requests...');
        
        // جلب أول سجل لمعرفة الأعمدة المتاحة
        const { data: sample, error } = await supabase
            .from('blog_requests')
            .select('*')
            .limit(1);
            
        if (error) {
            console.error('❌ خطأ في جلب البيانات:', error);
            return;
        }
        
        if (sample && sample.length > 0) {
            console.log('📋 الأعمدة المتاحة في جدول blog_requests:');
            Object.keys(sample[0]).forEach(column => {
                console.log(`  - ${column}: ${typeof sample[0][column]} (${sample[0][column]})`);
            });
        } else {
            console.log('⚠️ لا توجد بيانات في الجدول');
        }
        
    } catch (error) {
        console.error('❌ خطأ عام:', error);
    }
}

checkBlogRequestsStructure().then(() => {
    console.log('🏁 انتهاء الفحص');
    process.exit(0);
});
