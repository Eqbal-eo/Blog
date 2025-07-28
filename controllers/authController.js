const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../db/db'); // Database interaction
const rateLimit = require('express-rate-limit');

// Create login attempt rate limiter
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Maximum 5 attempts
    message: { error: 'تم تجاوز الحد المسموح به من محاولات تسجيل الدخول، يرجى المحاولة بعد 15 دقيقة' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Login process (POST) with rate limiter applied
router.post('/login', loginLimiter, (req, res) => {
    const { username, password } = req.body;

    // Check if user exists in database
    const query = 'SELECT * FROM users WHERE username = ?';
    db.query(query, [username], (err, results) => {
        if (err) {
            console.error('Error querying database:', err);
            return res.status(500).send('حدث خطأ في الاتصال بقاعدة البيانات');
        }

        // If user doesn't exist
        if (results.length === 0) {
            return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        }

        // If user exists, verify password
        const user = results[0];
        bcrypt.compare(password, user.password, (err, match) => {
            if (err) {
                console.error('Error comparing passwords:', err);
                return res.status(500).send('حدث خطأ في عملية التحقق من كلمة المرور');
            }

            if (match) {
                // Password is correct, create JWT token
                const token = jwt.sign({ userId: user.id, username: user.username }, 'your_jwt_secret', { expiresIn: '1h' });
                
                // Save user information in session
                req.session.user = {
                    id: user.id,
                    username: user.username
                };
                
                // Redirect user to welcome page
                res.render('welcome', { username: user.username });
            } else {
                // Password is incorrect
                return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
            }
        });
    });
});
