require('dotenv').config();
const supabase = require('./db/db');

// محاكاة دالة generateInviteCode
function generateInviteCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

async function testApprovalDirectly() {
    const requestId = 11; // استخدم رقم الطلب المتاح
    
    try {
        console.log('🔍 بدء عملية الموافقة على الطلب رقم:', requestId);        // التحقق من وجود الطلب
        const { data: request, error: fetchError } = await supabase
            .from('blog_requests')
            .select('id, email, full_name, specialty')
            .eq('id', requestId)
            .single();
            
        if (fetchError || !request) {
            console.error('الطلب غير موجود:', fetchError);
            return;
        }
        
        console.log('✅ تم العثور على الطلب:', request);
        
        // إنشاء رمز دعوة فريد
        const inviteCode = generateInviteCode();
        console.log('🎫 تم إنشاء رمز الدعوة:', inviteCode);        // إدراج رمز الدعوة في قاعدة البيانات
        console.log('💾 إدراج رمز الدعوة في قاعدة البيانات...');        const { error: inviteError } = await supabase
            .from('invite_codes')
            .insert([{
                code: inviteCode,
                email: request.email,
                full_name: request.full_name,
                specialty: request.specialty,
                blog_request_id: requestId,
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 يوم
                is_used: false
            }]);
            
        if (inviteError) {
            console.error('❌ خطأ في إدراج رمز الدعوة:', inviteError);
            throw inviteError;
        }
        
        console.log('✅ تم إدراج رمز الدعوة بنجاح');
        
        // تحديث حالة الطلب إلى "مقبول"
        console.log('🔄 تحديث حالة الطلب...');
        const { error } = await supabase
            .from('blog_requests')
            .update({ 
                status: 'approved', 
                reviewed_at: new Date() 
            })
            .eq('id', requestId);

        if (error) {
            console.error('❌ خطأ في تحديث حالة الطلب:', error);
            throw error;
        }
        
        console.log('✅ تم تحديث حالة الطلب بنجاح');
        console.log(`✅ تم إنشاء رمز دعوة للمستخدم ${request.full_name}: ${inviteCode}`);
        
    } catch (error) {
        console.error('❌ خطأ عام في عملية الموافقة:', error);
        console.error('تفاصيل الخطأ:', error.message);
        if (error.details) console.error('تفاصيل إضافية:', error.details);
        if (error.hint) console.error('نصيحة:', error.hint);
    }
}

testApprovalDirectly().then(() => {
    console.log('🏁 انتهاء الاختبار');
    process.exit(0);
});
