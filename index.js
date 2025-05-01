require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./db/db'); // ملف الاتصال بقاعدة البيانات
const Memorystore = require('memorystore')(session); // استيراد memorystore

// استدعاء الراوتات
const authRoutes = require('./routes/authRoutes');
const mainRoutes = require('./routes/mainRoutes');
const postRoutes = require('./routes/postRoutes');
const pagesRoutes = require('./routes/pagesRoutes'); 

const app = express();
const PORT = 3000;

// إعداد الجلسات مع Memorystore
const sessionStore = new Memorystore({
    checkPeriod: 86400000 // التحقق من الجلسات القديمة كل 24 ساعة
});

app.use(session({
    secret: 'mySecretKey',
    resave: false,
    saveUninitialized: false,
    store: sessionStore, // استخدام memorystore لتخزين الجلسات
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 ساعة
        sameSite: 'lax'
    }
}));

// إعداد المحركات وملفات الواجهة
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// تحليل بيانات النماذج و JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// تتبع الجلسات في كل طلب
app.use((req, res, next) => {
    console.log(`🛜 [${req.method}] ${req.url} - session ID: ${req.sessionID}`);
    console.log('جلسة المستخدم:', req.session);
    next();
});

// مسارات التطبيق
app.use('/', authRoutes);  
app.use('/', mainRoutes);
app.use('/posts', postRoutes);
app.use('/', pagesRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

module.exports = app;
