import { defineConfig } from 'vite';

export default defineConfig({
  root: 'frontend',
  base: './',
  build: {
    outDir: '../build/frontend',
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0',
    port: 9000,
    allowedHosts: true,
    hmr: {
      overlay: false,
    },
  },
});
