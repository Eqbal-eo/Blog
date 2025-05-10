const express = require('express');
const router = express.Router();
const supabase = require('../db/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { authenticateToken } = require('../middleware/authMiddleware');

// استخدام المفتاح السري من متغيرات البيئة
const JWT_SECRET = process.env.JWT_SECRET;

// عرض صفحة التسجيل
router.get('/register', (req, res) => {
    res.render('register', { error: null, success: null });
});

// معالجة التسجيل
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // التحقق من وجود المستخدم باستخدام اسم المستخدم
        const { data: existingUser, error: userError } = await supabase
            .from('users')
            .select('username')
            .eq('username', username);

        if (userError) {
            console.error('خطأ في البحث عن المستخدم:', userError);
            return res.render('register', {
                error: 'حدث خطأ أثناء التحقق من البيانات',
                success: null
            });
        }

        // التحقق من وجود البريد الإلكتروني في جدول الإعدادات
        const { data: existingEmail, error: emailError } = await supabase
            .from('settings')
            .select('email')
            .eq('email', email);

        if (emailError) {
            console.error('خطأ في البحث عن البريد الإلكتروني:', emailError);
            return res.render('register', {
                error: 'حدث خطأ أثناء التحقق من البيانات',
                success: null
            });
        }

        if ((existingUser && existingUser.length > 0) || (existingEmail && existingEmail.length > 0)) {
            return res.render('register', {
                error: 'اسم المستخدم أو البريد الإلكتروني مستخدم بالفعل',
                success: null
            });
        }

        // تشفير كلمة المرور
        const hashedPassword = await bcrypt.hash(password, 10);

        // إنشاء المستخدم
        const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert([{
                username,
                password: hashedPassword
            }])
            .select()
            .single();

        if (createError) {
            console.error('خطأ في إنشاء المستخدم:', createError);
            throw createError;
        }

        // إنشاء إعدادات المستخدم مع البريد الإلكتروني
        const { error: settingsError } = await supabase
            .from('settings')
            .insert([{
                user_id: newUser.id,
                email: email
            }]);

        if (settingsError) {
            console.error('خطأ في إنشاء الإعدادات:', settingsError);
            throw settingsError;
        }

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

        // إنشاء توكن JWT
        const token = jwt.sign(
            { id: users.id, username: users.username },
            JWT_SECRET,
            { expiresIn: '24h' } // صلاحية التوكن 24 ساعة
        );

        // تخزين التوكن في كوكيز آمنة
        res.cookie('auth_token', token, {
            httpOnly: true, // لا يمكن الوصول إليها من JavaScript
            secure: process.env.NODE_ENV === 'production', // للاتصالات HTTPS فقط في الإنتاج
            maxAge: 86400000 // 24 ساعة بالمللي ثانية
        });

        // توجيه المستخدم إلى لوحة التحكم
        res.redirect('/dashboard');
            
    } catch (err) {
        console.error('حدث خطأ أثناء تسجيل الدخول:', err);
        res.render('login', { error: 'حدث خطأ في الاتصال بقاعدة البيانات' });
    }
});

// عرض لوحة التحكم
router.get('/dashboard', authenticateToken, async (req, res) => {
    console.log('🔍 الدخول إلى مسار لوحة التحكم');
    try {
        // استخراج بيانات المستخدم من الـوسيط authenticateToken
        const userId = req.user.id;
        console.log('👤 معرف المستخدم:', userId);
        
        // جلب الاسم العربي للمستخدم
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('display_name_ar')
            .eq('id', userId)
            .single();
            
        if (userError) {
            console.error('خطأ في جلب بيانات المستخدم:', userError);
            throw userError;
        }
        
        const { data: posts, error } = await supabase
            .from('posts')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ خطأ في جلب المنشورات:', error);
            throw error;
        }

        console.log(`📄 تم جلب ${posts.length} منشور بنجاح`);
        
        res.render('dashboard', {
            user: {
                ...req.user,
                display_name_ar: userData.display_name_ar
            },
            posts
        });
    } catch (err) {
        console.error("❌ خطأ في صفحة لوحة التحكم:", err);
        res.status(500).render('login', { error: 'حدث خطأ أثناء تحميل لوحة التحكم. الرجاء تسجيل الدخول مرة أخرى.' });
    }
});

// تسجيل الخروج
router.get('/logout', (req, res) => {
    // حذف كوكيز التوكن
    res.clearCookie('auth_token');
    res.redirect('/login');
});

// حذف الحساب
router.post('/delete-account', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { password } = req.body;

        // التحقق من كلمة المرور
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('password')
            .eq('id', userId)
            .single();

        if (userError) {
            console.error('خطأ في جلب بيانات المستخدم:', userError);
            return res.render('settings', {
                error: 'حدث خطأ أثناء التحقق من كلمة المرور',
                user: req.user,
                settings: {}
            });
        }

        // مقارنة كلمة المرور
        const isPasswordValid = await bcrypt.compare(password, userData.password);
        if (!isPasswordValid) {
            return res.render('settings', {
                error: 'كلمة المرور غير صحيحة',
                user: req.user,
                settings: {}
            });
        }

        // حذف بيانات المستخدم - يتم حذف المنشورات والإعدادات بناءً على العلاقات الخارجية في قاعدة البيانات
        // 1. حذف الإعدادات أولا
        const { error: settingsDeleteError } = await supabase
            .from('settings')
            .delete()
            .eq('user_id', userId);

        if (settingsDeleteError) {
            console.error('خطأ في حذف إعدادات المستخدم:', settingsDeleteError);
            throw settingsDeleteError;
        }

        // 2. حذف المنشورات
        const { error: postsDeleteError } = await supabase
            .from('posts')
            .delete()
            .eq('user_id', userId);

        if (postsDeleteError) {
            console.error('خطأ في حذف منشورات المستخدم:', postsDeleteError);
            throw postsDeleteError;
        }

        // 3. حذف حساب المستخدم نفسه
        const { error: userDeleteError } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);

        if (userDeleteError) {
            console.error('خطأ في حذف حساب المستخدم:', userDeleteError);
            throw userDeleteError;
        }

        // تسجيل الخروج بعد حذف الحساب
        res.clearCookie('auth_token');
        // توجيه المستخدم إلى صفحة تسجيل الدخول مع رسالة نجاح
        res.render('login', { error: null, success: 'تم حذف حسابك بنجاح' });
    } catch (err) {
        console.error('خطأ في حذف الحساب:', err);
        res.render('settings', {
            error: 'حدث خطأ أثناء محاولة حذف الحساب، يرجى المحاولة مرة أخرى',
            user: req.user,
            settings: {}
        });
    }
});

module.exports = router;
