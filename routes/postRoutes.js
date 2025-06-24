const express = require('express');
const router = express.Router();
const supabase = require('../db/db');
const { authenticateToken } = require('../middleware/authMiddleware');

// تطبيق middleware على جميع مسارات التدوينات
router.use(authenticateToken);

router.get('/create', async (req, res) => {
    try {
        // جلب الاسم العربي للمستخدم
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('display_name_ar')
            .eq('id', req.user.id)
            .single();
            
        if (userError) {
            console.error('خطأ في جلب بيانات المستخدم:', userError);
            throw userError;
        }
        
        res.render('create-post', {
            user: {
                ...req.user,
                display_name_ar: userData.display_name_ar
            }
        });
    } catch (err) {
        console.error('خطأ في عرض صفحة إنشاء التدوينة:', err);
        res.redirect('/dashboard');
    }
});

router.post('/create', async (req, res) => {    const { title, content, status, category, created_at } = req.body;
    const userId = req.user.id; // استخدام بيانات المستخدم من JWT

    if (!title || !content || !category) {
        return res.send('يرجى إدخال جميع الحقول');
    }

    // التحقق من وجود حالة وإلا تعيين الحالة الافتراضية إلى "pending"
    const postStatus = status || 'pending';

    try {        const { error } = await supabase
            .from('posts')
            .insert([{
                title,
                content,
                category,
                user_id: userId,
                status: postStatus,
                created_at
            }]);

        if (error) throw error;
        
        // إذا كانت التدوينة في انتظار المراجعة، عرض رسالة للمستخدم
        if (postStatus === 'pending') {
            // يمكن استخدام res.locals لتمرير معلومات النجاح إلى لوحة التحكم
            // هنا نستخدم جلسة مؤقتة لتخزين رسالة النجاح
            res.cookie('success_message', 'تم إرسال تدوينتك بنجاح وهي في انتظار مراجعة المشرف', { 
                maxAge: 5000, // ستختفي بعد 5 ثوان
                httpOnly: true 
            });
        }
        
        res.redirect('/dashboard');
    } catch (err) {
        console.error('خطأ في إدخال التدوينة:', err);
        res.send('حدث خطأ');
    }
});

router.get('/select-edit', async (req, res) => {
    try {
        // جلب الاسم العربي للمستخدم
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('display_name_ar')
            .eq('id', req.user.id)
            .single();
            
        if (userError) {
            console.error('خطأ في جلب بيانات المستخدم:', userError);
            throw userError;
        }
        
        const { data: posts, error } = await supabase
            .from('posts')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        // ترتيب المنشورات المرفوضة في البداية
        if (posts) {
            posts.sort((a, b) => {
                // وضع المنشورات المرفوضة في البداية
                if (a.status === 'rejected' && b.status !== 'rejected') return -1;
                if (a.status !== 'rejected' && b.status === 'rejected') return 1;
                return 0;
            });
        }
        
        res.render('select-edit', { 
            posts,
            user: {
                ...req.user,
                display_name_ar: userData.display_name_ar
            }
        });
    } catch (err) {
        console.error('خطأ في عرض صفحة تحديد التدوينة للتعديل:', err);
        res.redirect('/dashboard');
    }
});

router.post('/edit/:id', async (req, res) => {
    const postId = req.params.id;
    const { title, content, status, category, created_at, resubmit } = req.body;

    if (!title || !content || !category) {
        return res.send('يرجى إدخال جميع الحقول');
    }

    // التعامل مع إعادة تقديم التدوينات المرفوضة
    let postStatus = status || 'published';
    
    // إذا كانت التدوينة مرفوضة وتم إعادة تقديمها
    if (resubmit === 'true') {
        postStatus = 'pending';
    }

    try {
        // التحقق من حالة التدوينة قبل التعديل
        const { data: oldPostData, error: fetchError } = await supabase
            .from('posts')
            .select('status, rejection_reason')
            .eq('id', postId)
            .single();
            
        if (fetchError) throw fetchError;
        
        const updateData = {
            title,
            content,
            category,
            status: postStatus,
            created_at,
            updated_at: new Date()
        };
        
        // إذا كانت التدوينة مرفوضة سابقاً وتم إعادة تقديمها، نحذف سبب الرفض
        if (oldPostData.status === 'rejected' && resubmit === 'true') {
            updateData.rejection_reason = null;
        }

        const { error } = await supabase
            .from('posts')
            .update(updateData)
            .eq('id', postId);

        if (error) throw error;
        
        // إذا تم إعادة تقديم المنشور بعد الرفض، نضيف رسالة نجاح
        if (oldPostData.status === 'rejected' && resubmit === 'true') {
            res.cookie('success_message', 'تم إعادة تقديم التدوينة بنجاح وهي في انتظار المراجعة مرة أخرى', { 
                maxAge: 5000, 
                httpOnly: true 
            });
        }
        
        res.redirect('/dashboard');
    } catch (err) {
        console.error('فشل التعديل:', err);
        res.status(500).render('error', { 
            message: 'حدث خطأ أثناء تعديل التدوينة',
            error: { status: 500 }
        });
    }
});

router.get('/select-delete', async (req, res) => {
    try {
        // جلب الاسم العربي للمستخدم
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('display_name_ar')
            .eq('id', req.user.id)
            .single();
            
        if (userError) {
            console.error('خطأ في جلب بيانات المستخدم:', userError);
            throw userError;
        }
        
        const { data: posts, error } = await supabase
            .from('posts')
            .select('*')
            .eq('user_id', req.user.id);

        if (error) throw error;
        
        res.render('select-delete', { 
            posts,
            user: {
                ...req.user,
                display_name_ar: userData.display_name_ar
            }
        });
    } catch (err) {
        console.error('خطأ في عرض صفحة تحديد التدوينة للحذف:', err);
        res.redirect('/dashboard');
    }
});

router.post('/delete/:id', async (req, res) => {
    const postId = req.params.id;
    
    try {
        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId)
            .eq('user_id', req.user.id); // التأكد من أن المستخدم يحذف تدوينته فقط

        if (error) throw error;
        res.redirect('/posts/select-delete');
    } catch (err) {
        console.error('خطأ في حذف التدوينة:', err);
        res.send('فشل الحذف');
    }
});

// مسار جديد للحذف المتعدد
router.post('/delete-multiple', async (req, res) => {
    const { postIds } = req.body;
    
    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
        return res.status(400).json({ error: 'لم يتم تحديد تدوينات للحذف' });
    }
    
    try {
        // التحقق من أن جميع التدوينات المحددة تخص المستخدم الحالي
        const { data: userPosts, error: checkError } = await supabase
            .from('posts')
            .select('id')
            .eq('user_id', req.user.id)
            .in('id', postIds);
            
        if (checkError) throw checkError;
        
        // التأكد من أن عدد التدوينات المسترجعة يطابق عدد التدوينات المرسلة
        if (userPosts.length !== postIds.length) {
            return res.status(403).json({ error: 'لا يمكنك حذف تدوينات لا تملكها' });
        }
        
        // حذف التدوينات
        const { error: deleteError } = await supabase
            .from('posts')
            .delete()
            .eq('user_id', req.user.id)
            .in('id', postIds);
            
        if (deleteError) throw deleteError;
        
        res.json({ 
            success: true, 
            message: `تم حذف ${postIds.length} تدوينة بنجاح`,
            deletedCount: postIds.length 
        });
        
    } catch (err) {
        console.error('خطأ في الحذف المتعدد:', err);
        res.status(500).json({ error: 'فشل في حذف التدوينات' });
    }
});

module.exports = router;