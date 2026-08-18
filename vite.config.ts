import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ command }) => ({
  // Project page lives at https://kachamucha.github.io/kachamuchu/, so the
  // production build must be served from that sub-path. Dev stays at root.
  base: command === 'build' ? '/kachamuchu/' : '/',
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
