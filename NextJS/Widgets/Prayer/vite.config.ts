import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    // Inject CSS into the JS bundle so it's all in one file
    cssInjectedByJsPlugin(),
  ],
  css: {
    postcss: {
      plugins: [
        // Use Tailwind v4 PostCSS plugin
        require('@tailwindcss/postcss'),
      ],
    },
  },
  build: {
    // Output to public directory so Vercel serves it
    outDir: 'public/widget',
    // Generate a single bundle file
    lib: {
      entry: path.resolve(__dirname, 'widget/index.tsx'),
      name: 'PrayerWidget',
      formats: ['iife'],
      fileName: () => 'prayer-widget.js',
    },
    rollupOptions: {
      // Don't bundle these - they should be available globally or handled internally
      external: [],
      output: {
        // Put everything in a single file
        inlineDynamicImports: true,
        // Global variable name for the widget
        globals: {},
      },
    },
    // Optimize for production
    minify: 'terser',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    // Define environment variables for the widget
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
});
