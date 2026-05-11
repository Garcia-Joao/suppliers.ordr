const { createServer } = require('http')
const { join } = require('path')
const { readFileSync, existsSync, statSync } = require('fs')

const port = Number(process.env.PORT || 3002)
const root = join(__dirname, 'out')
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

createServer((req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${port}`)
  let pathname = decodeURIComponent(url.pathname)
  let filePath = join(root, pathname)

  if (existsSync(filePath) && statSync(filePath).isDirectory()) filePath = join(filePath, 'index.html')
  if (!existsSync(filePath)) filePath = join(root, pathname + '.html')
  if (!existsSync(filePath)) filePath = join(root, 'index.html')

  const ext = filePath.slice(filePath.lastIndexOf('.'))
  res.setHeader('Content-Type', mime[ext] || 'application/octet-stream')
  res.end(readFileSync(filePath))
}).listen(port, '0.0.0.0', () => {
  console.log(`Suppliers ORDR running at http://localhost:${port}`)
})
