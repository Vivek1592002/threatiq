import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

/**
 * Production Content-Security-Policy. Injected only into the built HTML —
 * Vite's dev server relies on inline module preambles for HMR.
 * (frame-ancestors / HSTS must be set as real response headers by the host.)
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

function cspPlugin(): Plugin {
  return {
    name: 'rdr-csp',
    apply: 'build',
    transformIndexHtml: () => [
      { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' },
    ],
  };
}

/**
 * Vite rejects unknown Host headers (DNS-rebinding protection). Allow ngrok
 * tunnel domains explicitly instead of disabling the check with `true`.
 * Extra hosts can be added via VITE_ALLOWED_HOSTS=a.example.com,b.example.com
 */
const allowedHosts = [
  '.ngrok-free.app',
  '.ngrok-free.dev',
  '.ngrok.app',
  '.ngrok.dev',
  '.ngrok.io',
  ...(process.env.VITE_ALLOWED_HOSTS?.split(',').map((h) => h.trim()).filter(Boolean) ?? []),
];

export default defineConfig({
  plugins: [react(), cspPlugin()],
  server: { allowedHosts },
  preview: { allowedHosts },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Stable vendor chunks: app deploys don't invalidate cached libraries.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) return 'react';
          if (/[\\/](@tanstack|zustand)[\\/]/.test(id)) return 'data';
          if (/[\\/](d3-[a-z]+|internmap)[\\/]/.test(id)) return 'd3';
          if (/[\\/](motion|framer-motion|motion-dom|motion-utils)[\\/]/.test(id)) return 'motion';
          return 'vendor';
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
