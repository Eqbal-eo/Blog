const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../db/db'); // تفاعل مع قاعدة البيانات
const rateLimit = require('express-rate-limit');

// إنشاء محدد عدد محاولات تسجيل الدخول
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 5, // 5 محاولات كحد أقصى
    message: { error: 'تم تجاوز الحد المسموح به من محاولات تسجيل الدخول، يرجى المحاولة بعد 15 دقيقة' },
    standardHeaders: true,
    legacyHeaders: false,
});

// عملية تسجيل الدخول (POST) مع تطبيق محدد المحاولات
router.post('/login', loginLimiter, (req, res) => {
    const { username, password } = req.body;

    // التحقق من وجود المستخدم في قاعدة البيانات
    const query = 'SELECT * FROM users WHERE username = ?';
    db.query(query, [username], (err, results) => {
        if (err) {
            console.error('Error querying database:', err);
            return res.status(500).send('حدث خطأ في الاتصال بقاعدة البيانات');
        }

        // إذا لم يكن المستخدم موجودًا
        if (results.length === 0) {
            return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        }

        // إذا كان المستخدم موجودًا، تحقق من كلمة المرور
        const user = results[0];
        bcrypt.compare(password, user.password, (err, match) => {
            if (err) {
                console.error('Error comparing passwords:', err);
                return res.status(500).send('حدث خطأ في عملية التحقق من كلمة المرور');
            }

            if (match) {
                // كلمة المرور صحيحة، إنشاء التوكن JWT
                const token = jwt.sign({ userId: user.id, username: user.username }, 'your_jwt_secret', { expiresIn: '1h' });
                
                // حفظ معلومات المستخدم في الجلسة
                req.session.user = {
                    id: user.id,
                    username: user.username
                };
                
                // توجيه المستخدم إلى صفحة الترحيب
                res.render('welcome', { username: user.username });
            } else {
                // كلمة المرور خاطئة
                return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
            }
        });
    });
});
