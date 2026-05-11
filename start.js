const path = require('path')
const fs = require('fs')
const express = require('express')

const app = express()

const port = Number(process.env.PORT || 3000)
const outDir = path.join(__dirname, 'out')
const indexFile = path.join(outDir, 'index.html')

if (!fs.existsSync(indexFile)) {
  console.error('[suppliers.ordr] Build output not found.')
  console.error(`[suppliers.ordr] Expected: ${indexFile}`)
  console.error('[suppliers.ordr] Run "npm run build" before starting the server.')
  process.exit(1)
}

app.disable('x-powered-by')

app.use(
  express.static(outDir, {
    extensions: ['html'],
    maxAge: '1h',
  })
)

app.use((req, res) => {
  const requestedPath = req.path.replace(/^\/+/, '')
  const htmlPath = path.join(outDir, requestedPath, 'index.html')

  if (fs.existsSync(htmlPath)) {
    return res.sendFile(htmlPath)
  }

  return res.sendFile(indexFile)
})

app.listen(port, '0.0.0.0', () => {
  console.log(`[suppliers.ordr] Static app running on 0.0.0.0:${port}`)
})