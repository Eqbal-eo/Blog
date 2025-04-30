const express = require('express');
const router = express.Router();
const supabase = require('../db/db');

let aboutContent = "مرحباً بك في مدونة آفاق، هذه النبذة قابلة للتعديل.";
let contactContent = "تواصل معنا عبر البريد أو مواقع التواصل.";

router.get('/about', (req, res) => {
    res.render('about', { aboutContent });
});

router.get('/contact', (req, res) => {
    res.render('contact', { contactContent });
});

router.get('/settings', (req, res) => {
    res.render('settings', { aboutContent, contactContent });
});

router.post('/settings', (req, res) => {
    aboutContent = req.body.aboutContent;
    contactContent = req.body.contactContent;
    res.redirect('/');
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