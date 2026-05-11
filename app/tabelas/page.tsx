'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  Copy,
  Edit3,
  Loader2,
  Plus,
  Power,
  RefreshCw,
  Search,
  Table2,
  Trash2,
  X,
} from 'lucide-react'
import { supplierApi, type PriceTablePayload, type SupplierPriceTable } from '@/lib/api'

type TableModal = { mode: 'create' | 'edit'; table?: SupplierPriceTable }
type DuplicateModal = { table: SupplierPriceTable }

const emptyForm = {
  name: '',
  description: '',
  active: true,
  validFrom: '',
  validUntil: '',
}

function money(value: number) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function TabelasPage() {
  const [tables, setTables] = useState<SupplierPriceTable[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [tableModal, setTableModal] = useState<TableModal | null>(null)
  const [duplicateModal, setDuplicateModal] = useState<DuplicateModal | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [duplicateForm, setDuplicateForm] = useState({ name: '', priceAdjustmentPercent: '0' })

  const filteredTables = useMemo(() => {
    const term = search.trim().toLowerCase()
    return tables.filter((table) => !term || table.name.toLowerCase().includes(term) || table.description?.toLowerCase().includes(term))
  }, [search, tables])

  useEffect(() => {
    loadTables()
  }, [])

  async function loadTables() {
    setLoading(true)
    setError('')
    try {
      const result = await supplierApi.priceTables()
      setTables(result.tables)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar tabelas.')
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setForm(emptyForm)
    setTableModal({ mode: 'create' })
  }

  function openEdit(table: SupplierPriceTable) {
    setForm({
      name: table.name,
      description: table.description || '',
      active: table.active,
      validFrom: table.validFrom || '',
      validUntil: table.validUntil || '',
    })
    setTableModal({ mode: 'edit', table })
  }

  async function submitTable(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')

    const payload: PriceTablePayload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      active: form.active,
      validFrom: form.validFrom || null,
      validUntil: form.validUntil || null,
    }

    try {
      const result = tableModal?.mode === 'edit' && tableModal.table
        ? await supplierApi.updatePriceTable(tableModal.table.id, payload)
        : await supplierApi.createPriceTable(payload)

      setTables(result.tables)
      setTableModal(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar tabela.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleTable(table: SupplierPriceTable) {
    setSaving(true)
    setError('')

    try {
      const result = await supplierApi.updatePriceTable(table.id, { active: !table.active })
      setTables(result.tables)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar status da tabela.')
    } finally {
      setSaving(false)
    }
  }

  async function removeTable(table: SupplierPriceTable) {
    if (!window.confirm(`Excluir a tabela "${table.name}"?`)) return
    setSaving(true)
    setError('')

    try {
      const result = await supplierApi.deletePriceTable(table.id)
      setTables(result.tables)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir tabela.')
    } finally {
      setSaving(false)
    }
  }

  function openDuplicate(table: SupplierPriceTable) {
    setDuplicateForm({ name: `${table.name} - cópia`, priceAdjustmentPercent: '0' })
    setDuplicateModal({ table })
  }

  async function submitDuplicate(event: FormEvent) {
    event.preventDefault()
    if (!duplicateModal) return

    setSaving(true)
    setError('')

    try {
      const result = await supplierApi.duplicatePriceTable(duplicateModal.table.id, {
        name: duplicateForm.name,
        priceAdjustmentPercent: duplicateForm.priceAdjustmentPercent,
        active: false,
      })
      setTables(result.tables)
      setDuplicateModal(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao duplicar tabela.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="supplier-page space-y-6">
      <section className="supplier-card overflow-hidden rounded-[2rem]">
        <div className="relative p-5 md:p-8">
          <div className="pointer-events-none absolute right-0 top-0 h-52 w-52 rounded-full bg-emerald-300/20 blur-3xl" />
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="supplier-chip supplier-chip-primary">
                <Table2 size={14} />
                Tabelas de preço
              </p>
              <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">Tabelas</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[var(--supplier-muted)]">
                Ative, pause, duplique e ajuste suas listas comerciais.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={loadTables} className="supplier-button">
                <RefreshCw size={17} />
                Atualizar
              </button>
              <button type="button" onClick={openCreate} className="supplier-button-primary">
                <Plus size={17} />
                Nova tabela
              </button>
            </div>
          </div>
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm font-black text-red-600 dark:text-red-200">{error}</div> : null}

      <section className="supplier-card-flat rounded-[1.5rem] p-4">
        <label className="flex items-center gap-3 rounded-2xl border border-[var(--supplier-border)] bg-[var(--supplier-card-muted)] px-4 py-3">
          <Search size={18} className="text-[var(--supplier-muted)]" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar tabela..." className="w-full bg-transparent text-sm font-bold outline-none placeholder:text-[var(--supplier-muted-2)]" />
        </label>
      </section>

      {loading ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-48 animate-pulse rounded-[2rem] border border-[var(--supplier-border)] bg-[var(--supplier-card-muted)]" />)}
        </div>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {filteredTables.map((table) => (
            <article key={table.id} className="supplier-card-flat rounded-[2rem] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className={table.active ? 'supplier-chip supplier-chip-primary' : 'supplier-chip'}>
                    {table.active ? 'Ativa' : 'Pausada'}
                  </span>
                  <h2 className="mt-3 text-2xl font-black">{table.name}</h2>
                  <p className="mt-2 text-sm font-semibold text-[var(--supplier-muted)]">{table.description || 'Sem descrição'}</p>
                </div>
                <button type="button" onClick={() => toggleTable(table)} disabled={saving} className={table.active ? 'supplier-button' : 'supplier-button-primary'}>
                  <Power size={17} />
                  {table.active ? 'Pausar' : 'Ativar'}
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Info label="Itens" value={String(table.itemCount ?? table.items?.length ?? 0)} />
                <Info label="Preço médio" value={money(table.averagePrice || 0)} />
                <Info label="Atualizada" value={new Date(table.updatedAt).toLocaleDateString('pt-BR')} />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" onClick={() => openEdit(table)} className="supplier-button flex-1">
                  <Edit3 size={16} />
                  Editar
                </button>
                <button type="button" onClick={() => openDuplicate(table)} className="supplier-button flex-1">
                  <Copy size={16} />
                  Duplicar
                </button>
                <button type="button" onClick={() => removeTable(table)} className="supplier-button-danger">
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {tableModal ? (
        <Modal title={tableModal.mode === 'create' ? 'Nova tabela' : 'Editar tabela'} onClose={() => setTableModal(null)}>
          <form onSubmit={submitTable} className="space-y-4">
            <Field label="Nome"><input className="supplier-field" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></Field>
            <Field label="Descrição"><textarea className="supplier-field min-h-24 resize-none" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Válida de"><input type="date" className="supplier-field" value={form.validFrom} onChange={(event) => setForm((current) => ({ ...current, validFrom: event.target.value }))} /></Field>
              <Field label="Válida até"><input type="date" className="supplier-field" value={form.validUntil} onChange={(event) => setForm((current) => ({ ...current, validUntil: event.target.value }))} /></Field>
            </div>
            <label className="flex items-center justify-between rounded-2xl border border-[var(--supplier-border)] bg-[var(--supplier-card-muted)] p-4">
              <span className="font-black">Tabela ativa</span>
              <input type="checkbox" checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} className="h-5 w-5 accent-emerald-500" />
            </label>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setTableModal(null)} className="supplier-button">Cancelar</button>
              <button type="submit" disabled={saving} className="supplier-button-primary">{saving ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </form>
        </Modal>
      ) : null}

      {duplicateModal ? (
        <Modal title="Duplicar tabela" onClose={() => setDuplicateModal(null)}>
          <form onSubmit={submitDuplicate} className="space-y-4">
            <Field label="Nome da nova tabela"><input className="supplier-field" value={duplicateForm.name} onChange={(event) => setDuplicateForm((current) => ({ ...current, name: event.target.value }))} /></Field>
            <Field label="Ajuste percentual dos preços">
              <input type="number" step="0.01" className="supplier-field" value={duplicateForm.priceAdjustmentPercent} onChange={(event) => setDuplicateForm((current) => ({ ...current, priceAdjustmentPercent: event.target.value }))} placeholder="Ex: -20 ou 15" />
            </Field>
            <p className="text-sm font-semibold text-[var(--supplier-muted)]">Use valores negativos para desconto, como -20%, ou positivos para acréscimo.</p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setDuplicateModal(null)} className="supplier-button">Cancelar</button>
              <button type="submit" disabled={saving} className="supplier-button-primary">{saving ? 'Duplicando...' : 'Duplicar'}</button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--supplier-border)] bg-[var(--supplier-card-muted)] p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--supplier-muted)]">{label}</p>
      <p className="mt-2 text-lg font-black">{value}</p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-[var(--supplier-muted)]">{label}</span>{children}</label>
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xl">
      <div className="w-full max-w-2xl rounded-[2rem] border border-[var(--supplier-border)] bg-[var(--supplier-card-solid)] p-5 text-[var(--supplier-text)] shadow-2xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black">{title}</h2>
          <button type="button" onClick={onClose} className="supplier-button"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}
