const { createServer } = require('http')
const { join, normalize } = require('path')
const { readFileSync, existsSync, statSync } = require('fs')

const port = Number(process.env.PORT || 3002)
const root = join(__dirname, 'out')
const mainLoginUrl = process.env.NEXT_PUBLIC_ORDR_APP_URL || 'https://panelordr.com.br'

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.json': 'application/json; charset=utf-8',
}

function sendRedirectPage(res) {
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.end(`<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${mainLoginUrl.replace(/\/$/, '')}/login/"><title>ORDR Suppliers</title></head><body>Redirecionando...</body></html>`)
}

createServer((req, res) => {
  try {
    const url = new URL(req.url || '/', `http://localhost:${port}`)
    let pathname = decodeURIComponent(url.pathname)

    if (pathname.includes('..')) {
      res.statusCode = 400
      res.end('Bad request')
      return
    }

    let filePath = join(root, pathname)

    if (existsSync(filePath) && statSync(filePath).isDirectory()) {
      filePath = join(filePath, 'index.html')
    }

    if (!existsSync(filePath)) {
      filePath = join(root, pathname + '.html')
    }

    if (!existsSync(filePath)) {
      filePath = join(root, 'index.html')
    }

    if (!existsSync(filePath)) {
      // Prevent the process from crashing and causing 503 if the app was started before build/output exists.
      sendRedirectPage(res)
      return
    }

    const ext = filePath.slice(filePath.lastIndexOf('.'))
    res.setHeader('Content-Type', mime[ext] || 'application/octet-stream')
    res.end(readFileSync(filePath))
  } catch (error) {
    console.error('[suppliers-start] request failed:', error)
    sendRedirectPage(res)
  }
}).listen(port, '0.0.0.0', () => {
  console.log(`Suppliers ORDR running at http://localhost:${port}`)
})
