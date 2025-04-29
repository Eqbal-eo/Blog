const express = require('express');
const router = express.Router();
const db = require('../db/db');

const { route } = require("./pagesRoutes");

let aboutContent = "مرحباً بك في مدونة آفاق، هذه النبذة قابلة للتعديل.";
let contactContent = "تواصل معنا عبر البريد أو مواقع التواصل.";

// عرض الصفحات
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
router.get('/blogs', (req, res) => {
    db.query('SELECT users.id, users.name, users.bio, COUNT(posts.id) AS post_count FROM blogs LEFT JOIN posts ON users.id = posts.user_id GROUP BY users.id', (err, blogs) => {
        if (err) {
            console.error(err);
            return res.send('حدث خطأ');
        }
        res.render('blogs', { blogs }); // إرسال البيانات للواجهة
    });
});
module.exports = router;