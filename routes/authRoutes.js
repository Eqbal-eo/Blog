const express = require('express');
const router = express.Router();
const supabase = require('../db/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../services/emailService');
require('dotenv').config();
const { authenticateToken } = require('../middleware/authMiddleware');

// استخدام المفتاح السري من متغيرات البيئة
const JWT_SECRET = process.env.JWT_SECRET;

// عرض صفحة التسجيل (الصفحة الجديدة)
router.get('/register', (req, res) => {
    res.render('register', { error: null, success: null });
});

// عرض صفحة طلب المدونة
router.get('/blog-request', (req, res) => {
    res.render('blog-request', { error: null, success: null });
});

// معالجة طلب المدونة
router.post('/blog-request', async (req, res) => {
    const { 
        full_name, 
        email, 
        specialty, 
        experience_years, 
        sample_title, 
        sample_content, 
        sample_category, 
        motivation 
    } = req.body;

    try {
        // التحقق من أن المحتوى يحتوي على العدد المطلوب من الكلمات (300 كلمة على الأقل)
        const wordCount = sample_content.trim().split(/\s+/).length;
        if (wordCount < 300) {
            return res.render('blog-request', {
                error: 'يجب أن يحتوي المقال التجريبي على 300 كلمة على الأقل',
                success: null
            });
        }

        // التحقق من عدم وجود طلب مقدم سابقاً بنفس البريد الإلكتروني ولم يتم البت فيه
        const { data: existingRequest, error: checkError } = await supabase
            .from('blog_requests')
            .select('id, status')
            .eq('email', email)
            .eq('status', 'pending');

        if (checkError) {
            console.error('خطأ في البحث عن الطلبات السابقة:', checkError);
            throw checkError;
        }

        if (existingRequest && existingRequest.length > 0) {
            return res.render('blog-request', {
                error: 'يوجد طلب مقدم سابقاً بنفس البريد الإلكتروني في انتظار المراجعة',
                success: null
            });
        }

        // إدراج طلب المدونة الجديد
        const { data: newRequest, error: insertError } = await supabase
            .from('blog_requests')
            .insert([{
                full_name,
                email,
                specialty,
                experience_years: parseInt(experience_years),
                sample_title,
                sample_content,
                sample_category,
                motivation,
                status: 'pending'
            }])
            .select()
            .single();

        if (insertError) {
            console.error('خطأ في إدراج طلب المدونة:', insertError);
            throw insertError;
        }

        // إرسال إشعار للمشرفين
        try {
            await emailService.notifyAdminsNewRequest(newRequest);
        } catch (emailError) {
            console.error('خطأ في إرسال إشعار المشرفين:', emailError);
            // لا نوقف العملية بسبب فشل إرسال البريد الإلكتروني
        }

        // توجيه إلى صفحة تأكيد الإرسال
        res.render('request-submitted', { 
            email: email,
            requestId: newRequest.id 
        });

    } catch (err) {
        console.error('خطأ في إرسال طلب المدونة:', err);
        res.render('blog-request', {
            error: 'حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى',
            success: null
        });
    }
});

// عرض صفحة إكمال التسجيل
router.get('/complete-registration', (req, res) => {
    res.render('complete-registration', { 
        error: null, 
        success: null,
        userInfo: null,
        invite_code: ''
    });
});

