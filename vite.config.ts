import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { readFileSync } from 'node:fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [
    {
      name: 'html-components',
      transformIndexHtml: {
        order: 'pre',
        handler(html, context) {
          return html.replace(
            /<include src="([^"]+)"><\/include>/g,
            (_, source) => readFileSync(resolve(dirname(context.filename), source), 'utf8')
          )
        }
      },
      configureServer(server) {
        const componentsDirectory = resolve(__dirname, 'src/components')
        server.watcher.add(componentsDirectory)
        server.watcher.on('change', (file) => {
          if (file.replace(/\\/g, '/').startsWith(componentsDirectory.replace(/\\/g, '/') + '/')) {
            server.ws.send({ type: 'full-reload', path: '*' })
          }
        })
      }
    },
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
