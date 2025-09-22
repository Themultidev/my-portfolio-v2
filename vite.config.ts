import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
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
        main: 'index.html',
        overview: 'overview.html'
      }
    }
  }
})
