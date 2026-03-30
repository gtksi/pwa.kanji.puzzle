import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/pwa.kanji.puzzle/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: '漢字パズル — 漢字クエスト',
        short_name: '漢字パズル',
        description: '唱えておぼえる漢字パズルPWA',
        theme_color: '#0f0f14',
        background_color: '#0f0f14',
        display: 'standalone',
        icons: [
          { src: 'favicon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
  },
})
