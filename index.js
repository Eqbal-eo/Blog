require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser'); // Add cookie handler
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const db = require('./db/db'); // Database connection file

// Import routes
const authRoutes = require('./routes/authRoutes');
const mainRoutes = require('./routes/mainRoutes');
const postRoutes = require('./routes/postRoutes');
const pagesRoutes = require('./routes/pagesRoutes'); 
const adminRoutes = require('./routes/adminRoutes'); // Add admin routes
const notificationRoutes = require('./routes/notificationRoutes'); // Add notification routes

const app = express(); 
const PORT = 3000; 

// Determine if the application is running in production or development environment
const isProduction = process.env.NODE_ENV === 'production';
const domain = isProduction ? '.afaq.blog' : 'localhost';

// Security Headers (Helmet)
app.use(helmet({
    contentSecurityPolicy: false // Disabled to prevent breaking existing inline scripts/styles
}));

// Use cookie handler instead of sessions
app.use(cookieParser());

// Setup view engine and interface files
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files BEFORE rate limiting so we don't count CSS/JS requests
app.use(express.static(path.join(__dirname, 'public')));

// Global Rate Limiting (Applied to dynamic routes)
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 requests per 15 mins window
    message: 'لقد تجاوزت الحد المسموح به من الطلبات. يرجى الانتظار قليلاً ثم المحاولة مجدداً.'
});
app.use(globalLimiter);

// Parse form data and JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
 
// Middleware for Custom Visitor Tracking
const visitorTracker = require('./middleware/visitorTracker');
app.use(visitorTracker);

// Application routes
app.use('/', authRoutes);   
app.use('/', mainRoutes);  
app.use('/posts', postRoutes);
app.use('/', pagesRoutes);  
app.use('/admin', adminRoutes); // Add admin routes
app.use('/notifications', notificationRoutes); // Add notification routes

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
}); 

module.exports = app; 