import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import crypto from 'crypto';

console.log('🔨 Building with BULLETPROOF ESBuild...');

// Clean dist directory completely
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true });
}
fs.mkdirSync('dist');

// Generate unique hash for cache busting
const buildHash = crypto.randomBytes(8).toString('hex');
console.log('🎯 Build hash:', buildHash);

// Process Tailwind CSS with COMPREHENSIVE content scanning
console.log('⚡ Processing Tailwind CSS with enhanced scanning...');
try {
  // Create explicit safelist for dynamic classes
  const safelistClasses = [
    'glass-effect',
    'glass-card', 
    'yellow-glass',
    'dark-mode',
    'light-mode',
    'bg-white',
    'bg-gray-100',
    'bg-gray-200',
    'text-white',
    'text-gray-300',
    'text-gray-400', 
    'text-gray-500',
    'text-gray-600',
    'text-gray-700',
    'text-gray-800',
    'text-gray-900',
    'border-white/10',
    'border-white/20',
    'border-gray-200',
    'hover:bg-white/10',
    'hover:bg-white/20',
    'hover:bg-gray-100',
    'hover:bg-gray-200',
    'backdrop-filter',
    'backdrop-blur-md',
    'backdrop-blur-lg',
    'bg-gradient-to-r',
    'from-beamly-primary',
    'to-beamly-secondary',
    'bg-clip-text',
    'text-transparent'
  ];
  
  const tailwindCommand = `npx tailwindcss -i ./src/index.css -o ./dist/styles-${buildHash}.css ` +
    `--content "./src/**/*.{js,ts,jsx,tsx,html}" ` +
    `--content "./index.html" ` +
    `--content "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}" ` +
    `--safelist "${safelistClasses.join(' ')}" ` +
    `--minify`;
    
  execSync(tailwindCommand, { stdio: 'inherit' });
  console.log('✅ Tailwind CSS processed successfully');
  
  // Verify CSS file was created and has content
  const cssPath = `./dist/styles-${buildHash}.css`;
  if (!fs.existsSync(cssPath)) {
    throw new Error('CSS file was not created');
  }
  
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  if (cssContent.length < 1000) {
    throw new Error('CSS file appears to be too small - possible processing error');
  }
  
  console.log('✅ CSS file verification passed:', cssContent.length, 'bytes');
  
} catch (error) {
  console.error('❌ Tailwind CSS processing failed:', error);
  process.exit(1);
}

// Copy public folder contents
if (fs.existsSync('public')) {
  fs.cpSync('public', 'dist', { recursive: true });
  console.log('✅ Copied public assets');
}

// Create optimized index.html
console.log('📝 Creating optimized index.html...');
fs.copyFileSync('index.html', 'dist/index.html');
let html = fs.readFileSync('dist/index.html', 'utf8');

// Remove any existing CSS/JS links and the dev script
html = html.replace(/<link[^>]*href="[^"]*\.(css|js)"[^>]*>/g, '');
html = html.replace(/<script[^>]*src="[^"]*"[^>]*><\/script>/g, '');

// Add cache-busted CSS and JS with proper attributes
html = html.replace('</head>', 
  `  <link rel="preload" href="/styles-${buildHash}.css" as="style">\n` +
  `  <link rel="stylesheet" href="/styles-${buildHash}.css" type="text/css">\n` +
  `  <style>body { font-family: 'Inter', sans-serif; }</style>\n` +
  `</head>`
);

html = html.replace('</body>', 
  `  <script type="module" src="/app-${buildHash}.js"></script>\n` +
  `</body>`
);

// Force dark-mode class and add timestamp
html = html.replace('<body>', `<body class="dark-mode" data-build="${buildHash}">`);

// Add meta tag for cache busting
html = html.replace('<head>', 
  `<head>\n  <meta name="build-version" content="${buildHash}">\n  <meta name="build-time" content="${new Date().toISOString()}">`
);

fs.writeFileSync('dist/index.html', html);
console.log('✅ HTML optimized with cache busting');

// Environment variables with fallbacks
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

// Enhanced ESBuild configuration
console.log('🔧 Building JavaScript with ESBuild...');
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
      '.css': 'empty', // Ignore CSS imports - we handle separately
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
    chunkNames: `chunks/[name]-${buildHash}`,
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
  
  console.log('✅ JavaScript build completed successfully');
  
} catch (error) {
  console.error('❌ JavaScript build failed:', error);
  process.exit(1);
}

// Create build manifest for debugging
const manifest = {
  buildTime: new Date().toISOString(),
  buildHash: buildHash,
  files: {
    css: `styles-${buildHash}.css`,
    js: `app-${buildHash}.js`,
    html: 'index.html'
  },
  environment: 'production',
  tailwindVersion: 'v4.1.11' // Static version since npx command fails
};

fs.writeFileSync('dist/build-manifest.json', JSON.stringify(manifest, null, 2));

// Final verification
console.log('🔍 Final verification...');
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

console.log('✅ BULLETPROOF BUILD COMPLETE!');
console.log('🎯 Files created:');
console.log(`   📄 index.html`);
console.log(`   🎨 ${cssFile}`);
console.log(`   ⚡ ${jsFile}`);
console.log(`   📋 build-manifest.json`);
console.log('');
console.log('🚀 Ready to deploy to Firebase!');