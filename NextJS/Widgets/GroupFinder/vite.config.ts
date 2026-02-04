import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    cssInjectedByJsPlugin(),
  ],
  css: {
    postcss: {
      plugins: [
        require('@tailwindcss/postcss'),
      ],
    },
  },
  build: {
    outDir: 'public/widget',
    lib: {
      entry: path.resolve(__dirname, 'widget/index.tsx'),
      name: 'GroupFinderWidget',
      formats: ['iife'],
      fileName: () => 'group-finder-widget.js',
    },
    rollupOptions: {
      external: [],
      output: {
        inlineDynamicImports: true,
        globals: {},
      },
    },
    minify: 'terser',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env.NEXTAUTH_URL': JSON.stringify(process.env.NEXTAUTH_URL || 'https://group-finder.vercel.app'),
    'process.env': JSON.stringify({}),
  },
});
