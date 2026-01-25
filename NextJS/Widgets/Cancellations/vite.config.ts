import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import path from 'path';

export default defineConfig({
  publicDir: false,
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
      name: 'CancellationsWidget',
      formats: ['iife'],
      fileName: () => 'cancellations-widget.js',
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
    'process.env': JSON.stringify({}),
  },
});
