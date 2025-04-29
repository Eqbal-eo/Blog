const express = require('express');
const router = express.Router();
const supabase = require('../db/db');
const bcrypt = require('bcrypt');

router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        if (error || !users) {
            return res.render('login', { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        }

        const isMatch = await bcrypt.compare(password, users.password);
        if (!isMatch) {
            return res.render('login', { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        }

        req.session.user = {
            id: users.id,
            username: users.username
        };

        res.redirect('/dashboard');
    } catch (err) {
        console.error('Error during login:', err);
        res.render('login', { error: 'حدث خطأ في الاتصال بقاعدة البيانات' });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('فشل في إنهاء الجلسة:', err);
            return res.redirect('/dashboard');
        }
        res.redirect('/login');
    });
});

router.get('/register', (req, res) => {
    res.render('register', { error: null, success: null });
});

router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.render('register', { error: 'يرجى إدخال جميع الحقول', success: null });
    }

    try {
        // Check if username exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('username')
            .eq('username', username)
            .single();

        if (existingUser) {
            return res.render('register', { error: 'اسم المستخدم موجود مسبقًا', success: null });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const { error } = await supabase
            .from('users')
            .insert([{ username, password: hashedPassword }]);

        if (error) {
            console.error('Error during registration:', error);
            return res.render('register', { error: 'حدث خطأ أثناء إنشاء الحساب', success: null });
        }

        res.render('register', { error: null, success: 'تم إنشاء الحساب بنجاح، يمكنك تسجيل الدخول الآن' });
    } catch (err) {
        console.error('Error:', err);
        res.render('register', { error: 'حدث خطأ في قاعدة البيانات', success: null });
    }
});

router.get('/dashboard', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    try {
        const { data: posts, error } = await supabase
            .from('posts')
            .select('*')
            .eq('user_id', req.session.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.render('dashboard', {
            user: req.session.user,
            posts
        });
    } catch (err) {
        console.error(err);
        res.send('حدث خطأ');
    }
});

router.get('/settings', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const site = {
        title: 'مدونتي',
        description: 'أهلاً بك في المدونة'
    };

    res.render('settings', {
        user: req.session.user,
        site
    });
});

module.exports = router;
