'use client'

import { useEffect, useMemo, useState } from 'react'
import { OperatingHoursGrid } from '@/components/profile/operating-hours-grid'
import { supplierApi, type OperatingHour, type SupplierProfile } from '@/lib/api'
import {
  BadgeCheck,
  Building2,
  Eye,
  EyeOff,
  Globe2,
  Loader2,
  LockKeyhole,
  RadioTower,
  Save,
  ShieldCheck,
} from 'lucide-react'

const emptyHours: OperatingHour[] = [
  { day: 'sun', label: 'Domingo', enabled: false, startTime: '08:00', endTime: '18:00' },
  { day: 'mon', label: 'Segunda', enabled: true, startTime: '08:00', endTime: '18:00' },
  { day: 'tue', label: 'Terça', enabled: true, startTime: '08:00', endTime: '18:00' },
  { day: 'wed', label: 'Quarta', enabled: true, startTime: '08:00', endTime: '18:00' },
  { day: 'thu', label: 'Quinta', enabled: true, startTime: '08:00', endTime: '18:00' },
  { day: 'fri', label: 'Sexta', enabled: true, startTime: '08:00', endTime: '18:00' },
  { day: 'sat', label: 'Sábado', enabled: true, startTime: '09:00', endTime: '14:00' },
]

const fallback: SupplierProfile = {
  id: 'fallback',
  name: 'Fornecedor ORDR',
  categories: [],
  active: true,
  onlineEnabled: true,
  publicListingEnabled: false,
  operatingHours: emptyHours,
  onlineStatus: { onlineEnabled: true, insideOperatingHours: false, isOnline: false, today: null },
}

