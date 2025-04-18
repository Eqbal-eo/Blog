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

    db.query('SELECT * FROM posts WHERE user_id = ?', [req.session.user.id], (err, posts) => { // استعلام لجلب التدوينات الخاصة بالمستخدم
        if (err) return res.send('حدث خطأ');
        res.render('select-edit', { posts }); // تمرير التدوينات إلى الصفحة
    });
});

router.post('/edit/:id', (req, res) => { // تنفيذ عملية تعديل التدوينة
    const postId = req.params.id; // الحصول على معرف التدوينة من الرابط
    if (!req.session.user) return res.redirect('/login'); // تحقق من تسجيل الدخول
    const { title, content } = req.body;    // الحصول على عنوان ومحتوى التدوينة من النموذج
    // تحقق من وجود الحقول
    if (!title || !content) {
        return res.send('يرجى إدخال جميع الحقول'); // إذا كانت الحقول فارغة، إظهار رسالة خطأ
    }
    // استعلام لتحديث التدوينة في قاعدة البيانات
    // استخدام معرف المستخدم للتحقق من ملكية التدوينة
    db.query('UPDATE posts SET title = ?, content = ? WHERE id = ?', [title, content, postId], (err) => { // تنفيذ الاستعلام
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

router.post('/delete/:id', (req, res) => { // تنفيذ عملية حذف التدوينة
    const postId = req.params.id;
    db.query('DELETE FROM posts WHERE id = ? AND user_id = ?', [postId], (err) => {
        if (err) return res.send('فشل الحذف');
        res.redirect('/posts/select-delete');
    });
});

module.exports = router;
// هذا هو ملف مسارات التدوينات (postRoutes.js) الذي يتعامل مع إنشاء وتعديل وحذف التدوينات في التطبيق.