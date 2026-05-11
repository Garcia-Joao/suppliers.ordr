import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme/theme-provider'

export const metadata: Metadata = {
  title: 'ORDR Suppliers',
  description: 'Portal de fornecedores do ORDR',
  icons: [{ rel: 'icon', url: '/icon.svg' }],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="dark">
      <body><ThemeProvider>{children}</ThemeProvider></body>
    </html>
  )
}
