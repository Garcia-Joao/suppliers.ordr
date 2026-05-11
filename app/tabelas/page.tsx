'use client'

import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Copy, Edit3, Loader2, PackagePlus, Plus, Power, RefreshCw, Search, Table2, Trash2, X } from 'lucide-react'
import { supplierApi, type PriceTablePayload, type SupplierPriceTable, type SupplierProduct, type SupplierTableItem } from '@/lib/api'

type TableModal = { mode: 'create' | 'edit'; table?: SupplierPriceTable }
type DuplicateModal = { table: SupplierPriceTable }
type AddProductsModal = { table: SupplierPriceTable }

const emptyForm = { name: '', description: '', active: true, validFrom: '', validUntil: '', includeAllProducts: false, priceAdjustmentPercent: '0' }

function money(value: number | string | null | undefined) {
  return Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function TabelasPage() {
  const [tables, setTables] = useState<SupplierPriceTable[]>([])
  const [products, setProducts] = useState<SupplierProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [tableModal, setTableModal] = useState<TableModal | null>(null)
  const [duplicateModal, setDuplicateModal] = useState<DuplicateModal | null>(null)
  const [addProductsModal, setAddProductsModal] = useState<AddProductsModal | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [duplicateForm, setDuplicateForm] = useState({ name: '', priceAdjustmentPercent: '0' })
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [productAdjustment, setProductAdjustment] = useState('0')

  const filteredTables = useMemo(() => {
    const term = search.trim().toLowerCase()
    return tables.filter((table) => !term || table.name.toLowerCase().includes(term) || table.description?.toLowerCase().includes(term) || table.items.some((item) => item.name.toLowerCase().includes(term)))
  }, [search, tables])

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [tablesResult, productsResult] = await Promise.all([supplierApi.priceTables(), supplierApi.products()])
      setTables(tablesResult.tables)
      setProducts(productsResult.products)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar tabelas.')
    } finally {
      setLoading(false)
    }
  }

  function openCreate() { setForm(emptyForm); setTableModal({ mode: 'create' }) }
  function openEdit(table: SupplierPriceTable) {
    setForm({ name: table.name, description: table.description || '', active: table.active, validFrom: table.validFrom || '', validUntil: table.validUntil || '', includeAllProducts: false, priceAdjustmentPercent: '0' })
    setTableModal({ mode: 'edit', table })
  }
  function openDuplicate(table: SupplierPriceTable) { setDuplicateForm({ name: `${table.name} - cópia`, priceAdjustmentPercent: '0' }); setDuplicateModal({ table }) }
  function openAddProducts(table: SupplierPriceTable) {
    const alreadyInTable = new Set(table.items.map((item) => item.supplierProductId).filter(Boolean))
    setSelectedProductIds(products.filter((product) => product.active !== false && !alreadyInTable.has(product.id)).map((product) => product.id))
    setProductAdjustment('0')
    setAddProductsModal({ table })
  }

  async function submitTable(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    const payload: PriceTablePayload = { name: form.name.trim(), description: form.description.trim() || null, active: form.active, validFrom: form.validFrom || null, validUntil: form.validUntil || null, includeAllProducts: form.includeAllProducts, priceAdjustmentPercent: form.priceAdjustmentPercent }
    try {
      const result = tableModal?.mode === 'edit' && tableModal.table ? await supplierApi.updatePriceTable(tableModal.table.id, payload) : await supplierApi.createPriceTable(payload)
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

  async function submitDuplicate(event: FormEvent) {
    event.preventDefault()
    if (!duplicateModal) return
    setSaving(true)
    setError('')
    try {
      const result = await supplierApi.duplicatePriceTable(duplicateModal.table.id, { name: duplicateForm.name, priceAdjustmentPercent: duplicateForm.priceAdjustmentPercent, active: false })
      setTables(result.tables)
      setDuplicateModal(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao duplicar tabela.')
    } finally {
      setSaving(false)
    }
  }

  async function submitAddProducts(event: FormEvent) {
    event.preventDefault()
    if (!addProductsModal) return
    setSaving(true)
    setError('')
    try {
      let latestTables = tables
      for (const productId of selectedProductIds) {
        const result = await supplierApi.createPriceTableItemFromExisting(addProductsModal.table.id, { productId, priceAdjustmentPercent: productAdjustment })
        latestTables = result.tables
      }
      setTables(latestTables)
      setAddProductsModal(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar produtos na tabela.')
    } finally {
      setSaving(false)
    }
  }

  async function removeItem(table: SupplierPriceTable, item: SupplierTableItem) {
    if (!window.confirm(`Remover "${item.name}" da tabela?`)) return
    setSaving(true)
    setError('')
    try {
      const result = await supplierApi.deletePriceTableItem(table.id, item.id)
      setTables(result.tables)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover item da tabela.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleItem(table: SupplierPriceTable, item: SupplierTableItem) {
    setSaving(true)
    setError('')
    try {
      const result = await supplierApi.updatePriceTableItem(table.id, item.id, { active: item.active === false })
      setTables(result.tables)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar item.')
    } finally {
      setSaving(false)
    }
  }

  return <div className="supplier-page space-y-6">
    <section className="supplier-card overflow-hidden rounded-[2rem]"><div className="relative p-5 md:p-8"><div className="pointer-events-none absolute right-0 top-0 h-52 w-52 rounded-full bg-emerald-300/20 blur-3xl" /><div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between"><div><p className="supplier-chip supplier-chip-primary"><Table2 size={14} /> Tabelas de preço</p><h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">Tabelas</h1><p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[var(--supplier-muted)]">Crie tabelas em branco ou já com todos os produtos cadastrados. Depois ajuste produtos e preços por tabela.</p></div><div className="flex flex-wrap gap-3"><button type="button" onClick={loadData} className="supplier-button"><RefreshCw size={17} />Atualizar</button><button type="button" onClick={openCreate} className="supplier-button-primary"><Plus size={17} />Nova tabela</button></div></div></div></section>
    {error ? <div className="rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm font-black text-red-600 dark:text-red-200">{error}</div> : null}
    <section className="supplier-card-flat rounded-[1.5rem] p-4"><label className="flex items-center gap-3 rounded-2xl border border-[var(--supplier-border)] bg-[var(--supplier-card-muted)] px-4 py-3"><Search size={18} className="text-[var(--supplier-muted)]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar tabela ou produto dentro da tabela..." className="w-full bg-transparent text-sm font-bold outline-none placeholder:text-[var(--supplier-muted-2)]" /></label></section>
    {loading ? <div className="grid gap-4 xl:grid-cols-2">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-56 animate-pulse rounded-[2rem] border border-[var(--supplier-border)] bg-[var(--supplier-card-muted)]" />)}</div> : <section className="grid gap-4 xl:grid-cols-2">{filteredTables.map((table) => <TableCard key={table.id} table={table} saving={saving} onToggle={() => toggleTable(table)} onEdit={() => openEdit(table)} onDuplicate={() => openDuplicate(table)} onRemove={() => removeTable(table)} onAddProducts={() => openAddProducts(table)} onToggleItem={(item) => toggleItem(table, item)} onRemoveItem={(item) => removeItem(table, item)} />)}</section>}
    {tableModal ? <Modal title={tableModal.mode === 'create' ? 'Nova tabela' : 'Editar tabela'} onClose={() => setTableModal(null)}><form onSubmit={submitTable} className="space-y-4"><Field label="Nome"><input className="supplier-field" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></Field><Field label="Descrição"><textarea className="supplier-field min-h-24 resize-none" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></Field><div className="grid gap-4 md:grid-cols-2"><Field label="Válida de"><input type="date" className="supplier-field" value={form.validFrom} onChange={(event) => setForm((current) => ({ ...current, validFrom: event.target.value }))} /></Field><Field label="Válida até"><input type="date" className="supplier-field" value={form.validUntil} onChange={(event) => setForm((current) => ({ ...current, validUntil: event.target.value }))} /></Field></div>{tableModal.mode === 'create' ? <div className="rounded-2xl border border-[var(--supplier-border)] bg-[var(--supplier-card-muted)] p-4"><label className="flex items-center justify-between gap-4"><div><p className="font-black">Criar já com todos os produtos</p><p className="mt-1 text-xs font-semibold text-[var(--supplier-muted)]">Adiciona todos os produtos ativos do catálogo nessa tabela.</p></div><input type="checkbox" checked={form.includeAllProducts} onChange={(event) => setForm((current) => ({ ...current, includeAllProducts: event.target.checked }))} className="h-5 w-5 accent-emerald-500" /></label>{form.includeAllProducts ? <Field label="Ajuste percentual dos preços"><input type="number" step="0.01" className="supplier-field mt-3" value={form.priceAdjustmentPercent} onChange={(event) => setForm((current) => ({ ...current, priceAdjustmentPercent: event.target.value }))} placeholder="Ex: -20 ou 10" /></Field> : null}</div> : null}<label className="flex items-center justify-between rounded-2xl border border-[var(--supplier-border)] bg-[var(--supplier-card-muted)] p-4"><span className="font-black">Tabela ativa</span><input type="checkbox" checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} className="h-5 w-5 accent-emerald-500" /></label><div className="flex justify-end gap-3"><button type="button" onClick={() => setTableModal(null)} className="supplier-button">Cancelar</button><button type="submit" disabled={saving} className="supplier-button-primary">{saving ? 'Salvando...' : 'Salvar'}</button></div></form></Modal> : null}
    {duplicateModal ? <Modal title="Duplicar tabela" onClose={() => setDuplicateModal(null)}><form onSubmit={submitDuplicate} className="space-y-4"><Field label="Nome da nova tabela"><input className="supplier-field" value={duplicateForm.name} onChange={(event) => setDuplicateForm((current) => ({ ...current, name: event.target.value }))} /></Field><Field label="Ajuste percentual dos preços"><input type="number" step="0.01" className="supplier-field" value={duplicateForm.priceAdjustmentPercent} onChange={(event) => setDuplicateForm((current) => ({ ...current, priceAdjustmentPercent: event.target.value }))} placeholder="Ex: -20 ou 15" /></Field><p className="text-sm font-semibold text-[var(--supplier-muted)]">Use valores negativos para desconto, como -20%, ou positivos para acréscimo.</p><div className="flex justify-end gap-3"><button type="button" onClick={() => setDuplicateModal(null)} className="supplier-button">Cancelar</button><button type="submit" disabled={saving} className="supplier-button-primary">{saving ? 'Duplicando...' : 'Duplicar'}</button></div></form></Modal> : null}
    {addProductsModal ? <Modal title={`Adicionar produtos em ${addProductsModal.table.name}`} onClose={() => setAddProductsModal(null)}><form onSubmit={submitAddProducts} className="space-y-4"><Field label="Ajuste percentual dos preços"><input type="number" step="0.01" className="supplier-field" value={productAdjustment} onChange={(event) => setProductAdjustment(event.target.value)} placeholder="Ex: -20 ou 10" /></Field><div className="max-h-[420px] space-y-2 overflow-y-auto pr-1 supplier-scrollbar">{products.map((product) => { const selected = selectedProductIds.includes(product.id); return <button key={product.id} type="button" onClick={() => setSelectedProductIds((current) => selected ? current.filter((id) => id !== product.id) : [...current, product.id])} className={`w-full rounded-2xl border p-4 text-left transition ${selected ? 'border-emerald-300 bg-emerald-500/10' : 'border-[var(--supplier-border)] bg-[var(--supplier-card-muted)]'}`}><div className="flex items-center justify-between gap-3"><div><p className="font-black">{product.name}</p><p className="mt-1 text-xs font-semibold text-[var(--supplier-muted)]">{product.sku || 'Sem SKU'} · {product.category || 'Sem categoria'} · {money(product.unitPrice)}</p></div><span className={selected ? 'supplier-chip supplier-chip-primary' : 'supplier-chip'}>{selected ? 'Selecionado' : 'Adicionar'}</span></div></button> })}</div><div className="flex justify-end gap-3"><button type="button" onClick={() => setAddProductsModal(null)} className="supplier-button">Cancelar</button><button type="submit" disabled={saving || selectedProductIds.length === 0} className="supplier-button-primary">{saving ? 'Adicionando...' : `Adicionar ${selectedProductIds.length} produto(s)`}</button></div></form></Modal> : null}
  </div>
}

function TableCard({ table, saving, onToggle, onEdit, onDuplicate, onRemove, onAddProducts, onToggleItem, onRemoveItem }: { table: SupplierPriceTable; saving: boolean; onToggle: () => void; onEdit: () => void; onDuplicate: () => void; onRemove: () => void; onAddProducts: () => void; onToggleItem: (item: SupplierTableItem) => void; onRemoveItem: (item: SupplierTableItem) => void }) { return <article className="supplier-card-flat rounded-[2rem] p-5"><div className="flex items-start justify-between gap-4"><div><span className={table.active ? 'supplier-chip supplier-chip-primary' : 'supplier-chip'}>{table.active ? 'Ativa' : 'Pausada'}</span><h2 className="mt-3 text-2xl font-black">{table.name}</h2><p className="mt-2 text-sm font-semibold text-[var(--supplier-muted)]">{table.description || 'Sem descrição'}</p></div><button type="button" onClick={onToggle} disabled={saving} className={table.active ? 'supplier-button' : 'supplier-button-primary'}><Power size={17} />{table.active ? 'Pausar' : 'Ativar'}</button></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><Info label="Itens" value={String(table.itemCount ?? table.items?.length ?? 0)} /><Info label="Preço médio" value={money(table.averagePrice || 0)} /><Info label="Atualizada" value={new Date(table.updatedAt).toLocaleDateString('pt-BR')} /></div><div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={onAddProducts} className="supplier-button-primary flex-1"><PackagePlus size={16} />Produtos</button><button type="button" onClick={onEdit} className="supplier-button flex-1"><Edit3 size={16} />Editar</button><button type="button" onClick={onDuplicate} className="supplier-button flex-1"><Copy size={16} />Duplicar</button><button type="button" onClick={onRemove} className="supplier-button-danger"><Trash2 size={16} /></button></div><div className="mt-5 space-y-2"><p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--supplier-muted)]">Produtos da tabela</p>{table.items.length === 0 ? <p className="rounded-2xl border border-dashed border-[var(--supplier-border)] p-4 text-sm font-semibold text-[var(--supplier-muted)]">Tabela vazia. Clique em Produtos para adicionar itens.</p> : table.items.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--supplier-border)] bg-[var(--supplier-card-muted)] px-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-black">{item.name}</p><p className="text-xs font-semibold text-[var(--supplier-muted)]">{item.sku || 'Sem SKU'} · {money(item.unitPrice)}</p></div><div className="flex shrink-0 gap-2"><button type="button" onClick={() => onToggleItem(item)} className={item.active === false ? 'supplier-button-primary px-3 py-2' : 'supplier-button px-3 py-2'}>{item.active === false ? 'Ativar' : 'Pausar'}</button><button type="button" onClick={() => onRemoveItem(item)} className="supplier-button-danger px-3 py-2"><Trash2 size={14} /></button></div></div>)}</div></article> }
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-[var(--supplier-border)] bg-[var(--supplier-card-muted)] p-4"><p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--supplier-muted)]">{label}</p><p className="mt-2 text-lg font-black">{value}</p></div> }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-[var(--supplier-muted)]">{label}</span>{children}</label> }
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xl"><div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-[var(--supplier-border)] bg-[var(--supplier-card-solid)] p-5 text-[var(--supplier-text)] shadow-2xl"><div className="mb-5 flex items-center justify-between gap-4"><h2 className="text-2xl font-black">{title}</h2><button type="button" onClick={onClose} className="supplier-button"><X size={18} /></button></div>{children}</div></div> }
