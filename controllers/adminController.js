const supabase = require('../db/db');
const { sendBlogApprovalEmail, sendBlogRejectionEmail } = require('../services/emailService');

// عرض قائمة المنشورات التي تنتظر الموافقة
exports.getPendingPosts = async (req, res) => {
    try {
        // استخراج بيانات المستخدم
        const userId = req.user.id;
        
        // جلب بيانات المستخدم من قاعدة البيانات
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('display_name_ar, role, username')
            .eq('id', userId)
            .single();
            
        if (userError) {
            console.error('خطأ في جلب بيانات المستخدم:', userError);
            throw userError;
        }

        // جلب المنشورات المعلقة
        const { data: posts, error } = await supabase
            .from('posts')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // تمرير بيانات المستخدم والمنشورات للعرض
        res.render('admin/pending-posts', { 
            posts,
            user: {
                ...req.user,
                display_name_ar: userData.display_name_ar,
                role: userData.role,
                username: userData.username
            }
        });
    } catch (error) {
        console.error('خطأ في جلب المنشورات المعلقة:', error);
        res.status(500).render('error', { 
            message: 'حدث خطأ أثناء محاولة جلب المنشورات المعلقة',
            error: { status: 500 }
        });
    }
};

// الموافقة على منشور
exports.approvePost = async (req, res) => {
    const { postId } = req.params;
    
    try {        // التحقق من وجود المنشور
        const { data: post, error: fetchError } = await supabase
            .from('posts')
            .select('id, user_id, title')
            .eq('id', postId)
            .single();
            
        if (fetchError || !post) {
            console.error('المنشور غير موجود:', fetchError);
            return res.status(404).json({ 
                error: true, 
                message: 'المنشور غير موجود' 
            });
        }
        
        // تحديث حالة المنشور إلى "منشور"
        const { error } = await supabase
            .from('posts')
            .update({ 
                status: 'published', 
                published_at: new Date() 
            })
            .eq('id', postId);

        if (error) throw error;

        // إرسال إشعار للمؤلف بالموافقة على المنشور
        const { createNotification } = require('../services/notificationService');
        const notificationMessage = `تم الموافقة على منشورك "${post.title}" ونشره على المدونة`;
        await createNotification(
            post.user_id, 
            postId, 
            notificationMessage, 
            'post_approved'
        );

        res.json({ success: true, message: 'تم نشر المنشور وإرسال إشعار للمؤلف' });
    } catch (error) {
        console.error('خطأ في الموافقة على المنشور:', error);
        res.status(500).json({ 
            error: true, 
            message: 'حدث خطأ في عملية الموافقة على المنشور' 
        });
    }
};

// رفض منشور
exports.rejectPost = async (req, res) => {
    const { postId } = req.params;
    const { reason } = req.body;
    
    try {
        // الحصول على معلومات المنشور أولاً لمعرفة المؤلف
        const { data: post, error: fetchError } = await supabase
            .from('posts')
            .select('user_id, title')
            .eq('id', postId)
            .single();
            
        if (fetchError || !post) {
            console.error('المنشور غير موجود:', fetchError);
            return res.status(404).json({ 
                error: true, 
                message: 'المنشور غير موجود' 
            });
        }

        // تحديث حالة المنشور إلى "مرفوض"
        const { error } = await supabase
            .from('posts')
            .update({ 
                status: 'rejected',
                rejection_reason: reason,
                updated_at: new Date()
            })
            .eq('id', postId);

        if (error) throw error;

        // إرسال إشعار للمؤلف
        const { createNotification } = require('../services/notificationService');
        const notificationMessage = `تم رفض منشورك "${post.title}" للأسباب التالية: ${reason}`;
        await createNotification(
            post.user_id, 
            postId, 
            notificationMessage, 
            'post_rejected'
        );

        res.json({ success: true, message: 'تم رفض المنشور وإرسال إشعار للمؤلف' });
    } catch (error) {
        console.error('خطأ في رفض المنشور:', error);
        res.status(500).json({ 
            error: true, 
            message: 'حدث خطأ في عملية رفض المنشور' 
        });
    }
};

