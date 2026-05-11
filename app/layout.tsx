import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ORDR Suppliers',
  description: 'Portal de fornecedores do ORDR',
  icons: [{ rel: 'icon', url: '/icon.svg' }],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
