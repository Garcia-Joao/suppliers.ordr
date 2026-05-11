import type { ReactNode } from 'react'
import './globals.css'
import { SupplierAppFrame } from '@/components/layout/supplier-app-frame'
import { ThemeProvider } from '@/components/theme/theme-provider'

export const metadata = {
  title: 'ORDR Suppliers',
  description: 'Painel de fornecedores ORDR',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <SupplierAppFrame>{children}</SupplierAppFrame>
        </ThemeProvider>
      </body>
    </html>
  )
}
