const express = require('express');
const router = express.Router();
const supabase = require('../db/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../services/emailService');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const { authenticateToken } = require('../middleware/authMiddleware');

// Use the secret key from environment variables
const JWT_SECRET = process.env.JWT_SECRET;

// Create login rate limiter
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: 'لقد تجاوزت الحد المسموح به لمحاولات الدخول، يرجى المحاولة بعد 15 دقيقة.',
    handler: (req, res, next, options) => {
        res.status(options.statusCode).render('login', { error: options.message });
    }
});

// Create registration rate limiter
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 requests per windowMs
    message: 'لقد تجاوزت الحد المسموح به لمحاولات التسجيل، يرجى المحاولة بعد ساعة.',
    handler: (req, res, next, options) => {
        res.status(options.statusCode).render('register', { error: options.message, success: null });
    }
});

// Display the new registration page (complete registration with activation code)
router.get('/register', (req, res) => {
    res.render('register', { error: null, success: null });
});

// Display blog request page
router.get('/blog-request', (req, res) => {
    res.render('blog-request', { error: null, success: null });
});

// Handle blog request
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
        // Verify that the content contains the required word count (at least 300 words)
        const wordCount = sample_content.trim().split(/\s+/).length;
        if (wordCount < 300) {
            return res.render('blog-request', {
                error: 'يجب أن يحتوي المقال التجريبي على 300 كلمة على الأقل',
                success: null
            });
        }

        // Check that there is no previous request submitted with the same email and pending
        const { data: existingRequest, error: checkError } = await supabase
            .from('blog_requests')
            .select('id, status')
            .eq('email', email)
            .eq('status', 'pending');

        if (checkError) {
            console.error('خطأ في البحث عن الطلبات السابقة:', checkError);
            throw checkError;
        }        if (existingRequest && existingRequest.length > 0) {
            return res.render('blog-request', {
                error: 'يوجد طلب مقدم سابقاً بنفس البريد الإلكتروني في انتظار المراجعة',
                success: null
            });
        }

        // Insert new blog request
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

        // Send notification to admins
        try {
            await emailService.notifyAdminsNewRequest(newRequest);
        } catch (emailError) {
            console.error('خطأ في إرسال إشعار المشرفين:', emailError);
            // Don't stop the process due to email sending failure
        }        // Redirect to submission confirmation page
        res.render('request-submitted', { 
            email: email,
            requestId: newRequest.id 
        });    } catch (err) {
        console.error('خطأ في إرسال طلب المدونة:', err);
        res.render('blog-request', {
            error: 'حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى',
            success: null
        });
    }
});



// Old registration route (will be gradually removed)

// Handle new registration (with activation code)
router.post('/register', registerLimiter, async (req, res) => {
    const { username, email, invite_code } = req.body;

    // Basic input validation
    if (!username || !email || !invite_code || username.trim() === '' || email.trim() === '' || invite_code.trim() === '') {
        return res.render('register', { error: 'جميع الحقول المطلوبة يجب تعبئتها', success: null });
    }

    try {
        // Search for the invite code
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
            .single();        if (codeError || !inviteCodeData) {
            return res.render('register', {
                error: 'كود التفعيل غير صحيح',
                success: null
            });
        }        // Verify that the code has not been used before
        if (inviteCodeData.is_used) {
            return res.render('register', {
                error: 'هذا الكود تم استخدامه من قبل',
                success: null
            });
        }

        // Verify that the code has not expired
        const expirationDate = new Date(inviteCodeData.expires_at);
        const now = new Date();        if (now > expirationDate) {
            return res.render('register', {
                error: 'انتهت صلاحية كود التفعيل، يرجى طلب كود جديد',
                success: null
            });
        }        // Verify email match
        if (email !== inviteCodeData.email) {
            return res.render('register', {
                error: 'البريد الإلكتروني لا يطابق كود التفعيل',
                success: null
            });
        }

        // Check that username doesn't exist
        const { data: existingUser, error: userCheckError } = await supabase
            .from('users')
            .select('username')
            .eq('username', username);

        if (userCheckError) {
            console.error('خطأ في البحث عن المستخدم:', userCheckError);
            throw userCheckError;
        }        if (existingUser && existingUser.length > 0) {
            return res.render('register', {
                error: 'اسم المستخدم مستخدم بالفعل، يرجى اختيار اسم آخر',
                success: null
            });
        }

        // Create temporary password (user will change it on first login)
        const tempPassword = crypto.randomBytes(8).toString('hex');
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Create new user
        const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert([{
                username,
                password: hashedPassword,
                display_name_ar: inviteCodeData.full_name,
                role: 'user'
            }])
            .select()
            .single();

        if (createError) {
            console.error('خطأ في إنشاء المستخدم:', createError);
            throw createError;
        }

        // Create user settings
        const { error: settingsError } = await supabase
            .from('settings')
            .insert([{
                user_id: newUser.id,
                email: inviteCodeData.email,
                blog_title: `مدونة ${inviteCodeData.full_name}`,
                blog_description: `مدونة متخصصة في ${inviteCodeData.specialty}`,
                about_text: '',
                contact_info: inviteCodeData.email
            }]);

        if (settingsError) {
            console.error('خطأ في إنشاء الإعدادات:', settingsError);
            throw settingsError;
        }

        // Update invite code to show it has been used
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

        // Send login credentials via email
        try {
            await emailService.sendLoginCredentials(
                email,
                inviteCodeData.full_name,
                username,
                tempPassword
            );
        } catch (emailError) {
            console.error('خطأ في إرسال بيانات الدخول:', emailError);
        }        res.render('register', {
            error: null,
            success: `تم إنشاء حسابك بنجاح! تم إرسال بيانات الدخول إلى ${email}. يمكنك الآن تسجيل الدخول.`
        });    } catch (err) {
        console.error('خطأ في التسجيل:', err);
        res.render('register', {
            error: 'حدث خطأ أثناء إنشاء الحساب، يرجى المحاولة مرة أخرى',
            success: null
        });
    }
});

