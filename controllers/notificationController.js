const supabase = require('../db/db');
const { 
    getUserNotifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    getUnreadNotificationsCount 
} = require('../services/notificationService');

// Display notifications page
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page || 1);
        const limit = 10;
        const offset = (page - 1) * limit;
        
        // Fetch user data including role and Arabic display name
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('display_name_ar, role')
            .eq('id', userId)
            .single();
            
        if (userError) {
            console.error('Error fetching user data:', userError);
            throw userError;
        }

        // Fetch notifications
        const { success, data: notifications, count, error } = await getUserNotifications(userId, { 
            limit, 
            offset 
        });

        if (!success) {
            throw error;
        }

        // Get unread notifications count
        const { count: unreadCount } = await getUnreadNotificationsCount(userId);

        // For API interface
        if (req.xhr || req.headers.accept.indexOf('application/json') !== -1) {
            return res.json({
                notifications,
                hasMore: count > offset + notifications.length,
                totalCount: count,
                unreadCount
            });
        }

        // For regular interface
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
        console.error('Error fetching notifications:', error);
        
        if (req.xhr || req.headers.accept.indexOf('application/json') !== -1) {
            return res.status(500).json({ error: 'An error occurred while fetching notifications' });
        }
        
        res.status(500).render('error', { 
            message: 'An error occurred while trying to fetch notifications',
            error: { status: 500 }
        });
    }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { notificationId } = req.params;
        
        const { success, error } = await markNotificationAsRead(notificationId, userId);
        
        if (!success) {
            throw error;
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'An error occurred while marking notification as read' });
    }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const { success, error } = await markAllNotificationsAsRead(userId);
        
        if (!success) {
            throw error;
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: 'An error occurred while marking all notifications as read' });
    }
};

// Get unread notifications count
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const { success, count, error } = await getUnreadNotificationsCount(userId);
        
        if (!success) {
            throw error;
        }
        
        res.json({ success: true, count });
    } catch (error) {
        console.error('Error counting unread notifications:', error);
        res.status(500).json({ error: 'An error occurred while counting unread notifications' });
    }
};
