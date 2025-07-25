require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser'); // إضافة معالج الكوكيز
const path = require('path');
const db = require('./db/db'); // ملف الاتصال بقاعدة البيانات

// استدعاء الراوتات
const authRoutes = require('./routes/authRoutes');
const mainRoutes = require('./routes/mainRoutes');
const postRoutes = require('./routes/postRoutes');
const pagesRoutes = require('./routes/pagesRoutes'); 
const adminRoutes = require('./routes/adminRoutes'); // إضافة مسارات المشرف
const notificationRoutes = require('./routes/notificationRoutes'); // إضافة مسارات الإشعارات

const app = express(); 
const PORT = 3000; 

// تحديد ما إذا كان التطبيق يعمل في بيئة الإنتاج أو التطوير
const isProduction = process.env.NODE_ENV === 'production';
const domain = isProduction ? '.afaq.blog' : 'localhost';

// استخدام معالج الكوكيز بدلاً من الجلسات
app.use(cookieParser());

// إعداد المحركات وملفات الواجهة
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// تحليل بيانات النماذج و JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
 
// مسارات التطبيق
app.use('/', authRoutes); 
app.use('/', mainRoutes);
app.use('/posts', postRoutes);
app.use('/', pagesRoutes); 
app.use('/admin', adminRoutes); // إضافة مسارات المشرف
app.use('/notifications', notificationRoutes); // إضافة مسارات الإشعارات

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
}); 

module.exports = app; 