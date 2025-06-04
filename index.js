// Load environment variables at the very beginning
const dotenv = require('dotenv');
const path = require('path');

// Explicitly load the .env file
const result = dotenv.config({ path: path.resolve(__dirname, '.env') });
if (result.error) {
    console.error('Error loading .env file:', result.error);
}

const express = require('express');
const cookieParser = require('cookie-parser'); // إضافة معالج الكوكيز
const db = require('./db/db'); // ملف الاتصال بقاعدة البيانات

// استدعاء الراوتات
const authRoutes = require('./routes/authRoutes');
const mainRoutes = require('./routes/mainRoutes');
const postRoutes = require('./routes/postRoutes');
const pagesRoutes = require('./routes/pagesRoutes');
const adminRoutes = require('./routes/adminRoutes'); // إضافة مسارات المشرف
const notificationRoutes = require('./routes/notificationRoutes'); // إضافة مسارات الإشعارات
const blogRequestRoutes = require('./routes/blogRequestRoutes'); // إضافة مسارات طلبات المدونات

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
app.use('/', blogRequestRoutes); // إضافة مسارات طلبات المدونات

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`JWT_SECRET exists: ${!!process.env.JWT_SECRET}`);
    console.log(`SUPABASE_URL exists: ${!!process.env.SUPABASE_URL}`);
});

module.exports = app;