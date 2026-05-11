'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supplierApi, type DashboardData } from '@/lib/api'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Clock,
  Globe2,
  Loader2,
  Package,
  RadioTower,
  RefreshCw,
  Table2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const supplier = data?.supplier
  const onlineStatus = data?.onlineStatus || supplier?.onlineStatus
  const isOnline = Boolean(onlineStatus?.isOnline)
  const isEnabled = Boolean(onlineStatus?.onlineEnabled ?? supplier?.onlineEnabled)
  const insideHours = Boolean(onlineStatus?.insideOperatingHours)

  const todayLabel = useMemo(() => {
    const today = onlineStatus?.today
    if (!today) return 'Hoje'
    return today.enabled ? `${today.startTime} às ${today.endTime}` : 'Fechado'
  }, [onlineStatus])

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    setLoading(true)
    setError('')

    try {
      const result = await supplierApi.dashboard()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dashboard.')
    } finally {
      setLoading(false)
    }
  }

  async function toggleAvailability() {
    if (!supplier) return

    setSaving(true)
    setError('')

    try {
      const result = await supplierApi.updateAvailability(!supplier.onlineEnabled)
      setData((current) =>
        current
          ? {
              ...current,
              supplier: result.supplier,
              onlineStatus: result.supplier.onlineStatus,
            }
          : current
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar disponibilidade.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="supplier-page grid min-h-[60vh] place-items-center">
        <div className="supplier-card rounded-[2rem] px-6 py-5">
          <Loader2 className="mx-auto size-8 animate-spin text-[var(--supplier-primary)]" />
          <p className="mt-3 text-sm font-black text-[var(--supplier-muted)]">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="supplier-page space-y-6">
      <section className="supplier-card overflow-hidden rounded-[2rem]">
        <div className="relative p-5 md:p-8">
          <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl" />
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="supplier-chip supplier-chip-primary">
                <BarChart3 size={14} />
                Dashboard
              </p>
              <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
                Olá, {supplier?.name || 'fornecedor'}
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[var(--supplier-muted)]">
                Acompanhe disponibilidade, tabelas, produtos e estoque do seu painel ORDR Suppliers.
              </p>
            </div>

            <button type="button" onClick={loadDashboard} className="supplier-button">
              <RefreshCw size={17} />
              Atualizar
            </button>
          </div>
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm font-black text-red-600 dark:text-red-200">{error}</div> : null}

      <section className={`rounded-[2rem] border p-5 shadow-sm ${isOnline ? 'border-emerald-300/70 bg-emerald-500/10' : 'border-[var(--supplier-border)] bg-[var(--supplier-card)]'}`}>
        <div className="grid gap-5 xl:grid-cols-[1fr_auto] xl:items-center">
          <div className="flex items-start gap-4">
            <div className={`grid size-14 shrink-0 place-items-center rounded-2xl ${isOnline ? 'bg-[var(--supplier-primary)] text-slate-950' : 'bg-[var(--supplier-card-muted)] text-[var(--supplier-muted)]'}`}>
              <RadioTower size={26} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--supplier-muted)]">Status atual</p>
              <h2 className="mt-1 text-3xl font-black">{isOnline ? 'Online' : 'Offline'}</h2>
              <p className="mt-2 text-sm font-semibold text-[var(--supplier-muted)]">
                Status final = botão online/offline + horário do dia.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <MiniStatus label="Disponibilizado" value={isEnabled ? 'Sim' : 'Não'} active={isEnabled} />
                <MiniStatus label="Expediente" value={insideHours ? 'Aberto' : 'Fechado'} active={insideHours} />
                <MiniStatus label="Hoje" value={todayLabel} active={insideHours} />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleAvailability}
            disabled={saving}
            className={isEnabled ? 'supplier-button min-w-56' : 'supplier-button-primary min-w-56'}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : isEnabled ? <ToggleRight size={19} /> : <ToggleLeft size={19} />}
            {isEnabled ? 'Pausar painel' : 'Disponibilizar online'}
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<Package size={20} />} label="Produtos" value={data?.productCount ?? 0} href="/produtos" />
        <MetricCard icon={<Table2 size={20} />} label="Tabelas ativas" value={data?.activePriceTables ?? 0} href="/tabelas" />
        <MetricCard icon={<Globe2 size={20} />} label="Produtos vinculados" value={data?.linkedProducts ?? 0} href="/produtos" />
        <MetricCard icon={<AlertTriangle size={20} />} label="Estoque baixo" value={data?.lowStockProducts ?? 0} href="/produtos" warning={(data?.lowStockProducts ?? 0) > 0} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="supplier-card-flat rounded-[2rem] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="supplier-chip">
                <Clock size={14} />
                Próximas ações
              </p>
              <h2 className="mt-3 text-2xl font-black">Resumo operacional</h2>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {(data?.highlights?.length ? data.highlights : [
              { label: 'Código ORDR', value: supplier?.ordrCode || '—' },
              { label: 'Categorias', value: (data?.categories || []).join(', ') || 'Não informado' },
              { label: 'Pedidos', value: 'Em breve' },
              { label: 'Receita', value: 'Em breve' },
            ]).map((item) => (
              <div key={item.label} className="rounded-2xl border border-[var(--supplier-border)] bg-[var(--supplier-card-muted)] p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--supplier-muted)]">{item.label}</p>
                <p className="mt-2 text-lg font-black">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="supplier-card-flat rounded-[2rem] p-5">
          <p className="supplier-chip">Atalhos</p>
          <div className="mt-5 space-y-3">
            <Shortcut href="/produtos" label="Cadastrar produtos" />
            <Shortcut href="/tabelas" label="Editar tabelas de preço" />
            <Shortcut href="/perfil" label="Ajustar horários e visibilidade" />
          </div>
        </div>
      </section>
    </div>
  )
}

function MiniStatus({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <div className={`rounded-2xl border p-3 ${active ? 'border-emerald-300/60 bg-emerald-500/10' : 'border-[var(--supplier-border)] bg-[var(--supplier-card-muted)]'}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--supplier-muted)]">{label}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  )
}

function MetricCard({ icon, label, value, href, warning = false }: { icon: React.ReactNode; label: string; value: number; href: string; warning?: boolean }) {
  return (
    <Link href={href} className={`supplier-card-flat block rounded-[2rem] p-5 transition hover:-translate-y-1 ${warning ? 'border-amber-300/70 bg-amber-500/10' : ''}`}>
      <div className="flex items-center justify-between">
        <span className={`grid size-11 place-items-center rounded-2xl ${warning ? 'bg-amber-500/15 text-amber-600 dark:text-amber-200' : 'bg-emerald-500/10 text-[var(--supplier-primary-strong)] dark:text-[var(--supplier-primary)]'}`}>
          {icon}
        </span>
        <ArrowRight size={18} className="text-[var(--supplier-muted)]" />
      </div>
      <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-[var(--supplier-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </Link>
  )
}

function Shortcut({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-2xl border border-[var(--supplier-border)] bg-[var(--supplier-card-muted)] px-4 py-3 text-sm font-black transition hover:border-emerald-300">
      {label}
      <ArrowRight size={17} />
    </Link>
  )
}
