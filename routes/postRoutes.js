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

router.post('/create', async (req, res) => {
    const { title, content, status, category, created_at } = req.body;
    const userId = req.user.id; // استخدام بيانات المستخدم من JWT

    if (!title || !content || !category) {
        return res.send('يرجى إدخال جميع الحقول');
    }

    const postStatus = status || 'published';

    try {
        const { error } = await supabase
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
            .eq('user_id', req.user.id);

        if (error) throw error;
        
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
    const { title, content, status, category, created_at } = req.body;

    if (!title || !content || !category) {
        return res.send('يرجى إدخال جميع الحقول');
    }

    const postStatus = status || 'published';

    try {
        const { error } = await supabase
            .from('posts')
            .update({
                title,
                content,
                category,
                status: postStatus,
                created_at
            })
            .eq('id', postId);

        if (error) throw error;
        res.redirect('/dashboard');
    } catch (err) {
        res.send('فشل التعديل');
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
            .eq('id', postId);

        if (error) throw error;
        res.redirect('/posts/select-delete');
    } catch (err) {
        res.send('فشل الحذف');
    }
});

module.exports = router;