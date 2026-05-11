'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Copy,
  Loader2,
  PackageSearch,
  Power,
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
      { label: 'Receita do mês', value: money(data.monthlyRevenue ?? 0), icon: CalendarClock, href: '/pedidos' },
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
          <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative grid gap-6 xl:grid-cols-[1.25fr_0.75fr] xl:items-stretch">
            <div>
              <span className="ordr-kicker">Dashboard</span>
              <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-tight md:text-6xl">
                Painel do fornecedor
              </h1>
              <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-muted-foreground md:text-lg">
                Gerencie disponibilidade, catálogo e tabelas de preço com a mesma identidade visual do ORDR.
              </p>

              {loading ? (
                <div className="mt-8 inline-flex items-center gap-2 rounded-2xl border bg-background/70 px-4 py-3 text-sm font-black text-muted-foreground">
                  <Loader2 className="size-4 animate-spin text-primary" /> Carregando informações...
                </div>
              ) : data ? (
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <button onClick={toggleOnline} disabled={savingOnline} className="ordr-button-primary">
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

            <div className="rounded-[2rem] border bg-background/65 p-5">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-muted-foreground">Status atual</p>
                  <h2 className="mt-1 text-2xl font-black">{isOnline ? 'Online' : 'Offline'}</h2>
                </div>
                <div className={isOnline ? 'grid size-14 place-items-center rounded-2xl bg-primary/15 text-primary' : 'grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground'}>
                  {isOnline ? <Wifi className="size-7" /> : <WifiOff className="size-7" />}
                </div>
              </div>
              <div className="space-y-3 text-sm font-bold">
                <div className="flex items-center justify-between gap-3 rounded-2xl border bg-card/55 p-4">
                  <span className="text-muted-foreground">Disponibilizado manualmente</span>
                  <span>{data?.supplier.onlineEnabled ? 'Sim' : 'Não'}</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-2xl border bg-card/55 p-4">
                  <span className="text-muted-foreground">Dentro do expediente</span>
                  <span>{data?.onlineStatus.insideOperatingHours ? 'Sim' : 'Não'}</span>
                </div>
                <div className="rounded-2xl border bg-card/55 p-4">
                  <span className="text-muted-foreground">Hoje</span>
                  <p className="mt-1 text-base font-black">{todayLabel(data)}</p>
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
