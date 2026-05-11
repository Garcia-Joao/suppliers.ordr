'use client'

import type { ReactNode } from 'react'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Edit3, Loader2, Plus, Search, Trash2, X } from 'lucide-react'
import { SupplierShell } from '@/components/layout/supplier-shell'
import { supplierApi, type PriceTableItemPayload, type PriceTablePayload, type SupplierPriceTable, type SupplierProduct } from '@/lib/api'

const EMPTY_TABLE: PriceTablePayload = { name: '', description: '', active: true, validFrom: '', validUntil: '' }
const EMPTY_ITEM: PriceTableItemPayload = { itemName: '', sku: '', unit: 'unit', quantity: 1, unitPrice: '', notes: '' }

export default function PriceTablesPage() {
  const [tables, setTables] = useState<SupplierPriceTable[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [tableModal, setTableModal] = useState<{ mode: 'create' | 'edit'; table?: SupplierPriceTable } | null>(null)
  const [itemModal, setItemModal] = useState<{ mode: 'create' | 'edit'; table: SupplierPriceTable; item?: SupplierProduct } | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const result = await supplierApi.priceTables()
      setTables(result.tables)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load().catch(() => setLoading(false)) }, [])

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase()
    if (!search) return tables
    return tables.filter((table) =>
      [table.name, table.description, ...table.items.map((item) => `${item.name} ${item.sku}`)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(search)
    )
  }, [query, tables])

  async function saveTable(payload: PriceTablePayload, table?: SupplierPriceTable) {
    setSaving(true)
    try {
      const result = table
        ? await supplierApi.updatePriceTable(table.id, payload)
        : await supplierApi.createPriceTable(payload)
      setTables(result.tables)
      setTableModal(null)
    } finally {
      setSaving(false)
    }
  }

  async function removeTable(table: SupplierPriceTable) {
    if (!confirm(`Excluir a tabela "${table.name}"?`)) return
    const result = await supplierApi.deletePriceTable(table.id)
    setTables(result.tables)
  }

  async function saveItem(payload: PriceTableItemPayload, table: SupplierPriceTable, item?: SupplierProduct) {
    setSaving(true)
    try {
      const result = item
        ? await supplierApi.updatePriceTableItem(table.id, item.id, payload)
        : await supplierApi.createPriceTableItem(table.id, payload)
      setTables(result.tables)
      setItemModal(null)
    } finally {
      setSaving(false)
    }
  }

  async function removeItem(table: SupplierPriceTable, item: SupplierProduct) {
    if (!confirm(`Remover "${item.name}" da tabela?`)) return
    const result = await supplierApi.deletePriceTableItem(table.id, item.id)
    setTables(result.tables)
  }

  return (
    <SupplierShell>
      <section className="space-y-4 pb-24 lg:pb-0">
        <div className="rounded-[2rem] border bg-card p-5 md:p-8">
          <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-primary">Tabelas</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">Tabelas de preço</h1>
              <p className="mt-3 max-w-2xl text-muted-foreground">Cadastre tabelas e itens que ficam disponíveis para clientes ORDR.</p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative min-w-0 md:w-80">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full rounded-2xl border bg-background py-3 pl-11 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary" placeholder="Buscar tabela ou item..." />
              </div>
              <button onClick={() => setTableModal({ mode: 'create' })} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-black text-primary-foreground shadow-lg shadow-emerald-500/20">
                <Plus className="size-4" /> Nova tabela
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[2rem] border bg-card p-8 text-center text-sm font-black text-muted-foreground"><Loader2 className="mx-auto mb-3 size-6 animate-spin text-primary" />Carregando tabelas...</div>
        ) : filtered.length ? (
          <div className="space-y-4">
            {filtered.map((table) => (
              <article key={table.id} className="overflow-hidden rounded-[2rem] border bg-card">
                <div className="flex flex-col justify-between gap-4 border-b bg-secondary/40 p-5 lg:flex-row lg:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-background px-3 py-1 text-xs font-black uppercase">{table.active ? 'Ativa' : 'Inativa'}</span>
                      <span className="text-xs font-bold text-muted-foreground">{table.itemCount} itens · média {money(table.averagePrice)}</span>
                    </div>
                    <h2 className="mt-2 text-2xl font-black">{table.name}</h2>
                    {table.description && <p className="mt-1 text-sm text-muted-foreground">{table.description}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setItemModal({ mode: 'create', table })} className="rounded-2xl bg-primary px-4 py-2 text-sm font-black text-primary-foreground"><Plus className="mr-2 inline size-4" />Item</button>
                    <button onClick={() => setTableModal({ mode: 'edit', table })} className="rounded-2xl border bg-background px-4 py-2 text-sm font-black"><Edit3 className="mr-2 inline size-4" />Editar</button>
                    <button onClick={() => removeTable(table)} className="rounded-2xl border bg-background px-4 py-2 text-sm font-black text-red-500"><Trash2 className="mr-2 inline size-4" />Excluir</button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[780px] text-sm">
                    <thead>
                      <tr className="text-left text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
                        <th className="px-5 py-4">Item</th><th className="px-5 py-4">SKU</th><th className="px-5 py-4">Unidade</th><th className="px-5 py-4 text-right">Preço</th><th className="px-5 py-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {table.items.length ? table.items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="px-5 py-4 font-black">{item.name}<p className="text-xs font-medium text-muted-foreground">{item.notes || item.category || 'Sem observações'}</p></td>
                          <td className="px-5 py-4 text-muted-foreground">{item.sku || '-'}</td>
                          <td className="px-5 py-4">{formatQuantity(item.quantity)} {unitLabel(item.unit)}</td>
                          <td className="px-5 py-4 text-right font-black">{money(item.unitPrice)}</td>
                          <td className="px-5 py-4 text-right"><button onClick={() => setItemModal({ mode: 'edit', table, item })} className="mr-2 rounded-xl border px-3 py-2 font-bold">Editar</button><button onClick={() => removeItem(table, item)} className="rounded-xl border px-3 py-2 font-bold text-red-500">Remover</button></td>
                        </tr>
                      )) : <tr><td className="px-5 py-8 text-center text-muted-foreground" colSpan={5}>Nenhum item cadastrado nessa tabela.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border bg-card p-10 text-center"><h2 className="text-2xl font-black">Nenhuma tabela encontrada</h2><p className="mt-2 text-muted-foreground">Crie sua primeira tabela para liberar produtos no portal.</p></div>
        )}
      </section>

      {tableModal && <TableModal modal={tableModal} saving={saving} onClose={() => setTableModal(null)} onSave={(payload) => saveTable(payload, tableModal.table)} />}
      {itemModal && <ItemModal modal={itemModal} saving={saving} onClose={() => setItemModal(null)} onSave={(payload) => saveItem(payload, itemModal.table, itemModal.item)} />}
    </SupplierShell>
  )
}

