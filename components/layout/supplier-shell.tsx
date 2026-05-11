'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  Building2,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Moon,
  Package,
  ReceiptText,
  Settings,
  Sun,
  Table2,
} from 'lucide-react'
import { supplierApi } from '@/lib/api'

type CompanyOption = {
  id: string
  name: string
  companyType?: string | null
}

type CurrentUser = {
  id?: string
  name?: string | null
  email?: string | null
  company?: CompanyOption | null
  currentCompany?: CompanyOption | null
  companies?: CompanyOption[]
  memberships?: Array<{ company?: CompanyOption | null }>
}

const ORDR_APP_URL = process.env.NEXT_PUBLIC_ORDR_APP_URL || 'https://panelordr.com.br'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/produtos', label: 'Produtos', icon: Package },
  { href: '/tabelas', label: 'Tabelas', icon: Table2 },
  { href: '/pedidos', label: 'Pedidos', icon: ReceiptText },
  { href: '/perfil', label: 'Perfil', icon: Settings },
]

function getCurrentCompany(user: CurrentUser | null): CompanyOption | null {
  return user?.currentCompany || user?.company || null
}

function getCompanies(user: CurrentUser | null): CompanyOption[] {
  if (!user) return []

  if (Array.isArray(user.companies) && user.companies.length > 0) {
    return user.companies
  }

  if (Array.isArray(user.memberships)) {
    return user.memberships
      .map((membership) => membership.company)
      .filter(Boolean) as CompanyOption[]
  }

  const current = getCurrentCompany(user)
  return current ? [current] : []
}

export function SupplierShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [companyModalOpen, setCompanyModalOpen] = useState(false)
  const [switchingCompanyId, setSwitchingCompanyId] = useState('')
  const [darkMode, setDarkMode] = useState(true)

  const currentCompany = getCurrentCompany(user)
  const companies = useMemo(() => getCompanies(user), [user])

  useEffect(() => {
    const isDark =
      document.documentElement.classList.contains('dark') ||
      localStorage.getItem('ordr-suppliers-theme') !== 'light'

    setDarkMode(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  useEffect(() => {
    let active = true

    async function loadMe() {
      try {
        const result = await supplierApi.me()
        if (!active) return

        const authUser = result.user as CurrentUser
        const company = getCurrentCompany(authUser)

        if (!company) {
          window.location.href = `${ORDR_APP_URL}/login/`
          return
        }

        if (String(company.companyType || '').toUpperCase() === 'BUSINESS') {
          window.location.href = `${ORDR_APP_URL}/selecionar-empresa/`
          return
        }

        setUser(authUser)
      } catch {
        window.location.href = `${ORDR_APP_URL}/login/`
      } finally {
        if (active) setLoading(false)
      }
    }

    loadMe()

    return () => {
      active = false
    }
  }, [])

  function toggleTheme() {
    const nextDark = !darkMode
    setDarkMode(nextDark)
    localStorage.setItem('ordr-suppliers-theme', nextDark ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', nextDark)
  }

  async function logout() {
    try {
      await supplierApi.logout()
    } finally {
      window.location.href = `${ORDR_APP_URL}/login/`
    }
  }

  async function switchCompany(companyId: string) {
    setSwitchingCompanyId(companyId)

    try {
      const result = await supplierApi.switchCompany(companyId)
      const nextUser = result.user as CurrentUser
      const nextCompany = getCurrentCompany(nextUser)

      if (String(nextCompany?.companyType || '').toUpperCase() === 'BUSINESS') {
        window.location.href = `${ORDR_APP_URL}/selecionar-empresa/`
        return
      }

      setUser(nextUser)
      setCompanyModalOpen(false)
      router.refresh()
    } finally {
      setSwitchingCompanyId('')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-950 dark:bg-slate-950 dark:text-white">
        <div className="rounded-[2rem] border border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="h-2 w-44 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-emerald-400" />
          </div>
          <p className="mt-4 text-sm font-black">Carregando painel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="supplier-shell-root">
      <aside className="supplier-shell-sidebar">
        <div className="px-5 pt-5">
          <Link href="/" className="flex items-center gap-3 rounded-[1.4rem] px-2 py-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/20">
              <BarChart3 size={23} strokeWidth={3} />
            </div>
            <div>
              <p className="text-lg font-black tracking-tight text-slate-950 dark:text-white">ORDR</p>
              <p className="-mt-1 text-xs font-black uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-300">
                Suppliers
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setCompanyModalOpen(true)}
            className="mt-5 w-full rounded-[1.35rem] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/60 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-emerald-400/30 dark:hover:bg-emerald-400/10"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-200">
                  <Building2 size={18} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950 dark:text-white">
                    {currentCompany?.name || 'Fornecedor'}
                  </p>
                  <p className="mt-0.5 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                    empresa ativa
                  </p>
                </div>
              </div>
              <ChevronDown size={16} className="shrink-0 text-slate-400" />
            </div>
          </button>
        </div>

        <nav className="mt-6 flex flex-1 flex-col gap-1 px-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition ${
                  active
                    ? 'bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/10'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white'
                }`}
              >
                <Icon size={18} strokeWidth={active ? 3 : 2.3} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="space-y-2 px-4 pb-5">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            {darkMode ? 'Tema claro' : 'Tema escuro'}
          </button>

          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-red-500 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-400/10"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      <main className="supplier-shell-main">
        <div className="supplier-shell-content">{children}</div>
      </main>

      {companyModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xl">
          <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-5 text-slate-950 shadow-2xl dark:border-white/10 dark:bg-slate-950 dark:text-white">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-500">
                  Trocar empresa
                </p>
                <h2 className="mt-1 text-2xl font-black">Escolha a empresa ativa</h2>
              </div>
              <button
                type="button"
                onClick={() => setCompanyModalOpen(false)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/10"
              >
                Fechar
              </button>
            </div>

            <div className="space-y-2">
              {companies.map((company) => {
                const active = company.id === currentCompany?.id
                const supplier = String(company.companyType || '').toUpperCase() === 'SUPPLIER'

                return (
                  <button
                    key={company.id}
                    type="button"
                    onClick={() => switchCompany(company.id)}
                    disabled={active || switchingCompanyId === company.id}
                    className={`w-full rounded-2xl border p-4 text-left transition disabled:cursor-default ${
                      active
                        ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-400/30 dark:bg-emerald-400/10'
                        : 'border-slate-200 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50/60 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-emerald-400/30 dark:hover:bg-emerald-400/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-black">{company.name}</p>
                        <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                          {supplier ? 'Fornecedor' : 'Operação ORDR'}
                        </p>
                      </div>
                      {active ? (
                        <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-black text-white dark:text-slate-950">
                          Atual
                        </span>
                      ) : null}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
