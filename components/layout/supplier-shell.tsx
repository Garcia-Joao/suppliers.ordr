'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BarChart3, ClipboardList, LayoutDashboard, LogOut, Moon, PackageSearch, Sun, TableProperties, UserCircle } from 'lucide-react'
import { SuppliersBrand } from '@/components/brand/suppliers-brand'
import { auth } from '@/lib/auth'
import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { useTheme } from '@/components/theme/theme-provider'

const nav = [
  { href: '/', label: 'Resumo', icon: LayoutDashboard },
  { href: '/pedidos', label: 'Pedidos', icon: ClipboardList },
  { href: '/tabelas', label: 'Tabelas', icon: TableProperties },
  { href: '/produtos', label: 'Produtos', icon: PackageSearch },
  { href: '/perfil', label: 'Perfil', icon: UserCircle },
]

export function SupplierShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()

  function logout() {
    auth.clear()
    router.push('/login')
  }

  return (
    <div className="min-h-screen p-3 md:p-5">
      <div className="mx-auto grid max-w-[1500px] gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="glass-card sticky top-5 hidden h-[calc(100vh-2.5rem)] rounded-[2rem] p-4 lg:block">
          <div className="mb-8 flex items-center justify-between gap-3 px-2 pt-2"><SuppliersBrand /><button onClick={toggleTheme} className="grid size-10 place-items-center rounded-2xl border bg-background/60 text-muted-foreground hover:text-foreground" title={theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}>{theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}</button></div>
          <nav className="space-y-2">
            {nav.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href
              return (
                <Link key={item.href} href={item.href} className={clsx('flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition', active ? 'bg-primary text-primary-foreground shadow-lg shadow-emerald-500/20' : 'text-muted-foreground hover:bg-secondary hover:text-foreground')}>
                  <Icon className="size-4" /> {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="absolute inset-x-4 bottom-4 rounded-3xl border bg-background/60 p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-2xl bg-secondary"><BarChart3 className="size-4" /></div>
              <div>
                <p className="text-sm font-black">Fornecedor</p>
                <p className="text-xs text-muted-foreground">Acesso externo</p>
              </div>
            </div>
            <button onClick={logout} className="flex w-full items-center justify-center gap-2 rounded-2xl border px-3 py-2 text-sm font-bold hover:bg-secondary">
              <LogOut className="size-4" /> Sair
            </button>
          </div>
        </aside>

        <main className="min-w-0">
          <header className="glass-card sticky top-3 z-20 mb-4 flex items-center justify-between rounded-[1.75rem] px-4 py-3 lg:hidden">
            <SuppliersBrand compact />
            <div className="flex items-center gap-2"><button onClick={toggleTheme} className="rounded-2xl border px-3 py-2 text-sm font-bold">{theme === 'dark' ? 'Claro' : 'Escuro'}</button>
            <button onClick={logout} className="rounded-2xl border px-3 py-2 text-sm font-bold">Sair</button></div>
          </header>
          {children}
          <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-5 gap-2 rounded-[1.5rem] border bg-background/90 p-2 backdrop-blur lg:hidden">
            {nav.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href
              return <Link key={item.href} href={item.href} className={clsx('grid place-items-center rounded-2xl p-2 text-xs font-bold', active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}><Icon className="mb-1 size-4" />{item.label}</Link>
            })}
          </nav>
        </main>
      </div>
    </div>
  )
}
