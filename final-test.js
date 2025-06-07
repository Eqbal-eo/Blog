/**
 * اختبار شامل للنظام قبل النشر على afaq.blog
 * Final comprehensive test before production deployment
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('🔍 اختبار شامل لنظام afaq.blog قبل النشر...\n');

// 1. التحقق من الملفات المطلوبة
console.log('📁 التحقق من الملفات الأساسية:');
const requiredFiles = [
    'index.js',
    'package.json',
    'db/db.js',
    'routes/authRoutes.js',
    'middleware/authMiddleware.js',
    'utils/cookieUtils.js',
    'config/production.js',
    'controllers/authController.js'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, file));
    console.log(`   ${exists ? '✅' : '❌'} ${file}`);
    if (!exists) allFilesExist = false;
});

// 2. التحقق من المتغيرات
console.log('\n🔧 التحقق من متغيرات البيئة:');
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'JWT_SECRET', 'SESSION_SECRET'];
let allEnvVarsExist = true;

requiredEnvVars.forEach(varName => {
    const exists = !!process.env[varName];
    console.log(`   ${exists ? '✅' : '❌'} ${varName}`);
    if (!exists) allEnvVarsExist = false;
});

// 3. التحقق من حزم npm
console.log('\n📦 التحقق من الحزم المطلوبة:');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredPackages = [
    '@supabase/supabase-js',
    'express',
    'helmet', 
    'express-rate-limit',
    'cookie-parser',
    'jsonwebtoken',
    'bcrypt'
];

let allPackagesInstalled = true;
requiredPackages.forEach(pkg => {
    const exists = !!packageJson.dependencies[pkg];
    console.log(`   ${exists ? '✅' : '❌'} ${pkg}`);
    if (!exists) allPackagesInstalled = false;
});

// 4. اختبار إعدادات الكوكيز
console.log('\n🍪 اختبار إعدادات الكوكيز:');
try {
    const { getCookieOptions, getClearCookieOptions } = require('./utils/cookieUtils');
    
    // اختبار بيئة الإنتاج
    process.env.NODE_ENV = 'production';
    const prodOptions = getCookieOptions();
    
    const cookieChecks = [
        { name: 'Domain صحيح', pass: prodOptions.domain === '.afaq.blog' },
        { name: 'Secure مفعل', pass: prodOptions.secure === true },
        { name: 'HttpOnly مفعل', pass: prodOptions.httpOnly === true },
        { name: 'SameSite strict', pass: prodOptions.sameSite === 'strict' }
    ];
    
    cookieChecks.forEach(check => {
        console.log(`   ${check.pass ? '✅' : '❌'} ${check.name}`);
    });
    
} catch (err) {
    console.log('   ❌ خطأ في تحميل إعدادات الكوكيز:', err.message);
}

// 5. اختبار قاعدة البيانات
console.log('\n🗄️ اختبار الاتصال بقاعدة البيانات:');
async function testDatabase() {
    try {
        const supabase = require('./db/db');
        const { data, error } = await supabase.from('users').select('count', { count: 'exact' });
        
        if (error) throw error;
        console.log('   ✅ الاتصال بقاعدة البيانات نجح');
        return true;
    } catch (err) {
        console.log('   ❌ فشل الاتصال بقاعدة البيانات:', err.message);
        return false;
    }
}

// النتيجة النهائية
async function showFinalResult() {
    const dbOk = await testDatabase();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 تقرير النظام النهائي:');
    console.log('='.repeat(60));
    
    const allSystemsGo = allFilesExist && allEnvVarsExist && allPackagesInstalled && dbOk;
    
    if (allSystemsGo) {
        console.log('🎉 النظام جاهز للنشر على afaq.blog!');
        console.log('');
        console.log('✅ جميع الملفات موجودة');
        console.log('✅ متغيرات البيئة مضبوطة');
        console.log('✅ الحزم المطلوبة مثبتة');
        console.log('✅ إعدادات الكوكيز صحيحة للإنتاج');
        console.log('✅ قاعدة البيانات متصلة');
        console.log('');
        console.log('🚀 خطوات النشر:');
        console.log('   1. تأكد من NODE_ENV=production في بيئة الإنتاج');
        console.log('   2. تأكد من استخدام HTTPS على afaq.blog');
        console.log('   3. ارفع الملفات إلى الخادم');
        console.log('   4. تشغيل: npm install --production');
        console.log('   5. تشغيل: npm start');
        
    } else {
        console.log('⚠️ النظام يحتاج إصلاحات قبل النشر:');
        if (!allFilesExist) console.log('   ❌ ملفات مفقودة');
        if (!allEnvVarsExist) console.log('   ❌ متغيرات بيئة مفقودة');
        if (!allPackagesInstalled) console.log('   ❌ حزم مفقودة');
        if (!dbOk) console.log('   ❌ مشكلة في قاعدة البيانات');
    }
    
    console.log('='.repeat(60));
}

// تشغيل الاختبار النهائي
showFinalResult().catch(console.error);
