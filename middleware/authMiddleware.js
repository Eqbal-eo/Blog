const jwt = require('jsonwebtoken');
require('dotenv').config();

// استخدام المفتاح السري من متغيرات البيئة
const JWT_SECRET = process.env.JWT_SECRET;

// وسيط للتحقق من توكن المصادقة
const authenticateToken = (req, res, next) => {
    // استخراج التوكن من الكوكيز
    const token = req.cookies.auth_token;
    
    if (!token) {
        return res.redirect('/login');
    }

    // التحقق من صحة التوكن
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            // إذا كان التوكن غير صالح أو منتهي الصلاحية
            console.error('خطأ في التحقق من التوكن:', err);
            res.clearCookie('auth_token');
            return res.redirect('/login');
        }

        // تخزين بيانات المستخدم في الطلب للاستخدام لاحقاً
        req.user = user;
        next();
    });
};

module.exports = { authenticateToken };