// معالجة إكمال التسجيل
router.post('/complete-registration', async (req, res) => {
    const { invite_code, username, password, confirm_password, bio } = req.body;

    try {
        // البحث عن كود الدعوة
        const { data: inviteCodeData, error: codeError } = await supabase
            .from('invite_codes')
            .select(`
                id,
                code,
                blog_request_id,
                full_name,
                email,
                specialty,
                is_used,
                expires_at
            `)
            .eq('code', invite_code.toUpperCase())
            .single();

        if (codeError || !inviteCodeData) {
            return res.render('complete-registration', {
                error: 'كود التفعيل غير صحيح',
                success: null,
                userInfo: null,
                invite_code: invite_code
            });
        }

        // التحقق من أن الكود لم يُستخدم من قبل
        if (inviteCodeData.is_used) {
            return res.render('complete-registration', {
                error: 'هذا الكود تم استخدامه من قبل',
                success: null,
                userInfo: null,
                invite_code: invite_code
            });
        }

        // التحقق من أن الكود لم ينتهِ صلاحيته
        const expirationDate = new Date(inviteCodeData.expires_at);
        const now = new Date();
        if (now > expirationDate) {
            return res.render('complete-registration', {
                error: 'انتهت صلاحية كود التفعيل، يرجى طلب كود جديد',
                success: null,
                userInfo: null,
                invite_code: invite_code
            });
        }

        // إذا لم يتم إرسال بيانات إنشاء الحساب، اعرض المعلومات للمستخدم ليكمل
        if (!username || !password) {
            return res.render('complete-registration', {
                error: null,
                success: 'كود التفعيل صحيح! أكمل إنشاء حسابك أدناه',
                userInfo: {
                    full_name: inviteCodeData.full_name,
                    email: inviteCodeData.email,
                    specialty: inviteCodeData.specialty
                },
                invite_code: invite_code
            });
        }

        // التحقق من تطابق كلمات المرور
        if (password !== confirm_password) {
            return res.render('complete-registration', {
                error: 'كلمات المرور غير متطابقة',
                success: null,
                userInfo: {
                    full_name: inviteCodeData.full_name,
                    email: inviteCodeData.email,
                    specialty: inviteCodeData.specialty
                },
                invite_code: invite_code
            });
        }

        // التحقق من عدم وجود اسم المستخدم
        const { data: existingUser, error: userCheckError } = await supabase
            .from('users')
            .select('username')
            .eq('username', username);

        if (userCheckError) {
            console.error('خطأ في البحث عن المستخدم:', userCheckError);
            throw userCheckError;
        }

        if (existingUser && existingUser.length > 0) {
            return res.render('complete-registration', {
                error: 'اسم المستخدم مستخدم بالفعل، يرجى اختيار اسم آخر',
                success: null,
                userInfo: {
                    full_name: inviteCodeData.full_name,
                    email: inviteCodeData.email,
                    specialty: inviteCodeData.specialty
                },
                invite_code: invite_code
            });
        }

        // تشفير كلمة المرور
        const hashedPassword = await bcrypt.hash(password, 10);

        // إنشاء المستخدم الجديد
        const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert([{
                username,
                password: hashedPassword,
                bio: bio || null,
                display_name_ar: inviteCodeData.full_name,
                role: 'user'
            }])
            .select()
            .single();

        if (createError) {
            console.error('خطأ في إنشاء المستخدم:', createError);
            throw createError;
        }

        // إنشاء إعدادات المستخدم
        const { error: settingsError } = await supabase
            .from('settings')
            .insert([{
                user_id: newUser.id,
                email: inviteCodeData.email,
                blog_title: `مدونة ${inviteCodeData.full_name}`,
                blog_description: `مدونة متخصصة في ${inviteCodeData.specialty}`,
                about_text: bio || '',
                contact_info: inviteCodeData.email
            }]);

        if (settingsError) {
            console.error('خطأ في إنشاء الإعدادات:', settingsError);
            throw settingsError;
        }

        // تحديث كود الدعوة لإظهار أنه تم استخدامه
        const { error: updateCodeError } = await supabase
            .from('invite_codes')
            .update({
                is_used: true,
                used_by: newUser.id,
                used_at: new Date().toISOString()
            })
            .eq('id', inviteCodeData.id);

        if (updateCodeError) {
            console.error('خطأ في تحديث كود الدعوة:', updateCodeError);
        }

        // تسجيل دخول المستخدم تلقائياً
        const token = jwt.sign(
            { userId: newUser.id, username: newUser.username },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 يوم
        });

        // توجيه إلى صفحة الترحيب
        res.render('welcome', { 
            username: newUser.username,
            displayName: inviteCodeData.full_name
        });

    } catch (err) {
        console.error('خطأ في إكمال التسجيل:', err);
        res.render('complete-registration', {
            error: 'حدث خطأ أثناء إنشاء الحساب، يرجى المحاولة مرة أخرى',
            success: null,
            userInfo: null,
            invite_code: invite_code || ''
        });
    }
});

// المسار القديم للتسجيل (سيتم إزالته تدريجياً)

