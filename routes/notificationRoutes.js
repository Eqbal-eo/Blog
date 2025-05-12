const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/authMiddleware');

// جميع مسارات الإشعارات تتطلب مصادقة
router.use(authenticateToken);

// عرض صفحة الإشعارات
router.get('/', notificationController.getNotifications);

// تحديد إشعار واحد كمقروء
router.post('/:notificationId/read', notificationController.markAsRead);

// تحديد جميع الإشعارات كمقروءة
router.post('/read/all', notificationController.markAllAsRead);

// الحصول على عدد الإشعارات غير المقروءة
router.get('/unread/count', notificationController.getUnreadCount);

module.exports = router;
