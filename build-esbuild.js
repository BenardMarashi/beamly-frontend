import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🔨 Building with ESBuild (bypassing Rollup)...');

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Process Tailwind CSS first with content scanning
console.log('⚡ Processing Tailwind CSS...');
try {
 execSync('npx tailwindcss@3.4.1 -i ./src/index.css -o ./dist/main.css --content "./src/**/*.{js,ts,jsx,tsx}" --content "./index.html" --content "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}"', { stdio: 'inherit' });  console.log('✅ Tailwind CSS processed');
} catch (error) {
  console.error('❌ Tailwind CSS processing failed:', error);
  process.exit(1);
}

// Copy public folder contents to dist
if (fs.existsSync('public')) {
  fs.cpSync('public', 'dist', { recursive: true });
  console.log('✅ Copied public assets');
}

// Copy and update index.html
fs.copyFileSync('index.html', 'dist/index.html');
let html = fs.readFileSync('dist/index.html', 'utf8');
// Add CSS link in head and script in body
html = html.replace('</head>', '    <link rel="stylesheet" href="/main.css">\n  </head>');
html = html.replace('<script type="module" src="/src/main.tsx"></script>', '<script type="module" src="/main.js"></script>');
// Force dark-mode class on body
html = html.replace('<body>', '<body class="dark-mode">');
fs.writeFileSync('dist/index.html', html);
console.log('✅ Updated index.html with CSS and dark-mode class');

// Read environment variables from .env file
import { config } from 'dotenv';
config(); // Load .env file

// Define import.meta.env as a complete object for ESBuild
const env = {
  'import.meta.env': JSON.stringify({
    VITE_FIREBASE_API_KEY: 'AIzaSyA8iNiFS-1dW-ntuJtv84atQQzHZyZka-U',
    VITE_FIREBASE_AUTH_DOMAIN: 'beamly-app.firebaseapp.com',
    VITE_FIREBASE_PROJECT_ID: 'beamly-app',
    VITE_FIREBASE_STORAGE_BUCKET: 'beamly-app.appspot.com',
    VITE_FIREBASE_MESSAGING_SENDER_ID: '663724690900',
    VITE_FIREBASE_APP_ID: '1:663724690900:web:0846e84e4bfec91ddb1a41',
    VITE_FIREBASE_MEASUREMENT_ID: 'G-2T41KM2ZFK',
    VITE_PAYMENT_PROVIDER: 'stripe',
    VITE_STRIPE_PUBLISHABLE_KEY: 'pk_live_51RdSRmDtB4sjDNJyR97SlxSSI6JtoHGq94VAb9Iy9YGmunnBFAZUuW6m6NEhkRU19eLE04YR20BYOxuc8j5U5FGM007fmevCim',
    NODE_ENV: 'production',
    PROD: true,
    DEV: false,
    MODE: 'production',
  }),
};

// Build with esbuild
esbuild.build({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  outfile: 'dist/main.js',
  format: 'esm',
  target: 'es2020',
  minify: false,
  sourcemap: false,
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
    '.jsx': 'jsx',
    '.js': 'js',
    '.css': 'empty', // Ignore CSS imports since we process separately
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
  plugins: [
    {
      name: 'import-meta-url',
      setup(build) {
        build.onResolve({ filter: /^https?:\/\// }, args => {
          return { path: args.path, external: true };
        });
      },
    },
  ],
}).then(() => {
  console.log('✅ Build complete with ESBuild!');
  console.log('📁 Output directory: dist/');
}).catch((error) => {
  console.error('❌ Build failed:', error);
  process.exit(1);
});