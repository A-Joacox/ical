import { fileURLToPath } from 'node:url'
import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'

const port = Number(process.env.PORT ?? 3000)
const host = process.env.HOST ?? '0.0.0.0'
const webDist = process.env.WEB_DIST ?? fileURLToPath(new URL('../../web/dist', import.meta.url))

const app = Fastify({ logger: true })

app.get('/api/health', async () => ({ ok: true, time: new Date().toISOString() }))

// Sirve la PWA compilada. El SW, el HTML y el manifest se revalidan siempre para que
// las actualizaciones lleguen al iPhone; los assets con hash se cachean para siempre.
await app.register(fastifyStatic, {
  root: webDist,
  setHeaders(reply, filePath) {
    if (/\.(html|webmanifest)$|sw\.js$/.test(filePath)) {
      reply.header('Cache-Control', 'no-cache')
    } else if (/[\\/]assets[\\/]/.test(filePath)) {
      reply.header('Cache-Control', 'public, max-age=31536000, immutable')
    }
  },
})

// Rutas del cliente (SPA): cualquier GET que no sea /api devuelve index.html.
app.setNotFoundHandler((req, reply) => {
  if (req.method !== 'GET' || req.url.startsWith('/api/')) {
    return reply.code(404).send({ error: 'not_found' })
  }
  return reply.sendFile('index.html')
})

await app.listen({ port, host })
