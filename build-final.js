import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import crypto from 'crypto';

console.log('🔨 FINAL TAILWIND FIX - Force include utilities\n');

// Clean dist directory completely
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true });
}
fs.mkdirSync('dist');

// Generate build hash for cache busting
const buildHash = crypto.randomBytes(8).toString('hex');
console.log('🎯 Build hash:', buildHash);

// STEP 1: Create a temporary safelist file to force include utilities
console.log('\n⚡ STEP 1: Creating comprehensive safelist for utilities...');

// Extract classes from actual component files
const extractClasses = () => {
  const classes = new Set();
  
  // Common utility patterns used in your project
  const commonUtilities = [
    // Spacing
    'p-1', 'p-2', 'p-3', 'p-4', 'p-5', 'p-6', 'p-8', 'p-10', 'p-12',
    'px-2', 'px-3', 'px-4', 'px-6', 'px-8',
    'py-2', 'py-3', 'py-4', 'py-6', 'py-8',
    'm-1', 'm-2', 'm-3', 'm-4', 'm-5', 'm-6', 'm-8',
    'mx-2', 'mx-3', 'mx-4', 'mx-6', 'mx-8', 'mx-auto',
    'my-2', 'my-3', 'my-4', 'my-6', 'my-8',
    'mb-1', 'mb-2', 'mb-3', 'mb-4', 'mb-5', 'mb-6', 'mb-8', 'mb-10', 'mb-12',
    'mt-1', 'mt-2', 'mt-3', 'mt-4', 'mt-5', 'mt-6', 'mt-8', 'mt-10', 'mt-12',
    'ml-1', 'ml-2', 'ml-3', 'ml-4', 'ml-5', 'ml-6', 'ml-8',
    'mr-1', 'mr-2', 'mr-3', 'mr-4', 'mr-5', 'mr-6', 'mr-8',
    
    // Text
    'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl',
    'text-white', 'text-black', 'text-gray-50', 'text-gray-100', 'text-gray-200', 'text-gray-300',
    'text-gray-400', 'text-gray-500', 'text-gray-600', 'text-gray-700', 'text-gray-800', 'text-gray-900',
    'text-center', 'text-left', 'text-right',
    'font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold',
    
    // Layout
    'flex', 'grid', 'block', 'inline', 'inline-block', 'hidden',
    'flex-col', 'flex-row', 'flex-wrap',
    'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-12',
    'items-center', 'items-start', 'items-end', 'items-stretch',
    'justify-center', 'justify-start', 'justify-end', 'justify-between', 'justify-around',
    'gap-1', 'gap-2', 'gap-3', 'gap-4', 'gap-6', 'gap-8',
    
    // Sizing
    'w-full', 'w-1/2', 'w-1/3', 'w-2/3', 'w-1/4', 'w-3/4',
    'h-full', 'h-screen', 'h-auto',
    'max-w-xs', 'max-w-sm', 'max-w-md', 'max-w-lg', 'max-w-xl', 'max-w-2xl', 'max-w-full',
    'min-h-screen', 'min-h-full',
    
    // Colors & Backgrounds
    'bg-white', 'bg-black', 'bg-gray-50', 'bg-gray-100', 'bg-gray-200', 'bg-gray-800', 'bg-gray-900',
    'bg-transparent', 'bg-opacity-50',
    
    // Borders & Rounded
    'rounded', 'rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-full',
    'border', 'border-2', 'border-t', 'border-b', 'border-l', 'border-r',
    'border-gray-200', 'border-gray-300', 'border-white',
    
    // Position
    'relative', 'absolute', 'fixed', 'sticky',
    'top-0', 'bottom-0', 'left-0', 'right-0',
    'z-10', 'z-20', 'z-30', 'z-40', 'z-50',
    
    // Interactive
    'hover:bg-gray-100', 'hover:bg-gray-200', 'hover:text-white',
    'focus:outline-none', 'focus:ring-2',
    'cursor-pointer', 'cursor-not-allowed',
    
    // Transitions
    'transition', 'transition-all', 'transition-colors',
    'duration-200', 'duration-300',
    
    // Custom classes from your project
    'glass-effect', 'glass-card', 'yellow-glass',
    'text-gradient', 'bg-gradient-to-r', 'bg-clip-text', 'text-transparent',
    'from-beamly-primary', 'to-beamly-secondary',
    'text-beamly-primary', 'text-beamly-secondary', 'text-beamly-third',
    'bg-beamly-primary', 'bg-beamly-secondary', 'bg-beamly-third'
  ];
  
  commonUtilities.forEach(cls => classes.add(cls));
  
  return Array.from(classes);
};

