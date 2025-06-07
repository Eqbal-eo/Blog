/**
 * إعدادات الإنتاج لموقع afaq.blog
 * 
 * هذا الملف يحتوي على الإعدادات المطلوبة للنشر على الإنتاج
 */

// التحقق من أن التطبيق يعمل في بيئة الإنتاج
if (process.env.NODE_ENV === 'production') {
    
    // إعدادات أمان إضافية للإنتاج
    const helmet = require('helmet');
    const rateLimit = require('express-rate-limit');
    
    module.exports = function(app) {
        
        // إعدادات Helmet للأمان
        app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
                    scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'", "https://akqkiedcfjkskgxsgfth.supabase.co"],
                },
            },
            crossOriginEmbedderPolicy: false
        }));

        // Rate limiting عام
        const generalLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 دقيقة
            max: 100, // 100 طلب لكل IP
            message: {
                error: 'تم تجاوز الحد المسموح من الطلبات، يرجى المحاولة بعد قليل'
            },
            standardHeaders: true,
            legacyHeaders: false,
        });

        app.use(generalLimiter);

        // Rate limiting خاص بتسجيل الدخول (أكثر صرامة)
        const loginLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 دقيقة
            max: 5, // 5 محاولات فقط
            skipSuccessfulRequests: true,
            message: {
                error: 'تم تجاوز الحد المسموح من محاولات تسجيل الدخول'
            }
        });

        app.use('/login', loginLimiter);

        // إعدادات CORS للنطاق
        app.use((req, res, next) => {
            const allowedOrigins = [
                'https://afaq.blog',
                'https://www.afaq.blog'
            ];
            
            const origin = req.headers.origin;
            if (allowedOrigins.includes(origin)) {
                res.setHeader('Access-Control-Allow-Origin', origin);
            }
            
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            
            next();
        });

        // Trust proxy (مهم لـ Vercel)
        app.set('trust proxy', 1);

        console.log('✅ تم تطبيق إعدادات الإنتاج للأمان');
    };

} else {
    // في بيئة التطوير، لا نحتاج إعدادات إضافية
    module.exports = function(app) {
        console.log('🛠️ تشغيل في بيئة التطوير - لا توجد إعدادات إنتاج إضافية');
    };
}
