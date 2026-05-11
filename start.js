const { createServer } = require('http')
const { existsSync, readFileSync, statSync } = require('fs')
const { extname, join, normalize, sep } = require('path')

const port = Number(process.env.PORT || 3000)
const root = join(__dirname, 'out')
const indexFile = join(root, 'index.html')
const mainAppUrl = (process.env.NEXT_PUBLIC_ORDR_APP_URL || 'https://panelordr.com.br').replace(/\/$/, '')

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

function send(res, statusCode, body, contentType = 'text/plain; charset=utf-8') {
  res.statusCode = statusCode
  res.setHeader('Content-Type', contentType)
  res.end(body)
}

function sendFile(res, filePath) {
  const ext = extname(filePath).toLowerCase()
  res.statusCode = 200
  res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream')

  if (filePath.includes(`${sep}_next${sep}`)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
  } else {
    res.setHeader('Cache-Control', 'public, max-age=300')
  }

  res.end(readFileSync(filePath))
}

function sendLoginRedirect(res) {
  send(
    res,
    200,
    `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${mainAppUrl}/login/"><script>location.replace(${JSON.stringify(`${mainAppUrl}/login/`)})</script><title>ORDR Suppliers</title></head><body>Redirecionando...</body></html>`,
    'text/html; charset=utf-8'
  )
}

function resolveStaticFile(pathname) {
  const decodedPath = decodeURIComponent(pathname || '/')
  const safePath = normalize(decodedPath).replace(/^([/\\])+/, '')

  if (safePath.startsWith('..')) return null

  let filePath = join(root, safePath)

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, 'index.html')
  }

  if (existsSync(filePath)) return filePath

  const htmlFile = join(root, `${safePath}.html`)
  if (existsSync(htmlFile)) return htmlFile

  return existsSync(indexFile) ? indexFile : null
}

createServer((req, res) => {
  try {
    const url = new URL(req.url || '/', `http://localhost:${port}`)
    const filePath = resolveStaticFile(url.pathname)

    if (!filePath) {
      console.error('[suppliers.ordr] Missing static build output. Expected:', indexFile)
      sendLoginRedirect(res)
      return
    }

    sendFile(res, filePath)
  } catch (error) {
    console.error('[suppliers.ordr] Request failed:', error)
    send(res, 500, 'Internal server error')
  }
}).listen(port, '0.0.0.0', () => {
  console.log(`[suppliers.ordr] Static app running on 0.0.0.0:${port}`)
  console.log(`[suppliers.ordr] Serving: ${root}`)
})
