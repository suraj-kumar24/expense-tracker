import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves the site from /<repo>/, so the build sets BASE=/expense-tracker/.
// Two pages: the product page at the root and the app at app/.
export default defineConfig({
  base: process.env.BASE || '/',
  build: {
    rollupOptions: { input: { home: 'index.html', app: 'app/index.html' } }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Envelope',
        short_name: 'Envelope',
        description: 'See where your money goes each month, one category at a time.',
        start_url: 'app/',
        scope: './',
        theme_color: '#f5ead8',
        background_color: '#f5ead8',
        display: 'standalone',
        orientation: 'portrait',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,jpg,woff2}'],
        navigateFallback: null, // each page is precached by its own URL
        runtimeCaching: [{
          urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
          handler: 'CacheFirst',
          options: { cacheName: 'fonts', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 } }
        }]
      }
    })
  ]
});
