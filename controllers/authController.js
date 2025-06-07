const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const supabase = require('../db/db'); // تفاعل مع قاعدة البيانات
const rateLimit = require('express-rate-limit');
const express = require('express');
const router = express.Router();

// إنشاء محدد عدد محاولات تسجيل الدخول
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 5, // 5 محاولات كحد أقصى
    message: { error: 'تم تجاوز الحد المسموح به من محاولات تسجيل الدخول، يرجى المحاولة بعد 15 دقيقة' },
    standardHeaders: true,
    legacyHeaders: false,
});

// عملية تسجيل الدخول (POST) مع تطبيق محدد المحاولات
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;

        // التحقق من وجود المستخدم في قاعدة البيانات
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .limit(1);

        if (error) {
            console.error('Error querying database:', error);
            return res.status(500).send('حدث خطأ في الاتصال بقاعدة البيانات');
        }

        // إذا لم يكن المستخدم موجودًا
        if (!users || users.length === 0) {
            return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        }

        // إذا كان المستخدم موجودًا، تحقق من كلمة المرور
        const user = users[0];
        const match = await bcrypt.compare(password, user.password);

        if (match) {
            // كلمة المرور صحيحة، إنشاء التوكن JWT
            const token = jwt.sign(
                { userId: user.id, username: user.username }, 
                process.env.JWT_SECRET || 'your_jwt_secret', 
                { expiresIn: '1h' }
            );
            
            // حفظ معلومات المستخدم في الجلسة
            req.session.user = {
                id: user.id,
                username: user.username,
                role: user.role
            };
            
            // توجيه المستخدم إلى صفحة الترحيب
            res.render('welcome', { username: user.username });
        } else {
            // كلمة المرور خاطئة
            return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        }
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).send('حدث خطأ في عملية تسجيل الدخول');
    }
});

// عملية تسجيل الخروج
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).send('حدث خطأ في تسجيل الخروج');
        }
        res.clearCookie('connect.sid');
        res.redirect('/');
    });
});

// التحقق من حالة تسجيل الدخول
router.get('/status', (req, res) => {
    if (req.session.user) {
        res.json({ 
            loggedIn: true, 
            user: {
                id: req.session.user.id,
                username: req.session.user.username,
                role: req.session.user.role
            }
        });
    } else {
        res.json({ loggedIn: false });
    }
});

// دالة للتحقق من صحة invite code أثناء التسجيل
router.post('/validate-invite', async (req, res) => {
    try {
        const { inviteCode } = req.body;
        
        const { data: invites, error } = await supabase
            .from('invite_codes')
            .select('*')
            .eq('code', inviteCode)
            .eq('is_used', false)
            .gt('expires_at', new Date().toISOString())
            .limit(1);

        if (error) {
            console.error('Error validating invite code:', error);
            return res.status(500).json({ error: 'حدث خطأ في التحقق من كود الدعوة' });
        }

        if (!invites || invites.length === 0) {
            return res.status(400).json({ error: 'كود الدعوة غير صحيح أو منتهي الصلاحية' });
        }

        const invite = invites[0];
        res.json({ 
            valid: true, 
            invite: {
                full_name: invite.full_name,
                email: invite.email,
                specialty: invite.specialty
            }
        });
    } catch (error) {
        console.error('Invite validation error:', error);
        return res.status(500).json({ error: 'حدث خطأ في التحقق من كود الدعوة' });
    }
});

// دالة التسجيل باستخدام invite code
router.post('/register', async (req, res) => {
    try {
        const { username, password, inviteCode } = req.body;

        // التحقق من صحة كود الدعوة أولاً
        const { data: invites, error: inviteError } = await supabase
            .from('invite_codes')
            .select('*')
            .eq('code', inviteCode)
            .eq('is_used', false)
            .gt('expires_at', new Date().toISOString())
            .limit(1);

        if (inviteError || !invites || invites.length === 0) {
            return res.status(400).json({ error: 'كود الدعوة غير صحيح أو منتهي الصلاحية' });
        }

        const invite = invites[0];

        // التحقق من عدم وجود المستخدم مسبقاً
        const { data: existingUsers, error: userCheckError } = await supabase
            .from('users')
            .select('id')
            .eq('username', username)
            .limit(1);

        if (userCheckError) {
            console.error('Error checking existing user:', userCheckError);
            return res.status(500).json({ error: 'حدث خطأ في التحقق من المستخدم' });
        }

        if (existingUsers && existingUsers.length > 0) {
            return res.status(400).json({ error: 'اسم المستخدم موجود مسبقاً' });
        }

        // تشفير كلمة المرور
        const hashedPassword = await bcrypt.hash(password, 10);

        // إنشاء المستخدم الجديد
        const { data: newUser, error: createUserError } = await supabase
            .from('users')
            .insert([{
                username: username,
                password: hashedPassword,
                display_name_ar: invite.full_name,
                role: 'user'
            }])
            .select()
            .single();

        if (createUserError) {
            console.error('Error creating user:', createUserError);
            return res.status(500).json({ error: 'حدث خطأ في إنشاء المستخدم' });
        }

        // تحديث كود الدعوة ليصبح مستخدماً
        const { error: updateInviteError } = await supabase
            .from('invite_codes')
            .update({
                is_used: true,
                used_by: newUser.id,
                used_at: new Date().toISOString()
            })
            .eq('id', invite.id);

        if (updateInviteError) {
            console.error('Error updating invite code:', updateInviteError);
            // المستخدم تم إنشاؤه بنجاح، لكن لم يتم تحديث كود الدعوة
        }

        // إنشاء إعدادات افتراضية للمستخدم
        const { error: settingsError } = await supabase
            .from('settings')
            .insert([{
                user_id: newUser.id,
                blog_title: `مدونة ${invite.full_name}`,
                blog_description: `مدونة متخصصة في ${invite.specialty}`,
                about_text: `أهلاً بكم في مدونتي. أنا ${invite.full_name} متخصص في ${invite.specialty}.`,
                email: invite.email
            }]);

        if (settingsError) {
            console.error('Error creating user settings:', settingsError);
            // المستخدم تم إنشاؤه بنجاح، لكن لم يتم إنشاء الإعدادات
        }

        res.status(201).json({ 
            message: 'تم إنشاء الحساب بنجاح',
            user: {
                id: newUser.id,
                username: newUser.username,
                display_name: newUser.display_name_ar
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ error: 'حدث خطأ في عملية التسجيل' });
    }
});

module.exports = { router, loginLimiter };
