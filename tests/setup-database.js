/**
 * Database Setup Script for Blog Registration System
 * This script helps verify and set up the database schema
 */

require('dotenv').config();
const supabase = require('../db/db');

async function setupDatabase() {
    console.log('🔧 Setting up database schema...');
    
    try {
        // Test database connection
        console.log('📡 Testing database connection...');
        const { data: connectionTest, error: connectionError } = await supabase
            .from('users')
            .select('count')
            .limit(1);
            
        if (connectionError) {
            console.error('❌ Database connection failed:', connectionError.message);
            return;
        }
        
        console.log('✅ Database connection successful');
        
        // Check if invite_codes table exists
        console.log('🔍 Checking invite_codes table...');
        const { data: inviteCodesTest, error: inviteError } = await supabase
            .from('invite_codes')
            .select('id')
            .limit(1);
            
        if (inviteError) {
            console.log('⚠️  invite_codes table may not exist. Please create it using the schema file.');
            console.log('Error:', inviteError.message);
        } else {
            console.log('✅ invite_codes table exists');
        }
        
        // Check if blog_requests table exists  
        console.log('🔍 Checking blog_requests table...');
        const { data: blogRequestsTest, error: blogRequestError } = await supabase
            .from('blog_requests')
            .select('id')
            .limit(1);
            
        if (blogRequestError) {
            console.log('⚠️  blog_requests table may not exist. Please create it using the schema file.');
            console.log('Error:', blogRequestError.message);
        } else {
            console.log('✅ blog_requests table exists');
        }
        
        // Check if notifications table exists
        console.log('🔍 Checking notifications table...');
        const { data: notificationsTest, error: notificationError } = await supabase
            .from('notifications')
            .select('id')
            .limit(1);
            
        if (notificationError) {
            console.log('⚠️  notifications table may not exist. Please create it using the schema file.');
            console.log('Error:', notificationError.message);
        } else {
            console.log('✅ notifications table exists');
        }
        
        // Check admin user
        console.log('🔍 Checking admin user...');
        const { data: adminUser, error: adminError } = await supabase
            .from('users')
            .select('username, role')
            .eq('role', 'admin')
            .limit(1);
            
        if (adminError) {
            console.log('⚠️  Error checking admin user:', adminError.message);
        } else if (!adminUser || adminUser.length === 0) {
            console.log('⚠️  No admin user found. Please create one manually.');
        } else {
            console.log('✅ Admin user exists:', adminUser[0].username);
        }
        
        console.log('\n📋 Database setup summary:');
        console.log('- Database connection: ✅');
        console.log('- invite_codes table:', inviteError ? '⚠️' : '✅');
        console.log('- blog_requests table:', blogRequestError ? '⚠️' : '✅');
        console.log('- notifications table:', notificationError ? '⚠️' : '✅');
        console.log('- Admin user:', (!adminUser || adminUser.length === 0) ? '⚠️' : '✅');
        
        if (inviteError || blogRequestError || notificationError) {
            console.log('\n💡 To create missing tables, run the SQL commands from database_schema.sql in your Supabase dashboard.');
        }
        
    } catch (error) {
        console.error('❌ Database setup failed:', error);
    }
}

// Run setup if this file is executed directly
if (require.main === module) {
    setupDatabase().then(() => {
        console.log('🏁 Database setup check completed');
        process.exit(0);
    });
}

module.exports = { setupDatabase };
