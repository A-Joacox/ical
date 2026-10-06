import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      pwaAssets: { config: true, overrideManifestIcons: true },
      injectManifest: { globPatterns: ['**/*.{js,css,html,svg,png,ico,wasm}'] },
      manifest: {
        name: 'Self Grow',
        short_name: 'Self Grow',
        description: 'Calorías, gym, agenda y home-server en una sola app',
        lang: 'es',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        background_color: '#000000',
        theme_color: '#000000',
      },
    }),
  ],
  server: {
    proxy: { '/api': 'http://localhost:3000' },
  },
})
