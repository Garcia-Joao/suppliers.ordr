'use client'

import { useEffect, useMemo, useState } from 'react'
import { SupplierShell } from '@/components/layout/supplier-shell'
import { supplierApi, type OperatingHour, type SupplierProfile } from '@/lib/api'
import { Eye, EyeOff, Loader2, RadioTower, Save } from 'lucide-react'

const emptyHours: OperatingHour[] = [
  { day: 'sun', label: 'Domingo', enabled: false, startTime: '08:00', endTime: '18:00' },
  { day: 'mon', label: 'Segunda', enabled: true, startTime: '08:00', endTime: '18:00' },
  { day: 'tue', label: 'Terça', enabled: true, startTime: '08:00', endTime: '18:00' },
  { day: 'wed', label: 'Quarta', enabled: true, startTime: '08:00', endTime: '18:00' },
  { day: 'thu', label: 'Quinta', enabled: true, startTime: '08:00', endTime: '18:00' },
  { day: 'fri', label: 'Sexta', enabled: true, startTime: '08:00', endTime: '18:00' },
  { day: 'sat', label: 'Sábado', enabled: true, startTime: '09:00', endTime: '13:00' },
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

  useEffect(() => {
    supplierApi.profile().then((result) => setSupplier(result.supplier)).catch(() => setSupplier(fallback)).finally(() => setLoading(false))
  }, [])

  const image = supplier.photoData || supplier.photoUrl
  const isOnline = supplier.onlineStatus?.isOnline
  const visibilityLabel = supplier.publicListingEnabled ? 'Público para empresas ORDR' : 'Somente por código ORDR'

  const categoriesText = useMemo(() => (supplier.categories ?? []).join(', '), [supplier.categories])

  async function saveProfile(patch: Partial<SupplierProfile>) {
    setSaving(true)
    setMessage('')
    try {
      const result = await supplierApi.updateProfile(patch)
      setSupplier(result.supplier)
      setMessage('Perfil atualizado.')
      window.setTimeout(() => setMessage(''), 2400)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao salvar perfil.')
    } finally {
      setSaving(false)
    }
  }

  function updateHour(index: number, patch: Partial<OperatingHour>) {
    const next = [...(supplier.operatingHours ?? emptyHours)]
    next[index] = { ...next[index], ...patch }
    setSupplier((current) => ({ ...current, operatingHours: next }))
  }

  return (
    <SupplierShell>
      <section className="glass-card rounded-[2rem] p-5 md:p-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-primary">Perfil e visibilidade</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">Dados do fornecedor</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Controle seus dados, horários e se sua tabela aparece automaticamente para empresas ORDR.
            </p>
          </div>
          <span className="rounded-2xl border bg-background/60 px-4 py-2 text-sm font-bold text-muted-foreground">
            {loading ? 'Carregando...' : saving ? 'Salvando...' : 'Sincronizado'}
          </span>
        </div>

        {message && <div className="mb-5 rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3 text-sm font-black text-primary">{message}</div>}

        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <aside className="rounded-[2rem] border bg-card p-5">
            <div className="grid aspect-square place-items-center overflow-hidden rounded-[1.5rem] bg-secondary">
              {image ? <img src={image} alt={supplier.name} className="h-full w-full object-cover" /> : <span className="text-6xl font-black text-primary">{supplier.name.slice(0, 1)}</span>}
            </div>
            <h2 className="mt-5 text-2xl font-black">{supplier.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">Código ORDR</p>
            <p className="mt-1 rounded-2xl border bg-background px-4 py-3 text-xl font-black tracking-[0.18em] text-primary">{supplier.ordrCode || '—'}</p>

            <div className={`mt-5 rounded-[1.5rem] border p-4 ${isOnline ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-zinc-500/20 bg-secondary'}`}>
              <div className="flex items-center gap-3">
                <span className={`grid size-10 place-items-center rounded-2xl ${isOnline ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                  <RadioTower className="size-5" />
                </span>
                <div>
                  <p className="text-lg font-black">{isOnline ? 'Online agora' : 'Offline agora'}</p>
                  <p className="text-xs font-bold text-muted-foreground">
                    {supplier.onlineEnabled ? 'Disponibilidade manual ativa' : 'Disponibilidade pausada'} · {supplier.onlineStatus?.insideOperatingHours ? 'dentro do expediente' : 'fora do expediente'}
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <div className="space-y-5">
            <div className="rounded-[2rem] border bg-card p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-black">Disponibilização automática</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {visibilityLabel}. Desativado significa que empresas só acessam suas tabelas informando seu código ORDR.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => saveProfile({ publicListingEnabled: !supplier.publicListingEnabled })}
                  disabled={saving}
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition disabled:opacity-50 ${supplier.publicListingEnabled ? 'bg-primary text-primary-foreground' : 'border border-border bg-background hover:bg-secondary'}`}
                >
                  {supplier.publicListingEnabled ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  {supplier.publicListingEnabled ? 'Visível para todos' : 'Somente por código'}
                </button>
              </div>
            </div>

            <div className="rounded-[2rem] border bg-card p-5">
              <h2 className="text-xl font-black">Dados comerciais</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input className="field" value={supplier.name} onChange={(e) => setSupplier((c) => ({ ...c, name: e.target.value }))} placeholder="Nome" />
                <input className="field" value={supplier.document ?? ''} onChange={(e) => setSupplier((c) => ({ ...c, document: e.target.value }))} placeholder="Documento" />
                <input className="field" value={supplier.contactName ?? ''} onChange={(e) => setSupplier((c) => ({ ...c, contactName: e.target.value }))} placeholder="Contato" />
                <input className="field" value={supplier.phone ?? ''} onChange={(e) => setSupplier((c) => ({ ...c, phone: e.target.value }))} placeholder="Telefone" />
                <input className="field" value={supplier.email ?? ''} onChange={(e) => setSupplier((c) => ({ ...c, email: e.target.value }))} placeholder="E-mail" />
                <input className="field" value={supplier.address ?? ''} onChange={(e) => setSupplier((c) => ({ ...c, address: e.target.value }))} placeholder="Endereço" />
                <input className="field md:col-span-2" value={categoriesText} onChange={(e) => setSupplier((c) => ({ ...c, categories: e.target.value.split(',').map((item) => item.trim()).filter(Boolean) }))} placeholder="Categorias, separadas por vírgula" />
              </div>
            </div>

            <div className="rounded-[2rem] border bg-card p-5">
              <h2 className="text-xl font-black">Horários de expediente</h2>
              <div className="mt-4 space-y-3">
                {(supplier.operatingHours ?? emptyHours).map((hour, index) => (
                  <div key={hour.day} className="grid gap-3 rounded-2xl border bg-background p-3 md:grid-cols-[1fr_120px_120px_110px] md:items-center">
                    <label className="flex items-center gap-3 font-black">
                      <input type="checkbox" checked={hour.enabled} onChange={(e) => updateHour(index, { enabled: e.target.checked })} />
                      {hour.label}
                    </label>
                    <input className="field" type="time" value={hour.startTime} onChange={(e) => updateHour(index, { startTime: e.target.value })} />
                    <input className="field" type="time" value={hour.endTime} onChange={(e) => updateHour(index, { endTime: e.target.value })} />
                    <span className="text-xs font-black text-muted-foreground">{hour.enabled ? 'Ativo' : 'Fechado'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => saveProfile(supplier)}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-primary-foreground disabled:opacity-50"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Salvar alterações
              </button>
            </div>
          </div>
        </div>
      </section>
    </SupplierShell>
  )
}