// معاينة منشور معلق
exports.previewPost = async (req, res) => {
    const { postId } = req.params;
    
    try {
        // جلب معلومات المنشور
        const { data: post, error: postError } = await supabase
            .from('posts')
            .select('*, users:user_id(*)')
            .eq('id', postId)
            .single();
            
        if (postError || !post) {
            console.error('خطأ في جلب بيانات المنشور:', postError);
            return res.status(404).render('error', { 
                message: 'المنشور غير موجود',
                error: { status: 404 }
            });
        }
        
        // التحقق من أن المنشور معلق أو أن المستخدم مشرف
        if (post.status !== 'pending' && req.user.role !== 'admin') {
            return res.status(403).render('error', { 
                message: 'غير مصرح لك بالوصول لهذا المنشور',
                error: { status: 403 }
            });
        }
        
        // جلب اسم الكاتب
        const author = post.users;
        const authorName = author.display_name_ar || author.username;
        
        // استخراج بيانات المستخدم الحالي
        const userId = req.user.id;
        
        // جلب بيانات المستخدم من قاعدة البيانات
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('display_name_ar, role')
            .eq('id', userId)
            .single();
            
        if (userError) {
            console.error('خطأ في جلب بيانات المستخدم:', userError);
            throw userError;
        }
        
        // تمرير البيانات للعرض
        res.render('post', {
            post: { 
                ...post,
                author_name: authorName,
                preview: true
            },
            user: {
                ...req.user,
                display_name_ar: userData.display_name_ar,
                role: userData.role
            }
        });
    } catch (error) {
        console.error('خطأ في معاينة المنشور:', error);
        res.status(500).render('error', { 
            message: 'حدث خطأ أثناء محاولة عرض المنشور',
            error: { status: 500 }
        });
    }
};

// ======================== Blog Request Admin Functions ========================

// عرض قائمة طلبات المدونات المعلقة
exports.getPendingBlogRequests = async (req, res) => {
    try {
        // استخراج بيانات المستخدم
        const userId = req.user.id;
        
        // جلب بيانات المستخدم من قاعدة البيانات
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('display_name_ar, role, username')
            .eq('id', userId)
            .single();
            
        if (userError) {
            console.error('خطأ في جلب بيانات المستخدم:', userError);
            throw userError;
        }

        // جلب طلبات المدونات المعلقة
        const { data: requests, error } = await supabase
            .from('blog_requests')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // تمرير بيانات المستخدم والطلبات للعرض
        res.render('admin/pending-blog-requests', { 
            requests,
            user: {
                ...req.user,
                display_name_ar: userData.display_name_ar,
                role: userData.role,
                username: userData.username
            }
        });
    } catch (error) {
        console.error('خطأ في جلب طلبات المدونات المعلقة:', error);
        res.status(500).render('error', { 
            message: 'حدث خطأ أثناء محاولة جلب طلبات المدونات المعلقة',
            error: { status: 500 }
        });
    }
};

// الموافقة على طلب مدونة
exports.approveBlogRequest = async (req, res) => {
    const { requestId } = req.params;

    try {
        console.log('🔍 بدء عملية الموافقة على الطلب رقم:', requestId);        // التحقق من وجود الطلب
        const { data: request, error: fetchError } = await supabase
            .from('blog_requests')
            .select('id, email, full_name, specialty')
            .eq('id', requestId)
            .single();
            
        if (fetchError || !request) {
            console.error('الطلب غير موجود:', fetchError);
            return res.status(404).json({ 
                error: true, 
                message: 'الطلب غير موجود' 
            });
        }
        
        console.log('✅ تم العثور على الطلب:', request);
        
        // إنشاء رمز دعوة فريد
        const inviteCode = generateInviteCode();        console.log('🎫 تم إنشاء رمز الدعوة:', inviteCode);
          // إدراج رمز الدعوة في قاعدة البيانات
        console.log('💾 إدراج رمز الدعوة في قاعدة البيانات...');        const { error: inviteError } = await supabase
            .from('invite_codes')
            .insert([{
                code: inviteCode,
                email: request.email,
                full_name: request.full_name,
                specialty: request.specialty,
                blog_request_id: requestId,
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 يوم
                is_used: false
            }]);
            
        if (inviteError) {
            console.error('❌ خطأ في إدراج رمز الدعوة:', inviteError);
            throw inviteError;
        }
        
        console.log('✅ تم إدراج رمز الدعوة بنجاح');
        
        // تحديث حالة الطلب إلى "مقبول"
        console.log('🔄 تحديث حالة الطلب...');        const { error } = await supabase
            .from('blog_requests')
            .update({ 
                status: 'approved', 
                reviewed_at: new Date() 
            })
            .eq('id', requestId);

        if (error) {
            console.error('❌ خطأ في تحديث حالة الطلب:', error);
            throw error;
        }
        
        console.log('✅ تم تحديث حالة الطلب بنجاح');// إرسال إيميل موافقة
        try {
            // التحقق من وجود إعدادات البريد الإلكتروني
            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                await sendBlogApprovalEmail(request.email, request.full_name, inviteCode);
                console.log(`تم إرسال إيميل الموافقة للمستخدم ${request.full_name}`);
            } else {
                console.log(`⚠️ لم يتم إعداد البريد الإلكتروني - كود الدعوة: ${inviteCode}`);
                console.log(`📧 البريد الإلكتروني للمستخدم: ${request.email}`);
            }
        } catch (emailError) {
            console.error('خطأ في إرسال إيميل الموافقة:', emailError);
            console.log(`⚠️ فشل الإيميل لكن كود الدعوة تم إنشاؤه: ${inviteCode}`);
            // لا نتوقف هنا لأن العملية الأساسية نجحت
        }

        console.log(`تم إنشاء رمز دعوة للمستخدم ${request.full_name}: ${inviteCode}`);

        res.json({ 
            success: true, 
            message: 'تم قبول الطلب وإرسال رمز الدعوة',
            inviteCode: inviteCode 
        });
    } catch (error) {
        console.error('خطأ في الموافقة على طلب المدونة:', error);
        res.status(500).json({ 
            error: true, 
            message: 'حدث خطأ في عملية الموافقة على الطلب' 
        });
    }
};

