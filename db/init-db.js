const supabase = require('../db/db');

// إنشاء جدول للإشعارات إذا لم يكن موجودًا
async function createNotificationsTable() {
  try {    // التحقق مما إذا كان الجدول موجودًا بالفعل
    const { data, error } = await supabase.from('notifications').select('id').limit(1);
    
    // إذا لم يكن هناك خطأ، فهذا يعني أن الجدول موجود بالفعل
    if (!error) {
      console.log('✅ جدول الإشعارات موجود بالفعل');
      return;
    } else {
      console.log('⚠️ لا يمكن الوصول إلى جدول الإشعارات:', error.message);
      console.log('⚠️ تأكد من إنشاء جدول الإشعارات في قاعدة البيانات');
      console.log(`
        🔄 يرجى إنشاء جدول الإشعارات في لوحة تحكم Supabase باستخدام SQL التالي إذا لم يكن موجودًا:
        
        CREATE TABLE IF NOT EXISTS public.notifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          post_id INTEGER,
          message TEXT NOT NULL,
          type VARCHAR(50) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          is_read BOOLEAN DEFAULT FALSE,
          FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
          FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE SET NULL
        );
      `);
      return; // نتوقف هنا لأن الجدول يجب أن يُنشأ يدويًا
    }    // تم إزالة الكود الذي يحاول إنشاء الجدول باستخدام API لأن الجدول سيتم إنشاؤه يدويًا
  } catch (err) {
    console.error('❌ حدث خطأ أثناء إنشاء جدول الإشعارات:', err);
  }
}

module.exports = { createNotificationsTable };
