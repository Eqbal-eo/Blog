const express = require('express');
const router = express.Router();
const supabase = require('../db/db');
const { authenticateToken } = require('../middleware/authMiddleware');
const { sanitize } = require('../utils/sanitize');

// Apply middleware to all post routes
router.use(authenticateToken);

router.get('/create', async (req, res) => {
    try {
        // Fetch user's Arabic name
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
    const userId = req.user.id; // Use user data from JWT

    if (!title || !content || !category) {
        return res.send('يرجى إدخال جميع الحقول');
    }

    // Authors may only save a draft or submit for review; publishing requires admin approval
    const isAdmin = req.user.role === 'admin';
    const allowedStatuses = isAdmin ? ['draft', 'pending', 'published'] : ['draft', 'pending'];
    const postStatus = allowedStatuses.includes(status) ? status : 'pending';

    try {        const { error } = await supabase
            .from('posts')
            .insert([{
                title,
                content: sanitize(content),
                category,
                user_id: userId,
                status: postStatus,
                created_at
            }]);

        if (error) throw error;
        
        // If post is pending review, display message to user
        if (postStatus === 'pending') {
            // Can use res.locals to pass success information to dashboard
            // Here we use temporary session to store success message
            res.cookie('success_message', 'تم إرسال تدوينتك بنجاح وهي في انتظار مراجعة المشرف', { 
                maxAge: 5000, // Will disappear after 5 seconds
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
        // Fetch user's Arabic name
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
        
        // Sort rejected posts at the beginning
        if (posts) {
            posts.sort((a, b) => {
                // Place rejected posts at the beginning
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

    try {
        // Load the post and make sure it belongs to the current user
        const { data: oldPostData, error: fetchError } = await supabase
            .from('posts')
            .select('status, rejection_reason')
            .eq('id', postId)
            .eq('user_id', req.user.id)
            .maybeSingle();

        if (fetchError) throw fetchError;

        if (!oldPostData) {
            return res.status(403).render('error', {
                message: 'لا يمكنك تعديل تدوينة لا تملكها',
                error: { status: 403 }
            });
        }

        // Decide the new status on the server. A post that was never approved
        // cannot be published by its author: it goes to review instead.
        const isAdmin = req.user.role === 'admin';
        const wasPublished = oldPostData.status === 'published';
        let postStatus;
        if (resubmit === 'true') {
            postStatus = 'pending';
        } else if (status === 'draft') {
            postStatus = 'draft';
        } else if (status === 'published') {
            postStatus = (isAdmin || wasPublished) ? 'published' : 'pending';
        } else if (status === 'pending') {
            postStatus = 'pending';
        } else {
            postStatus = oldPostData.status;
        }

        const updateData = {
            title,
            content: sanitize(content),
            category,
            status: postStatus,
            created_at,
            updated_at: new Date()
        };
        
        // If post was previously rejected and is being resubmitted, delete rejection reason
        if (oldPostData.status === 'rejected' && resubmit === 'true') {
            updateData.rejection_reason = null;
        }

        const { error } = await supabase
            .from('posts')
            .update(updateData)
            .eq('id', postId)
            .eq('user_id', req.user.id);

        if (error) throw error;
        
        // If post is resubmitted after rejection, add success message
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
        // Fetch user's Arabic name
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
            .eq('user_id', req.user.id); // Ensure user is deleting only their own post

        if (error) throw error;
        res.redirect('/posts/select-delete');
    } catch (err) {
        console.error('خطأ في حذف التدوينة:', err);
        res.send('فشل الحذف');
    }
});

// New route for multiple deletion
router.post('/delete-multiple', async (req, res) => {
    const { postIds } = req.body;
    
    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
        return res.status(400).json({ error: 'لم يتم تحديد تدوينات للحذف' });
    }
    
    try {
        // Verify that all selected posts belong to current user
        const { data: userPosts, error: checkError } = await supabase
            .from('posts')
            .select('id')
            .eq('user_id', req.user.id)
            .in('id', postIds);
            
        if (checkError) throw checkError;
        
        // Ensure number of retrieved posts matches number of sent posts
        if (userPosts.length !== postIds.length) {
            return res.status(403).json({ error: 'لا يمكنك حذف تدوينات لا تملكها' });
        }
        
        // Delete posts
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