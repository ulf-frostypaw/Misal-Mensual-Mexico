import mdx from '@mdx-js/rollup'
import react from '@vitejs/plugin-react'
import { readFile } from 'node:fs/promises'
import { join, normalize, extname } from 'node:path'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import { defineConfig, type Plugin } from 'vite'
import remarkSections from './src/remark-sections.ts'

// Tipos MIME para las imágenes servidas por el proxy.
const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
}

// En desarrollo, el servidor de Vite no ejecuta las funciones serverless de
// Vercel, así que servimos /api/images/* con un middleware propio desde
// public/images/ para que funcione igual que en producción.
const serveImagesInDev = (): Plugin => ({
  name: 'serve-images-in-dev',
  configureServer(server) {
    server.middlewares.use('/api/images', async (req, res) => {
      const url = new URL(req.url ?? '/', 'http://localhost')
      const relative = url.pathname.replace(/^\/api\/images\//, '')
      const safe = normalize(relative).replace(/^(\.\.(\/|\\|$))+/, '')
      const filePath = join(process.cwd(), 'public', 'images', safe)
      try {
        const data = await readFile(filePath)
        const ext = extname(filePath).toLowerCase()
        res.statusCode = 200
        res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream')
        res.end(data)
      } catch {
        res.statusCode = 404
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.end('Imagen no encontrada')
      }
    })
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    serveImagesInDev(),
    mdx({
      providerImportSource: '@mdx-js/react',
      remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkSections],
    }),
  ],
})
