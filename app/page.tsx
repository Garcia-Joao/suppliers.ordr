'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowUpRight,
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
import Link from 'next/link'
import { SupplierShell } from '@/components/layout/supplier-shell'
import { supplierApi, type DashboardData, type SupplierProfile } from '@/lib/api'

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingOnline, setSavingOnline] = useState(false)
  const [copied, setCopied] = useState(false)
  const onlineStatus = data?.onlineStatus

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
        <section className="relative overflow-hidden rounded-[2rem] border bg-card p-5 shadow-2xl shadow-black/5 md:p-8">
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative grid gap-6 xl:grid-cols-[1.3fr_0.7fr] xl:items-stretch">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-primary">Dashboard</p>
              <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight md:text-6xl">
                Central do fornecedor
              </h1>
              <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
                Controle sua disponibilidade, tabelas de preço e catálogo em um painel separado para fornecedores ORDR.
              </p>

              {loading ? (
                <div className="mt-8 inline-flex items-center gap-2 rounded-2xl border bg-background/70 px-4 py-3 text-sm font-black text-muted-foreground">
                  <Loader2 className="size-4 animate-spin text-primary" /> Carregando informações...
                </div>
              ) : data ? (
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <button
                    onClick={toggleOnline}
                    disabled={savingOnline}
                    className="inline-flex items-center gap-3 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-primary-foreground shadow-lg shadow-emerald-500/20 disabled:opacity-60"
                  >
                    {savingOnline ? <Loader2 className="size-4 animate-spin" /> : <Power className="size-4" />}
                    {data.supplier.onlineEnabled ? 'Pausar disponibilidade' : 'Disponibilizar online'}
                  </button>
                  <button
                    onClick={copyCode}
                    className="inline-flex items-center gap-2 rounded-2xl border bg-background/70 px-5 py-3 text-sm font-black"
                  >
                    <Copy className="size-4" /> Código ORDR: {data.supplier.ordrCode || '-'}
                  </button>
                  {copied && <span className="text-sm font-black text-primary">Copiado!</span>}
                </div>
              ) : (
                <button onClick={load} className="mt-8 rounded-2xl border px-5 py-3 font-black">
                  Tentar novamente
                </button>
              )}
            </div>

            <StatusPanel profile={data?.supplier ?? null} loading={loading} savingOnline={savingOnline} onToggleOnline={toggleOnline} />
          </div>
        </section>

        {data && (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard icon={TableProperties} label="Tabelas ativas" value={data.activePriceTables} href="/tabelas" />
              <MetricCard icon={PackageSearch} label="Produtos cadastrados" value={data.productCount} href="/produtos" />
              <MetricCard icon={CheckCircle2} label="Estoque baixo" value={data.lowStockProducts ?? 0} href="/produtos" />
              <MetricCard icon={CalendarClock} label="Pedidos" value="Pausado" href="/pedidos" />
            </section>

            <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
              <article className="rounded-[2rem] border bg-card p-5">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-black">Categorias atendidas</h2>
                    <p className="text-sm text-muted-foreground">Usadas para encontrar seu fornecedor rapidamente.</p>
                  </div>
                  <Link href="/perfil" className="rounded-2xl border px-3 py-2 text-sm font-black">Editar</Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.categories.length ? data.categories.map((category) => (
                    <span key={category} className="rounded-full bg-secondary px-4 py-2 text-sm font-black">{category}</span>
                  )) : <p className="text-sm text-muted-foreground">Nenhuma categoria cadastrada ainda.</p>}
                </div>
              </article>

              <article className="rounded-[2rem] border bg-card p-5">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-black">Horário de hoje</h2>
                    <p className="text-sm text-muted-foreground">O online automático considera este horário.</p>
                  </div>
                  <Link href="/perfil" className="rounded-2xl border px-3 py-2 text-sm font-black">Ajustar horários</Link>
                </div>
                <div className="rounded-3xl bg-secondary p-5">
                  <p className="text-sm font-black text-muted-foreground">{onlineStatus?.today?.label || 'Hoje'}</p>
                  <p className="mt-2 text-3xl font-black">
                    {onlineStatus?.today?.enabled
                      ? `${onlineStatus.today.startTime} → ${onlineStatus.today.endTime}`
                      : 'Fechado'}
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {onlineStatus?.onlineEnabled
                      ? onlineStatus.isOnline
                        ? 'Você está disponível automaticamente agora.'
                        : 'Disponibilidade ligada, mas fora do expediente.'
                      : 'Disponibilidade manual pausada.'}
                  </p>
                </div>
              </article>
            </section>
          </>
        )}
      </div>
    </SupplierShell>
  )
}

function StatusPanel({ profile, loading, savingOnline, onToggleOnline }: { profile: SupplierProfile | null; loading: boolean; savingOnline: boolean; onToggleOnline: () => void }) {
  const status = profile?.onlineStatus
  const online = Boolean(status?.isOnline)

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.75rem] border bg-background/70 p-5 backdrop-blur"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">Status atual</p>
          <h2 className="mt-3 text-4xl font-black">{loading ? '...' : online ? 'Online' : 'Offline'}</h2>
        </div>
        <div className={`grid size-14 place-items-center rounded-3xl ${online ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
          {online ? <Wifi className="size-6" /> : <WifiOff className="size-6" />}
        </div>
      </div>
      <button
        type="button"
        onClick={onToggleOnline}
        disabled={loading || savingOnline || !profile}
        className={online ? 'mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-60' : 'mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl border bg-secondary px-4 py-3 text-sm font-black text-foreground disabled:opacity-60'}
      >
        {savingOnline ? <Loader2 className="size-4 animate-spin" /> : <Power className="size-4" />}
        {profile?.onlineEnabled ? 'Pausar agora' : 'Colocar online'}
      </button>
      <div className="mt-5 space-y-3">
        <StatusLine label="Disponibilizado" value={profile?.onlineEnabled ? 'Sim' : 'Não'} />
        <StatusLine label="Expediente" value={status?.insideOperatingHours ? 'Aberto' : 'Fechado'} />
        <StatusLine label="Hoje" value={status?.today?.enabled ? `${status.today.startTime} às ${status.today.endTime}` : 'Fechado'} />
      </div>
    </motion.article>
  )
}

function StatusLine({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3 rounded-2xl bg-secondary px-4 py-3 text-sm"><span className="font-bold text-muted-foreground">{label}</span><strong>{value}</strong></div>
}

function MetricCard({ icon: Icon, label, value, href }: { icon: any; label: string; value: string | number; href?: string }) {
  const content = (
    <article className="rounded-[1.75rem] border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-xl">
      <div className="mb-8 flex items-center justify-between">
        <div className="grid size-12 place-items-center rounded-2xl bg-secondary"><Icon className="size-5 text-primary" /></div>
        {href && <ArrowUpRight className="size-4 text-muted-foreground" />}
      </div>
      <p className="text-sm font-bold text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-black">{value}</p>
    </article>
  )

  return href ? <Link href={href}>{content}</Link> : content
}
