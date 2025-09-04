#!/usr/bin/env node

/**
 * Generate Farcaster manifest credentials
 * Run: node scripts/generate-farcaster-manifest.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Generating Farcaster manifest credentials...');
console.log('📝 This will create account association credentials for your Farcaster Mini App');
console.log('');

try {
  // Run the create-onchain CLI command with Base Sepolia
  console.log('Running: npx create-onchain --manifest --chain base-sepolia');
  console.log('');
  
  execSync('npx create-onchain --manifest --chain base-sepolia', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('');
  console.log('✅ Farcaster manifest credentials generated!');
  console.log('📄 Check your .env file for:');
  console.log('   - FARCASTER_HEADER');
  console.log('   - FARCASTER_PAYLOAD'); 
  console.log('   - FARCASTER_SIGNATURE');
  console.log('');
  console.log('🎉 Your Mini App is ready for Farcaster deployment!');
  
} catch (error) {
  console.error('❌ Error generating manifest:', error.message);
  console.log('');
  console.log('💡 Make sure you have:');
  console.log('   1. A Farcaster account');
  console.log('   2. Your app deployed to a public URL');
  console.log('   3. Your Farcaster custody wallet connected');
  process.exit(1);
}
