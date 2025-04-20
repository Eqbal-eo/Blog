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
    const { title, content, status } = req.body;  // إضافة الحقل status
    const userId = req.session.user.id;

    if (!title || !content) {
        return res.send('يرجى إدخال جميع الحقول');
    }

    // إذا لم يتم إرسال حالة النشر، سيتم تعيينها كـ "منشورة" افتراضيًا
    const postStatus = status || 'published'; 

    const query = 'INSERT INTO posts (title, content, user_id, status) VALUES (?, ?, ?, ?)';
    db.query(query, [title, content, userId, postStatus], (err) => {
        if (err) {
            console.error('خطأ في إدخال التدوينة:', err);
            return res.send('حدث خطأ');
        }
        res.redirect('/dashboard');
    });
});

// عرض التدوينات الخاصة بالمستخدم مع حالة النشر
router.get('/select-edit', (req, res) => { 
    if (!req.session.user) return res.redirect('/login');

    db.query('SELECT * FROM posts WHERE user_id = ?', [req.session.user.id], (err, posts) => { 
        if (err) return res.send('حدث خطأ');
        res.render('select-edit', { posts });
    });
});

// تنفيذ عملية تعديل التدوينة
router.post('/edit/:id', (req, res) => { 
    const postId = req.params.id;
    if (!req.session.user) return res.redirect('/login'); 
    const { title, content, status } = req.body; 

    if (!title || !content) {
        return res.send('يرجى إدخال جميع الحقول');
    }

    const postStatus = status || 'published'; // إذا لم يتم إرسال حالة النشر، سيتم تعيينها كـ "منشورة" افتراضيًا

    db.query('UPDATE posts SET title = ?, content = ?, status = ? WHERE id = ?', [title, content, postStatus, postId], (err) => {
        if (err) return res.send('فشل التعديل');
        res.redirect('/dashboard');
    });
});

// صفحة اختيار التدوينة للحذف
router.get('/select-delete', (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    db.query('SELECT * FROM posts WHERE user_id = ?', [req.session.user.id], (err, posts) => {
        if (err) return res.send('حدث خطأ');
        res.render('select-delete', { posts });
    });
});

// تنفيذ عملية حذف التدوينة
router.post('/delete/:id', (req, res) => { 
    const postId = req.params.id;
    db.query('DELETE FROM posts WHERE id = ?', [postId], (err) => {
        if (err) return res.send('فشل الحذف');
        res.redirect('/posts/select-delete');
    });
});

module.exports = router;
