const supabase = require('../db/db');
const { 
    getUserNotifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    getUnreadNotificationsCount 
} = require('../services/notificationService');

// عرض صفحة الإشعارات
exports.getNotifications = async (req, res) => {
    try {        const userId = req.user.id;
        const page = parseInt(req.query.page || 1);
        const limit = 10;
        const offset = (page - 1) * limit;
        const showReadNotifications = req.query.showReadNotifications === 'true';
        
        // جلب بيانات المستخدم بما فيها الدور والاسم العربي
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('display_name_ar, role')
            .eq('id', userId)
            .single();
            
        if (userError) {
            console.error('خطأ في جلب بيانات المستخدم:', userError);
            throw userError;
        }        // جلب الإشعارات غير المقروءة فقط (أو مع الإشعارات المقروءة بناءً على المعاملة)
        const { success, data: notifications, count, error } = await getUserNotifications(userId, { 
            limit, 
            offset,
            showReadNotifications // استخدام القيمة من الاستعلام
        });

        if (!success) {
            throw error;
        }

        // جلب عدد الإشعارات غير المقروءة
        const { count: unreadCount } = await getUnreadNotificationsCount(userId);

        // للواجهة API
        if (req.xhr || req.headers.accept.indexOf('application/json') !== -1) {
            return res.json({
                notifications,
                hasMore: count > offset + notifications.length,
                totalCount: count,
                unreadCount
            });
        }

        // للواجهة العادية
        res.render('notifications', {
            user: {
                ...req.user,
                display_name_ar: userData.display_name_ar,
                role: userData.role
            },
            notifications,
            currentPage: page,
            hasMoreNotifications: count > offset + notifications.length,
            unreadCount
        });
    } catch (error) {
        console.error('خطأ في جلب الإشعارات:', error);
        
        if (req.xhr || req.headers.accept.indexOf('application/json') !== -1) {
            return res.status(500).json({ error: 'حدث خطأ أثناء جلب الإشعارات' });
        }
        
        res.status(500).render('error', { 
            message: 'حدث خطأ أثناء محاولة جلب الإشعارات',
            error: { status: 500 }
        });
    }
};

// تحديد إشعار كمقروء
exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { notificationId } = req.params;
        
        const { success, error } = await markNotificationAsRead(notificationId, userId);
        
        if (!success) {
            throw error;
        }
        
        // جلب عدد الإشعارات غير المقروءة المتبقية
        const { count: unreadCount } = await getUnreadNotificationsCount(userId);
        
        // إذا نجح الأمر، نقوم بجلب قائمة محدثة من الإشعارات غير المقروءة
        const { data: remainingNotifications } = await getUserNotifications(userId, { 
            limit: 10,
            offset: 0,
            showReadNotifications: false
        });
        
        res.json({ 
            success: true, 
            unreadCount,
            remainingNotifications
        });
    } catch (error) {
        console.error('خطأ في تحديد الإشعار كمقروء:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء تحديد الإشعار كمقروء' });
    }
};

// تحديد جميع الإشعارات كمقروءة
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const { success, error } = await markAllNotificationsAsRead(userId);
        
        if (!success) {
            throw error;
        }
        
        // جلب عدد الإشعارات غير المقروءة (سيكون صفر بعد التحديث)
        const { count: unreadCount } = await getUnreadNotificationsCount(userId);
        
        // إعادة قائمة إشعارات فارغة بما أن كلها أصبحت مقروءة
        res.json({ 
            success: true,
            unreadCount: 0,
            remainingNotifications: [] 
        });
    } catch (error) {
        console.error('خطأ في تحديد جميع الإشعارات كمقروءة:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء تحديد جميع الإشعارات كمقروءة' });
    }
};

// الحصول على عدد الإشعارات غير المقروءة
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const { success, count, error } = await getUnreadNotificationsCount(userId);
        
        if (!success) {
            throw error;
        }
        
        res.json({ success: true, count });
    } catch (error) {
        console.error('خطأ في حساب الإشعارات غير المقروءة:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء حساب الإشعارات غير المقروءة' });
    }
};
