#!/bin/bash
# Production Deployment Script for afaq.blog
# نص نشر الإنتاج لموقع afaq.blog

echo "🚀 بدء عملية النشر لموقع afaq.blog..."
echo "=================================================="

# التحقق من متغيرات البيئة المطلوبة
echo "🔍 التحقق من متغيرات البيئة..."
if [ -z "$NODE_ENV" ]; then
    echo "⚠️  تحذير: NODE_ENV غير محدد. سيتم تعيينه إلى production"
    export NODE_ENV=production
fi

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ] || [ -z "$JWT_SECRET" ]; then
    echo "❌ خطأ: متغيرات البيئة المطلوبة مفقودة"
    echo "المطلوب: SUPABASE_URL, SUPABASE_ANON_KEY, JWT_SECRET"
    exit 1
fi

echo "✅ متغيرات البيئة متوفرة"

# تثبيت الحزم
echo "📦 تثبيت حزم الإنتاج..."
npm install --production

if [ $? -ne 0 ]; then
    echo "❌ فشل في تثبيت الحزم"
    exit 1
fi

echo "✅ تم تثبيت الحزم بنجاح"

# اختبار الاتصال بقاعدة البيانات
echo "🗄️ اختبار الاتصال بقاعدة البيانات..."
node -e "
const supabase = require('./db/db');
supabase.from('users').select('count', { count: 'exact' })
  .then(({error}) => {
    if (error) throw error;
    console.log('✅ اتصال قاعدة البيانات نجح');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ فشل الاتصال بقاعدة البيانات:', err.message);
    process.exit(1);
  });
"

if [ $? -ne 0 ]; then
    echo "❌ مشكلة في قاعدة البيانات"
    exit 1
fi

# اختبار إعدادات الكوكيز
echo "🍪 اختبار إعدادات الكوكيز..."
node tests/test-cookie-settings.js > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "❌ مشكلة في إعدادات الكوكيز"
    exit 1
fi

echo "✅ إعدادات الكوكيز صحيحة"

# تشغيل الاختبار الشامل
echo "🔍 تشغيل الاختبار الشامل..."
node final-test.js > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "❌ فشل في الاختبار الشامل"
    exit 1
fi

echo "✅ جميع الاختبارات نجحت"

echo "=================================================="
echo "🎉 النظام جاهز للتشغيل!"
echo ""
echo "لتشغيل الخادم:"
echo "  npm start"
echo ""
echo "أو للتشغيل في الخلفية:"
echo "  nohup npm start > server.log 2>&1 &"
echo ""
echo "📊 مراقبة السجلات:"
echo "  tail -f server.log"
echo "=================================================="
