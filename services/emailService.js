const nodemailer = require('nodemailer');
require('dotenv').config();

// تكوين خدمة البريد الإلكتروني
const createTransporter = () => {
    // التحقق من وجود إعدادات البريد الإلكتروني
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('إعدادات البريد الإلكتروني غير مكتملة - EMAIL_USER و EMAIL_PASS مطلوبان');
    }
      // تكوين Zoho Mail SMTP
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.zoho.eu',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });
};

// إرسال إيميل موافقة على طلب المدونة
const sendBlogApprovalEmail = async (email, fullName, inviteCode) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
      from: process.env.EMAIL_FROM || '"مدونات آفاق" <no-reply@afaq.blog>',  to: email,
      subject: 'تم قبول طلب إنشاء المدونة - مدونات آفاق',
      html: `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
        <style>
          * {
        font-family: 'Tajawal', Arial, sans-serif;
        box-sizing: border-box;
        text-align: center;
          }
          p {
        text-align: center;
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0;">
        <div style="max-width: 520px; margin: 40px auto; padding: 0 20px;">
          <!-- صندوق الرسالة -->
          <div style="background: white; border-radius: 18px; padding: 35px 25px; border: 1px solid #e0e0e0;">
        <!-- الهيدر -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; font-size: 2.4rem; font-weight: 700; margin: 0;">مدونات آفاق</h1>
        </div>

        <!-- الترحيب -->
        <div style="text-align: center; margin-bottom: 25px;">
          <p style="color: #333; font-size: 1.05rem; margin: 0;">السيد/ة  <strong>${fullName}</strong></p>
          <p style="color: #555; font-size: 0.95rem; margin: 12px 0 0; line-height: 1.7;">
            تهانينا قبول طلبكم بعد مراجعته من قِبَل المشرفين، <br>والآن بإمكانك البدء في إنشاء مدونتك ومشاركة أفكارك مع المجتمع.
          </p>
        </div>

        <!-- كود الدعوة -->
        <div style="background: #f9f9f9; border-radius: 12px; padding: 20px 25px; margin: 30px 0; border: 1px solid #e0e0e0;">
          <p style="color: #333; font-size: 0.9rem; font-weight: 500; margin: 0 0 10px;">كود التسجيل الخاص بك:</p>
          <div style="background: white; padding: 12px 20px; border-radius: 10px; border: 1px solid #e0e0e0; text-align: center;">
            <span style="color: #333; font-size: 1.6rem; font-weight: 700; letter-spacing: 2px;">${inviteCode}</span>
          </div>
        </div> 

        <!-- زر التسجيل --> 
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.SITE_URL || 'http://localhost:3000'}/register" 
             style="background: #8c4a21ca;
                color: white;
                padding: 14px 30px;
                border-radius: 30px;
                text-decoration: none;
                font-size: 1rem;
                font-weight: 500;
                display: inline-block;">
            الانتقال لصفحة التسجيل
                </a>
        </div>

        <!-- معلومات إضافية -->
        <div style="background: #f9f9f9; border-radius: 10px; padding: 15px; text-align: center; border: 1px solid #e0e0e0;">
          <p style="color: #555; font-size: 0.85rem; margin: 0;">الكود صالح لمدة قصيرة من تاريخ الإرسال</p>
        </div>
          </div>

          <!-- الفوتر -->
          <div style="text-align: center; margin-top: 25px;">
        <p style="color: #555; font-size: 0.8rem; margin: 0;">آفاق - منصة التدوين الثقافي © ${new Date().getFullYear()}</p>
          </div>
        </div>
      </body>
      </html>
      `
    };


        const result = await transporter.sendMail(mailOptions);
        console.log('تم إرسال إيميل الموافقة بنجاح:', result.messageId);
        return { success: true, messageId: result.messageId };
        
    } catch (error) {
        console.error('خطأ في إرسال إيميل الموافقة:', error);
        return { success: false, error: error.message };
    }
};

// إرسال إيميل رفض طلب المدونة
const sendBlogRejectionEmail = async (email, fullName, reason) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {  from: process.env.EMAIL_FROM || '"مدونات آفاق" <no-reply@afaq.blog>',
      to: email,
      subject: 'طلب المراجعة والتحسين - مدونات آفاق',
      html: `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
        <style>
          * {
        font-family: 'Tajawal', Arial, sans-serif;
        box-sizing: border-box;
          }
          p {
        text-align: center;
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0;">
        <div style="max-width: 520px; margin: 40px auto; padding: 0 20px;">
          <!-- صندوق الرسالة -->
          <div style="background: white; border-radius: 18px; padding: 35px 25px; border: 1px solid #e0e0e0;">
        <!-- الهيدر -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; font-size: 2.4rem; font-weight: 700; margin: 0;">مدونات آفاق</h1>
        </div>

        <!-- الرسالة الرئيسية -->
        <div style="text-align: center; margin-bottom: 25px;">
          <h2 style="color: #333; font-size: 1.5rem; font-weight: 600; margin: 0 0 15px;">نشكر لك اهتمامك بالمنصة</h2>
          <p style="color: #333; font-size: 1.05rem; margin: 0;">السيّد/ة  <strong>${fullName}</strong></p>
          <p style="color: #555; font-size: 0.95rem; margin: 12px 0 0; line-height: 1.7;">
            نقدّر اهتمامك بالانضمام إلى مجتمع آفاق الثقافي <br> لقد راجع فريقنا طلبك بعناية فائقة.
          </p>
        </div>

        <!-- ملاحظات التحسين -->
        <div style="background: #f9f9f9; border-radius: 12px; padding: 20px 25px; margin: 30px 0; border: 1px solid #e0e0e0;">
          <p style="color: #333; font-size: 0.9rem; font-weight: 500; margin: 0 0 10px;">ملاحظات لتطوير المحتوى</p>
          <div style="background: white; padding: 12px 20px; border-radius: 10px; border: 1px solid #e0e0e0;">
            <p style="color: #333; font-size: 0.95rem; margin: 0; line-height: 1.6;">${reason}</p>
          </div>
          <p style="color: #555; font-size: 0.85rem; margin-top: 10px;">نؤمن بقدرتك على الإبداع</p>
        </div>

        <!-- رسالة التشجيع -->
        <div style="text-align: center; margin-bottom: 25px;">
          <p style="color: #555; font-size: 0.95rem; margin: 0; line-height: 1.7;">
            نتطلع لرؤية إبداعك يزين منصتنا
          </p>
        </div>

        <!-- زر إعادة التقديم -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.SITE_URL || 'http://localhost:3000'}/blog-request" 
             style="background: #8c4a21ca;
                color: white;
                padding: 14px 30px;
                border-radius: 30px;
                text-decoration: none;
                font-size: 1rem;
                font-weight: 500;
                display: inline-block;">
            إعادة تقديم الطلب
                </a>
        </div>

          <!-- الفوتر -->
          <div style="text-align: center; margin-top: 25px;">
        <p style="color: #555; font-size: 0.8rem; margin: 0;">آفاق - منصة التدوين الثقافي © ${new Date().getFullYear()}</p>
          </div>
        </div>
      </body>
      </html>
      `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('تم إرسال إيميل الرفض بنجاح:', result.messageId);
        return { success: true, messageId: result.messageId };
        
    } catch (error) {
        console.error('خطأ في إرسال إيميل الرفض:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendBlogApprovalEmail,
    sendBlogRejectionEmail
};
