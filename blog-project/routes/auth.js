const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/login', authController.showLogin); 
router.post('/login', authController.login); // تم التعديل هنا ليرتبط بالـ authController المعدل
router.get('/logout', authController.logout);

module.exports = router;
// هذا هو ملف مسارات المصادقة، حيث يتم تعريف المسارات الخاصة بتسجيل الدخول