import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import crypto from 'crypto';

console.log('🔨 FIXED PRODUCTION BUILD - Tailwind FIRST, Bundle SECOND\n');

// Clean dist directory completely
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true });
}
fs.mkdirSync('dist');

// Generate build hash for cache busting
const buildHash = crypto.randomBytes(8).toString('hex');
console.log('🎯 Build hash:', buildHash);

// STEP 1: Process Tailwind CSS FIRST from SOURCE files (BEFORE bundling)
console.log('\n⚡ STEP 1: Processing Tailwind CSS from SOURCE files...');
try {
  // Build Tailwind with comprehensive content scanning and NO safelist restrictions
  const tailwindCommand = `npx tailwindcss ` +
    `-i ./src/index.css ` +
    `-o ./dist/styles-${buildHash}.css ` +
    `--content "./src/**/*.{js,jsx,ts,tsx}" ` +
    `--content "./index.html" ` +
    `--content "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}" ` +
    `--minify`;
    
  console.log('Running:', tailwindCommand);
  execSync(tailwindCommand, { stdio: 'inherit' });
  
  // Verify CSS was built properly
  const cssPath = `./dist/styles-${buildHash}.css`;
  const cssStats = fs.statSync(cssPath);
  const cssSize = (cssStats.size / 1024).toFixed(2);
  console.log(`✅ CSS built: ${cssSize} KB`);
  
  // Check for critical utility classes
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  const utilityChecks = [
    { name: 'Flexbox', pattern: /\.flex\{/ },
    { name: 'Grid', pattern: /\.grid\{/ },
    { name: 'Spacing', pattern: /\.p-4\{/ },
    { name: 'Margins', pattern: /\.m-4\{/ },
    { name: 'Text sizes', pattern: /\.text-lg\{/ },
    { name: 'Colors', pattern: /\.text-white\{/ },
    { name: 'Backgrounds', pattern: /\.bg-white\{/ }
  ];
  
  console.log('\n🔍 Checking for utility classes:');
  let missingUtilities = [];
  utilityChecks.forEach(check => {
    if (check.pattern.test(cssContent)) {
      console.log(`   ✅ ${check.name} found`);
    } else {
      console.log(`   ❌ ${check.name} MISSING`);
      missingUtilities.push(check.name);
    }
  });
  
  if (cssStats.size < 50000) {
    console.warn(`\n⚠️  WARNING: CSS file is only ${cssSize} KB (should be 50KB+)`);
    if (missingUtilities.length > 0) {
      throw new Error(`CSS is missing utility classes: ${missingUtilities.join(', ')}`);
    }
  } else {
    console.log(`✅ CSS file size looks good: ${cssSize} KB`);
  }
  
} catch (error) {
  console.error('❌ Tailwind CSS processing failed:', error);
  process.exit(1);
}

// STEP 2: Copy public assets
console.log('\n📁 STEP 2: Copying public assets...');
if (fs.existsSync('public')) {
  fs.cpSync('public', 'dist', { recursive: true });
  console.log('✅ Public assets copied');
}

// STEP 3: Build JavaScript with esbuild (AFTER CSS is ready)
console.log('\n📦 STEP 3: Building JavaScript with esbuild...');

// Environment variables
import { config } from 'dotenv';
config();

const env = {
  'import.meta.env': JSON.stringify({
    VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyA8iNiFS-1dW-ntuJtv84atQQzHZyZka-U',
    VITE_FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'beamly-app.firebaseapp.com',
    VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID || 'beamly-app',
    VITE_FIREBASE_STORAGE_BUCKET: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'beamly-app.appspot.com',
    VITE_FIREBASE_MESSAGING_SENDER_ID: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '663724690900',
    VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID || '1:663724690900:web:0846e84e4bfec91ddb1a41',
    VITE_FIREBASE_MEASUREMENT_ID: process.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-2T41KM2ZFK',
    VITE_PAYMENT_PROVIDER: process.env.VITE_PAYMENT_PROVIDER || 'stripe',
    VITE_STRIPE_PUBLISHABLE_KEY: process.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_live_51RdSRmDtB4sjDNJyR97SlxSSI6JtoHGq94VAb9Iy9YGmunnBFAZUuW6m6NEhkRU19eLE04YR20BYOxuc8j5U5FGM007fmevCim',
    NODE_ENV: 'production',
    PROD: true,
    DEV: false,
    MODE: 'production',
  }),
};

try {
  await esbuild.build({
    entryPoints: ['src/main.tsx'],
    bundle: true,
    outfile: `dist/app-${buildHash}.js`,
    format: 'esm',
    target: 'es2020',
    minify: true,
    sourcemap: false,
    treeShaking: true,
    loader: {
      '.tsx': 'tsx',
      '.ts': 'ts',
      '.jsx': 'jsx',
      '.js': 'js',
      '.css': 'empty', // Ignore CSS imports - already processed
      '.svg': 'dataurl',
      '.png': 'dataurl',
      '.jpg': 'dataurl',
      '.jpeg': 'dataurl',
      '.gif': 'dataurl',
      '.woff': 'file',
      '.woff2': 'file',
      '.eot': 'file',
      '.ttf': 'file',
    },
    define: {
      global: 'globalThis',
      'import.meta.env.MODE': '"production"',
      'import.meta.env.PROD': 'true',
      'import.meta.env.DEV': 'false',
      ...env,
    },
    external: [],
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js'],
    jsx: 'automatic',
    jsxDev: false,
    platform: 'browser',
    mainFields: ['browser', 'module', 'main'],
    conditions: ['browser', 'import', 'module', 'default'],
    metafile: true,
    splitting: false,
    plugins: [
      {
        name: 'external-urls',
        setup(build) {
          build.onResolve({ filter: /^https?:\/\// }, args => {
            return { path: args.path, external: true };
          });
        },
      },
    ],
  });
  
  console.log('✅ JavaScript build completed');
  
} catch (error) {
  console.error('❌ JavaScript build failed:', error);
  process.exit(1);
}

// STEP 4: Create production HTML with correct asset references
console.log('\n📝 STEP 4: Creating production HTML...');
fs.copyFileSync('index.html', 'dist/index.html');
let html = fs.readFileSync('dist/index.html', 'utf8');

// Remove ALL existing script and CSS links
html = html.replace(/<script[^>]*src="[^"]*"[^>]*><\/script>/g, '');
html = html.replace(/<link[^>]*href="[^"]*\.(css|js)"[^>]*>/g, '');

// Add production CSS (before closing head)
html = html.replace('</head>', 
  `  <link rel="preload" href="/styles-${buildHash}.css" as="style">\n` +
  `  <link rel="stylesheet" href="/styles-${buildHash}.css" type="text/css">\n` +
  `</head>`
);

// Add production JS (before closing body)
html = html.replace('</body>', 
  `  <script type="module" src="/app-${buildHash}.js"></script>\n` +
  `</body>`
);

// Add dark-mode class and build info
html = html.replace('<body>', `<body class="dark-mode" data-build="${buildHash}">`);
html = html.replace('<head>', 
  `<head>\n  <meta name="build-version" content="${buildHash}">\n  <meta name="build-time" content="${new Date().toISOString()}">`
);

fs.writeFileSync('dist/index.html', html);
console.log('✅ Production HTML created');

// STEP 5: Final verification
console.log('\n🔍 STEP 5: Final verification...');
const distFiles = fs.readdirSync('dist');
console.log('📁 Dist files:', distFiles);

const cssFile = `styles-${buildHash}.css`;
const jsFile = `app-${buildHash}.js`;

if (!distFiles.includes(cssFile)) {
  console.error('❌ CSS file missing!');
  process.exit(1);
}

if (!distFiles.includes(jsFile)) {
  console.error('❌ JS file missing!');
  process.exit(1);
}

// Final CSS verification
const finalCssStats = fs.statSync(`dist/${cssFile}`);
const finalCssSize = (finalCssStats.size / 1024).toFixed(2);

console.log('\n✅ BUILD COMPLETE!');
console.log('🎯 Files created:');
console.log(`   📄 index.html`);
console.log(`   🎨 ${cssFile} (${finalCssSize} KB)`);
console.log(`   ⚡ ${jsFile}`);

if (finalCssStats.size >= 50000) {
  console.log('\n🎉 SUCCESS: CSS file is the right size with utility classes!');
} else {
  console.log('\n⚠️  WARNING: CSS file might be missing utility classes');
}

console.log('\n🚀 Ready to deploy to Firebase!');
console.log('💡 Run: firebase deploy --only hosting');