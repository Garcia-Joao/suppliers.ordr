'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  Loader2,
  LogOut,
  Moon,
  PackageSearch,
  RefreshCw,
  Search,
  Sun,
  TableProperties,
  UserCircle,
  X,
} from 'lucide-react'
import { SuppliersBrand } from '@/components/brand/suppliers-brand'
import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useTheme } from '@/components/theme/theme-provider'
import { supplierApi } from '@/lib/api'
import {
  getMainSelectionUrl,
  isSupplierCompany,
  isSupplierUser,
  redirectToMainApp,
  redirectToMainLogin,
  toSupplierSession,
  type SupplierAuthCompany,
  type SupplierSession,
} from '@/lib/auth'

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, helper: 'Visão geral' },
  { href: '/tabelas', label: 'Tabelas', icon: TableProperties, helper: 'Preços' },
  { href: '/produtos', label: 'Produtos', icon: PackageSearch, helper: 'Catálogo' },
  { href: '/pedidos', label: 'Pedidos', icon: ClipboardList, helper: 'Em breve' },
  { href: '/perfil', label: 'Perfil', icon: UserCircle, helper: 'Cadastro' },
]

function companyTypeLabel(company: SupplierAuthCompany) {
  return isSupplierCompany(company) ? 'Fornecedor' : 'Operação'
}

