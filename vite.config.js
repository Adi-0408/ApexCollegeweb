import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    minify: 'terser',
    terserOptions: {
      format: {
        comments: false, // Strip ALL comments so minifier checks pass 100%
      },
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2,
      },
    },
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].min.js',
        chunkFileNames: 'assets/[name]-[hash].min.js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: {
          'vendor-core': ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
});
