import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Force console output
console.log('🔧 Loading vite.config.ts...');

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'debug-build',
      buildStart() {
        console.log('🚀 Build starting...');
      },
      buildEnd() {
        console.log('✅ Build ended');
      },
      closeBundle() {
        console.log('📦 Bundle closed');
      }
    }
  ],
  
  define: {
    global: 'globalThis',
  },
  
  server: {
    port: 5173,
    host: true,
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: false, // Disable minify to see if that's the issue
    
    // Force rollup to show what it's doing
    rollupOptions: {
      onwarn(warning, warn) {
        console.log('⚠️ Rollup warning:', warning.message);
        warn(warning);
      },
      
      plugins: [
        {
          name: 'debug-rollup',
          buildStart() {
            console.log('🎯 Rollup build starting...');
          },
          buildEnd() {
            console.log('🎯 Rollup build ended');
          },
          generateBundle(options, bundle) {
            console.log('📝 Generating bundle...');
            console.log('📁 Output dir:', options.dir);
            console.log('📄 Files:', Object.keys(bundle));
          }
        }
      ]
    }
  },
  
  // Maximum logging
  logLevel: 'info'
})