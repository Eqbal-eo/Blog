const express = require('express');
const router = express.Router();
const supabase = require('../db/db');

router.get('/', async (req, res) => {
    const postsPerPage = 5;
    const page = parseInt(req.query.page) || 1;
    const start = (page - 1) * postsPerPage;
    const end = start + postsPerPage - 1;

    try {
        const { data: settings, error: settingsError } = await supabase
            .from('settings')
            .select('*')
            .single();

        if (settingsError) {
            throw new Error('خطأ في تحميل إعدادات الموقع');
        }

        const { count: totalPosts } = await supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'published');

        const totalPages = Math.ceil(totalPosts / postsPerPage);

        const { data: posts, error: postsError } = await supabase
            .from('posts')
            .select(`
                *,
                users (
                    username
                )
            `)
            .eq('status', 'published')
            .order('created_at', { ascending: false })
            .range(start, end);

        if (postsError) {
            throw new Error('حدث خطأ أثناء جلب التدوينات');
        }

        res.render('home', {
            site: settings,
            posts,
            pages: Array.from({ length: totalPages }, (_, i) => totalPages - i),
            currentPage: page
        });
    } catch (err) {
        console.error(err);
        res.send(err.message || 'حدث خطأ');
    }
});

router.get('/article/:id', async (req, res) => {
    const postId = req.params.id;

    try {
        const { data: settings, error: settingsError } = await supabase
            .from('settings')
            .select('*')
            .single();

        if (settingsError) {
            throw new Error('خطأ في تحميل إعدادات الموقع');
        }

        const { data: post, error: postError } = await supabase
            .from('posts')
            .select(`
                *,
                users (
                    username
                )
            `)
            .eq('id', postId)
            .eq('status', 'published')
            .single();

        if (postError || !post) {
            throw new Error('التدوينة غير موجودة أو حدث خطأ');
        }

        // نحول created_at إلى كائن Date
        post.created_at = new Date(post.created_at);

        res.render('post', {
            site: settings,
            post
        });

    } catch (err) {
        console.error(err);
        res.send(err.message || 'حدث خطأ');
    }
});

module.exports = router;