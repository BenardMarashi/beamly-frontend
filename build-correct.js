import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import crypto from 'crypto';

console.log('🔨 CORRECT PRODUCTION BUILD - Using tailwind.config.js\n');

// Clean dist directory completely
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true });
}
fs.mkdirSync('dist');

// Generate build hash for cache busting
const buildHash = crypto.randomBytes(8).toString('hex');
console.log('🎯 Build hash:', buildHash);

// STEP 1: Process Tailwind CSS FIRST using the config file
console.log('\n⚡ STEP 1: Processing Tailwind CSS using tailwind.config.js...');
try {
  // Use the config file for proper content detection and NextUI integration
  const tailwindCommand = `npx tailwindcss ` +
    `-i ./src/index.css ` +
    `-o ./dist/styles-${buildHash}.css ` +
    `-c ./tailwind.config.js ` +
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
    { name: 'Flexbox (.flex)', pattern: /\.flex\{/ },
    { name: 'Grid (.grid)', pattern: /\.grid\{/ },
    { name: 'Padding (.p-6)', pattern: /\.p-6\{/ },
    { name: 'Margin (.mb-4)', pattern: /\.mb-4\{/ },
    { name: 'Text sizes (.text-xl)', pattern: /\.text-xl\{/ },
    { name: 'Text white (.text-white)', pattern: /\.text-white\{/ },
    { name: 'Text gray (.text-gray-300)', pattern: /\.text-gray-300\{/ },
    { name: 'Items center (.items-center)', pattern: /\.items-center\{/ },
    { name: 'Justify center (.justify-center)', pattern: /\.justify-center\{/ },
    { name: 'Glass effect (.glass-effect)', pattern: /\.glass-effect\{/ }
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
  
  console.log(`\n📊 Found ${foundUtilities}/${utilityChecks.length} expected utility classes`);
  
  if (cssStats.size < 30000) {
    console.warn(`\n⚠️  WARNING: CSS file is only ${cssSize} KB (might be missing utilities)`);
  } else {
    console.log(`✅ CSS file size looks good: ${cssSize} KB`);
  }
  
  // If we're missing too many utilities, let's try without minification to debug
  if (foundUtilities < 6) {
    console.log('\n🔧 Utilities missing, trying unminified build for debugging...');
    const debugCommand = `npx tailwindcss ` +
      `-i ./src/index.css ` +
      `-o ./dist/styles-${buildHash}-debug.css ` +
      `-c ./tailwind.config.js`;
    
    execSync(debugCommand, { stdio: 'inherit' });
    const debugStats = fs.statSync(`./dist/styles-${buildHash}-debug.css`);
    console.log(`Debug CSS size: ${(debugStats.size / 1024).toFixed(2)} KB`);
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

// STEP 3: Build JavaScript with esbuild
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

// STEP 4: Create production HTML
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

// Final CSS size check
const finalCssStats = fs.statSync(`dist/${cssFile}`);
const finalCssSize = (finalCssStats.size / 1024).toFixed(2);

console.log('\n✅ BUILD COMPLETE!');
console.log('🎯 Files created:');
console.log(`   📄 index.html`);
console.log(`   🎨 ${cssFile} (${finalCssSize} KB)`);
console.log(`   ⚡ ${jsFile}`);

// Create a build report
const buildReport = {
  buildTime: new Date().toISOString(),
  buildHash: buildHash,
  cssSize: `${finalCssSize} KB`,
  files: {
    css: cssFile,
    js: jsFile,
    html: 'index.html'
  }
};

fs.writeFileSync('dist/build-report.json', JSON.stringify(buildReport, null, 2));

console.log('\n🚀 Ready to deploy!');
console.log('💡 Run: firebase deploy --only hosting');