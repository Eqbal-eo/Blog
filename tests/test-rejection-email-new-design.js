const { sendBlogRejectionEmail } = require('./services/emailService');

// Quick test for sending rejection email
async function testRejectionEmail() {
    console.log('🔹 Starting rejection email test...');
    
    try {
        const result = await sendBlogRejectionEmail(
            'ahmadmhd@gmail.com', // Test email
            'أحمد الكاتب', // Full name
            'المحتوى المقدم يحتاج إلى تحسين في جودة الكتابة والأسلوب. يرجى مراجعة قواعد اللغة العربية والتأكد من أصالة المحتوى.' // Rejection reason
        );

        if (result.success) {
            console.log('✅ Email sent successfully!');
            console.log('📧 Message ID:', result.messageId);
        } else {
            console.log('❌ Failed to send email:');
            console.log('Error:', result.error);
        }
    } catch (error) {
        console.error('❌ Test error:', error);
    }
}

testRejectionEmail();
