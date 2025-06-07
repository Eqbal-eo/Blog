# دليل استكشاف أخطاء تسجيل الدخول في afaq.blog

## المشاكل الشائعة والحلول

### 1. الكوكيز لا تُحفظ في المتصفح

**الأعراض:**
- تسجيل الدخول يبدو ناجحاً لكن المستخدم يُعاد توجيهه لصفحة تسجيل الدخول
- الكوكيز لا تظهر في Developer Tools

**الأسباب المحتملة:**
- إعدادات `domain` غير صحيحة
- إعدادات `secure` مع HTTP بدلاً من HTTPS
- مشاكل في `sameSite` policy

**الحلول:**
1. تأكد من أن `NODE_ENV=production` في متغيرات البيئة
2. تأكد من استخدام HTTPS في الإنتاج
3. تحقق من أن domain يبدأ بنقطة: `.afaq.blog`

### 2. خطأ CORS في الإنتاج

**الأعراض:**
- رسائل خطأ CORS في console المتصفح
- الطلبات تفشل مع status 403 أو 404

**الحلول:**
1. تحقق من إعدادات CORS في `config/production.js`
2. تأكد من أن النطاق مضاف في `allowedOrigins`

### 3. JWT Token غير صحيح

**الأعراض:**
- رسالة "invalid signature" في logs الخادم
- المستخدم يُوجه لصفحة تسجيل الدخول رغم إدخال بيانات صحيحة

**الحلول:**
1. تأكد من أن `JWT_SECRET` نفسه في كل البيئات
2. تحقق من أن التوكن لم ينتهِ
3. راجع logs الخادم لتفاصيل أكثر

### 4. مشاكل Rate Limiting

**الأعراض:**
- رسالة "تم تجاوز الحد المسموح من الطلبات"
- عدم قدرة على تسجيل الدخول رغم البيانات الصحيحة

**الحلول:**
1. انتظر 15 دقيقة قبل المحاولة مرة أخرى
2. في حالة الطوارئ، قم بإعادة تشغيل الخادم

## أوامر التشخيص المفيدة

### اختبار إعدادات الكوكيز
```bash
node tests/test-cookie-settings.js
```

### اختبار الاتصال بقاعدة البيانات
```bash
node check-supabase-status.js
```

### اختبار متغيرات البيئة
```bash
node validate-env.js
```

## فحص المتصفح

### Firefox/Chrome Developer Tools
1. اذهب إلى `Network` tab
2. حاول تسجيل الدخول
3. ابحث عن طلب POST إلى `/login`
4. تحقق من Response Headers للكوكيز
5. اذهب إلى `Application/Storage` > `Cookies` للتأكد من وجود `auth_token`

### الكوكيز المتوقعة في الإنتاج
```
Name: auth_token
Domain: .afaq.blog
Secure: ✓
HttpOnly: ✓
SameSite: Strict
```

## متغيرات البيئة المطلوبة للإنتاج

```env
NODE_ENV=production
SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
JWT_SECRET=[YOUR_SECURE_JWT_SECRET]
SESSION_SECRET=[YOUR_SESSION_SECRET]
```

## تسجيل الأخطاء (Logging)

إذا كنت تواجه مشاكل، تحقق من:

1. **Server Logs**: ابحث عن رسائل خطأ في console الخادم
2. **Browser Console**: تحقق من JavaScript errors
3. **Network Tab**: راجع HTTP requests/responses

## جهات الاتصال للدعم

إذا استمرت المشاكل:
1. راجع logs الخادم أولاً
2. تأكد من إعدادات DNS للنطاق
3. تحقق من إعدادات SSL certificate
