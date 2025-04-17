const express = require('express');
const router = express.Router();
const db = require('../db/db');

// صفحة إنشاء تدوينة
router.get('/create', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.render('create-post');
});

// تنفيذ عملية إنشاء التدوينة
router.post('/create', (req, res) => {
    const { title, content } = req.body;
    const userId = req.session.user.id;

    if (!title || !content) {
        return res.send('يرجى إدخال جميع الحقول');
    }

    const query = 'INSERT INTO posts (title, content, user_id) VALUES (?, ?, ?)';
    db.query(query, [title, content, userId], (err) => {
        if (err) {
            console.error('خطأ في إدخال التدوينة:', err);
            return res.send('حدث خطأ');
        }
        res.redirect('/dashboard');
    });
});

router.get('/select-edit', (req, res) => { // صفحة اختيار التدوينة للتعديل
    if (!req.session.user) return res.redirect('/login');

    db.query('SELECT * FROM posts WHERE user_id = ?', [req.session.user.id], (err, posts) => {
        if (err) return res.send('حدث خطأ');
        res.render('select-edit', { posts });
    });
});

router.get('/edit/:id', (req, res) => { // صفحة تعديل التدوينة
    const postId = req.params.id;
    db.query('SELECT * FROM posts WHERE id = ?', [postId], (err, results) => {
        if (err || results.length === 0) return res.send('لم يتم العثور على التدوينة');
        res.render('edit-post', { post: results[0] });
    });
});

router.post('/edit/:id', (req, res) => { // تنفيذ عملية تعديل التدوينة
    const postId = req.params.id;
    const { title, content } = req.body;

    db.query('UPDATE posts SET title = ?, content = ? WHERE id = ?', [title, content, postId], (err) => {
        if (err) return res.send('فشل التعديل');
        res.redirect('/dashboard');
    });
});

router.get('/select-delete', (req, res) => { // صفحة اختيار التدوينة للحذف
    if (!req.session.user) return res.redirect('/login');

    db.query('SELECT * FROM posts WHERE user_id = ?', [req.session.user.id], (err, posts) => {
        if (err) return res.send('حدث خطأ');
        res.render('select-delete', { posts });
    });
});

router.get('/delete/:id', (req, res) => { // تنفيذ عملية حذف التدوينة
    const postId = req.params.id;

    db.query('DELETE FROM posts WHERE id = ?', [postId], (err) => {
        if (err) return res.send('فشل الحذف');
        res.redirect('/dashboard');
    });
});

router.post('/delete/:id', (req, res) => {
    const postId = req.params.id;
    db.query('DELETE FROM posts WHERE id = ?', [postId], (err) => {
        if (err) return res.send('فشل الحذف');
        res.redirect('/posts/select-delete');
    });
});


module.exports = router;
// هذا هو ملف مسارات التدوينات، حيث يتم تعريف المسارات الخاصة بإنشاء التدوينات
// مثل صفحة إنشاء التدوينة وتنفيذ عملية إنشاء التدوينة