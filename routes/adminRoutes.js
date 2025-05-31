const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

// جميع مسارات المشرف تحتاج إلى المصادقة وصلاحيات المشرف
router.use(authenticateToken, isAdmin);

// عرض قائمة المنشورات المعلقة
router.get('/pending-posts', adminController.getPendingPosts);

// الموافقة على منشور
router.post('/posts/:postId/approve', adminController.approvePost);

// رفض منشور
router.post('/posts/:postId/reject', adminController.rejectPost);

// معاينة منشور معلق
router.get('/posts/:postId/preview', adminController.previewPost);

// ======================== Blog Request Routes ========================

// عرض قائمة طلبات المدونات المعلقة
router.get('/pending-blog-requests', adminController.getPendingBlogRequests);

// الموافقة على طلب مدونة
router.post('/blog-requests/:requestId/approve', adminController.approveBlogRequest);

// رفض طلب مدونة
router.post('/blog-requests/:requestId/reject', adminController.rejectBlogRequest);

// معاينة طلب مدونة
router.get('/blog-requests/:requestId/preview', adminController.previewBlogRequest);

module.exports = router;
