'use client'

import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { redirectToMainLogin } from '@/lib/auth'

export default function SupplierLoginRedirectPage() {
  useEffect(() => {
    redirectToMainLogin()
  }, [])

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="glass-card flex items-center gap-3 rounded-[2rem] px-5 py-4 text-sm font-black text-muted-foreground">
        <Loader2 className="size-5 animate-spin text-primary" />
        Redirecionando para o login principal do ORDR...
      </div>
    </main>
  )
}
