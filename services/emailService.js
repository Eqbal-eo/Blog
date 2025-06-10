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

// إرسال كود التفعيل
async function sendInviteCode(email, fullName, inviteCode, specialty) {
    const subject = 'كود التفعيل - مدونات آفاق';
    
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: 'Tahoma', 'Arial', sans-serif;
                    background-color: #f9f7f0;
                    margin: 0;
                    padding: 20px;
                    direction: rtl;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: white;
                    border-radius: 15px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .header {
                    background-color: #8c4a21;
                    color: white;
                    padding: 30px;
                    text-align: center;
                }
                .header h1 {
                    margin: 0;
                    font-size: 2rem;
                }
                .content {
                    padding: 30px;
                }
                .welcome {
                    font-size: 1.2rem;
                    color: #333;
                    margin-bottom: 20px;
                }
                .code-container {
                    background-color: #f8f9fa;
                    border: 2px dashed #8c4a21;
                    border-radius: 10px;
                    padding: 20px;
                    text-align: center;
                    margin: 20px 0;
                }
                .invite-code {
                    font-size: 2.5rem;
                    font-weight: bold;
                    color: #8c4a21;
                    letter-spacing: 0.5rem;
                    margin: 10px 0;
                }
                .instructions {
                    background-color: #e7f3ff;
                    border-right: 4px solid #0066cc;
                    padding: 15px;
                    margin: 20px 0;
                }
                .footer {
                    background-color: #f8f9fa;
                    padding: 20px;
                    text-align: center;
                    color: #666;
                    font-size: 0.9rem;
                }
                .button {
                    display: inline-block;
                    background-color: #8c4a21;
                    color: white;
                    padding: 12px 30px;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 10px 0;
                }
                .warning {
                    background-color: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 5px;
                    padding: 10px;
                    margin: 15px 0;
                    color: #856404;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>مدونات آفاق</h1>
                    <p>مرحباً بك في مجتمع المدونين</p>
                </div>
                
                <div class="content">
                    <div class="welcome">
                        مرحباً <strong>${fullName}</strong>،
                    </div>
                    
                    <p>نحن سعداء لقبولك في مجتمع مدونات آفاق! تم مراجعة طلب إنشاء المدونة الخاص بك في مجال <strong>${specialty}</strong> والموافقة عليه.</p>
                    
                    <div class="code-container">
                        <p><strong>كود التفعيل الخاص بك:</strong></p>
                        <div class="invite-code">${inviteCode}</div>
                        <p><small>استخدم هذا الكود لإكمال إنشاء حسابك</small></p>
                    </div>
                    
                    <div class="instructions">
                        <h4>خطوات إكمال التسجيل:</h4>
                        <ol>
                            <li>انتقل إلى صفحة إكمال التسجيل</li>
                            <li>أدخل كود التفعيل أعلاه</li>
                            <li>اختر اسم المستخدم وكلمة المرور</li>
                            <li>ابدأ رحلتك في الكتابة!</li>
                        </ol>
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="${process.env.WEBSITE_URL}/complete-registration" class="button">أكمل التسجيل الآن</a>
                    </div>
                    
                    <div class="warning">
                        <strong>تنبيه مهم:</strong> هذا الكود صالح لمدة 7 أيام فقط من تاريخ الإرسال. يرجى إكمال التسجيل في أقرب وقت ممكن.
                    </div>
                </div>
                
                <div class="footer">
                    <p>مدونات آفاق - منصة للتدوين الثقافي والفكري</p>
                    <p>هذا بريد إلكتروني تلقائي، يرجى عدم الرد عليه</p>
                </div>
            </div>
        </body>
        </html>
    `;

    const textContent = `
مرحباً ${fullName}،

تم قبولك في مجتمع مدونات آفاق!

كود التفعيل الخاص بك: ${inviteCode}

يرجى زيارة الرابط التالي لإكمال التسجيل:
${process.env.WEBSITE_URL}/complete-registration

هذا الكود صالح لمدة 7 أيام فقط.

مدونات آفاق
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
            <style>
                body { font-family: 'Tahoma', 'Arial', sans-serif; direction: rtl; }
                .container { max-width: 600px; margin: 0 auto; }
                .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: white; }
                .info-box { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; }
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
                    
                    <p style="text-align: center;">
                        <a href="${process.env.WEBSITE_URL}/admin/blog-requests" 
                           style="background-color: #8c4a21; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                           مراجعة الطلب
                        </a>
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;

    // إرسال للمشرفين (نفس البريد للتسجيل الداخلي)
    const adminEmail = process.env.ADMIN_EMAIL;
    return await sendEmail(adminEmail, subject, htmlContent);
}

// إرسال إشعار رفض الطلب
async function sendRejectionNotification(email, fullName, reason) {
    const subject = 'تحديث حول طلب المدونة - مدونات آفاق';
    
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: 'Tahoma', 'Arial', sans-serif; direction: rtl; }
                .container { max-width: 600px; margin: 0 auto; }
                .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: white; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>تحديث حول طلب المدونة</h2>
                </div>
                <div class="content">
                    <p>عزيزي/عزيزتي ${fullName}،</p>
                    <p>نشكرك على اهتمامك بالانضمام إلى مدونات آفاق.</p>
                    <p>نأسف لإعلامك أنه لم يتم قبول طلبك هذه المرة للأسباب التالية:</p>
                    <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        ${reason}
                    </div>
                    <p>يمكنك إعادة تقديم طلب جديد في أي وقت مع مراعاة الملاحظات المذكورة أعلاه.</p>
                    <p>شكراً لتفهمك.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return await sendEmail(email, subject, htmlContent);
}

module.exports = {
    sendEmail,
    sendInviteCode,
    notifyAdminsNewRequest,
    sendRejectionNotification
};