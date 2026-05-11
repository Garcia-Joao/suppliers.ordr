'use client'

import { FormEvent, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Copy,
  Edit3,
  Eye,
  EyeOff,
  Layers,
  Loader2,
  PackagePlus,
  Percent,
  Plus,
  Search,
  TableProperties,
  Trash2,
  X,
} from 'lucide-react'
import { clsx } from 'clsx'
import { SupplierShell } from '@/components/layout/supplier-shell'
import {
  supplierApi,
  type DuplicateTablePayload,
  type ExistingProductPayload,
  type PriceTableItemPayload,
  type PriceTablePayload,
  type SupplierPriceTable,
  type SupplierProduct,
} from '@/lib/api'

const units = ['unit', 'ml', 'l', 'g', 'kg']
const emptyTableForm: PriceTablePayload = { name: '', description: '', active: true, validFrom: '', validUntil: '' }
const emptyItemForm: PriceTableItemPayload = { itemName: '', sku: '', category: '', unit: 'unit', quantity: '1', unitPrice: '0', notes: '', active: true, stockEnabled: false, stockQuantity: '0', minStockQuantity: '0' }

function money(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function numberText(value?: number | null) {
  return Number(value ?? 0).toLocaleString('pt-BR', { maximumFractionDigits: 3 })
}

export default function TabelasPage() {
  const [tables, setTables] = useState<SupplierPriceTable[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [query, setQuery] = useState('')
  const [tableModal, setTableModal] = useState<{ mode: 'create' | 'edit'; table?: SupplierPriceTable } | null>(null)
  const [itemModal, setItemModal] = useState<{ table: SupplierPriceTable; item?: SupplierProduct } | null>(null)
  const [existingModal, setExistingModal] = useState<{ table: SupplierPriceTable } | null>(null)
  const [duplicateModal, setDuplicateModal] = useState<{ table: SupplierPriceTable } | null>(null)
  const [bulkModal, setBulkModal] = useState<{ table: SupplierPriceTable } | null>(null)
  const [tableForm, setTableForm] = useState(emptyTableForm)
  const [itemForm, setItemForm] = useState(emptyItemForm)
  const [existingForm, setExistingForm] = useState<ExistingProductPayload>({ sourceItemId: '', priceAdjustmentPercent: '0' })
  const [duplicateForm, setDuplicateForm] = useState<DuplicateTablePayload>({ name: '', active: false, priceAdjustmentPercent: '0' })
  const [bulkPercent, setBulkPercent] = useState('')

  async function load() {
    setLoading(true)
    try {
      const result = await supplierApi.priceTables()
      setTables(result.tables ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load().catch(() => setLoading(false))
  }, [])

  const allProducts = useMemo(() => tables.flatMap((table) => table.items.map((item) => ({ ...item, tableId: table.id, tableName: table.name, tableActive: table.active }))), [tables])

  const filteredTables = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return tables
    return tables.filter((table) => `${table.name} ${table.description ?? ''} ${table.items.map((item) => `${item.name} ${item.sku ?? ''} ${item.category ?? ''}`).join(' ')}`.toLowerCase().includes(term))
  }, [tables, query])

  const totals = useMemo(() => {
    const active = tables.filter((table) => table.active).length
    const items = tables.reduce((sum, table) => sum + table.items.length, 0)
    const inactiveProducts = tables.reduce((sum, table) => sum + table.items.filter((item) => item.active === false).length, 0)
    return { active, items, inactiveProducts }
  }, [tables])

  function openCreateTable() {
    setTableForm(emptyTableForm)
    setTableModal({ mode: 'create' })
  }

  function openEditTable(table: SupplierPriceTable) {
    setTableForm({ name: table.name, description: table.description ?? '', active: table.active, validFrom: table.validFrom?.slice(0, 10) ?? '', validUntil: table.validUntil?.slice(0, 10) ?? '' })
    setTableModal({ mode: 'edit', table })
  }

  function openCreateItem(table: SupplierPriceTable) {
    setItemForm(emptyItemForm)
    setItemModal({ table })
  }

  function openEditItem(table: SupplierPriceTable, item: SupplierProduct) {
    setItemForm({ itemName: item.name, sku: item.sku ?? '', category: item.category ?? '', unit: item.unit, quantity: String(item.quantity), unitPrice: String(item.unitPrice), notes: item.notes ?? '', active: item.active !== false, stockEnabled: Boolean(item.stockEnabled), stockQuantity: String(item.stockQuantity ?? 0), minStockQuantity: String(item.minStockQuantity ?? 0) })
    setItemModal({ table, item })
  }

  async function submitTable(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      if (tableModal?.mode === 'edit' && tableModal.table) await supplierApi.updatePriceTable(tableModal.table.id, tableForm)
      else await supplierApi.createPriceTable(tableForm)
      setTableModal(null)
      await load()
    } finally { setSaving(false) }
  }

  async function toggleTable(table: SupplierPriceTable) {
    const result = await supplierApi.updatePriceTable(table.id, { active: !table.active })
    setTables(result.tables)
  }

  async function submitItem(event: FormEvent) {
    event.preventDefault()
    if (!itemModal) return
    setSaving(true)
    try {
      if (itemModal.item) await supplierApi.updatePriceTableItem(itemModal.table.id, itemModal.item.id, itemForm)
      else await supplierApi.createPriceTableItem(itemModal.table.id, itemForm)
      setItemModal(null)
      await load()
    } finally { setSaving(false) }
  }

  async function toggleProduct(table: SupplierPriceTable, item: SupplierProduct) {
    const result = await supplierApi.togglePriceTableItemActive(table.id, item.id, !(item.active !== false))
    setTables(result.tables)
  }

  async function submitExisting(event: FormEvent) {
    event.preventDefault()
    if (!existingModal) return
    setSaving(true)
    try {
      await supplierApi.createPriceTableItemFromExisting(existingModal.table.id, existingForm)
      setExistingModal(null)
      await load()
    } finally { setSaving(false) }
  }

  async function submitDuplicate(event: FormEvent) {
    event.preventDefault()
    if (!duplicateModal) return
    setSaving(true)
    try {
      await supplierApi.duplicatePriceTable(duplicateModal.table.id, duplicateForm)
      setDuplicateModal(null)
      await load()
    } finally { setSaving(false) }
  }

  async function submitBulk(event: FormEvent) {
    event.preventDefault()
    if (!bulkModal) return
    setSaving(true)
    try {
      await supplierApi.bulkAdjustPriceTablePrices(bulkModal.table.id, { priceAdjustmentPercent: bulkPercent })
      setBulkModal(null)
      setBulkPercent('')
      await load()
    } finally { setSaving(false) }
  }

  async function deleteTable(table: SupplierPriceTable) {
    if (!confirm(`Excluir a tabela "${table.name}"?`)) return
    await supplierApi.deletePriceTable(table.id)
    await load()
  }

  async function deleteItem(table: SupplierPriceTable, item: SupplierProduct) {
    if (!confirm(`Remover "${item.name}" da tabela ${table.name}?`)) return
    await supplierApi.deletePriceTableItem(table.id, item.id)
    await load()
  }

  return (
    <SupplierShell>
      <div className="space-y-5 pb-24 lg:pb-0">
        <section className="ordr-panel relative overflow-hidden rounded-[2rem] p-5 md:p-7">
          <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
            <div>
              <span className="ordr-kicker"><TableProperties className="size-3.5" /> Tabelas</span>
              <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">Tabelas de preço</h1>
              <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-muted-foreground">Crie tabelas por cliente, evento ou condição comercial. Pause tabelas e produtos sem perder histórico.</p>
            </div>
            <button onClick={openCreateTable} className="ordr-button-primary"><Plus className="size-4" /> Nova tabela</button>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          <Metric label="Tabelas ativas" value={totals.active} />
          <Metric label="Itens cadastrados" value={totals.items} />
          <Metric label="Produtos inativos" value={totals.inactiveProducts} />
        </section>

        <section className="ordr-panel rounded-[1.75rem] p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar tabela, produto, SKU ou categoria..." className="ordr-input pl-11" />
          </div>
        </section>

        {loading ? <div className="ordr-panel flex items-center justify-center gap-3 rounded-[2rem] p-10 text-sm font-black text-muted-foreground"><Loader2 className="size-5 animate-spin text-primary" /> Carregando tabelas...</div> : null}

        <section className="grid gap-4">
          {filteredTables.map((table) => (
            <article key={table.id} className={clsx('ordr-panel overflow-hidden rounded-[2rem]', !table.active && 'opacity-80')}>
              <div className="border-b bg-background/45 p-5">
                <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
                  <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className={clsx('rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide', table.active ? 'bg-primary/12 text-primary' : 'bg-muted text-muted-foreground')}>{table.active ? 'Ativa' : 'Pausada'}</span>
                      <span className="rounded-full border bg-background/70 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-muted-foreground">{table.items.length} itens</span>
                    </div>
                    <h2 className="text-2xl font-black tracking-tight">{table.name}</h2>
                    <p className="mt-1 max-w-2xl text-sm font-bold text-muted-foreground">{table.description || 'Sem descrição cadastrada.'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => toggleTable(table)} className={table.active ? 'ordr-button-primary' : 'ordr-button-soft'}>{table.active ? <Eye className="size-4" /> : <EyeOff className="size-4" />}{table.active ? 'Ativa' : 'Ativar'}</button>
                    <button onClick={() => openCreateItem(table)} className="ordr-button-soft"><PackagePlus className="size-4" /> Produto</button>
                    <button onClick={() => { setExistingForm({ sourceItemId: allProducts.find((product) => product.tableId !== table.id)?.id ?? '', priceAdjustmentPercent: '0' }); setExistingModal({ table }) }} className="ordr-button-soft"><Copy className="size-4" /> Existente</button>
                    <button onClick={() => { setDuplicateForm({ name: `${table.name} - cópia`, active: false, priceAdjustmentPercent: '0' }); setDuplicateModal({ table }) }} className="ordr-button-soft"><Copy className="size-4" /> Duplicar</button>
                    <button onClick={() => setBulkModal({ table })} className="ordr-button-soft"><Percent className="size-4" /> Preços</button>
                    <button onClick={() => openEditTable(table)} className="grid size-10 place-items-center rounded-2xl border"><Edit3 className="size-4" /></button>
                    <button onClick={() => deleteTable(table)} className="grid size-10 place-items-center rounded-2xl border text-destructive"><Trash2 className="size-4" /></button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-left text-sm">
                  <thead className="border-b text-xs font-black uppercase tracking-wide text-muted-foreground">
                    <tr><th className="px-5 py-4">Produto</th><th className="px-5 py-4">SKU</th><th className="px-5 py-4">Categoria</th><th className="px-5 py-4">Qtd.</th><th className="px-5 py-4 text-right">Preço</th><th className="px-5 py-4">Estoque</th><th className="px-5 py-4 text-right">Ações</th></tr>
                  </thead>
                  <tbody>
                    {table.items.map((item) => (
                      <tr key={item.id} className={clsx('border-b last:border-0', item.active === false && 'opacity-60')}>
                        <td className="px-5 py-4"><p className="font-black">{item.name}</p><p className="text-xs font-bold text-muted-foreground">{item.active === false ? 'Inativo' : 'Ativo'} · {item.notes ?? 'Sem informações'}</p></td>
                        <td className="px-5 py-4 font-bold text-muted-foreground">{item.sku ?? '—'}</td>
                        <td className="px-5 py-4 font-bold text-muted-foreground">{item.category ?? '—'}</td>
                        <td className="px-5 py-4 font-bold">{numberText(item.quantity)} {item.unit}</td>
                        <td className="px-5 py-4 text-right font-black text-primary">{money(item.price)}</td>
                        <td className="px-5 py-4 font-bold">{item.stockEnabled ? `${numberText(item.stockQuantity)} / mín. ${numberText(item.minStockQuantity)}` : '—'}</td>
                        <td className="px-5 py-4"><div className="flex justify-end gap-2"><button onClick={() => toggleProduct(table, item)} className="grid size-9 place-items-center rounded-xl border">{item.active === false ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button><button onClick={() => openEditItem(table, item)} className="grid size-9 place-items-center rounded-xl border"><Edit3 className="size-4" /></button><button onClick={() => deleteItem(table, item)} className="grid size-9 place-items-center rounded-xl border text-destructive"><Trash2 className="size-4" /></button></div></td>
                      </tr>
                    ))}
                    {table.items.length === 0 ? <tr><td colSpan={7} className="px-5 py-10 text-center text-sm font-bold text-muted-foreground">Nenhum item cadastrado nessa tabela.</td></tr> : null}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </section>

        {tableModal ? <TableModal title={tableModal.mode === 'create' ? 'Nova tabela' : 'Editar tabela'} form={tableForm} setForm={setTableForm} onSubmit={submitTable} onClose={() => setTableModal(null)} saving={saving} /> : null}
        {itemModal ? <ItemModal title={itemModal.item ? 'Editar produto da tabela' : 'Novo produto da tabela'} form={itemForm} setForm={setItemForm} onSubmit={submitItem} onClose={() => setItemModal(null)} saving={saving} /> : null}
        {existingModal ? <Modal title="Adicionar produto existente" onClose={() => setExistingModal(null)}><form onSubmit={submitExisting} className="space-y-4"><label className="space-y-2"><span className="text-sm font-black">Produto já cadastrado</span><select className="ordr-input" value={existingForm.sourceItemId} onChange={(e) => setExistingForm((f) => ({ ...f, sourceItemId: e.target.value }))} required>{allProducts.filter((product) => product.tableId !== existingModal.table.id).map((product) => <option key={`${product.tableId}-${product.id}`} value={product.id}>{product.name} · {product.tableName} · {money(product.price)}</option>)}</select></label><label className="space-y-2"><span className="text-sm font-black">Ajuste de preço (%)</span><input className="ordr-input" type="number" step="0.01" value={existingForm.priceAdjustmentPercent ?? '0'} onChange={(e) => setExistingForm((f) => ({ ...f, priceAdjustmentPercent: e.target.value }))} /></label><Actions saving={saving} onCancel={() => setExistingModal(null)} /></form></Modal> : null}
        {duplicateModal ? <Modal title="Duplicar tabela" onClose={() => setDuplicateModal(null)}><form onSubmit={submitDuplicate} className="space-y-4"><label className="space-y-2"><span className="text-sm font-black">Nome da nova tabela</span><input className="ordr-input" value={duplicateForm.name} onChange={(e) => setDuplicateForm((f) => ({ ...f, name: e.target.value }))} required /></label><label className="space-y-2"><span className="text-sm font-black">Ajuste em todos os preços (%)</span><input className="ordr-input" type="number" step="0.01" value={duplicateForm.priceAdjustmentPercent ?? '0'} onChange={(e) => setDuplicateForm((f) => ({ ...f, priceAdjustmentPercent: e.target.value }))} /></label><label className="flex items-center justify-between rounded-2xl border p-4"><span className="font-black">Nova tabela ativa</span><input type="checkbox" checked={Boolean(duplicateForm.active)} onChange={(e) => setDuplicateForm((f) => ({ ...f, active: e.target.checked }))} className="size-5 accent-emerald-500" /></label><Actions saving={saving} onCancel={() => setDuplicateModal(null)} /></form></Modal> : null}
        {bulkModal ? <Modal title="Alterar preços em lote" onClose={() => setBulkModal(null)}><form onSubmit={submitBulk} className="space-y-4"><p className="text-sm font-bold text-muted-foreground">Isso altera todos os itens da tabela <strong>{bulkModal.table.name}</strong>.</p><label className="space-y-2"><span className="text-sm font-black">Ajuste percentual</span><input className="ordr-input" type="number" step="0.01" value={bulkPercent} onChange={(e) => setBulkPercent(e.target.value)} placeholder="Ex: -20" required /></label><Actions saving={saving} onCancel={() => setBulkModal(null)} /></form></Modal> : null}
      </div>
    </SupplierShell>
  )
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="ordr-panel rounded-[1.5rem] p-4"><p className="text-sm font-black text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-black tracking-tight">{value}</p></div> }
function TableModal({ title, form, setForm, onSubmit, onClose, saving }: { title: string; form: PriceTablePayload; setForm: (updater: (value: PriceTablePayload) => PriceTablePayload) => void; onSubmit: (event: FormEvent) => void; onClose: () => void; saving: boolean }) { return <Modal title={title} onClose={onClose}><form onSubmit={onSubmit} className="space-y-4"><label className="space-y-2"><span className="text-sm font-black">Nome</span><input className="ordr-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required /></label><label className="space-y-2"><span className="text-sm font-black">Descrição</span><textarea className="ordr-input min-h-24" value={form.description ?? ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></label><div className="grid gap-4 md:grid-cols-2"><label className="space-y-2"><span className="text-sm font-black">Válida de</span><input type="date" className="ordr-input" value={form.validFrom ?? ''} onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))} /></label><label className="space-y-2"><span className="text-sm font-black">Até</span><input type="date" className="ordr-input" value={form.validUntil ?? ''} onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))} /></label></div><label className="flex items-center justify-between rounded-2xl border p-4"><span className="font-black">Tabela ativa</span><input type="checkbox" checked={Boolean(form.active)} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="size-5 accent-emerald-500" /></label><Actions saving={saving} onCancel={onClose} /></form></Modal> }
function ItemModal({ title, form, setForm, onSubmit, onClose, saving }: { title: string; form: PriceTableItemPayload; setForm: (updater: (value: PriceTableItemPayload) => PriceTableItemPayload) => void; onSubmit: (event: FormEvent) => void; onClose: () => void; saving: boolean }) { return <Modal title={title} onClose={onClose}><form onSubmit={onSubmit} className="space-y-4"><label className="space-y-2"><span className="text-sm font-black">Nome do item</span><input className="ordr-input" value={form.itemName} onChange={(e) => setForm((f) => ({ ...f, itemName: e.target.value }))} required /></label><div className="grid gap-4 md:grid-cols-2"><label className="space-y-2"><span className="text-sm font-black">SKU</span><input className="ordr-input" value={form.sku ?? ''} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value.toUpperCase() }))} /></label><label className="space-y-2"><span className="text-sm font-black">Categoria</span><input className="ordr-input" value={form.category ?? ''} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} /></label><label className="space-y-2"><span className="text-sm font-black">Unidade</span><select className="ordr-input" value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}>{units.map((unit) => <option key={unit}>{unit}</option>)}</select></label><label className="space-y-2"><span className="text-sm font-black">Quantidade</span><input type="number" step="0.001" className="ordr-input" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} /></label><label className="space-y-2 md:col-span-2"><span className="text-sm font-black">Preço unitário</span><input type="number" step="0.01" className="ordr-input" value={form.unitPrice} onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))} /></label></div><div className="grid gap-3 md:grid-cols-2"><label className="flex items-center justify-between rounded-2xl border p-4"><span className="font-black">Produto ativo</span><input type="checkbox" checked={form.active !== false} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="size-5 accent-emerald-500" /></label><label className="flex items-center justify-between rounded-2xl border p-4"><span className="font-black">Controlar estoque</span><input type="checkbox" checked={Boolean(form.stockEnabled)} onChange={(e) => setForm((f) => ({ ...f, stockEnabled: e.target.checked }))} className="size-5 accent-emerald-500" /></label></div>{form.stockEnabled ? <div className="grid gap-4 md:grid-cols-2"><label className="space-y-2"><span className="text-sm font-black">Estoque atual</span><input type="number" step="0.001" className="ordr-input" value={form.stockQuantity ?? '0'} onChange={(e) => setForm((f) => ({ ...f, stockQuantity: e.target.value }))} /></label><label className="space-y-2"><span className="text-sm font-black">Estoque mínimo</span><input type="number" step="0.001" className="ordr-input" value={form.minStockQuantity ?? '0'} onChange={(e) => setForm((f) => ({ ...f, minStockQuantity: e.target.value }))} /></label></div> : null}<label className="space-y-2"><span className="text-sm font-black">Informações do item</span><textarea className="ordr-input min-h-24" value={form.notes ?? ''} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></label><Actions saving={saving} onCancel={onClose} /></form></Modal> }
function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) { return <div className="modal-backdrop"><div className="modal-card ordr-panel max-h-[92vh] overflow-y-auto p-5 md:p-6"><div className="mb-5 flex items-start justify-between gap-4"><div><span className="ordr-kicker"><Layers className="size-3.5" /> Gestão</span><h2 className="mt-3 text-2xl font-black tracking-tight">{title}</h2></div><button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-2xl border bg-background/70"><X className="size-4" /></button></div>{children}</div></div> }
function Actions({ saving, onCancel }: { saving: boolean; onCancel: () => void }) { return <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onCancel} className="ordr-button-soft">Cancelar</button><button className="ordr-button-primary" disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : null}Salvar</button></div> }
