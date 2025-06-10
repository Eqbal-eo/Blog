# دليل إعداد Zoho Mail للمطورين

## خطوات إنشاء كلمة مرور التطبيق (App Password)

### 1. تسجيل الدخول إلى Zoho
- اذهب إلى: https://accounts.zoho.com
- سجل دخولك بحساب no-reply@afaq.blog

### 2. تفعيل المصادقة الثنائية (مطلوب)
- اذهب إلى: Account Settings > Security
- مكّن "Two-Factor Authentication"
- اتبع الخطوات لإعداد المصادقة الثنائية

### 3. إنشاء كلمة مرور التطبيق
- في نفس صفحة Security
- اذهب إلى قسم "Application-Specific Passwords"
- انقر على "Generate New Password"
- اختر "Other" أو "Mail Client"
- أدخل اسم مثل "Blog System"
- احفظ كلمة المرور الجديدة (ستظهر مرة واحدة فقط!)

### 4. تحديث متغيرات البيئة
استبدل ZOHO_PASSWORD في ملف .env بكلمة المرور الجديدة

### 5. إعدادات IMAP/SMTP (تأكد من تفعيلها)
- في Zoho Mail Settings
- اذهب إلى Mail Accounts > POP/IMAP Access
- تأكد من تفعيل IMAP وSMTP

## إعدادات SMTP الصحيحة لـ Zoho:
```
Host: smtp.zoho.com
Port: 587 (STARTTLS) أو 465 (SSL)
Security: STARTTLS أو SSL/TLS
Authentication: Normal Password
Username: no-reply@afaq.blog
Password: [App Password من الخطوة 3]
```

## بدائل أخرى إذا لم تعمل Zoho:

### Gmail SMTP (سهل الإعداد)
```
Host: smtp.gmail.com
Port: 587
Username: your-email@gmail.com
Password: App Password (من Google Account Security)
```

### SendGrid (مجاني للمطورين)
```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: [SendGrid API Key]
```

### Resend (حديث وسهل)
```
API-based، لا يحتاج SMTP تقليدي
مجاني حتى 3000 رسالة/شهر
```
