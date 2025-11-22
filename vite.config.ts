import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  server: {
    port:1000
  },

 build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        overview: resolve(__dirname, 'overview.html')
      }
    }
  }
})
