import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    open: true,
  },
  build: {
    outDir: 'dist',
    // Enable source maps for better debugging
    sourcemap: true,
    // Minify with terser for smaller bundle size
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Manual chunks to reduce bundle size
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'ui-vendor': ['@nextui-org/react', 'framer-motion', '@headlessui/react', '@heroicons/react'],
          'utils': ['date-fns', 'lodash', 'react-hot-toast'],
          'i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          'charts': ['recharts'],
        },
      },
    },
    // Target modern browsers for smaller bundle size
    target: 'es2015',
    // Optimize CSS
    cssCodeSplit: true,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@nextui-org/react',
      'framer-motion',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'firebase/storage',
      'firebase/messaging',
      'firebase/functions',
    ],
  },
  // Environment variable prefix
  envPrefix: 'VITE_',
  // Server configuration for preview
  preview: {
    port: 4173,
    host: true,
  },
});