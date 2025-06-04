require('dotenv').config();
const supabase = require('../db/db');

async function checkTableStructure() {
    try {
        console.log('🔍 Checking invite_codes table structure...');
          // Attempt test insertion to see errors
        const { error } = await supabase
            .from('invite_codes')
            .insert([{
                code: 'TEST123',
                email: 'test@example.com',
                full_name: 'Test User',
                specialty: 'Test Specialty',
                blog_request_id: 1,
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                is_used: false
            }]);
            
        if (error) {
            console.error('❌ Error in test insertion:', error);
            console.log('📋 Error details:', error.message);
            if (error.details) console.log('📋 Additional details:', error.details);
        } else {
            console.log('✅ Insertion successful');
            
            // Delete test record
            await supabase
                .from('invite_codes')
                .delete()
                .eq('code', 'TEST123');
            console.log('🗑️ Test record deleted');        }
        
    } catch (error) {
        console.error('❌ General error:', error);
    }
}

checkTableStructure().then(() => {
    console.log('🏁 Check completed');
    process.exit(0);
});
