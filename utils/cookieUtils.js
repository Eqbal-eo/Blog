/**
 * Cookie Utilities for afaq.blog
 * 
 * يحتوي هذا الملف على دوال مساعدة للتعامل مع الكوكيز
 * مع الأخذ في الاعتبار اختلاف إعدادات التطوير والإنتاج
 */

/**
 * إنشاء إعدادات الكوكيز المناسبة حسب البيئة
 * @param {number} maxAge - مدة صلاحية الكوكيز بالمللي ثانية
 * @returns {Object} إعدادات الكوكيز
 */
function getCookieOptions(maxAge = 86400000) { // 24 ساعة افتراضياً
    const isProduction = process.env.NODE_ENV === 'production';
    
    const options = {
        httpOnly: true, // لا يمكن الوصول إليها من JavaScript
        secure: isProduction, // HTTPS فقط في الإنتاج
        maxAge: maxAge, // مدة الصلاحية
        sameSite: isProduction ? 'strict' : 'lax' // منع CSRF attacks
    };

    // إضافة domain فقط في بيئة الإنتاج
    if (isProduction) {
        options.domain = '.afaq.blog';
    }

    return options;
}

/**
 * إنشاء إعدادات لحذف الكوكيز
 * @returns {Object} إعدادات حذف الكوكيز
 */
function getClearCookieOptions() {
    const isProduction = process.env.NODE_ENV === 'production';
    
    const options = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax'
    };

    // إضافة domain فقط في بيئة الإنتاج
    if (isProduction) {
        options.domain = '.afaq.blog';
    }

    return options;
}

module.exports = {
    getCookieOptions,
    getClearCookieOptions
};
