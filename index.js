require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser'); // إضافة معالج الكوكيز
const path = require('path');
const db = require('./db/db'); // ملف الاتصال بقاعدة البيانات

// تطبيق إعدادات الإنتاج إذا لزم الأمر
const applyProductionConfig = require('./config/production');

// استدعاء الراوتات
const authRoutes = require('./routes/authRoutes');
const mainRoutes = require('./routes/mainRoutes');
const postRoutes = require('./routes/postRoutes');
const pagesRoutes = require('./routes/pagesRoutes'); 
const adminRoutes = require('./routes/adminRoutes'); // إضافة مسارات المشرف
const notificationRoutes = require('./routes/notificationRoutes'); // إضافة مسارات الإشعارات
const blogRequestRoutes = require('./routes/blogRequestRoutes'); // إضافة مسارات طلبات المدونات

const app = express(); 
const PORT = process.env.PORT || 3000;

// تطبيق إعدادات الإنتاج
applyProductionConfig(app);

// تحديد ما إذا كان التطبيق يعمل في بيئة الإنتاج أو التطوير
const isProduction = process.env.NODE_ENV === 'production';
const domain = isProduction ? '.afaq.blog' : 'localhost';

// استخدام معالج الكوكيز مع إعدادات محسنة
app.use(cookieParser(process.env.SESSION_SECRET, {
    secure: isProduction,
    httpOnly: true,
    sameSite: isProduction ? 'strict' : 'lax'
}));

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
app.use('/', blogRequestRoutes); // إضافة مسارات طلبات المدونات

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔒 Security: ${process.env.NODE_ENV === 'production' ? 'Production mode enabled' : 'Development mode'}`);
});

module.exports = app;