// Display login page
router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// Handle login
router.post('/login', loginLimiter, async (req, res) => {
    const { username, password } = req.body;

    // Basic input validation
    if (!username || !password || username.trim() === '' || password.trim() === '') {
        return res.render('login', { error: 'يرجى إدخال اسم المستخدم وكلمة المرور' });
    }

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
        }        // Create JWT token with user role included
        const token = jwt.sign(
            { id: users.id, username: users.username, role: users.role },
            JWT_SECRET,
            { expiresIn: '24h' } // Token validity 24 hours
        );

        // Store token in secure cookies
        res.cookie('auth_token', token, {
            httpOnly: true, // Cannot be accessed from JavaScript
            secure: process.env.NODE_ENV === 'production', // For HTTPS connections only in production
            maxAge: 86400000 // 24 hours in milliseconds
        });

        // Redirect user to dashboard
        res.redirect('/dashboard');
            
    } catch (err) {
        console.error('حدث خطأ أثناء تسجيل الدخول:', err);
        res.render('login', { error: 'حدث خطأ في الاتصال بقاعدة البيانات' });
    }
});

// Display dashboard
router.get('/dashboard', authenticateToken, async (req, res) => {    console.log('🔍 Accessing Dashboard Route');
    try {
        // Extract user data from authenticateToken middleware
        const userId = req.user.id;
        console.log('👤 User ID:', userId);
          // Fetch user data including role and Arabic name
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
          // Check for success message in cookies
        const successMessage = req.cookies.success_message || null;
        
        // If it exists, delete it after using it
        if (successMessage) {
            res.clearCookie('success_message');
        }

        // Fetch blog request statistics for admins
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
                role: userData.role // Add user role
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

// Logout
router.get('/logout', (req, res) => {
    // Delete token cookie
    res.clearCookie('auth_token');
    res.redirect('/login');
});

// Delete account
router.post('/delete-account', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { password } = req.body;

        // Verify password
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

        // Compare password
        const isPasswordValid = await bcrypt.compare(password, userData.password);
        if (!isPasswordValid) {
            return res.render('settings', {
                error: 'كلمة المرور غير صحيحة',
                user: req.user,
                settings: {}
            });
        }        console.log('🗑️ بدء عملية حذف الحساب للمستخدم:', userId);

        // Delete user data - posts and settings will be deleted based on foreign key relationships in the database
        // 1. Delete notifications first
        console.log('🔔 حذف الإشعارات...');
        const { error: notificationsDeleteError } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', userId);

        if (notificationsDeleteError) {
            console.error('خطأ في حذف إشعارات المستخدم:', notificationsDeleteError);
            throw notificationsDeleteError;
        }

        // 2. Update invite codes used by this user
        console.log('🎫 تحديث أكواد الدعوة...');
        const { error: inviteCodesUpdateError } = await supabase
            .from('invite_codes')
            .update({ used_by: null })
            .eq('used_by', userId);

        if (inviteCodesUpdateError) {
            console.error('خطأ في تحديث أكواد الدعوة:', inviteCodesUpdateError);
            throw inviteCodesUpdateError;
        }

        // 3. Update blog requests reviewed by this user (if admin)
        console.log('📝 تحديث طلبات المدونات...');
        const { error: blogRequestsUpdateError } = await supabase
            .from('blog_requests')
            .update({ reviewed_by: null })
            .eq('reviewed_by', userId);

        if (blogRequestsUpdateError) {
            console.error('خطأ في تحديث طلبات المدونات:', blogRequestsUpdateError);
            throw blogRequestsUpdateError;
        }

        // 4. Delete settings
        console.log('⚙️ حذف الإعدادات...');
        const { error: settingsDeleteError } = await supabase
            .from('settings')
            .delete()
            .eq('user_id', userId);

        if (settingsDeleteError) {
            console.error('خطأ في حذف إعدادات المستخدم:', settingsDeleteError);
            throw settingsDeleteError;
        }

        // 5. Delete posts
        console.log('📄 حذف المنشورات...');
        const { error: postsDeleteError } = await supabase
            .from('posts')
            .delete()
            .eq('user_id', userId);

        if (postsDeleteError) {
            console.error('خطأ في حذف منشورات المستخدم:', postsDeleteError);
            throw postsDeleteError;
        }        // 6. Delete user account itself
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

        // Logout after deleting account
        res.clearCookie('auth_token');
        // Redirect user to login page with success message
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
