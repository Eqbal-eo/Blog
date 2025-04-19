const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./db/db'); // ملف الاتصال بقاعدة البيانات
const authRoutes = require('./routes/authRoutes');


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

// الصفحة الرئيسية
app.get('/', (req, res) => {
    res.send('Hello, Blog!');
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

app.get('/dashboard', (req, res) => { 
    if (!req.session.user) {// تحقق من تسجيل الدخول
        return res.redirect('/login'); // إذا لم يكن المستخدم مسجلاً الدخول، إعادة توجيه إلى صفحة تسجيل الدخول
    }

    res.render('dashboard', { user: req.session.user });
});

const postRoutes = require('./routes/postRoutes'); // ملف مسارات التدوينات
app.use('/posts', postRoutes);

