const supabase = require('../db/db');

// Display list of posts waiting for approval
exports.getPendingPosts = async (req, res) => {
    try {
        // Extract user data
        const userId = req.user.id;
        
        // Fetch user data from database
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('display_name_ar, role, username')
            .eq('id', userId)
            .single();
            
        if (userError) {
            console.error('Error fetching user data:', userError);
            throw userError;
        }

        // Fetch pending posts
        const { data: posts, error } = await supabase
            .from('posts')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Pass user data and posts to the view
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
        console.error('Error fetching pending posts:', error);
        res.status(500).render('error', { 
            message: 'حدث خطأ أثناء محاولة جلب المنشورات المعلقة',
            error: { status: 500 }
        });
    }
};

// Approve a post
exports.approvePost = async (req, res) => {
    const { postId } = req.params;
    
    try {        // Check if post exists
        const { data: post, error: fetchError } = await supabase
            .from('posts')
            .select('id, user_id, title')
            .eq('id', postId)
            .single();
            
        if (fetchError || !post) {
            console.error('Post not found:', fetchError);
            return res.status(404).json({ 
                error: true, 
                message: 'المنشور غير موجود' 
            });
        }
        
        // Update post status to "published"
        const { error } = await supabase
            .from('posts')
            .update({ 
                status: 'published', 
                published_at: new Date() 
            })
            .eq('id', postId);

        if (error) throw error;

        // Send notification to author about post approval
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
        console.error('Error approving post:', error);
        res.status(500).json({ 
            error: true, 
            message: 'حدث خطأ في عملية الموافقة على المنشور' 
        });
    }
};

// Reject a post
exports.rejectPost = async (req, res) => {
    const { postId } = req.params;
    const { reason } = req.body;
    
    try {
        // Get post information first to know the author
        const { data: post, error: fetchError } = await supabase
            .from('posts')
            .select('user_id, title')
            .eq('id', postId)
            .single();
            
        if (fetchError || !post) {
            console.error('Post not found:', fetchError);
            return res.status(404).json({ 
                error: true, 
                message: 'المنشور غير موجود' 
            });
        }

        // Update post status to "rejected"
        const { error } = await supabase
            .from('posts')
            .update({ 
                status: 'rejected',
                rejection_reason: reason,
                updated_at: new Date()
            })
            .eq('id', postId);

        if (error) throw error;

        // Send notification to author
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
        console.error('Error rejecting post:', error);
        res.status(500).json({ 
            error: true, 
            message: 'حدث خطأ في عملية رفض المنشور' 
        });
    }
};

// Preview a pending post
exports.previewPost = async (req, res) => {
    const { postId } = req.params;
    
    try {
        // Fetch post information
        const { data: post, error: postError } = await supabase
            .from('posts')
            .select('*, users:user_id(*)')
            .eq('id', postId)
            .single();
            
        if (postError || !post) {
            console.error('Error fetching post data:', postError);
            return res.status(404).render('error', { 
                message: 'المنشور غير موجود',
                error: { status: 404 }
            });
        }
        
        // Verify that the post is pending or user is admin
        if (post.status !== 'pending' && req.user.role !== 'admin') {
            return res.status(403).render('error', { 
                message: 'غير مصرح لك بالوصول لهذا المنشور',
                error: { status: 403 }
            });
        }
        
        // Get author name
        const author = post.users;
        const authorName = author.display_name_ar || author.username;
        
        // Extract current user data
        const userId = req.user.id;
        
        // Fetch user data from database
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('display_name_ar, role')
            .eq('id', userId)
            .single();
            
        if (userError) {
            console.error('Error fetching user data:', userError);
            throw userError;
        }
        
        // Pass data to the view
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
        console.error('Error previewing post:', error);
        res.status(500).render('error', { 
            message: 'حدث خطأ أثناء محاولة عرض المنشور',
            error: { status: 500 }
        });
    }
};
