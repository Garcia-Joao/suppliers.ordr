'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Copy,
  Loader2,
  PackageSearch,
  Power,
  ShieldCheck,
  Sparkles,
  TableProperties,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { SupplierShell } from '@/components/layout/supplier-shell'
import { supplierApi, type DashboardData } from '@/lib/api'

function money(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function todayLabel(data: DashboardData | null) {
  const today = data?.onlineStatus.today
  if (!today) return 'Sem horário cadastrado hoje'
  if (!today.enabled) return 'Fechado hoje'
  return `${today.startTime} às ${today.endTime}`
}

function onlineReason(data: DashboardData | null) {
  if (!data) return 'Carregando disponibilidade...'
  if (!data.supplier.onlineEnabled) return 'O fornecedor está pausado manualmente.'
  if (!data.onlineStatus.insideOperatingHours) return 'Fora do horário de expediente configurado.'
  return 'Disponível para operações e futuras solicitações.'
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingOnline, setSavingOnline] = useState(false)
  const [copied, setCopied] = useState(false)

  async function load() {
    setLoading(true)
    try {
      setData(await supplierApi.dashboard())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load().catch(() => setLoading(false))
  }, [])

  const isOnline = Boolean(data?.onlineStatus.isOnline)

  const stats = useMemo(() => {
    if (!data) return []
    return [
      { label: 'Produtos', value: String(data.productCount), icon: PackageSearch, href: '/produtos' },
      { label: 'Tabelas ativas', value: String(data.activePriceTables), icon: TableProperties, href: '/tabelas' },
      { label: 'Vinculados ao estoque', value: String(data.linkedProducts), icon: CheckCircle2, href: '/produtos' },
      { label: 'Estoque baixo', value: String(data.lowStockProducts ?? 0), icon: AlertTriangle, href: '/produtos' },
    ]
  }, [data])

  async function toggleOnline() {
    if (!data) return
    setSavingOnline(true)
    try {
      const result = await supplierApi.updateAvailability(!data.supplier.onlineEnabled)
      setData((current) => current ? {
        ...current,
        supplier: result.supplier,
        onlineStatus: result.supplier.onlineStatus,
      } : current)
    } finally {
      setSavingOnline(false)
    }
  }

  async function copyCode() {
    const code = data?.supplier.ordrCode
    if (!code) return
    await navigator.clipboard.writeText(code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <SupplierShell>
      <div className="space-y-4 pb-24 lg:pb-0">
        <section className="ordr-panel relative overflow-hidden rounded-[2rem] p-5 md:p-8">
          <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-24 bottom-0 size-80 rounded-full bg-accent/10 blur-3xl" />

          <div className="relative grid gap-5 xl:grid-cols-[1.05fr_0.95fr] xl:items-stretch">
            <div className="flex min-h-[360px] flex-col justify-between">
              <div>
                <span className="ordr-kicker"><Sparkles className="size-3.5" /> Dashboard</span>
                <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-tight md:text-6xl">
                  Painel do fornecedor
                </h1>
                <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-muted-foreground md:text-lg">
                  Gerencie disponibilidade, catálogo e tabelas de preço com a identidade visual do ORDR.
                </p>
              </div>

              {loading ? (
                <div className="mt-8 inline-flex w-fit items-center gap-2 rounded-2xl border bg-background/70 px-4 py-3 text-sm font-black text-muted-foreground">
                  <Loader2 className="size-4 animate-spin text-primary" /> Carregando informações...
                </div>
              ) : data ? (
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <button onClick={toggleOnline} disabled={savingOnline} className={isOnline ? 'ordr-button-primary' : 'ordr-button-soft'}>
                    {savingOnline ? <Loader2 className="size-4 animate-spin" /> : <Power className="size-4" />}
                    {data.supplier.onlineEnabled ? 'Pausar online' : 'Disponibilizar online'}
                  </button>
                  <button onClick={copyCode} className="ordr-button-soft">
                    <Copy className="size-4" /> Código ORDR: {data.supplier.ordrCode ?? '—'}
                  </button>
                  {copied ? <span className="text-sm font-black text-primary">Copiado!</span> : null}
                </div>
              ) : null}
            </div>

            <div className={isOnline ? 'relative overflow-hidden rounded-[2rem] border border-primary/35 bg-primary/12 p-5 shadow-[0_26px_80px_color-mix(in_oklch,var(--primary)_18%,transparent)]' : 'relative overflow-hidden rounded-[2rem] border bg-background/65 p-5'}>
              <div className={isOnline ? 'pointer-events-none absolute -right-16 -top-16 size-52 rounded-full bg-primary/35 blur-3xl' : 'pointer-events-none absolute -right-16 -top-16 size-52 rounded-full bg-muted/55 blur-3xl'} />
              <div className="relative flex h-full min-h-[330px] flex-col justify-between">
                <div>
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.18em] text-muted-foreground">Status atual</p>
                      <h2 className={isOnline ? 'mt-2 text-5xl font-black tracking-tight text-primary' : 'mt-2 text-5xl font-black tracking-tight'}>
                        {isOnline ? 'Online' : 'Offline'}
                      </h2>
                    </div>
                    <div className={isOnline ? 'relative grid size-16 place-items-center rounded-3xl bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'grid size-16 place-items-center rounded-3xl bg-muted text-muted-foreground'}>
                      {isOnline ? <span className="absolute inset-0 animate-ping rounded-3xl bg-primary/35" /> : null}
                      {isOnline ? <Wifi className="relative size-8" /> : <WifiOff className="size-8" />}
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border bg-background/70 p-4">
                    <div className="flex items-start gap-3">
                      <div className={isOnline ? 'grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary' : 'grid size-10 shrink-0 place-items-center rounded-2xl bg-muted text-muted-foreground'}>
                        <ShieldCheck className="size-5" />
                      </div>
                      <div>
                        <p className="text-sm font-black">{onlineReason(data)}</p>
                        <p className="mt-1 text-xs font-bold text-muted-foreground">
                          Status final = botão online + horário do dia.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 text-sm font-bold md:grid-cols-2">
                  <div className="rounded-2xl border bg-card/55 p-4">
                    <span className="text-muted-foreground">Disponibilizado</span>
                    <p className="mt-1 text-lg font-black">{data?.supplier.onlineEnabled ? 'Sim' : 'Não'}</p>
                  </div>
                  <div className="rounded-2xl border bg-card/55 p-4">
                    <span className="text-muted-foreground">Expediente</span>
                    <p className="mt-1 text-lg font-black">{data?.onlineStatus.insideOperatingHours ? 'Aberto' : 'Fechado'}</p>
                  </div>
                  <div className="rounded-2xl border bg-card/55 p-4 md:col-span-2">
                    <span className="text-muted-foreground">Hoje</span>
                    <p className="mt-1 text-lg font-black">{todayLabel(data)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Link key={stat.label} href={stat.href} className="ordr-panel group rounded-[1.75rem] p-5 transition hover:-translate-y-1 hover:border-primary">
                <div className="mb-6 flex items-center justify-between">
                  <div className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                </div>
                <p className="text-sm font-black text-muted-foreground">{stat.label}</p>
                <p className="mt-2 text-3xl font-black tracking-tight">{stat.value}</p>
              </Link>
            )
          })}
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="ordr-panel rounded-[2rem] p-5">
            <h2 className="text-xl font-black">Categorias vendidas</h2>
            <p className="mt-1 text-sm font-bold text-muted-foreground">Use categorias para facilitar a busca do fornecedor na gestão.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {(data?.categories?.length ? data.categories : ['Sem categorias']).map((category) => (
                <span key={category} className="rounded-full border bg-background/70 px-3 py-2 text-xs font-black uppercase tracking-wide text-muted-foreground">
                  {category}
                </span>
              ))}
            </div>
          </div>

          <div className="ordr-panel rounded-[2rem] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">Próximos pedidos</h2>
                <p className="mt-1 text-sm font-bold text-muted-foreground">Pausado por enquanto, mas a área já está reservada.</p>
              </div>
              <Link href="/pedidos" className="ordr-button-soft">Ver pedidos</Link>
            </div>
            <div className="mt-5 grid gap-3">
              {(data?.recentOrders?.length ? data.recentOrders : []).slice(0, 3).map((order) => (
                <div key={order.id} className="rounded-2xl border bg-background/65 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black">{order.code}</p>
                    <span className="text-sm font-black text-primary">{money(order.total)}</span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-muted-foreground">{order.items.length} item(ns)</p>
                </div>
              ))}
              {!data?.recentOrders?.length ? (
                <div className="rounded-2xl border border-dashed bg-background/55 p-6 text-center text-sm font-bold text-muted-foreground">
                  Nenhum pedido recente para exibir agora.
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </SupplierShell>
  )
}