// المسار القديم للتسجيل المباشر (احتياطي - للطوارئ فقط)
router.post('/register-direct', async (req, res) => {
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
        }        // إنشاء توكن JWT مع تضمين دور المستخدم
        const token = jwt.sign(
            { id: users.id, username: users.username, role: users.role },
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
router.get('/dashboard', authenticateToken, async (req, res) => {    console.log('🔍 Accessing Dashboard Route');
    try {
        // Extract user data from authenticateToken middleware
        const userId = req.user.id;
        console.log('👤 User ID:', userId);
          // جلب بيانات المستخدم بما فيها الدور والاسم العربي
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('display_name_ar, role')
            .eq('id', userId)
            .single();
            
        if (userError) {
            console.error('خطأ في جلب بيانات المستخدم:', userError);
            throw userError;
        }
        
        const { data: posts, error: postsError } = await supabase
            .from('posts')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });        if (postsError) {
            console.error('❌ Error fetching posts:', postsError);
            throw postsError;
        }
        console.log(`📄 Successfully fetched ${posts.length} posts`);
        
        // Fetch latest notifications for user
        const { data: notifications, error: notificationsError } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(3);
            
        if (notificationsError) {
            console.error('❌ Error fetching notifications:', notificationsError);
            // We don't want to stop the page if notifications fail to load
            console.log('Will continue loading the page without notifications');
        } else {
            console.log(`🔔 Successfully fetched ${notifications.length} notifications`);
        }
          // التحقق من وجود رسالة نجاح في الكوكيز
        const successMessage = req.cookies.success_message || null;
        
        // إذا كانت موجودة، نحذفها بعد استخدامها
        if (successMessage) {
            res.clearCookie('success_message');
        }

        // جلب إحصائيات طلبات المدونات للمشرفين
        let blogRequestsStats = null;
        if (userData.role === 'admin') {
            try {
                const { data: blogRequests, error: blogRequestsError } = await supabase
                    .from('blog_requests')
                    .select('status');

                if (!blogRequestsError && blogRequests) {
                    blogRequestsStats = {
                        total: blogRequests.length,
                        pending: blogRequests.filter(r => r.status === 'pending').length,
                        approved: blogRequests.filter(r => r.status === 'approved').length,
                        rejected: blogRequests.filter(r => r.status === 'rejected').length
                    };
                }
                console.log(`📊 Admin stats: ${JSON.stringify(blogRequestsStats)}`);
            } catch (adminError) {
                console.error('❌ Error fetching admin stats:', adminError);
            }
        }
        
        res.render('dashboard', {
            user: {
                ...req.user,
                display_name_ar: userData.display_name_ar,
                role: userData.role // إضافة دور المستخدم
            },
            posts,
            notifications: notifications || [],
            successMessage,
            blogRequestsStats
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
        }        console.log('🗑️ بدء عملية حذف الحساب للمستخدم:', userId);

        // حذف بيانات المستخدم - يتم حذف المنشورات والإعدادات بناءً على العلاقات الخارجية في قاعدة البيانات
        // 1. حذف الإشعارات أولا
        console.log('🔔 حذف الإشعارات...');
        const { error: notificationsDeleteError } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', userId);

        if (notificationsDeleteError) {
            console.error('خطأ في حذف إشعارات المستخدم:', notificationsDeleteError);
            throw notificationsDeleteError;
        }

        // 2. تحديث أكواد الدعوة المستخدمة من قبل هذا المستخدم
        console.log('🎫 تحديث أكواد الدعوة...');
        const { error: inviteCodesUpdateError } = await supabase
            .from('invite_codes')
            .update({ used_by: null })
            .eq('used_by', userId);

        if (inviteCodesUpdateError) {
            console.error('خطأ في تحديث أكواد الدعوة:', inviteCodesUpdateError);
            throw inviteCodesUpdateError;
        }

        // 3. تحديث طلبات المدونات التي راجعها هذا المستخدم (إذا كان مشرف)
        console.log('📝 تحديث طلبات المدونات...');
        const { error: blogRequestsUpdateError } = await supabase
            .from('blog_requests')
            .update({ reviewed_by: null })
            .eq('reviewed_by', userId);

        if (blogRequestsUpdateError) {
            console.error('خطأ في تحديث طلبات المدونات:', blogRequestsUpdateError);
            throw blogRequestsUpdateError;
        }

        // 4. حذف الإعدادات
        console.log('⚙️ حذف الإعدادات...');
        const { error: settingsDeleteError } = await supabase
            .from('settings')
            .delete()
            .eq('user_id', userId);

        if (settingsDeleteError) {
            console.error('خطأ في حذف إعدادات المستخدم:', settingsDeleteError);
            throw settingsDeleteError;
        }

        // 5. حذف المنشورات
        console.log('📄 حذف المنشورات...');
        const { error: postsDeleteError } = await supabase
            .from('posts')
            .delete()
            .eq('user_id', userId);

        if (postsDeleteError) {
            console.error('خطأ في حذف منشورات المستخدم:', postsDeleteError);
            throw postsDeleteError;
        }        // 6. حذف حساب المستخدم نفسه
        console.log('👤 حذف حساب المستخدم...');
        const { error: userDeleteError } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);

        if (userDeleteError) {
            console.error('خطأ في حذف حساب المستخدم:', userDeleteError);
            throw userDeleteError;
        }

        console.log('✅ تم حذف الحساب بنجاح');

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
