// ملف JavaScript للتعامل مع الإشعارات في الواجهة
document.addEventListener('DOMContentLoaded', function() {
    // استدعاء API للحصول على عدد الإشعارات غير المقروءة
    async function getUnreadNotificationsCount() {
        try {
            const response = await fetch('/notifications/unread/count');
            if (!response.ok) {
                throw new Error('حدث خطأ في جلب عدد الإشعارات');
            }
            const data = await response.json();
            return data.count;
        } catch (error) {
            console.error('خطأ:', error);
            return 0;
        }
    }

    // تحديث عداد الإشعارات
    function updateNotificationCounter(count) {
        const counter = document.getElementById('notificationCounter');
        if (!counter) return;
        
        if (count > 0) {
            counter.textContent = count > 99 ? '99+' : count;
            counter.style.display = 'inline-block';
        } else {
            counter.style.display = 'none';
        }
    }

    // استعلام عن عدد الإشعارات عند تحميل الصفحة
    getUnreadNotificationsCount().then(updateNotificationCounter);
});
