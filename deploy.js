#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🚀 SIMPLE DEPLOYMENT SCRIPT');
console.log('===========================\n');

// Step 1: Clean build
console.log('🧹 Cleaning previous build...');
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true });
  console.log('✅ Cleaned dist folder');
}

// Step 2: Build with production script
console.log('\n🔨 Building for production...');
try {
  execSync('npm run build:production', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Step 3: Verify build files
console.log('\n🔍 Verifying build files...');
const distFiles = fs.readdirSync('dist');
console.log('Files in dist:', distFiles);

const cssFiles = distFiles.filter(f => f.endsWith('.css'));
const jsFiles = distFiles.filter(f => f.endsWith('.js'));

if (cssFiles.length === 0) {
  console.error('❌ No CSS files found in dist!');
  process.exit(1);
}

if (jsFiles.length === 0) {
  console.error('❌ No JS files found in dist!');
  process.exit(1);
}

console.log(`✅ Found ${cssFiles.length} CSS file(s): ${cssFiles.join(', ')}`);
console.log(`✅ Found ${jsFiles.length} JS file(s): ${jsFiles.join(', ')}`);

// Step 4: Verify HTML references
const html = fs.readFileSync('dist/index.html', 'utf8');
const cssLinks = html.match(/<link[^>]*\.css[^>]*>/g) || [];
const jsScripts = html.match(/<script[^>]*\.js[^>]*>/g) || [];

console.log(`✅ HTML contains ${cssLinks.length} CSS link(s)`);
console.log(`✅ HTML contains ${jsScripts.length} JS script(s)`);

// Check for the problematic dev script
if (html.includes('/src/main.tsx')) {
  console.error('❌ HTML still contains dev script reference!');
  process.exit(1);
}

console.log('✅ HTML references look correct');

// Step 5: Deploy to Firebase
console.log('\n🚀 Deploying to Firebase...');
try {
  execSync('firebase deploy --only hosting', { stdio: 'inherit' });
  console.log('\n✅ DEPLOYMENT SUCCESSFUL!');
  console.log('🌐 Your site should now work with proper CSS!');
  console.log('🔗 URL: https://beamly-app.web.app');
  console.log('\n💡 Test in incognito window to avoid cache issues');
} catch (error) {
  console.error('❌ Firebase deployment failed:', error.message);
  process.exit(1);
}