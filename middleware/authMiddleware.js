const jwt = require('jsonwebtoken');
require('dotenv').config();

// استخدام المفتاح السري من متغيرات البيئة
const JWT_SECRET = process.env.JWT_SECRET;

// وسيط للتحقق من توكن المصادقة
const authenticateToken = (req, res, next) => {
    console.log('⚡ تنفيذ وسيط المصادقة');
    
    // استخراج التوكن من الكوكيز
    const token = req.cookies.auth_token;
    
    if (!token) {
        console.log('❌ لا يوجد توكن في الكوكيز');
        return res.redirect('/login');
    }

    console.log('✅ تم العثور على توكن JWT');

    // التحقق من صحة التوكن
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            // إذا كان التوكن غير صالح أو منتهي الصلاحية
            console.error('❌ خطأ في التحقق من التوكن:', err);
            res.clearCookie('auth_token');
            return res.redirect('/login');
        }

        console.log('✅ التوكن صالح - بيانات المستخدم:', user);

        // تخزين بيانات المستخدم في الطلب للاستخدام لاحقاً
        req.user = user;
        next();
    });
};

module.exports = { authenticateToken };