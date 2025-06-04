// Test script to verify environment variables
const dotenv = require('dotenv');
const path = require('path');

// Explicitly specify the path to the .env file
const result = dotenv.config({ path: path.resolve(__dirname, '.env') });

console.log('Dotenv config result:', result.error ? 'Error: ' + result.error.message : 'Success');
console.log('Environment variables test:');
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('JWT_SECRET first 10 chars:', process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 10) + '...' : 'undefined');
console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
