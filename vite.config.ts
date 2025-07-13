import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    open: false,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'react-hot-toast',
      '@tanstack/react-query',
      'framer-motion',
      '@nextui-org/react',
      'i18next',
      'react-i18next',
      'i18next-browser-languagedetector'
    ]
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@nextui-org/react'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
        },
      },
      onwarn(warning, warn) {
        // Suppress warnings about missing source maps
        if (warning.code === 'SOURCEMAP_ERROR') return;
        warn(warning);
      }
    },
  },
  envPrefix: 'VITE_',
});