import { readFile } from 'node:fs/promises'
import { join, normalize, extname } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'

// Proxy para servir imágenes subidas por el usuario desde public/images/.
// Ejemplo: /api/images/beato1.png -> sirve public/images/beato1.png
// Se usa una ruta de la API para controlar el acceso y el cacheado.

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Extrae la ruta relativa después de /api/images/
  const url = new URL(req.url ?? '/', 'http://localhost')
  const relative = url.pathname.replace(/^\/api\/images\//, '')

  // Evita el path traversal (../) y normaliza la ruta.
  const safe = normalize(relative).replace(/^(\.\.(\/|\\|$))+/, '')
  const filePath = join(process.cwd(), 'public', 'images', safe)

  try {
    const data = await readFile(filePath)
    const ext = extname(filePath).toLowerCase()
    res.statusCode = 200
    res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream')
    // Cachea la imagen durante un año (los nombres de archivo cambian al subir nuevas).
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    res.end(data)
  } catch {
    res.statusCode = 404
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end('Imagen no encontrada')
  }
}