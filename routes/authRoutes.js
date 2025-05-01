const express = require('express');
const router = express.Router();
const supabase = require('../db/db');
const bcrypt = require('bcrypt');


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
        // Check if the password matches
        const isMatch = await bcrypt.compare(password, users.password);
        if (!isMatch) {
            return res.render('login', { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        }

        // Set session data
        req.session.user = {
            id: users.id,
            username: users.username
        };
        req.session.save(err => {
            if (err) {
                console.error('فشل في حفظ الجلسة:', err);
                return res.render('login', { error: 'فشل في إنشاء الجلسة' });
            }
            res.redirect('/dashboard');
        });

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
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.render('register', { error: 'يرجى إدخال جميع الحقول', success: null });
    }

    try {
        // Check if username exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('username, email')
            .or(`username.eq.${username},email.eq.${email}`)
            .single();

        if (existingUser) {
            if (existingUser.username === username) {
                return res.render('register', { error: 'اسم المستخدم موجود مسبقًا', success: null });
            }
            if (existingUser.email === email) {
                return res.render('register', { error: 'البريد الإلكتروني مستخدم مسبقًا', success: null });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const { error } = await supabase
            .from('users')
            .insert([{
                username,
                email,
                password: hashedPassword
            }]);

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

router.get('/settings', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    try {
        const { data: userData, error } = await supabase
            .from('users')
            .select('username, email')
            .eq('id', req.session.user.id)
            .single();

        if (error) throw error;

        const site = {
            title: 'مدونتي',
            description: 'أهلاً بك في المدونة',
            theme: 'light'
        };

        res.render('settings', {
            user: { ...req.session.user, ...userData },
            site
        });
    } catch (err) {
        console.error('Error fetching user data:', err);
        res.redirect('/dashboard');
    }
});

module.exports = router;
