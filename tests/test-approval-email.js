// Approval Email Test File
require('dotenv').config();
const { sendBlogApprovalEmail } = require('../services/emailService');

// Test Data
const testData = {
    email: 'ahmad@gmail.com', // Replace with your email for testing
    fullName: 'أحمد محمد',
    inviteCode: 'TEST-' + Math.random().toString(36).substr(2, 8).toUpperCase()
};

console.log('🚀 Starting approval email test...');
console.log('📧 Data:', testData);

sendBlogApprovalEmail(testData.email, testData.fullName, testData.inviteCode)
    .then(result => {
        if (result.success) {
            console.log('✅ Email sent successfully!');
            console.log('📨 Message ID:', result.messageId);
            console.log('🎯 Check inbox:', testData.email);
        } else {
            console.log('❌ Failed to send email');
            console.log('🔴 Error:', result.error);
        }
    })
    .catch(error => {
        console.log('❌ General test error');
        console.log('🔴 Details:', error.message);
    });
