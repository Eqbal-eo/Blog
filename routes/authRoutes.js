const express = require('express');
const router = express.Router();
const supabase = require('../db/db');
const bcrypt = require('bcrypt');

// عرض صفحة التسجيل
router.get('/register', (req, res) => {
    res.render('register', { error: null, success: null });
});

// معالجة التسجيل
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // التحقق من وجود المستخدم
        const { data: existingUser } = await supabase
            .from('users')
            .select('username, email')
            .or(`username.eq.${username},email.eq.${email}`)
            .single();

        if (existingUser) {
            return res.render('register', {
                error: 'اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل',
                success: null
            });
        }

        // تشفير كلمة المرور
        const hashedPassword = await bcrypt.hash(password, 10);

        // إنشاء المستخدم
        const { error: createError } = await supabase
            .from('users')
            .insert([{
                username,
                email,
                password: hashedPassword
            }]);

        if (createError) throw createError;

        res.render('register', {
            error: null,
            success: 'تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول'
        });

    } catch (err) {
        console.error('خطأ في التسجيل:', err);
        res.render('register', {
            error: 'حدث خطأ أثناء إنشاء الحساب',
            success: null
        });
    }
});

// عرض صفحة تسجيل الدخول
router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// معالجة تسجيل الدخول
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

        // تعيين الجلسة
        req.session.user = {
            id: users.id,
            username: users.username
        };

        // تأكيد حفظ الجلسة قبل التوجيه
        req.session.save(err => {
            if (err) {
                console.error('فشل في حفظ الجلسة:', err);
                return res.render('login', { error: 'فشل في إنشاء الجلسة' });
            }
            res.redirect('/dashboard');
        });
            
    } catch (err) {
        console.error('حدث خطأ أثناء تسجيل الدخول:', err);
        res.render('login', { error: 'حدث خطأ في الاتصال بقاعدة البيانات' });
    }
});

 

// عرض لوحة التحكم
router.get('/dashboard', async (req, res) => {
    console.log('📥 دخول لوحة التحكم - الجلسة:', req.session);

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

// تسجيل الخروج
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('فشل في إنهاء الجلسة:', err);
            return res.redirect('/dashboard');
        }
        res.redirect('/login');
    });
});

module.exports = router;
