const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/authMiddleware');

// All notification routes require authentication
router.use(authenticateToken);

// Display notifications page
router.get('/', notificationController.getNotifications);

// Mark a single notification as read
router.post('/:notificationId/read', notificationController.markAsRead);

// Mark all notifications as read
router.post('/read/all', notificationController.markAllAsRead);

// Get the count of unread notifications
router.get('/unread/count', notificationController.getUnreadCount);

module.exports = router;