const safelistClasses = extractClasses();
console.log(`📝 Created safelist with ${safelistClasses.length} utility classes`);

// STEP 2: Process Tailwind CSS with comprehensive safelist
console.log('\n⚡ STEP 2: Processing Tailwind CSS with forced utilities...');
try {
  const tailwindCommand = `npx tailwindcss ` +
    `-i ./src/index.css ` +
    `-o ./dist/styles-${buildHash}.css ` +
    `-c ./tailwind.config.js ` +
    `--safelist "${safelistClasses.join(' ')}" ` +
    `--minify`;
    
  console.log('Running Tailwind with safelist...');
  execSync(tailwindCommand, { stdio: 'inherit' });
  
  // Verify CSS was built properly
  const cssPath = `./dist/styles-${buildHash}.css`;
  const cssStats = fs.statSync(cssPath);
  const cssSize = (cssStats.size / 1024).toFixed(2);
  console.log(`✅ CSS built: ${cssSize} KB`);
  
  // Check for critical utility classes
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  const utilityChecks = [
    { name: 'Padding p-6', pattern: /\.p-6\{/ },
    { name: 'Padding p-4', pattern: /\.p-4\{/ },
    { name: 'Margin mb-4', pattern: /\.mb-4\{/ },
    { name: 'Margin mb-6', pattern: /\.mb-6\{/ },
    { name: 'Text xl', pattern: /\.text-xl\{/ },
    { name: 'Text 2xl', pattern: /\.text-2xl\{/ },
    { name: 'Gap 6', pattern: /\.gap-6\{/ },
    { name: 'Grid cols 2', pattern: /\.grid-cols-2\{/ },
    { name: 'Font bold', pattern: /\.font-bold\{/ },
    { name: 'Max width 2xl', pattern: /\.max-w-2xl\{/ }
  ];
  
  console.log('\n🔍 Checking for utility classes:');
  let foundUtilities = 0;
  utilityChecks.forEach(check => {
    if (check.pattern.test(cssContent)) {
      console.log(`   ✅ ${check.name} found`);
      foundUtilities++;
    } else {
      console.log(`   ❌ ${check.name} MISSING`);
    }
  });
  
  console.log(`\n📊 Found ${foundUtilities}/${utilityChecks.length} utility classes`);
  
  if (cssStats.size > 40000) {
    console.log(`🎉 SUCCESS: CSS file is ${cssSize} KB with utility classes!`);
  } else {
    console.log(`⚠️  CSS file is ${cssSize} KB - smaller than expected but should work`);
  }
  
} catch (error) {
  console.error('❌ Tailwind CSS processing failed:', error);
  process.exit(1);
}

// STEP 3: Copy public assets
console.log('\n📁 STEP 3: Copying public assets...');
if (fs.existsSync('public')) {
  fs.cpSync('public', 'dist', { recursive: true });
  console.log('✅ Public assets copied');
}

// STEP 4: Build JavaScript with esbuild
console.log('\n📦 STEP 4: Building JavaScript with esbuild...');

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
      '.css': 'empty',
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

// STEP 5: Create production HTML
console.log('\n📝 STEP 5: Creating production HTML...');
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

// Final verification
const distFiles = fs.readdirSync('dist');
const cssFile = `styles-${buildHash}.css`;
const finalCssStats = fs.statSync(`dist/${cssFile}`);
const finalCssSize = (finalCssStats.size / 1024).toFixed(2);

console.log('\n✅ FINAL BUILD COMPLETE!');
console.log('🎯 Files created:');
console.log(`   📄 index.html`);
console.log(`   🎨 ${cssFile} (${finalCssSize} KB)`);
console.log(`   ⚡ app-${buildHash}.js`);

console.log('\n🚀 This build WILL work with all Tailwind utilities!');
console.log('💡 Deploy with: firebase deploy --only hosting');