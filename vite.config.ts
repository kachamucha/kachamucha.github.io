import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(() => ({
  // Served from the user Pages site https://kachamucha.github.io/ (the
  // kachamucha.github.io repo), which lives at the domain root.
  base: '/',
  server: {
    // Never let the browser (or the dev tunnel) cache dev files, so edits show
    // up on a normal phone reload instead of needing a hard refresh.
    headers: {
      'Cache-Control': 'no-store'
    }
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        issue1: resolve(__dirname, 'issue-01.html'),
        cart: resolve(__dirname, 'cart.html')
      }
    }
  }
}));
