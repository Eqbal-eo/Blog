const express = require('express');
const router = express.Router();
const supabase = require('../db/db');
const multer = require('multer');
const path = require('path');
const { authenticateToken } = require('../middleware/authMiddleware');

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage });

// Get settings page
router.get('/settings', authenticateToken, async (req, res) => {
    try {
        // Get user ID from JWT
        const userId = req.user.id;
        console.log('Fetching settings for user:', userId);

        // Get user data including bio and display name
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('bio, display_name_ar, username')
            .eq('id', userId)
            .single();

        if (userError) {
            console.error('Error fetching user data:', userError);
            throw userError;
        }

        // Get settings for the user
        const { data: settings, error: settingsError } = await supabase
            .from('settings')
            .select('*')
            .eq('user_id', userId)
            .single();

        // We don't consider missing settings as an error
        if (settingsError && settingsError.code !== 'PGRST116') {
            console.error('Error fetching settings:', settingsError);
            throw settingsError;
        }

        console.log('Successfully fetched settings and user data');

        res.render('settings', { 
            settings: settings || {},
            user: {
                ...userData,
                id: userId
            }
        });
    } catch (err) {
        console.error('Error in settings route:', err);
        // Provide more detailed error message to user
        res.status(500).render('settings', {
            settings: {},
            user: { id: req.user.id },
            error: 'عذراً، حدث خطأ أثناء جلب الإعدادات. يرجى المحاولة مرة أخرى.'
        });
    }
});

// Update settings
router.post('/settings', authenticateToken, upload.single('profile_image'), async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            blog_title,
            blog_description,
            about_text,
            contact_info,
            email,
            bio,
            display_name_ar
        } = req.body;

        console.log('Updating settings for user:', userId);

        let profile_image = req.file ? `/uploads/${req.file.filename}` : undefined;

        // Update user bio and Arabic display name
        const { error: userError } = await supabase
            .from('users')
            .update({ 
                bio,
                display_name_ar 
            })
            .eq('id', userId);

        if (userError) {
            console.error('Error updating user data:', userError);
            throw userError;
        }

        // Check if settings exist for this user
        const { data: existingSettings, error: checkError } = await supabase
            .from('settings')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (checkError && checkError.code !== 'PGRST116') {
            console.error('Error checking existing settings:', checkError);
            throw checkError;
        }

        const settingsData = {
            blog_title,
            blog_description,
            about_text,
            contact_info,
            email,
            user_id: userId,
            ...(profile_image && { profile_image })
        };

        if (existingSettings) {
            // Update existing settings
            console.log('Updating existing settings');
            const { error: updateError } = await supabase
                .from('settings')
                .update(settingsData)
                .eq('id', existingSettings.id);

            if (updateError) {
                console.error('Error updating settings:', updateError);
                throw updateError;
            }
        } else {
            // Insert new settings
            console.log('Creating new settings');
            const { error: insertError } = await supabase
                .from('settings')
                .insert([settingsData]);

            if (insertError) {
                console.error('Error inserting settings:', insertError);
                throw insertError;
            }
        }

        console.log('Settings updated successfully');
        res.redirect('/settings');
    } catch (err) {
        console.error('Error in settings update:', err);
        res.status(500).render('settings', {
            settings: req.body,
            user: { id: req.user.id },
            error: 'عذراً، حدث خطأ أثناء حفظ الإعدادات. يرجى المحاولة مرة أخرى.'
        });
    }
});

router.get('/about', async (req, res) => {
    try {
        const { data: settings } = await supabase
            .from('settings')
            .select('about_text')
            .single();

        res.render('about', {
            aboutContent: settings?.about_text || 'مرحباً بك في مدونات آفاق، هذه النبذة قابلة للتعديل.'
        });
    } catch (err) {
        console.error(err);
        res.render('about', {
            aboutContent: 'مرحباً بك في مدونات آفاق، هذه النبذة قابلة للتعديل.'
        });
    }
});

router.get('/contact', async (req, res) => {
    try {
        const { data: settings } = await supabase
            .from('settings')
            .select('contact_info')
            .single();

        res.render('contact', {
            contactContent: settings?.contact_info || 'تواصل معنا عبر البريد أو مواقع التواصل.'
        });
    } catch (err) {
        console.error(err);
        res.render('contact', {
            contactContent: 'تواصل معنا عبر البريد أو مواقع التواصل.'
        });
    }
});
// Display blogs page
router.get('/blogs', async (req, res) => {
    try {
        // Fetch users with their personal bios and Arabic names
        const { data: users, error } = await supabase
            .from('users')
            .select('id, username, bio, display_name_ar');
            
        if (error) throw error;

        // Fetch posts and categories for each user
        const bloggers = await Promise.all(users.map(async (user) => {
            // Fetch published posts for the user
            const { data: posts, error: postsError } = await supabase
                .from('posts')
                .select('category')
                .eq('user_id', user.id)
                .eq('status', 'published');

            if (postsError) throw postsError;

            // Extract unique categories from posts
            const categories = [...new Set(posts.map(post => post.category).filter(Boolean))];

            return {
                id: user.id,
                name: user.display_name_ar || user.username,
                bio: user.bio || 'لم يتم إضافة نبذة بعد',
                articlesCount: posts.length,
                categories: categories
            };
        }));

        res.render('blogs', { bloggers });
    } catch (err) {
        console.error(err);
        res.send('حدث خطأ');
    }
});

// Display author's posts
router.get('/author/:id', async (req, res) => {
    try {
        const authorId = req.params.id;
        
        // Fetch author information
        const { data: author, error: authorError } = await supabase
            .from('users')
            .select('id, username, bio, display_name_ar')
            .eq('id', authorId)
            .single();

        if (authorError) throw authorError;

        // Fetch author's posts
        const { data: posts, error: postsError } = await supabase
            .from('posts')
            .select(`
                id,
                title,
                content,
                category,
                created_at,
                status
            `)
            .eq('user_id', authorId)
            .eq('status', 'published')
            .order('created_at', { ascending: false });

        if (postsError) throw postsError;

        // Fetch blog settings for the author
        const { data: settings, error: settingsError } = await supabase
            .from('settings')
            .select('blog_title, blog_description, about_text, contact_info, email')
            .eq('user_id', authorId)
            .single();

        // We don't want to stop the process if there are no settings
        const finalSettings = settingsError ? {} : settings;

        res.render('author', {
            author: {
                id: author.id,
                username: author.username,
                name: author.display_name_ar || author.username,
                bio: author.bio || 'لم يتم إضافة نبذة بعد'
            },
            posts: posts,
            settings: finalSettings
        });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).send('حدث خطأ في جلب تدوينات الكاتب');
    }
});

module.exports = router;