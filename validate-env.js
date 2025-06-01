#!/usr/bin/env node

/**
 * Environment Variables Validator
 * 
 * This script checks if all required environment variables are set.
 * Run this before starting your application to ensure all needed
 * environment variables are properly configured.
 */

// Load environment variables
require('dotenv').config();

// Define required environment variables
const requiredVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'JWT_SECRET',
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASS',
  'EMAIL_FROM',
  'SITE_URL',
  'SESSION_SECRET'
];

// Define optional environment variables with default values
const optionalVars = {
  'NODE_ENV': 'development',
  'PORT': '3000'
};

console.log('\x1b[36m%s\x1b[0m', '=================================================================');
console.log('\x1b[36m%s\x1b[0m', '             ENVIRONMENT VARIABLES VALIDATION                    ');
console.log('\x1b[36m%s\x1b[0m', '=================================================================');
console.log();

// Check required variables
let missingVars = [];
for (const varName of requiredVars) {
  if (!process.env[varName]) {
    missingVars.push(varName);
    console.log('\x1b[31m%s\x1b[0m', `✗ Missing required environment variable: ${varName}`);
  } else {
    // Show only first few characters of sensitive values
    const value = process.env[varName];
    const isSensitive = varName.includes('KEY') || 
                        varName.includes('SECRET') || 
                        varName.includes('PASS') || 
                        varName.includes('TOKEN');
    
    const displayValue = isSensitive 
      ? `${value.substring(0, 3)}...${value.substring(value.length - 3)}` 
      : value;
    
    console.log('\x1b[32m%s\x1b[0m', `✓ ${varName}: ${displayValue}`);
  }
}

// Check optional variables
console.log('\n\x1b[33m%s\x1b[0m', '--- Optional Variables ---');
for (const [varName, defaultValue] of Object.entries(optionalVars)) {
  if (!process.env[varName]) {
    console.log('\x1b[33m%s\x1b[0m', `! ${varName} not set, using default: ${defaultValue}`);
  } else {
    console.log('\x1b[32m%s\x1b[0m', `✓ ${varName}: ${process.env[varName]}`);
  }
}

// Summary
console.log();
if (missingVars.length > 0) {
  console.log('\x1b[31m%s\x1b[0m', '=================================================================');
  console.log('\x1b[31m%s\x1b[0m', `  ERROR: ${missingVars.length} required variables are missing!`);
  console.log('\x1b[31m%s\x1b[0m', '=================================================================');
  console.log('\x1b[33m%s\x1b[0m', 'Please set these variables in your .env file before running the application.');
  console.log();
  process.exit(1);
} else {
  console.log('\x1b[32m%s\x1b[0m', '=================================================================');
  console.log('\x1b[32m%s\x1b[0m', '  SUCCESS: All required environment variables are set!');
  console.log('\x1b[32m%s\x1b[0m', '=================================================================');
  console.log();
}
