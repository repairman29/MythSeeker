import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps for production to reduce bundle size
    chunkSizeWarningLimit: 500, // Optimize chunk size warning limit
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries
          'react-vendor': ['react', 'react-dom'],
          'firebase-core': ['firebase/app'],
          'firebase-auth': ['firebase/auth'],
          'firebase-firestore': ['firebase/firestore'],
          'firebase-functions': ['firebase/functions'],
          'firebase-database': ['firebase/database'],
          'ui-vendor': ['lucide-react'],
          'utils-vendor': ['@tanstack/react-virtual'],
        },
        // Optimize chunk naming
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
        passes: 2, // Multiple compression passes
      },
      mangle: {
        safari10: true,
      },
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['@tanstack/react-virtual'], // Exclude from pre-bundling to reduce initial bundle
  },
  // Performance optimizations
  server: {
    hmr: {
      overlay: false, // Disable error overlay in development
    },
  },
}) 