const express = require('express');
const router = express.Router();
const supabase = require('../db/db');

router.get('/', async (req, res) => {
    const postsPerPage = 5;
    const page = parseInt(req.query.page) || 1;
    const start = (page - 1) * postsPerPage;
    const end = start + postsPerPage - 1;    try {
        // جلب الإعدادات مع معالجة حالة عدم وجود بيانات
        const { data: settings, error: settingsError } = await supabase
            .from('settings')
            .select('*')
            .limit(1)
            .single();
            
        // إذا لم توجد إعدادات، استخدم قيم افتراضية
        const defaultSettings = {
            blog_title: 'مدونات آفاق',
            blog_description: 'منصة للتدوين والنشر'
        };
        
        const finalSettings = settings || defaultSettings;
    
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
                    username,
                    display_name_ar
                )
            `)
            .eq('status', 'published')
            .order('created_at', { ascending: false })
            .range(start, end);
    
        if (postsError) {
            throw new Error('حدث خطأ أثناء جلب التدوينات');
        }

        // تعديل posts لاستخدام الاسم العربي إذا كان متوفراً
        posts.forEach(post => {
            if (post.users) {
                post.users.displayName = post.users.display_name_ar || post.users.username;
            }
        });        res.render('home', {
            site: finalSettings,
            posts,
            pages: Array.from({ length: totalPages }, (_, i) => totalPages - i),
            currentPage: page
        });
    } catch (err) {
        console.error(err);
        res.send(err.message || 'حدث خطأ');
    }
});    
// عرض صفحة التدوينة المفردة
router.get('/article/:id', async (req, res) => {
    const postId = req.params.id;

    try {
        // Get the post data first
        const { data: post, error: postError } = await supabase 
            .from('posts')
            .select(`
                *,
                users (
                    username,
                    display_name_ar
                )
            `)
            .eq('id', postId)
            .eq('status', 'published')
            .single();

        if (postError || !post) {
            throw new Error('التدوينة غير موجودة أو حدث خطأ');
        }

        // Try to get settings, but don't fail if they don't exist
        const { data: settings } = await supabase
            .from('settings')
            .select('*')
            .single();

        // استخدام الاسم العربي إذا كان متوفراً
        if (post.users) {
            post.users.displayName = post.users.display_name_ar || post.users.username;
        }

        // نحول created_at إلى كائن Date
        post.created_at = new Date(post.created_at);

        // Render the page with or without settings
        res.render('post', {
            site: settings || {},
            post
        });

    } catch (err) {
        console.error(err);
        res.status(404).send(err.message || 'حدث خطأ في تحميل التدوينة');
    }
});

module.exports = router;