export default function ProfilePage() {
  const [supplier, setSupplier] = useState<SupplierProfile>(fallback)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const image = supplier.photoData || supplier.photoUrl
  const isOnline = Boolean(supplier.onlineStatus?.isOnline)
  const insideOperatingHours = Boolean(supplier.onlineStatus?.insideOperatingHours)
  const categoriesText = useMemo(() => (supplier.categories ?? []).join(', '), [supplier.categories])

  useEffect(() => {
    let active = true

    async function loadProfile() {
      setLoading(true)
      setError('')

      try {
        const result = await supplierApi.profile()
        if (!active) return
        setSupplier({
          ...fallback,
          ...result.supplier,
          operatingHours: result.supplier.operatingHours?.length ? result.supplier.operatingHours : emptyHours,
        })
      } catch (err) {
        if (!active) return
        setSupplier(fallback)
        setError(err instanceof Error ? err.message : 'Erro ao carregar perfil.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadProfile()

    return () => {
      active = false
    }
  }, [])

  async function saveProfile(patch: Partial<SupplierProfile>) {
    setSaving(true)
    setMessage('')
    setError('')

    try {
      const result = await supplierApi.updateProfile(patch)
      setSupplier({
        ...fallback,
        ...result.supplier,
        operatingHours: result.supplier.operatingHours?.length ? result.supplier.operatingHours : emptyHours,
      })
      setMessage('Perfil atualizado.')
      window.setTimeout(() => setMessage(''), 2400)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar perfil.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleAvailability() {
    setSaving(true)
    setMessage('')
    setError('')

    try {
      const result = await supplierApi.updateAvailability(!supplier.onlineEnabled)
      setSupplier((current) => ({
        ...current,
        ...result.supplier,
        operatingHours: result.supplier.operatingHours?.length ? result.supplier.operatingHours : current.operatingHours,
      }))
      setMessage(result.supplier.onlineEnabled ? 'Fornecedor disponibilizado.' : 'Fornecedor pausado.')
      window.setTimeout(() => setMessage(''), 2400)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar disponibilidade.')
    } finally {
      setSaving(false)
    }
  }

  function updateSupplierField<K extends keyof SupplierProfile>(key: K, value: SupplierProfile[K]) {
    setSupplier((current) => ({ ...current, [key]: value }))
  }

  return (
    <div className="supplier-page space-y-6">
      <section className="supplier-card overflow-hidden rounded-[2rem]">
        <div className="relative p-5 md:p-8">
          <div className="pointer-events-none absolute right-0 top-0 h-52 w-52 rounded-full bg-emerald-300/20 blur-3xl" />

          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="supplier-chip supplier-chip-primary">
                <Building2 size={14} />
                Perfil e visibilidade
              </p>
              <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">Dados do fornecedor</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[var(--supplier-muted)]">
                Controle dados comerciais, status online, visibilidade para empresas ORDR e horários de expediente.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className="rounded-2xl border border-[var(--supplier-border)] bg-[var(--supplier-card-muted)] px-4 py-3 text-sm font-black text-[var(--supplier-muted)]">
                {loading ? 'Carregando...' : saving ? 'Salvando...' : 'Sincronizado'}
              </span>

              <button type="button" onClick={() => saveProfile(supplier)} disabled={saving || loading} className="supplier-button-primary">
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Salvar alterações
              </button>
            </div>
          </div>
        </div>
      </section>

      {message ? <div className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm font-black text-[var(--supplier-primary-strong)] dark:text-[var(--supplier-primary)]">{message}</div> : null}
      {error ? <div className="rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm font-black text-red-600 dark:text-red-200">{error}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <section className="supplier-card-flat rounded-[2rem] p-5">
            <div className="grid aspect-square place-items-center overflow-hidden rounded-[1.5rem] bg-[var(--supplier-card-muted)]">
              {image ? <img src={image} alt={supplier.name} className="h-full w-full object-cover" /> : <span className="text-6xl font-black text-[var(--supplier-primary)]">{supplier.name.slice(0, 1)}</span>}
            </div>

            <h2 className="mt-5 text-2xl font-black">{supplier.name}</h2>
            <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-[var(--supplier-muted)]">Código ORDR</p>
            <p className="mt-2 rounded-2xl border border-[var(--supplier-border)] bg-[var(--supplier-card-muted)] px-4 py-3 text-xl font-black tracking-[0.18em] text-[var(--supplier-primary-strong)] dark:text-[var(--supplier-primary)]">
              {supplier.ordrCode || '—'}
            </p>

            <div className={`mt-5 rounded-[1.5rem] border p-4 ${isOnline ? 'border-emerald-300 bg-emerald-500/10' : 'border-[var(--supplier-border)] bg-[var(--supplier-card-muted)]'}`}>
              <div className="flex items-center gap-3">
                <span className={`grid size-10 place-items-center rounded-2xl ${isOnline ? 'bg-[var(--supplier-primary)] text-slate-950' : 'bg-[var(--supplier-card-solid)] text-[var(--supplier-muted)] dark:bg-white/10'}`}>
                  <RadioTower className="size-5" />
                </span>
                <div>
                  <p className="text-lg font-black">{isOnline ? 'Online agora' : 'Offline agora'}</p>
                  <p className="text-xs font-bold text-[var(--supplier-muted)]">
                    {supplier.onlineEnabled ? 'Disponibilizado' : 'Pausado manualmente'} · {insideOperatingHours ? 'dentro do expediente' : 'fora do expediente'}
                  </p>
                </div>
              </div>

              <button type="button" onClick={toggleAvailability} disabled={saving} className={`mt-4 w-full ${supplier.onlineEnabled ? 'supplier-button' : 'supplier-button-primary'}`}>
                {supplier.onlineEnabled ? 'Pausar disponibilidade' : 'Disponibilizar online'}
              </button>
            </div>
          </section>

          <section className="supplier-card-flat rounded-[2rem] p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--supplier-muted)]">Resumo de acesso</p>
            <div className="mt-4 space-y-3">
              <AccessLine icon={<ShieldCheck size={18} />} label="Status manual" value={supplier.onlineEnabled ? 'Disponibilizado' : 'Pausado'} active={supplier.onlineEnabled} />
              <AccessLine icon={<BadgeCheck size={18} />} label="Expediente" value={insideOperatingHours ? 'Aberto agora' : 'Fechado agora'} active={insideOperatingHours} />
              <AccessLine icon={supplier.publicListingEnabled ? <Globe2 size={18} /> : <LockKeyhole size={18} />} label="Visibilidade" value={supplier.publicListingEnabled ? 'Público' : 'Por código'} active={supplier.publicListingEnabled} />
            </div>
          </section>
        </aside>

        <div className="min-w-0 space-y-5">
          <section className="supplier-card-flat rounded-[2rem] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="supplier-chip">
                  {supplier.publicListingEnabled ? <Globe2 size={14} /> : <LockKeyhole size={14} />}
                  Visibilidade automática
                </p>
                <h2 className="mt-3 text-2xl font-black">
                  {supplier.publicListingEnabled ? 'Aparece automaticamente para empresas ORDR' : 'Acesso somente por Código ORDR'}
                </h2>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[var(--supplier-muted)]">
                  Esta opção define se empresas ORDR conseguem encontrar este fornecedor automaticamente.
                  Se estiver desligada, elas precisam informar seu Código ORDR para acessar suas tabelas.
                </p>
              </div>

              <button
                type="button"
                onClick={() => saveProfile({ publicListingEnabled: !supplier.publicListingEnabled })}
                disabled={saving}
                className={supplier.publicListingEnabled ? 'supplier-button-primary min-w-56' : 'supplier-button min-w-56'}
              >
                {supplier.publicListingEnabled ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                {supplier.publicListingEnabled ? 'Visível para todos' : 'Somente por código'}
              </button>
            </div>
          </section>

          <section className="supplier-card-flat rounded-[2rem] p-5">
            <h2 className="text-2xl font-black">Dados comerciais</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Nome"><input className="supplier-field" value={supplier.name} onChange={(event) => updateSupplierField('name', event.target.value)} placeholder="Nome do fornecedor" /></Field>
              <Field label="Documento"><input className="supplier-field" value={supplier.document ?? ''} onChange={(event) => updateSupplierField('document', event.target.value)} placeholder="CNPJ, CPF ou documento" /></Field>
              <Field label="Contato"><input className="supplier-field" value={supplier.contactName ?? ''} onChange={(event) => updateSupplierField('contactName', event.target.value)} placeholder="Pessoa responsável" /></Field>
              <Field label="Telefone"><input className="supplier-field" value={supplier.phone ?? ''} onChange={(event) => updateSupplierField('phone', event.target.value)} placeholder="Telefone comercial" /></Field>
              <Field label="E-mail"><input className="supplier-field" value={supplier.email ?? ''} onChange={(event) => updateSupplierField('email', event.target.value)} placeholder="email@fornecedor.com" /></Field>
              <Field label="Endereço"><input className="supplier-field" value={supplier.address ?? ''} onChange={(event) => updateSupplierField('address', event.target.value)} placeholder="Endereço comercial" /></Field>
              <Field label="Categorias" wide><input className="supplier-field" value={categoriesText} onChange={(event) => updateSupplierField('categories', event.target.value.split(',').map((item) => item.trim()).filter(Boolean))} placeholder="Bebidas, Carnes, Descartáveis..." /></Field>
              <Field label="Observações" wide><textarea className="supplier-field min-h-28 resize-none" value={supplier.notes ?? ''} onChange={(event) => updateSupplierField('notes', event.target.value)} placeholder="Observações comerciais, condições, detalhes de entrega..." /></Field>
            </div>
          </section>

          <OperatingHoursGrid value={supplier.operatingHours ?? emptyHours} onChange={(operatingHours) => setSupplier((current) => ({ ...current, operatingHours }))} />

          <div className="flex justify-end">
            <button type="button" onClick={() => saveProfile(supplier)} disabled={saving || loading} className="supplier-button-primary">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Salvar alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={wide ? 'block md:col-span-2' : 'block'}>
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-[var(--supplier-muted)]">{label}</span>
      {children}
    </label>
  )
}

function AccessLine({ icon, label, value, active }: { icon: React.ReactNode; label: string; value: string; active: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--supplier-border)] bg-[var(--supplier-card-muted)] px-3 py-3">
      <div className="flex items-center gap-3">
        <span className={`grid size-9 place-items-center rounded-xl ${active ? 'bg-[var(--supplier-primary)] text-slate-950' : 'bg-[var(--supplier-card-solid)] text-[var(--supplier-muted)] dark:bg-white/10'}`}>
          {icon}
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--supplier-muted)]">{label}</p>
          <p className="text-sm font-black">{value}</p>
        </div>
      </div>
    </div>
  )
}
