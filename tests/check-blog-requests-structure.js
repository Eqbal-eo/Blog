require('dotenv').config();
const supabase = require('./db/db');

async function checkBlogRequestsStructure() {
    try {
        console.log('🔍 Checking blog_requests table structure...');
        
        // Fetch first record to identify available columns
        const { data: sample, error } = await supabase
            .from('blog_requests')
            .select('*')
            .limit(1);
            
        if (error) {
            console.error('❌ Error fetching data:', error);
            return;
        }
        
        if (sample && sample.length > 0) {
            console.log('📋 Available columns in blog_requests table:');
            Object.keys(sample[0]).forEach(column => {
                console.log(`  - ${column}: ${typeof sample[0][column]} (${sample[0][column]})`);
            });
        } else {
            console.log('⚠️ No data in table');
        }
        
    } catch (error) {
        console.error('❌ General error:', error);
    }
}

checkBlogRequestsStructure().then(() => {
    console.log('🏁 Check completed');
    process.exit(0);
});
