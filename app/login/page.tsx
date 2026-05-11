'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SuppliersBrand } from '@/components/brand/suppliers-brand'
import { supplierApi } from '@/lib/api'
import { auth } from '@/lib/auth'
import { ArrowRight, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const session = await supplierApi.login(username, password)
      auth.set(session)
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center p-4">
      <form onSubmit={submit} className="glass-card w-full max-w-[460px] rounded-[2rem] p-6 md:p-8">
        <SuppliersBrand />
        <div className="my-8 rounded-[1.5rem] border bg-background/60 p-4">
          <ShieldCheck className="mb-3 size-6 text-primary" />
          <h1 className="text-3xl font-black tracking-tight">Login ORDR Suppliers</h1>
          <p className="mt-2 text-sm text-muted-foreground">Entre para visualizar requisições, tabelas de preço e produtos vinculados.</p>
        </div>
        <label className="mb-4 block">
          <span className="mb-2 block text-sm font-bold">Usuário</span>
          <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-2xl border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary" placeholder="usuario" />
        </label>
        <label className="mb-4 block">
          <span className="mb-2 block text-sm font-bold">Senha</span>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full rounded-2xl border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary" placeholder="••••••••" />
        </label>
        {error && <p className="mb-4 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}
        <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 font-black text-primary-foreground shadow-lg shadow-emerald-500/20 disabled:opacity-60">
          {loading ? 'Entrando...' : 'Entrar'} <ArrowRight className="size-4" />
        </button>
      </form>
    </main>
  )
}
