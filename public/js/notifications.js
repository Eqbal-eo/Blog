// JavaScript file for handling notifications in the frontend
document.addEventListener('DOMContentLoaded', function() {
    // Call API to get unread notifications count
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

    // Update notification counter
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

    // Query notification count on page load
    getUnreadNotificationsCount().then(updateNotificationCounter);
});
