import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
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
      name: 'RSVPWidget',
      formats: ['iife'],
      fileName: () => 'rsvp-widget.js',
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
    // Define all environment variables used in the widget
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env.NEXTAUTH_URL': JSON.stringify(process.env.NEXTAUTH_URL || 'https://rsvp-wine.vercel.app'),
    // Replace any other process.env references
    'process.env': JSON.stringify({}),
  },
});
