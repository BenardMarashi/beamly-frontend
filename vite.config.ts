import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  server: {
    port: 5173,
    host: true,
    open: false,
  },
  optimizeDeps: {
    force: true,
    include: ['react', 'react-dom', '@nextui-org/react'],
    exclude: ['@firebase/app', '@firebase/auth', '@firebase/firestore', '@firebase/storage'],
  },
  build: {
    // Bypass Rollup optimization issues
    minify: 'esbuild',
    target: 'es2020',
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
      treeshake: false,
    },
    cssCodeSplit: false,
    chunkSizeWarningLimit: 10000,
  },
  esbuild: {
    keepNames: true,
    minifyIdentifiers: false,
    minifySyntax: false,
  },
  envPrefix: 'VITE_',
});