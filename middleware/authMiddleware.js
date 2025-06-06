const jwt = require('jsonwebtoken');
require('dotenv').config();
const { getClearCookieOptions } = require('../utils/cookieUtils');

// استخدام المفتاح السري من متغيرات البيئة
const JWT_SECRET = process.env.JWT_SECRET;

// وسيط للتحقق من توكن المصادقة
const authenticateToken = (req, res, next) => {    
    // Extract token from cookies
    const token = req.cookies.auth_token;
    
    if (!token) {
        return res.redirect('/login');
    }    // Verify token
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            // If token is invalid or expired - clear cookie with proper options
            res.clearCookie('auth_token', getClearCookieOptions());
            return res.redirect('/login');
        }

        // تخزين بيانات المستخدم في الطلب للاستخدام لاحقاً
        req.user = user;
        next();
    });
};

// وسيط للتحقق من صلاحيات المشرف
const isAdmin = (req, res, next) => {    console.log('⚡ Verifying Admin Permissions:', req.user);
    
    if (req.user && req.user.role === 'admin') {
        console.log('✅ User has admin permissions');
        next();
    } else {
        console.log('❌ User does not have admin permissions');
        res.status(403).render('error', { 
            message: 'غير مصرح لك بالوصول لهذه الصفحة',
            error: { status: 403 }
        });
    }
};

module.exports = {
    authenticateToken,
    isAdmin
};