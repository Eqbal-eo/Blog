/**
 * اختبار إعدادات الكوكيز للنطاق afaq.blog
 * 
 * هذا الملف يختبر إعدادات الكوكيز في بيئة الإنتاج والتطوير
 */

require('dotenv').config();
const { getCookieOptions, getClearCookieOptions } = require('../utils/cookieUtils');

function testCookieSettings() {
    console.log('🍪 اختبار إعدادات الكوكيز...\n');
    
    // حفظ البيئة الحالية
    const originalEnv = process.env.NODE_ENV;
    
    // اختبار بيئة التطوير
    console.log('🛠️ اختبار بيئة التطوير:');
    process.env.NODE_ENV = 'development';
    
    const devCookieOptions = getCookieOptions();
    const devClearOptions = getClearCookieOptions();
    
    console.log('   إعدادات إنشاء الكوكيز:', JSON.stringify(devCookieOptions, null, 2));
    console.log('   إعدادات حذف الكوكيز:', JSON.stringify(devClearOptions, null, 2));
    
    // اختبار بيئة الإنتاج
    console.log('\n🚀 اختبار بيئة الإنتاج:');
    process.env.NODE_ENV = 'production';
    
    const prodCookieOptions = getCookieOptions();
    const prodClearOptions = getClearCookieOptions();
    
    console.log('   إعدادات إنشاء الكوكيز:', JSON.stringify(prodCookieOptions, null, 2));
    console.log('   إعدادات حذف الكوكيز:', JSON.stringify(prodClearOptions, null, 2));
    
    // استعادة البيئة الأصلية
    process.env.NODE_ENV = originalEnv;
    
    // التحقق من الإعدادات المطلوبة
    console.log('\n✅ التحقق من الإعدادات:');
    
    const checks = [
        {
            name: 'Domain في الإنتاج',
            condition: prodCookieOptions.domain === '.afaq.blog',
            value: prodCookieOptions.domain
        },
        {
            name: 'عدم وجود Domain في التطوير',
            condition: !devCookieOptions.domain,
            value: devCookieOptions.domain || 'غير محدد'
        },
        {
            name: 'Secure في الإنتاج',
            condition: prodCookieOptions.secure === true,
            value: prodCookieOptions.secure
        },
        {
            name: 'عدم Secure في التطوير',
            condition: devCookieOptions.secure === false,
            value: devCookieOptions.secure
        },
        {
            name: 'SameSite strict في الإنتاج',
            condition: prodCookieOptions.sameSite === 'strict',
            value: prodCookieOptions.sameSite
        },
        {
            name: 'SameSite lax في التطوير',
            condition: devCookieOptions.sameSite === 'lax',
            value: devCookieOptions.sameSite
        }
    ];
    
    let allPassed = true;
    
    checks.forEach(check => {
        const status = check.condition ? '✅' : '❌';
        console.log(`   ${status} ${check.name}: ${check.value}`);
        if (!check.condition) allPassed = false;
    });
    
    console.log(`\n${allPassed ? '🎉' : '⚠️'} النتيجة: ${allPassed ? 'جميع الاختبارات نجحت' : 'هناك مشاكل في الإعدادات'}`);
    
    if (allPassed) {
        console.log('\n📋 ملخص الإعدادات:');
        console.log('   - الكوكيز ستعمل بشكل صحيح على afaq.blog في الإنتاج');
        console.log('   - الكوكيز ستعمل بشكل صحيح على localhost في التطوير');
        console.log('   - إعدادات الأمان مناسبة لكل بيئة');
        console.log('   - SameSite policy تمنع CSRF attacks');
    }
}

// تشغيل الاختبار
testCookieSettings();
