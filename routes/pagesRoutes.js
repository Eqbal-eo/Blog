const express = require('express');
const router = express.Router();
const supabase = require('../db/db');
const multer = require('multer');
const path = require('path');

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

// Middleware to check if user is authenticated
const checkAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
};

// Get settings page
router.get('/settings', checkAuth, async (req, res) => {
    try {
        const { data: settings, error } = await supabase
            .from('settings')
            .select('*')
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows returned
            throw error;
        }

        res.render('settings', { settings: settings || {} });
    } catch (err) {
        console.error('Error fetching settings:', err);
        res.status(500).send('حدث خطأ في جلب الإعدادات');
    }
});

// Update settings
router.post('/settings', checkAuth, upload.single('profile_image'), async (req, res) => {
    try {
        const {
            blog_title,
            blog_description,
            about_text,
            contact_info,
            email
        } = req.body;

        let profile_image = req.file ? `/uploads/${req.file.filename}` : undefined;

        // Check if settings exist
        const { data: existingSettings } = await supabase
            .from('settings')
            .select('id')
            .single();

        if (existingSettings) {
            // Update existing settings
            const { error: updateError } = await supabase
                .from('settings')
                .update({
                    blog_title,
                    blog_description,
                    about_text,
                    contact_info,
                    email,
                    ...(profile_image && { profile_image })
                })
                .eq('id', existingSettings.id);

            if (updateError) throw updateError;
        } else {
            // Insert new settings
            const { error: insertError } = await supabase
                .from('settings')
                .insert([{
                    blog_title,
                    blog_description,
                    about_text,
                    contact_info,
                    email,
                    profile_image
                }]);

            if (insertError) throw insertError;
        }

        res.redirect('/settings');
    } catch (err) {
        console.error('Error updating settings:', err);
        res.status(500).send('حدث خطأ في تحديث الإعدادات');
    }
});

router.get('/about', async (req, res) => {
    try {
        const { data: settings } = await supabase
            .from('settings')
            .select('about_text')
            .single();

        res.render('about', { 
            aboutContent: settings?.about_text || 'مرحباً بك في مدونة آفاق، هذه النبذة قابلة للتعديل.'
        });
    } catch (err) {
        console.error(err);
        res.render('about', { 
            aboutContent: 'مرحباً بك في مدونة آفاق، هذه النبذة قابلة للتعديل.'
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

router.get('/blogs', async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select(`
                id,
                username,
                bio,
                posts (count)
            `);

        if (error) throw error;

        const bloggers = users.map(user => ({
            name: user.username,
            bio: user.bio || 'لم يتم إضافة نبذة بعد',
            articlesCount: user.posts?.[0]?.count || 0
        }));

        res.render('blogs', { bloggers });
    } catch (err) {
        console.error(err);
        res.send('حدث خطأ');
    }
});

module.exports = router;