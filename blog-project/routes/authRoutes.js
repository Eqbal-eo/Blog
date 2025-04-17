const express = require('express');
const router = express.Router();
const db = require('../db/db');
const bcrypt = require('bcrypt');

// صفحة تسجيل الدخول (GET)
router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// عملية تسجيل الدخول (POST)
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    const query = 'SELECT * FROM users WHERE username = ?';
    db.query(query, [username], async (err, results) => {
        if (err) {
            console.error('Error querying database:', err);
            return res.render('login', { error: 'حدث خطأ في الاتصال بقاعدة البيانات' });
        }

        if (results.length === 0) {
            return res.render('login', { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        }

        const user = results[0];

        // ✅ مقارنة كلمة المرور المشفرة
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('login', { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        }

        // ✅ تسجيل الدخول بنجاح
        req.session.user = {
            id: user.id,
            username: user.username
        };

        res.redirect('/dashboard');
    });
});

// تسجيل الخروج (GET)
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('فشل في إنهاء الجلسة:', err);
            return res.redirect('/dashboard');
        }
        res.redirect('/login');
    });
});

// صفحة تسجيل الحساب (GET)
router.get('/register', (req, res) => {
    res.render('register', { error: null, success: null });
});

// تنفيذ عملية التسجيل (POST)
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.render('register', { error: 'يرجى إدخال جميع الحقول', success: null });
    }

    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err) {
            console.error(err);
            return res.render('register', { error: 'حدث خطأ في قاعدة البيانات', success: null });
        }

        if (results.length > 0) {
            return res.render('register', { error: 'اسم المستخدم موجود مسبقًا', success: null });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err) => {
            if (err) {
                console.error(err);
                return res.render('register', { error: 'حدث خطأ أثناء إنشاء الحساب', success: null });
            }

            res.render('register', { error: null, success: 'تم إنشاء الحساب بنجاح، يمكنك تسجيل الدخول الآن' });
        });
    });
});

// راوتر dashboard (اضفه في authRoutes.js أو ملف منفصل):
router.get('/dashboard', (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    const query = 'SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC';
    db.query(query, [req.session.user.id], (err, posts) => {
        if (err) {
            console.error(err);
            return res.send('حدث خطأ');
        }

        res.render('dashboard', {
            user: req.session.user,
            posts
        });
    });
});
module.exports = router;
