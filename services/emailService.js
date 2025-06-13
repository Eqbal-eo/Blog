const nodemailer = require('nodemailer');
require('dotenv').config();

// إعداد Zoho Mail SMTP
const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.eu', // استخدام السيرفر الأوروبي
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.ZOHO_EMAIL, // no-reply@afaq.blog
        pass: process.env.ZOHO_PASSWORD // كلمة المرور العادية تعمل!
    }
});

// تحقق من الاتصال
transporter.verify((error, success) => {
    if (error) {
        console.log('خطأ في إعداد البريد الإلكتروني:', error);
    } else {
        console.log('Email service is ready');
    }
});

// إرسال بريد إلكتروني عام
async function sendEmail(to, subject, htmlContent, textContent = '') {
    try {
        const mailOptions = {
            from: {
                name: 'مدونات آفاق',
                address: process.env.ZOHO_EMAIL
            },
            to: to,
            subject: subject,
            html: htmlContent,
            text: textContent
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('تم إرسال البريد الإلكتروني بنجاح:', result.messageId);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('خطأ في إرسال البريد الإلكتروني:', error);
        return { success: false, error: error.message };
    }
}

// إرسال كود التفعيل - تصميم بسيط ومتناسق
async function sendInviteCode(email, fullName, inviteCode, specialty) {
    const subject = 'تم قبولك في مدونات آفاق';
    
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&display=swap" rel="stylesheet">
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: 'Tajawal', sans-serif;
                    background-color: #f9f7f0;
                    color: #222;
                    line-height: 1.6;
                    padding: 20px;
                    direction: rtl;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: white;
                    border: 1px solid #e5e5e5;
                    border-radius: 8px;
                    overflow: hidden;
                }
                .header {
                    background-color: #f8f9fa;
                    padding: 30px;
                    text-align: center;
                    border-bottom: 1px solid #e5e5e5;
                }
                .header h1 {
                    font-size: 1.8rem;
                    font-weight: 500;
                    color: #222;
                    margin-bottom: 10px;
                }
                .header p {
                    font-size: 1rem;
                    color: #666;
                }
                .content {
                    padding: 40px 30px;
                }
                .greeting {
                    font-size: 1.2rem;
                    color: #222;
                    margin-bottom: 20px;
                    text-align: center;
                }
                .message {
                    font-size: 1rem;
                    color: #555;
                    margin-bottom: 30px;
                    line-height: 1.7;
                    text-align: center;
                }
                .specialty {
                    font-weight: 500;
                    color: #222;
                }
                .code-section {
                    background-color: #f8f9fa;
                    border: 1px solid #e5e5e5;
                    border-radius: 6px;
                    padding: 25px;
                    text-align: center;
                    margin: 30px 0;
                }
                .code-label {
                    font-size: 1rem;
                    color: #666;
                    margin-bottom: 15px;
                }
                .invite-code {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #222;
                    letter-spacing: 0.2rem;
                    font-family: 'Courier New', monospace;
                    background-color: white;
                    padding: 15px 20px;
                    border: 1px solid #e5e5e5;
                    border-radius: 4px;
                    display: inline-block;
                    margin: 10px 0;
                }
                .instructions {
                    background-color: #f8f9fa;
                    border: 1px solid #e5e5e5;
                    border-radius: 6px;
                    padding: 25px;
                    margin: 30px 0;
                }
                .instructions h4 {
                    font-size: 1.1rem;
                    color: #222;
                    margin-bottom: 15px;
                }
                .instructions ol {
                    padding-right: 20px;
                    color: #555;
                }
                .instructions li {
                    margin-bottom: 8px;
                    font-size: 0.95rem;
                }
                .button-container {
                    text-align: center;
                    margin: 30px 0;
                }
                .button {
                    display: inline-block;
                    background-color: #222;
                    color: white;
                    padding: 15px 30px;
                    text-decoration: none;
                    border-radius: 4px;
                    font-size: 1rem;
                    font-weight: 500;
                }
                .notice {
                    background-color: #f8f9fa;
                    border: 1px solid #e5e5e5;
                    border-radius: 6px;
                    padding: 20px;
                    margin: 25px 0;
                    font-size: 0.9rem;
                    color: #666;
                }
                .footer {
                    background-color: #f8f9fa;
                    padding: 25px;
                    text-align: center;
                    border-top: 1px solid #e5e5e5;
                    font-size: 0.9rem;
                    color: #666;
                }
                .footer .brand {
                    font-weight: 500;
                    color: #222;
                    margin-bottom: 5px;
                }
                @media (max-width: 600px) {
                    body {
                        padding: 10px;
                    }
                    .header, .content {
                        padding: 25px 20px;
                    }
                    .invite-code {
                        font-size: 1.8rem;
                        letter-spacing: 0.1rem;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>مدونات آفاق</h1>
                    <p>منصة التدوين الثقافي والفكري</p>
                </div>
                
                <div class="content">
                    <div class="greeting">
                        مرحباً <strong>${fullName}</strong>
                    </div>
                    
                    <div class="message">
                        تم قبول طلبك للانضمام إلى مدونات آفاق في مجال <span class="specialty">${specialty}</span>.
                        <br><br>
                        يمكنك الآن إكمال إنشاء حسابك باستخدام كود التفعيل أدناه.
                    </div>
                    
                    <div class="code-section">
                        <div class="code-label">كود التفعيل الخاص بك:</div>
                        <div class="invite-code">${inviteCode}</div>
                    </div>
                    
                    <div class="instructions">
                        <h4>خطوات إكمال التسجيل:</h4>
                        <ol>
                            <li>انقر على الرابط أدناه</li>
                            <li>أدخل كود التفعيل</li>
                            <li>أدخل بريدك الإلكتروني واختر اسم المستخدم</li>
                            <li>اختر كلمة مرور آمنة</li>
                            <li>ابدأ رحلتك في التدوين</li>
                        </ol>
                    </div>
                    
                    <div class="button-container">
                        <a href="${process.env.WEBSITE_URL}/register" class="button">إكمال التسجيل</a>
                    </div>

                    <div class="notice">
                        <strong>تنبيه:</strong> هذا الكود صالح لمدة 7 أيام فقط من تاريخ الإرسال.
                    </div>
                </div>
                
                <div class="footer">
                    <div class="brand">مدونات آفاق</div>
                    <div>منصة للتدوين الثقافي والفكري</div>
                    <div style="margin-top: 10px; font-size: 0.8rem;">
                        © 2025 مدونات آفاق - جميع الحقوق محفوظة
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;

    const textContent = `
مرحباً ${fullName}،

تم قبول طلبك للانضمام إلى مدونات آفاق في مجال ${specialty}.

كود التفعيل الخاص بك: ${inviteCode}

يرجى زيارة الرابط التالي لإكمال التسجيل:
${process.env.WEBSITE_URL}/register

هذا الكود صالح لمدة 7 أيام فقط.

مع أطيب التحيات،
فريق مدونات آفاق
    `;

    return await sendEmail(email, subject, htmlContent, textContent);
}

// إرسال إشعار رفض الطلب - تصميم بسيط ومتناسق
async function sendRejectionNotification(email, fullName, reason) {
    const subject = 'تحديث حول طلب المدونة - مدونات آفاق';
    
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&display=swap" rel="stylesheet">
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: 'Tajawal', sans-serif;
                    background-color: #f9f7f0;
                    color: #222;
                    line-height: 1.6;
                    padding: 20px;
                    direction: rtl;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: white;
                    border: 1px solid #e5e5e5;
                    border-radius: 8px;
                    overflow: hidden;
                }
                .header {
                    background-color: #f8f9fa;
                    padding: 30px;
                    text-align: center;
                    border-bottom: 1px solid #e5e5e5;
                }
                .header h1 {
                    font-size: 1.8rem;
                    font-weight: 500;
                    color: #222;
                    margin-bottom: 10px;
                }
                .header p {
                    font-size: 1rem;
                    color: #666;
                }
                .content {
                    padding: 40px 30px;
                }
                .greeting {
                    font-size: 1.2rem;
                    color: #222;
                    margin-bottom: 20px;
                }
                .message {
                    font-size: 1rem;
                    color: #555;
                    margin-bottom: 25px;
                    line-height: 1.7;
                }
                .reason-section {
                    background-color: #f8f9fa;
                    border: 1px solid #e5e5e5;
                    border-radius: 6px;
                    padding: 20px;
                    margin: 25px 0;
                }
                .reason-label {
                    font-size: 1rem;
                    color: #222;
                    font-weight: 500;
                    margin-bottom: 10px;
                }
                .reason-text {
                    font-size: 0.95rem;
                    color: #555;
                    line-height: 1.6;
                }
                .notice {
                    background-color: #f8f9fa;
                    border: 1px solid #e5e5e5;
                    border-radius: 6px;
                    padding: 20px;
                    margin: 25px 0;
                    font-size: 0.95rem;
                    color: #555;
                }
                .footer {
                    background-color: #f8f9fa;
                    padding: 25px;
                    text-align: center;
                    border-top: 1px solid #e5e5e5;
                    font-size: 0.9rem;
                    color: #666;
                }
                .footer .brand {
                    font-weight: 500;
                    color: #222;
                    margin-bottom: 5px;
                }
                @media (max-width: 600px) {
                    body {
                        padding: 10px;
                    }
                    .header, .content {
                        padding: 25px 20px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>مدونات آفاق</h1>
                    <p>منصة التدوين الثقافي والفكري</p>
                </div>
                
                <div class="content">
                    <div class="greeting">
                        عزيزي/عزيزتي <strong>${fullName}</strong>
                    </div>
                    
                    <div class="message">
                        نشكرك على اهتمامك بالانضمام إلى مدونات آفاق ووقتك في تقديم الطلب.
                    </div>
                    
                    <div class="message">
                        نأسف لإعلامك أنه لم يتم قبول طلبك في هذا الوقت للأسباب التالية:
                    </div>
                    
                    <div class="reason-section">
                        <div class="reason-label">أسباب عدم الموافقة:</div>
                        <div class="reason-text">${reason}</div>
                    </div>
                    
                    <div class="notice">
                        يمكنك إعادة تقديم طلب جديد في أي وقت مع مراعاة الملاحظات المذكورة أعلاه. نقدر تفهمك وندعوك للمحاولة مرة أخرى.
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <div style="font-size: 1rem; color: #555;">
                            شكراً لتفهمك
                        </div>
                    </div>
                </div>
                
                <div class="footer">
                    <div class="brand">مدونات آفاق</div>
                    <div>منصة للتدوين الثقافي والفكري</div>
                    <div style="margin-top: 10px; font-size: 0.8rem;">
                        © 2025 مدونات آفاق - جميع الحقوق محفوظة
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;

    const textContent = `
عزيزي/عزيزتي ${fullName}،

نشكرك على اهتمامك بالانضمام إلى مدونات آفاق.

نأسف لإعلامك أنه لم يتم قبول طلبك هذه المرة للأسباب التالية:

${reason}

يمكنك إعادة تقديم طلب جديد في أي وقت مع مراعاة الملاحظات المذكورة أعلاه.

شكراً لتفهمك.

فريق مدونات آفاق
    `;

    return await sendEmail(email, subject, htmlContent, textContent);
}

// إرسال إشعار بوصول طلب جديد للمشرفين
async function notifyAdminsNewRequest(requestData) {
    const subject = 'طلب مدونة جديد - مدونات آفاق';
    
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&display=swap" rel="stylesheet">
            <style>
                body {
                    font-family: 'Tajawal', sans-serif;
                    background-color: #f9f7f0;
                    color: #222;
                    direction: rtl;
                    margin: 0;
                    padding: 20px;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: white;
                    border: 1px solid #e5e5e5;
                    border-radius: 8px;
                }
                .header {
                    background-color: #f8f9fa;
                    color: #222;
                    padding: 25px;
                    text-align: center;
                    border-bottom: 1px solid #e5e5e5;
                }
                .content {
                    padding: 30px;
                }
                .info-box {
                    background-color: #f8f9fa;
                    border: 1px solid #e5e5e5;
                    padding: 20px;
                    border-radius: 6px;
                    margin: 15px 0;
                }
                .button-container {
                    text-align: center;
                    margin: 25px 0;
                }
                .button {
                    background-color: #222;
                    color: white;
                    padding: 12px 25px;
                    text-decoration: none;
                    border-radius: 4px;
                    font-weight: 500;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>طلب مدونة جديد يحتاج مراجعة</h2>
                </div>
                <div class="content">
                    <div class="info-box">
                        <h4>معلومات المتقدم:</h4>
                        <p><strong>الاسم:</strong> ${requestData.full_name}</p>
                        <p><strong>البريد الإلكتروني:</strong> ${requestData.email}</p>
                        <p><strong>التخصص:</strong> ${requestData.specialty}</p>
                        <p><strong>سنوات الخبرة:</strong> ${requestData.experience_years}</p>
                    </div>
                    
                    <div class="info-box">
                        <h4>المقال التجريبي:</h4>
                        <p><strong>العنوان:</strong> ${requestData.sample_title}</p>
                        <p><strong>الفئة:</strong> ${requestData.sample_category}</p>
                        <p><strong>المحتوى:</strong> ${requestData.sample_content.substring(0, 200)}...</p>
                    </div>
                    
                    <div class="info-box">
                        <h4>الدافع للانضمام:</h4>
                        <p>${requestData.motivation}</p>
                    </div>
                    
                    <div class="button-container">
                        <a href="${process.env.WEBSITE_URL}/admin/blog-requests" class="button">
                           مراجعة الطلب
                        </a>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;

    // إرسال للمشرفين
    const adminEmail = process.env.ADMIN_EMAIL;
    return await sendEmail(adminEmail, subject, htmlContent);
}

// إرسال بيانات الدخول للمستخدم الجديد
async function sendLoginCredentials(email, fullName, username, tempPassword) {
    const subject = 'بيانات الدخول - مدونات آفاق';
    
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&display=swap" rel="stylesheet">
            <style>
                body {
                    font-family: 'Tajawal', sans-serif;
                    background-color: #f9f7f0;
                    color: #222;
                    margin: 0;
                    padding: 20px;
                    direction: rtl;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: white;
                    border: 1px solid #e5e5e5;
                    border-radius: 8px;
                    overflow: hidden;
                }
                .header {
                    background-color: #f8f9fa;
                    padding: 30px;
                    text-align: center;
                    border-bottom: 1px solid #e5e5e5;
                }
                .header h1 {
                    font-size: 1.8rem;
                    font-weight: 500;
                    color: #222;
                    margin-bottom: 10px;
                }
                .content {
                    padding: 30px;
                }
                .greeting {
                    font-size: 1.2rem;
                    color: #222;
                    margin-bottom: 20px;
                }
                .credentials-container {
                    background-color: #f8f9fa;
                    border: 1px solid #e5e5e5;
                    border-radius: 6px;
                    padding: 25px;
                    margin: 25px 0;
                }
                .credential-item {
                    margin: 15px 0;
                    padding: 15px;
                    background-color: white;
                    border-radius: 4px;
                    border: 1px solid #e5e5e5;
                }
                .credential-label {
                    font-weight: 500;
                    color: #222;
                    display: block;
                    margin-bottom: 8px;
                }
                .credential-value {
                    font-size: 1.1rem;
                    color: #333;
                    font-family: 'Courier New', monospace;
                }
                .instructions {
                    background-color: #f8f9fa;
                    border: 1px solid #e5e5e5;
                    padding: 20px;
                    border-radius: 6px;
                    margin: 20px 0;
                }
                .notice {
                    background-color: #f8f9fa;
                    border: 1px solid #e5e5e5;
                    border-radius: 6px;
                    padding: 20px;
                    margin: 20px 0;
                    color: #666;
                    font-size: 0.9rem;
                }
                .footer {
                    background-color: #f8f9fa;
                    padding: 25px;
                    text-align: center;
                    border-top: 1px solid #e5e5e5;
                    color: #666;
                    font-size: 0.9rem;
                }
                .button {
                    display: inline-block;
                    background-color: #222;
                    color: white;
                    padding: 15px 30px;
                    text-decoration: none;
                    border-radius: 4px;
                    margin: 15px 0;
                    font-weight: 500;
                }
                .button-container {
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>مدونات آفاق</h1>
                    <p>أهلاً بك في مجتمعنا</p>
                </div>
                
                <div class="content">
                    <div class="greeting">
                        مرحباً <strong>${fullName}</strong>
                    </div>
                    
                    <p>تم إنشاء حسابك بنجاح في مدونات آفاق. يمكنك الآن تسجيل الدخول باستخدام البيانات التالية:</p>
                    
                    <div class="credentials-container">
                        <div class="credential-item">
                            <span class="credential-label">اسم المستخدم:</span>
                            <span class="credential-value">${username}</span>
                        </div>
                        <div class="credential-item">
                            <span class="credential-label">كلمة المرور المؤقتة:</span>
                            <span class="credential-value">${tempPassword}</span>
                        </div>
                    </div>
                    
                    <div class="notice">
                        <strong>تنبيه أمني:</strong> هذه كلمة مرور مؤقتة. يرجى تغييرها فور تسجيل الدخول الأول من صفحة الإعدادات.
                    </div>
                    
                    <div class="instructions">
                        <h4>خطوات تسجيل الدخول:</h4>
                        <ol>
                            <li>انتقل إلى صفحة تسجيل الدخول</li>
                            <li>أدخل اسم المستخدم وكلمة المرور أعلاه</li>
                            <li>غيّر كلمة المرور من الإعدادات</li>
                            <li>ابدأ في كتابة مقالاتك</li>
                        </ol>
                    </div>
                    
                    <div class="button-container">
                        <a href="${process.env.WEBSITE_URL}/login" class="button">تسجيل الدخول</a>
                    </div>
                </div>
                
                <div class="footer">
                    <p>مدونات آفاق - منصة للتدوين الثقافي والفكري</p>
                    <p style="margin-top: 10px; font-size: 0.8rem;">
                        © 2025 مدونات آفاق - جميع الحقوق محفوظة
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;

    const textContent = `
مرحباً ${fullName}،

تم إنشاء حسابك بنجاح في مدونات آفاق!

بيانات الدخول:
اسم المستخدم: ${username}
كلمة المرور المؤقتة: ${tempPassword}

يرجى تسجيل الدخول وتغيير كلمة المرور من الإعدادات.

رابط تسجيل الدخول: ${process.env.WEBSITE_URL}/login

مدونات آفاق
    `;

    return await sendEmail(email, subject, htmlContent, textContent);
}

module.exports = {
    sendEmail,
    sendInviteCode,
    notifyAdminsNewRequest,
    sendRejectionNotification,
    sendLoginCredentials
};
