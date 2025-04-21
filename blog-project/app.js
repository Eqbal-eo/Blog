const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./db/db'); // ملف الاتصال بقاعدة البيانات

// استدعاء الراوتات
const authRoutes = require('./routes/authRoutes');
const mainRoutes = require('./routes/mainRoutes');
const postRoutes = require('./routes/postRoutes');

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
app.use(authRoutes);
app.use('/', mainRoutes);
app.use('/posts', postRoutes);

// الصفحة الرئيسية (يمكن حذفه إذا كانت موجودة ضمن mainRoutes)
app.get('/', (req, res) => {
    res.render('home');
});
let aboutContent = "مرحباً بك في مدونة آفاق، هذه النبذة قابلة للتعديل.";
let contactContent = "تواصل معنا عبر البريد أو مواقع التواصل.";

// عرض الصفحات
app.get('/about', (req, res) => {
    res.render('about', { aboutContent });
});

app.get('/contact', (req, res) => {
    res.render('contact', { contactContent });
});

app.get('/settings', (req, res) => {
    res.render('settings', { aboutContent, contactContent });
});

app.post('/settings', (req, res) => {
    aboutContent = req.body.aboutContent;
    contactContent = req.body.contactContent;
    res.redirect('/');
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});