function TableModal({ modal, saving, onClose, onSave }: { modal: { mode: 'create' | 'edit'; table?: SupplierPriceTable }; saving: boolean; onClose: () => void; onSave: (payload: PriceTablePayload) => void }) {
  const [form, setForm] = useState<PriceTablePayload>(modal.table ? { name: modal.table.name, description: modal.table.description || '', active: modal.table.active, validFrom: dateInput(modal.table.validFrom), validUntil: dateInput(modal.table.validUntil) } : EMPTY_TABLE)
  function submit(e: FormEvent) { e.preventDefault(); onSave(form) }
  return <Modal title={modal.mode === 'create' ? 'Nova tabela' : 'Editar tabela'} onClose={onClose}><form onSubmit={submit} className="space-y-4"><Field label="Nome" value={form.name} onChange={(name) => setForm({ ...form, name })} required /><Field label="Descrição" value={form.description || ''} onChange={(description) => setForm({ ...form, description })} /><div className="grid gap-3 md:grid-cols-2"><Field type="date" label="Válida de" value={form.validFrom || ''} onChange={(validFrom) => setForm({ ...form, validFrom })} /><Field type="date" label="Válida até" value={form.validUntil || ''} onChange={(validUntil) => setForm({ ...form, validUntil })} /></div><label className="flex items-center justify-between rounded-2xl border p-4 font-black"><span>Tabela ativa</span><input type="checkbox" checked={Boolean(form.active)} onChange={(e) => setForm({ ...form, active: e.target.checked })} /></label><button disabled={saving} className="w-full rounded-2xl bg-primary px-5 py-3 font-black text-primary-foreground disabled:opacity-60">{saving ? 'Salvando...' : 'Salvar tabela'}</button></form></Modal>
}

function ItemModal({ modal, saving, onClose, onSave }: { modal: { mode: 'create' | 'edit'; table: SupplierPriceTable; item?: SupplierProduct }; saving: boolean; onClose: () => void; onSave: (payload: PriceTableItemPayload) => void }) {
  const [form, setForm] = useState<PriceTableItemPayload>(modal.item ? { itemName: modal.item.name, sku: modal.item.sku || '', unit: modal.item.unit, quantity: modal.item.quantity, unitPrice: modal.item.unitPrice, notes: modal.item.notes || '' } : EMPTY_ITEM)
  function submit(e: FormEvent) { e.preventDefault(); onSave(form) }
  return <Modal title={modal.mode === 'create' ? `Novo item · ${modal.table.name}` : 'Editar item'} onClose={onClose}><form onSubmit={submit} className="space-y-4"><Field label="Item" value={form.itemName} onChange={(itemName) => setForm({ ...form, itemName })} required /><Field label="SKU / Código" value={form.sku || ''} onChange={(sku) => setForm({ ...form, sku })} /><div className="grid gap-3 md:grid-cols-3"><Field label="Quantidade" type="number" step="0.001" value={String(form.quantity)} onChange={(quantity) => setForm({ ...form, quantity })} required /><label className="grid gap-2 text-sm font-black">Unidade<select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="rounded-2xl border bg-background px-4 py-3 outline-none"><option value="unit">un.</option><option value="g">g</option><option value="kg">kg</option><option value="ml">ml</option><option value="l">l</option></select></label><Field label="Preço" type="number" step="0.01" value={String(form.unitPrice)} onChange={(unitPrice) => setForm({ ...form, unitPrice })} required /></div><Field label="Observações" value={form.notes || ''} onChange={(notes) => setForm({ ...form, notes })} /><button disabled={saving} className="w-full rounded-2xl bg-primary px-5 py-3 font-black text-primary-foreground disabled:opacity-60">{saving ? 'Salvando...' : 'Salvar item'}</button></form></Modal>
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) { return <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"><div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-[2rem] border bg-background p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-2xl font-black">{title}</h2><button onClick={onClose} className="grid size-10 place-items-center rounded-2xl border"><X className="size-4" /></button></div>{children}</div></div> }
function Field({ label, value, onChange, type = 'text', required, step }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; step?: string }) { return <label className="grid gap-2 text-sm font-black">{label}<input type={type} step={step} required={required} value={value} onChange={(e) => onChange(e.target.value)} className="rounded-2xl border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary" /></label> }
function money(value: number) { return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function formatQuantity(value: number) { return Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 3 }) }
function unitLabel(unit: string) { return unit === 'unit' ? 'un.' : unit }
function dateInput(value?: string | null) { if (!value) return ''; return value.slice(0, 10) }
