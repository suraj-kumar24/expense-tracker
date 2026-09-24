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
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Envelope',
        short_name: 'Envelope',
        description: 'See where your money goes each month, one category at a time.',
        start_url: 'app/',
        // Lets the product page notice the app is already installed (getInstalledRelatedApps).
        related_applications: [{ platform: 'webapp', url: 'manifest.webmanifest' }],
        scope: './',
        theme_color: '#f5ead8',
        background_color: '#f5ead8',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          // Android Chrome needs PNGs at 192 and 512 before it offers to install.
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,woff2}'],
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
