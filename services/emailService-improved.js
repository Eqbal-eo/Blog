const nodemailer = require('nodemailer');
require('dotenv').config();

// Multiple email service options
const emailConfigs = {
    zoho: {
        host: 'smtp.zoho.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.ZOHO_EMAIL,
            pass: process.env.ZOHO_APP_PASSWORD // Use App Password, not regular password
        },
        tls: {
            rejectUnauthorized: false
        }
    },
    
    gmail: {
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_EMAIL,
            pass: process.env.GMAIL_APP_PASSWORD
        }
    },
    
    sendgrid: {
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY
        }
    }
};

// Select preferred email service
const selectedService = process.env.EMAIL_SERVICE || 'zoho'; // zoho, gmail, sendgrid
const transporter = nodemailer.createTransport(emailConfigs[selectedService]);

// Verify connection with better error handling
transporter.verify((error, success) => {
    if (error) {
        console.log(`خطأ في إعداد ${selectedService}:`, error.message);
        console.log('💡 اقتراحات الحل:');
        
        if (selectedService === 'zoho') {
            console.log('- تأكد من إنشاء App Password في Zoho');
            console.log('- فعّل Two-Factor Authentication');
            console.log('- تأكد من تفعيل IMAP/SMTP في إعدادات Zoho');
        } else if (selectedService === 'gmail') {
            console.log('- أنشئ App Password في Google Account');
            console.log('- فعّل 2-Step Verification');
        }
    } else {
        console.log(`✅ خدمة البريد الإلكتروني ${selectedService} جاهزة`);
    }
});

// Rest of the code remains the same...
async function sendEmail(to, subject, htmlContent, textContent = '') {
    try {
        const fromAddress = process.env.ZOHO_EMAIL || process.env.GMAIL_EMAIL || 'noreply@afaq.blog';
        
        const mailOptions = {
            from: {
                name: 'مدونات آفاق',
                address: fromAddress
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
        
        // Custom solution suggestions based on error type
        if (error.code === 'EAUTH') {
            console.log('💡 حل مقترح: تحقق من بيانات المصادقة (App Password)');
        } else if (error.code === 'ECONNECTION') {
            console.log('💡 حل مقترح: تحقق من الاتصال بالإنترنت وإعدادات الشبكة');
        }
        
        return { success: false, error: error.message, code: error.code };
    }
}

module.exports = {
    sendEmail,
    transporter,
    selectedService
};