function isActivePath(pathname: string, href: string) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function SupplierShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()
  const [session, setSession] = useState<SupplierSession | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [companyModalOpen, setCompanyModalOpen] = useState(false)
  const [companyQuery, setCompanyQuery] = useState('')
  const [switchingCompanyId, setSwitchingCompanyId] = useState<string | null>(null)
  const [switchError, setSwitchError] = useState('')

  useEffect(() => {
    let alive = true

    async function checkSession() {
      try {
        const result = await supplierApi.me()

        if (!alive) return

        if (!isSupplierUser(result.user)) {
          redirectToMainLogin()
          return
        }

        setSession(toSupplierSession(result.user))
      } catch {
        if (!alive) return
        redirectToMainLogin()
      } finally {
        if (alive) setCheckingSession(false)
      }
    }

    checkSession()

    return () => {
      alive = false
    }
  }, [])

  const companies = useMemo(() => {
    const list = session?.companies ?? []
    const term = companyQuery.trim().toLowerCase()

    const sorted = [...list].sort((a, b) => {
      const type = Number(isSupplierCompany(b)) - Number(isSupplierCompany(a))
      if (type !== 0) return type
      return a.name.localeCompare(b.name)
    })

    if (!term) return sorted

    return sorted.filter((company) => {
      return `${company.name} ${companyTypeLabel(company)}`.toLowerCase().includes(term)
    })
  }, [companyQuery, session?.companies])

  const hasMultipleCompanies = (session?.companies?.length ?? 0) > 1
  const currentCompanyId = session?.user.currentCompany?.id ?? session?.user.companyId ?? session?.supplierId ?? ''

  async function logout() {
    try {
      await supplierApi.logout()
    } catch {
      // Mesmo se a API falhar, mandamos o usuário para o login central.
    } finally {
      redirectToMainLogin()
    }
  }

  async function handleSwitchCompany(company: SupplierAuthCompany) {
    try {
      setSwitchError('')
      setSwitchingCompanyId(company.id)

      const result = await supplierApi.switchCompany(company.id)

      if (isSupplierUser(result.user)) {
        setSession(toSupplierSession(result.user))
        setCompanyModalOpen(false)
        setCompanyQuery('')
        window.location.href = '/'
        return
      }

      // Se a empresa escolhida for uma operação ORDR, saímos do portal de fornecedores
      // e voltamos para o app principal já com a empresa ativa atualizada no cookie.
      window.location.href = getMainSelectionUrl()
    } catch (error) {
      setSwitchError(error instanceof Error ? error.message : 'Não foi possível trocar de empresa.')
    } finally {
      setSwitchingCompanyId(null)
    }
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="glass-card flex items-center gap-3 rounded-[2rem] px-5 py-4 text-sm font-black text-muted-foreground">
          <Loader2 className="size-5 animate-spin text-primary" />
          Validando acesso do fornecedor...
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen lg:pl-[292px]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[292px] border-r bg-background/98 p-0 shadow-[18px_0_70px_rgba(0,0,0,0.22)] backdrop-blur-xl lg:flex lg:flex-col">
        <div className="border-b px-5 py-5">
          <div className="flex items-center justify-between gap-3">
            <SuppliersBrand />
            <button
              onClick={toggleTheme}
              className="grid size-10 place-items-center rounded-2xl border bg-background/75 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              title={theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
            >
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </div>
        </div>

        <div className="px-4 py-4">
          <button
            type="button"
            onClick={() => hasMultipleCompanies ? setCompanyModalOpen(true) : undefined}
            className={clsx(
              'group relative w-full overflow-hidden rounded-[1.65rem] border bg-primary/8 p-4 text-left transition',
              'shadow-[0_18px_46px_color-mix(in_oklch,var(--primary)_12%,transparent)]',
              hasMultipleCompanies ? 'hover:-translate-y-0.5 hover:border-primary hover:bg-primary/12' : 'cursor-default'
            )}
          >
            <div className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full bg-primary/20 blur-2xl transition group-hover:bg-primary/30" />
            <div className="relative mb-4 flex items-center gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/20">
                <Building2 className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black">{session.supplierName}</p>
                <p className="text-xs font-bold text-muted-foreground">Empresa ativa · clique para trocar</p>
              </div>
              <RefreshCw className={clsx('size-4 shrink-0 text-primary transition', hasMultipleCompanies ? 'opacity-100 group-hover:rotate-180' : 'opacity-35')} />
            </div>
            <div className="relative flex items-center justify-between gap-2">
              <span className="rounded-full bg-primary/12 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-primary ring-1 ring-primary/20">
                Fornecedor
              </span>
              <span className="text-xs font-black text-primary">{hasMultipleCompanies ? 'Trocar empresa' : 'Única empresa'}</span>
            </div>
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 px-4 pb-4">
          {nav.map((item) => {
            const Icon = item.icon
            const active = isActivePath(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'group relative flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-black transition',
                  active
                    ? 'bg-primary text-primary-foreground shadow-[0_18px_40px_color-mix(in_oklch,var(--primary)_24%,transparent)]'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                {active ? <span className="absolute -left-4 top-1/2 h-9 w-1 -translate-y-1/2 rounded-r-full bg-primary" /> : null}
                <div className={clsx('grid size-9 place-items-center rounded-xl transition', active ? 'bg-primary-foreground/18' : 'bg-secondary/70 group-hover:bg-background/80')}>
                  <Icon className="size-4 shrink-0" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block leading-none">{item.label}</span>
                  <span className={clsx('mt-1 block text-[11px] font-bold leading-none', active ? 'text-primary-foreground/72' : 'text-muted-foreground')}>{item.helper}</span>
                </div>
              </Link>
            )
          })}
        </nav>

        <div className="border-t p-4">
          <button onClick={logout} className="ordr-button-soft w-full text-muted-foreground">
            <LogOut className="size-4" /> Sair
          </button>
        </div>
      </aside>

      <main className="min-w-0 p-3 md:p-5">
        <header className="glass-card sticky top-3 z-20 mb-4 flex items-center justify-between rounded-[1.75rem] px-4 py-3 lg:hidden">
          <SuppliersBrand compact />
          <div className="flex items-center gap-2">
            {hasMultipleCompanies ? (
              <button onClick={() => setCompanyModalOpen(true)} className="rounded-2xl border px-3 py-2 text-sm font-black">
                Empresa
              </button>
            ) : null}
            <button onClick={toggleTheme} className="rounded-2xl border px-3 py-2 text-sm font-black">
              {theme === 'dark' ? 'Claro' : 'Escuro'}
            </button>
            <button onClick={logout} className="rounded-2xl border px-3 py-2 text-sm font-black">Sair</button>
          </div>
        </header>

        {children}

        <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-5 gap-2 rounded-[1.5rem] border bg-background/90 p-2 backdrop-blur lg:hidden">
          {nav.map((item) => {
            const Icon = item.icon
            const active = isActivePath(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'grid place-items-center rounded-2xl p-2 text-xs font-black transition',
                  active ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground'
                )}
              >
                <Icon className="mb-1 size-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </main>

      {companyModalOpen ? (
        <div className="modal-backdrop">
          <div className="modal-card ordr-panel p-5 md:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <span className="ordr-kicker">Empresas</span>
                <h2 className="mt-3 text-2xl font-black tracking-tight md:text-3xl">Trocar empresa</h2>
                <p className="mt-2 text-sm font-bold text-muted-foreground">
                  Escolha outro fornecedor ou volte para uma operação ORDR.
                </p>
              </div>
              <button onClick={() => setCompanyModalOpen(false)} className="grid size-10 place-items-center rounded-2xl border bg-background/70">
                <X className="size-4" />
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={companyQuery}
                onChange={(event) => setCompanyQuery(event.target.value)}
                placeholder="Buscar empresa..."
                className="ordr-input pl-11"
              />
            </div>

            {switchError ? (
              <div className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-black text-destructive">
                {switchError}
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-2">
              {companies.map((company) => {
                const supplier = isSupplierCompany(company)
                const active = company.id === currentCompanyId
                const switching = switchingCompanyId === company.id

                return (
                  <button
                    key={company.id}
                    onClick={() => handleSwitchCompany(company)}
                    disabled={switchingCompanyId !== null || active}
                    className="group rounded-[1.5rem] border bg-background/60 p-4 text-left transition hover:-translate-y-0.5 hover:border-primary hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-65"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className={supplier ? 'grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary' : 'grid size-12 place-items-center rounded-2xl bg-orange-500/15 text-orange-500'}>
                        <Building2 className="size-5" />
                      </div>
                      <span className={supplier ? 'rounded-full bg-primary/10 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-primary' : 'rounded-full bg-orange-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-orange-500'}>
                        {companyTypeLabel(company)}
                      </span>
                    </div>
                    <h3 className="truncate text-lg font-black">{company.name}</h3>
                    <p className="mt-1 text-sm font-bold text-muted-foreground">
                      {active ? 'Empresa ativa agora' : supplier ? 'Abrir portal do fornecedor' : 'Abrir painel ORDR'}
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm font-black">
                      <span className="text-muted-foreground">{active ? 'Selecionada' : 'Selecionar'}</span>
                      {switching ? <Loader2 className="size-4 animate-spin text-primary" /> : active ? <CheckCircle2 className="size-4 text-primary" /> : <ArrowRight className="size-4 transition group-hover:translate-x-1" />}
                    </div>
                  </button>
                )
              })}
            </div>

            <button onClick={() => { window.location.href = getMainSelectionUrl() }} className="ordr-button-soft mt-5 w-full">
              Ver seleção completa no ORDR
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
