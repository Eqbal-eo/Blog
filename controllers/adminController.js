const supabase = require('../db/db');

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
