'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { SupplierShell } from '@/components/layout/supplier-shell'

export function SupplierAppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  const isLoginRoute = pathname === '/login' || pathname?.startsWith('/login/')
  const isNotFoundRoute = pathname === '/_not-found'

  if (isLoginRoute || isNotFoundRoute) {
    return <>{children}</>
  }

  return <SupplierShell>{children}</SupplierShell>
}
