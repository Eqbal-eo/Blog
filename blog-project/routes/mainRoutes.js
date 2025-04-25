const express = require('express');
const router = express.Router();
const db = require('../db/db');

// الصفحة الرئيسية
router.get('/', (req, res) => {
    const postsPerPage = 5;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * postsPerPage;

    db.query('SELECT * FROM settings LIMIT 1', (err, settingsResult) => {
        if (err || settingsResult.length === 0) {
            console.error(err);
            return res.send('خطأ في تحميل إعدادات الموقع');
        }

        const site = settingsResult[0];

        db.query('SELECT COUNT(*) AS total FROM posts WHERE status = "published"', (err, countResult) => {
            if (err) {
                console.error(err);
                return res.send('خطأ في حساب عدد التدوينات');
            }

            const totalPosts = countResult[0].total;
            const totalPages = Math.ceil(totalPosts / postsPerPage);

            db.query(
                'SELECT posts.*, users.username FROM posts JOIN users ON posts.user_id = users.id WHERE posts.status = "published" ORDER BY created_at DESC LIMIT ? OFFSET ?',
                [postsPerPage, offset],
                (err, posts) => {
                    if (err) {
                        console.error(err);
                        return res.send('حدث خطأ أثناء جلب التدوينات');
                    }

                    res.render('home', {
                        site,
                        posts,
                        pages: Array.from({ length: totalPages }, (_, i) => totalPages - i),
                        currentPage: page
                    });
                }
            );
        });
    });
});

// صفحة تدوينة واحدة
router.get('/posts/:id', (req, res) => {
    const postId = req.params.id;

    db.query('SELECT * FROM settings LIMIT 1', (err, settingsResult) => {
        if (err || settingsResult.length === 0) {
            return res.send('خطأ في تحميل الإعدادات');
        }

        const site = settingsResult[0];

        db.query(
            'SELECT posts.*, users.username FROM posts JOIN users ON posts.user_id = users.id WHERE posts.id = ? AND posts.status = "published"',
            [postId],
            (err, results) => {
                if (err || results.length === 0) {
                    return res.send('التدوينة غير موجودة أو لم يتم نشرها');
                }

                const post = results[0];
                res.render('post', { site, post });
            }
        );
    });
});


module.exports = router;