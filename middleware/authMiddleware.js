const jwt = require('jsonwebtoken');
require('dotenv').config();

// استخدام المفتاح السري من متغيرات البيئة
const getJWTSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error('JWT_SECRET is not defined in environment variables');
    }
    return secret;
};

// وسيط للتحقق من توكن المصادقة
const authenticateToken = (req, res, next) => {    console.log('⚡ Executing Authentication Middleware');
    
    // Extract token from cookies
    const token = req.cookies.auth_token;
    
    if (!token) {
        console.log('❌ No token found in cookies');
        return res.redirect('/login');
    }

    console.log('✅ JWT token found');    // Verify token
    const jwtSecret = getJWTSecret();
    if (!jwtSecret) {
        console.error('❌ Cannot verify token: JWT_SECRET is not defined');
        res.clearCookie('auth_token');
        return res.redirect('/login');
    }
    
    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) {
            // If token is invalid or expired
            console.error('❌ Error verifying token:', err);
            res.clearCookie('auth_token');
            return res.redirect('/login');
        }

        console.log('✅ Token valid - User data:', user);

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