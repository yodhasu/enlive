import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  base: '/',
  publicDir: 'public',
  build: {
    target: 'es2021',
    outDir: 'dist',
    sourcemap: true,
  },
});
