const express = require('express');
const router = express.Router();
const supabase = require('../db/db');
const { authenticateToken } = require('../middleware/authMiddleware');

// تطبيق middleware على جميع مسارات التدوينات
router.use(authenticateToken);

router.get('/create', (req, res) => {
    res.render('create-post');
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
        const { data: posts, error } = await supabase
            .from('posts')
            .select('*')
            .eq('user_id', req.user.id); // استخدام بيانات المستخدم من JWT

        if (error) throw error;
        res.render('select-edit', { posts });
    } catch (err) {
        res.send('حدث خطأ');
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
        const { data: posts, error } = await supabase
            .from('posts')
            .select('*')
            .eq('user_id', req.user.id); // استخدام بيانات المستخدم من JWT

        if (error) throw error;
        res.render('select-delete', { posts });
    } catch (err) {
        res.send('حدث خطأ');
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