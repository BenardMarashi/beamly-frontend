// Debug script to verify CSS is working
import fs from 'fs';
import { execSync } from 'child_process';

console.log('🔍 CSS DEBUG VERIFICATION SCRIPT\n');

// Check if dist folder exists
if (!fs.existsSync('dist')) {
  console.log('❌ dist folder does not exist - run build first');
  process.exit(1);
}

// List all files in dist
console.log('📁 Files in dist:');
const distFiles = fs.readdirSync('dist');
distFiles.forEach(file => {
  const stats = fs.statSync(`dist/${file}`);
  console.log(`   ${file} (${stats.size} bytes)`);
});

// Check for CSS files
const cssFiles = distFiles.filter(f => f.endsWith('.css'));
console.log(`\n🎨 Found ${cssFiles.length} CSS file(s):`);
cssFiles.forEach(file => {
  const content = fs.readFileSync(`dist/${file}`, 'utf8');
  console.log(`   ${file}: ${content.length} characters`);
  
  // Check for key classes
  const keyClasses = ['glass-effect', 'dark-mode', 'backdrop-filter'];
  keyClasses.forEach(cls => {
    if (content.includes(cls)) {
      console.log(`   ✅ Contains ${cls}`);
    } else {
      console.log(`   ❌ Missing ${cls}`);
    }
  });
});

// Check HTML file
if (fs.existsSync('dist/index.html')) {
  const html = fs.readFileSync('dist/index.html', 'utf8');
  console.log('\n📄 HTML file check:');
  
  const cssLinks = html.match(/<link[^>]*\.css[^>]*>/g) || [];
  console.log(`   CSS links found: ${cssLinks.length}`);
  cssLinks.forEach(link => console.log(`   ${link}`));
  
  const hasBodyClass = html.includes('class="dark-mode"');
  console.log(`   Body has dark-mode class: ${hasBodyClass ? '✅' : '❌'}`);
  
  const buildVersion = html.match(/data-build="([^"]+)"/);
  if (buildVersion) {
    console.log(`   Build version: ${buildVersion[1]}`);
  }
}

// Check build manifest
if (fs.existsSync('dist/build-manifest.json')) {
  const manifest = JSON.parse(fs.readFileSync('dist/build-manifest.json', 'utf8'));
  console.log('\n📋 Build manifest:');
  console.log(`   Build time: ${manifest.buildTime}`);
  console.log(`   Build hash: ${manifest.buildHash}`);
  console.log(`   CSS file: ${manifest.files.css}`);
  console.log(`   JS file: ${manifest.files.js}`);
}

console.log('\n🌐 TESTING INSTRUCTIONS:');
console.log('1. Open your site in an incognito window');
console.log('2. Press F12 to open DevTools');
console.log('3. Go to Network tab');
console.log('4. Refresh the page');
console.log('5. Check if CSS file loads successfully (should be 200 status)');
console.log('6. Go to Console tab and check for any errors');
console.log('\n🔗 Your site: https://beamly-app.web.app');