// رفض طلب مدونة
exports.rejectBlogRequest = async (req, res) => {
    const { requestId } = req.params;
    const { reason } = req.body;
    
    try {
        // الحصول على معلومات الطلب أولاً
        const { data: request, error: fetchError } = await supabase
            .from('blog_requests')
            .select('email, full_name')
            .eq('id', requestId)
            .single();
            
        if (fetchError || !request) {
            console.error('الطلب غير موجود:', fetchError);
            return res.status(404).json({ 
                error: true, 
                message: 'الطلب غير موجود' 
            });
        }        // تحديث حالة الطلب إلى "مرفوض"
        const { error } = await supabase
            .from('blog_requests')
            .update({ 
                status: 'rejected',
                rejection_reason: reason,
                reviewed_at: new Date()
            })
            .eq('id', requestId);

        if (error) throw error;// إرسال إيميل رفض
        try {
            // التحقق من وجود إعدادات البريد الإلكتروني
            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                await sendBlogRejectionEmail(request.email, request.full_name, reason);
                console.log(`تم إرسال إيميل الرفض للمستخدم ${request.full_name}`);
            } else {
                console.log(`⚠️ لم يتم إعداد البريد الإلكتروني - تم رفض الطلب للمستخدم: ${request.full_name}`);
                console.log(`📧 البريد الإلكتروني للمستخدم: ${request.email}`);
                console.log(`📝 سبب الرفض: ${reason}`);
            }
        } catch (emailError) {
            console.error('خطأ في إرسال إيميل الرفض:', emailError);
            console.log(`⚠️ فشل الإيميل لكن تم رفض الطلب للمستخدم: ${request.full_name}`);
            // لا نتوقف هنا لأن العملية الأساسية نجحت
        }

        console.log(`تم رفض طلب المدونة للمستخدم ${request.full_name} بسبب: ${reason}`);

        res.json({ success: true, message: 'تم رفض الطلب وإرسال إشعار للمتقدم' });
    } catch (error) {
        console.error('خطأ في رفض طلب المدونة:', error);
        res.status(500).json({ 
            error: true, 
            message: 'حدث خطأ في عملية رفض الطلب' 
        });
    }
};

// معاينة طلب مدونة
exports.previewBlogRequest = async (req, res) => {
    const { requestId } = req.params;
    
    try {
        // جلب معلومات الطلب
        const { data: request, error: requestError } = await supabase
            .from('blog_requests')
            .select('*')
            .eq('id', requestId)
            .single();
            
        if (requestError || !request) {
            console.error('خطأ في جلب بيانات الطلب:', requestError);
            return res.status(404).render('error', { 
                message: 'الطلب غير موجود',
                error: { status: 404 }
            });
        }
        
        // استخراج بيانات المستخدم الحالي
        const userId = req.user.id;
        
        // جلب بيانات المستخدم من قاعدة البيانات
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('display_name_ar, role')
            .eq('id', userId)
            .single();
            
        if (userError) {
            console.error('خطأ في جلب بيانات المستخدم:', userError);
            throw userError;
        }
        
        // تمرير البيانات للعرض
        res.render('admin/blog-request-preview', {
            request,
            user: {
                ...req.user,
                display_name_ar: userData.display_name_ar,
                role: userData.role
            }
        });
    } catch (error) {
        console.error('خطأ في معاينة الطلب:', error);
        res.status(500).render('error', { 
            message: 'حدث خطأ أثناء محاولة عرض الطلب',
            error: { status: 500 }
        });
    }
};

// دالة مساعدة لإنشاء رمز دعوة فريد
function generateInviteCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
