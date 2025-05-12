const supabase = require('../db/db');

// إنشاء إشعار جديد
async function createNotification(userId, postId, message, type) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([
        { user_id: userId, post_id: postId, message, type }
      ]);

    if (error) {
      console.error('❌ خطأ في إنشاء إشعار:', error);
      throw error;
    }

    return { success: true, data };
  } catch (err) {
    console.error('❌ حدث خطأ أثناء إنشاء إشعار:', err);
    return { success: false, error: err };
  }
}

// الحصول على إشعارات المستخدم
async function getUserNotifications(userId, options = { limit: 10, offset: 0 }) {
  try {
    const { data, error, count } = await supabase
      .from('notifications')
      .select('*, posts(*)', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(options.offset, options.offset + options.limit - 1);

    if (error) {
      console.error('❌ خطأ في جلب الإشعارات:', error);
      throw error;
    }

    return { success: true, data, count };
  } catch (err) {
    console.error('❌ حدث خطأ أثناء جلب الإشعارات:', err);
    return { success: false, error: err };
  }
}

// تحديث حالة الإشعار إلى مقروء
async function markNotificationAsRead(notificationId, userId) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ خطأ في تحديث حالة الإشعار:', error);
      throw error;
    }

    return { success: true };
  } catch (err) {
    console.error('❌ حدث خطأ أثناء تحديث حالة الإشعار:', err);
    return { success: false, error: err };
  }
}

// تحديث جميع إشعارات المستخدم إلى مقروءة
async function markAllNotificationsAsRead(userId) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('❌ خطأ في تحديث حالة الإشعارات:', error);
      throw error;
    }

    return { success: true };
  } catch (err) {
    console.error('❌ حدث خطأ أثناء تحديث حالة الإشعارات:', err);
    return { success: false, error: err };
  }
}

// عدد الإشعارات غير المقروءة
async function getUnreadNotificationsCount(userId) {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('❌ خطأ في عد الإشعارات غير المقروءة:', error);
      throw error;
    }

    return { success: true, count };
  } catch (err) {
    console.error('❌ حدث خطأ أثناء عد الإشعارات غير المقروءة:', err);
    return { success: false, error: err };
  }
}

module.exports = {
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationsCount
};
