const nodemailer = require('nodemailer');
require('dotenv').config();

// تكوين خدمة البريد الإلكتروني
const createTransporter = () => {
    // التحقق من وجود إعدادات البريد الإلكتروني
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('إعدادات البريد الإلكتروني غير مكتملة - EMAIL_USER و EMAIL_PASS مطلوبان');
    }
    
    // يمكن استخدام Gmail أو أي مزود بريد إلكتروني آخر
    return nodemailer.createTransporter({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// إرسال إيميل موافقة على طلب المدونة
const sendBlogApprovalEmail = async (email, fullName, inviteCode) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: process.env.EMAIL_FROM || '"مدونات آفاق" <noreply@afaq-blogs.com>',
            to: email,
            subject: 'تم قبول طلب إنشاء المدونة - مدونات آفاق',
            html: `
                <div dir="rtl" style="font-family: 'Tajawal', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f7f0;">
                    <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #8c4a21; margin: 0; font-size: 2rem;">مدونات آفاق</h1>
                            <p style="color: #666; margin: 10px 0 0 0;">منصة للتدوين الثقافي والفكري</p>
                        </div>
                        
                        <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
                            <h2 style="color: #155724; margin: 0 0 10px 0; text-align: center;">
                                🎉 تهانينا! تم قبول طلبك
                            </h2>
                        </div>
                        
                        <p style="font-size: 1.1rem; line-height: 1.6; color: #333;">
                            مرحباً <strong>${fullName}</strong>،
                        </p>
                        
                        <p style="line-height: 1.6; color: #555;">
                            يسعدنا إبلاغك بأنه تم قبول طلبك لإنشاء مدونة على منصة "مدونات آفاق". لقد تمت مراجعة التدوينة النموذجية وقد أعجبنا المحتوى المقدم.
                        </p>
                        
                        <div style="background: #e3f2fd; border: 2px solid #2196f3; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
                            <h3 style="color: #1976d2; margin: 0 0 15px 0;">كود الدعوة الخاص بك</h3>
                            <div style="background: #1976d2; color: white; padding: 15px; border-radius: 6px; font-family: 'Courier New', monospace; font-size: 1.5rem; letter-spacing: 3px; margin: 10px 0;">
                                ${inviteCode}
                            </div>
                            <p style="color: #666; font-size: 0.9rem; margin: 10px 0 0 0;">
                                احتفظ بهذا الكود في مكان آمن - ستحتاجه للتسجيل
                            </p>
                        </div>
                        
                        <div style="margin: 25px 0;">
                            <h3 style="color: #333; margin-bottom: 15px;">الخطوات التالية:</h3>
                            <ol style="line-height: 1.8; color: #555; padding-right: 20px;">
                                <li>قم بزيارة صفحة التسجيل على منصتنا</li>
                                <li>أدخل كود الدعوة المرفق أعلاه</li>
                                <li>أكمل بيانات التسجيل (اسم المستخدم، البريد الإلكتروني، كلمة المرور)</li>
                                <li>ابدأ في إنشاء مدونتك ونشر تدويناتك</li>
                            </ol>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.SITE_URL || 'http://localhost:3000'}/register" 
                               style="background: #8c4a21; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                                التسجيل الآن
                            </a>
                        </div>
                        
                        <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0; color: #856404; font-size: 0.9rem;">
                                <strong>ملاحظة مهمة:</strong> كود الدعوة صالح لمدة 30 يوماً من تاريخ إرساله. بعد انتهاء هذه المدة ستحتاج إلى طلب كود جديد.
                            </p>
                        </div>
                        
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        
                        <div style="text-align: center; color: #777; font-size: 0.9rem;">
                            <p style="margin: 5px 0;">مدونات آفاق - منصة للتدوين الثقافي والفكري</p>
                            <p style="margin: 5px 0;">© ${new Date().getFullYear()} جميع الحقوق محفوظة</p>
                        </div>
                    </div>
                </div>
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
        
        const mailOptions = {
            from: process.env.EMAIL_FROM || '"مدونات آفاق" <noreply@afaq-blogs.com>',
            to: email,
            subject: 'بخصوص طلب إنشاء المدونة - مدونات آفاق',
            html: `
                <div dir="rtl" style="font-family: 'Tajawal', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f7f0;">
                    <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #8c4a21; margin: 0; font-size: 2rem;">مدونات آفاق</h1>
                            <p style="color: #666; margin: 10px 0 0 0;">منصة للتدوين الثقافي والفكري</p>
                        </div>
                        
                        <p style="font-size: 1.1rem; line-height: 1.6; color: #333;">
                            مرحباً <strong>${fullName}</strong>،
                        </p>
                        
                        <p style="line-height: 1.6; color: #555;">
                            شكراً لك على اهتمامك بالانضمام إلى منصة "مدونات آفاق". لقد تمت مراجعة طلبك بعناية من قبل فريق المراجعة.
                        </p>
                        
                        <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px; margin: 25px 0;">
                            <h3 style="color: #721c24; margin: 0 0 15px 0;">ملاحظات المراجعة:</h3>
                            <p style="color: #721c24; margin: 0; line-height: 1.6;">${reason}</p>
                        </div>
                        
                        <p style="line-height: 1.6; color: #555;">
                            نشجعك على تحسين المحتوى المقدم وفقاً للملاحظات أعلاه، ثم إعادة تقديم طلبك مرة أخرى. نحن نتطلع إلى رؤية إبداعك على منصتنا.
                        </p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.SITE_URL || 'http://localhost:3000'}/blog-request" 
                               style="background: #8c4a21; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                                تقديم طلب جديد
                            </a>
                        </div>
                        
                        <div style="background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 6px; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0; color: #0c5460; font-size: 0.9rem;">
                                <strong>نصائح للمحتوى:</strong> تأكد من أن التدوينة النموذجية تحتوي على محتوى أصلي وعالي الجودة، وأن تكون مكتوبة بلغة عربية سليمة، وأن تتوافق مع معايير المنصة.
                            </p>
                        </div>
                        
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        
                        <div style="text-align: center; color: #777; font-size: 0.9rem;">
                            <p style="margin: 5px 0;">مدونات آفاق - منصة للتدوين الثقافي والفكري</p>
                            <p style="margin: 5px 0;">© ${new Date().getFullYear()} جميع الحقوق محفوظة</p>
                        </div>
                    </div>
                </div>
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
