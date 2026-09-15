import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const basePath = process.env.VITE_BASE_PATH;

// Локально — корень '/'. На GitHub Pages — абсолютный путь подпапки репозитория
// (задаётся в workflow переменной VITE_BASE_PATH, например '/webtoon-reader').
const base = basePath ? `/${basePath.replace(/^\/+|\/+$/g, '')}/` : '/';

export default defineConfig({
  base,
  plugins: [
      react(),
      // Этап 6.6: офлайн (SW + precache + runtime-кеш артов/страниц/шрифтов)
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'pwa/icon-192.png', 'pwa/icon-512.png', 'pwa/icon-maskable-512.png'],
        manifest: {
          name: 'Hyperborea — Легенда о Северном Царстве',
          short_name: 'Hyperborea',
          description: 'Городское тёмное фэнтези: веб-комикс «Гиперборея» и артбук.',
          lang: 'ru',
          theme_color: '#0b0a10',
          background_color: '#0b0a10',
          display: 'standalone',
          start_url: base,
          scope: base,
          icons: [
            { src: 'pwa/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'pwa/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          navigateFallback: `${base}index.html`,
          // Преcache: только критичные и WebP-производные (оригиналы JPG/PNG
          // — лишь fallback для <picture>, их 3-4 МБ в SW не кладём)
          globPatterns: ['**/*.{js,css,html,woff2,svg,webp}'],
          // Офлайн-ядро: критичные + первая глава. Арты и главы 2–3
          // докешируются при первом заходе через runtimeCaching.
          globIgnores: ['**/images/art/webp/**', '**/pages/chapter-2/**', '**/pages/chapter-3/**'],
          runtimeCaching: [
            {
              // Первая глава и страницы комикса — приоритет из кеша
              urlPattern: ({ url }) => url.pathname.includes('/pages/'),
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'comic-pages',
                expiration: { maxEntries: 40, maxAgeSeconds: 30 * 24 * 60 * 60 },
              },
            },
            {
              urlPattern: ({ url }) => url.pathname.includes('/images/'),
              handler: 'CacheFirst',
              options: {
                cacheName: 'art',
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 24 * 60 * 60 },
              },
            },
            {
              urlPattern: /\.(?:woff2?)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'fonts',
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 24 * 60 * 60 },
              },
            },
          ],
        },
      }),
    ],
    build: {
      outDir: 'dist',
      rolldownOptions: {
        output: {
          // GSAP/ScrollTrigger — в отдельный vendor-чанк: общий для читалки
          // и скролл-анимаций, редко меняется (выгодный HTTP-кеш), не раздувает
          // главный чанк приложения.
          codeSplitting: {
            groups: [
              { name: 'vendor-anim', test: /[\\/]node_modules[\\/](gsap|@studio-freight[\\/]lenis)[\\/]/ },
            ],
          },
        },
      },
    },
});