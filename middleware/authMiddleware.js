const jwt = require('jsonwebtoken');
require('dotenv').config();

// use JWT_SECRET from environment variables
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error('JWT_SECRET is not set: authentication will reject every request');
}

// Middleware to verify authentication token
const authenticateToken = (req, res, next) => {
    // Extract token from cookies
    const token = req.cookies.auth_token;

    if (!token || !JWT_SECRET) {
        return res.redirect('/login');
    }

    // Verify token (pin the algorithm so a forged "alg" header is rejected)
    jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }, (err, user) => {
        if (err) {
            // If token is invalid or expired
            res.clearCookie('auth_token');
            return res.redirect('/login');
        }

        // Store user data in request for later use
        req.user = user;
        next();
    });
};

// Middleware to verify admin permissions
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
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