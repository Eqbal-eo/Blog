const jwt = require('jsonwebtoken');
require('dotenv').config();

// use JWT_SECRET from environment variables
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify authentication token
const authenticateToken = (req, res, next) => {
    console.log('⚡ Executing Authentication Middleware');

    // Extract token from cookies
    const token = req.cookies.auth_token;
    
    if (!token) {
        console.log('❌ No token found in cookies');
        return res.redirect('/login');
    }

    console.log('✅ JWT token found');

    // Verify token
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            // If token is invalid or expired
            console.error('❌ Error verifying token:', err);
            res.clearCookie('auth_token');
            return res.redirect('/login');
        }

        console.log('✅ Token valid - User data:', user);

        // Store user data in request for later use
        req.user = user;
        next();
    });
};

// Middleware to verify admin permissions
const isAdmin = (req, res, next) => {
    console.log('⚡ Verifying Admin Permissions:', req.user);

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