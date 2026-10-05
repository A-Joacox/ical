import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Genera favicon, íconos del manifest y apple-touch-icon a partir de public/icon.svg.
// Fondo negro para que el relleno de los íconos iOS/maskable no quede blanco.
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    apple: { ...minimal2023Preset.apple, padding: 0.1, resizeOptions: { background: '#000000' } },
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: '#000000' } },
  },
  images: ['public/icon.svg'],
})
