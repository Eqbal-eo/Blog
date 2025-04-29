require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./db/db'); // ملف الاتصال بقاعدة البيانات

// استدعاء الراوتات
const authRoutes = require('./routes/authRoutes');
const mainRoutes = require('./routes/mainRoutes');
const postRoutes = require('./routes/postRoutes');
const pagesRoutes = require('./routes/pagesRoutes'); // إذا كان لديك مسارات إضافية

const app = express();
const PORT = 3000;

// إعداد الجلسات
app.use(session({
    secret: 'mySecretKey',
    resave: false,
    saveUninitialized: true
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
 
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

module.exports = app;
