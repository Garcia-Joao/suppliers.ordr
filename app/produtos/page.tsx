'use client'

import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Edit3, Filter, Package, PackagePlus, Plus, Power, RefreshCw, Search, SlidersHorizontal, Trash2, X } from 'lucide-react'
import { supplierApi, type SupplierProduct, type SupplierProductPayload } from '@/lib/api'

type ProductFilter = 'all' | 'active' | 'inactive' | 'low-stock'
type ProductModal = { mode: 'create' | 'edit'; product?: SupplierProduct }
type StockModal = { product: SupplierProduct; mode: 'set' | 'delta' }

type ProductForm = {
  name: string
  sku: string
  category: string
  unit: string
  quantity: string
  unitPrice: string
  notes: string
  active: boolean
  stockEnabled: boolean
  stockQuantity: string
  minStockQuantity: string
}

type StockForm = { delta: string; stockQuantity: string; minStockQuantity: string }

const units = ['unit', 'kg', 'g', 'l', 'ml']
const emptyProductForm: ProductForm = { name: '', sku: '', category: '', unit: 'unit', quantity: '1', unitPrice: '', notes: '', active: true, stockEnabled: false, stockQuantity: '0', minStockQuantity: '0' }
const emptyStockForm: StockForm = { delta: '1', stockQuantity: '0', minStockQuantity: '0' }

function formatMoney(value: number | string | null | undefined) {
  return Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function asText(value: number | string | null | undefined, fallback = '') {
  if (value === null || typeof value === 'undefined') return fallback
  return String(value)
}

function buildPayload(form: ProductForm): SupplierProductPayload {
  return {
    name: form.name.trim(),
    sku: form.sku.trim() || null,
    category: form.category.trim() || null,
    unit: form.unit,
    quantity: form.quantity || '1',
    unitPrice: form.unitPrice || '0',
    notes: form.notes.trim() || null,
    active: form.active,
    stockEnabled: form.stockEnabled,
    stockQuantity: form.stockQuantity || '0',
    minStockQuantity: form.minStockQuantity || '0',
  }
}

export default function ProdutosPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<ProductFilter>('all')
  const [products, setProducts] = useState<SupplierProduct[]>([])
  const [productModal, setProductModal] = useState<ProductModal | null>(null)
  const [stockModal, setStockModal] = useState<StockModal | null>(null)
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm)
  const [stockForm, setStockForm] = useState<StockForm>(emptyStockForm)

  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter((product) => product.active !== false).length,
    inactive: products.filter((product) => product.active === false).length,
    lowStock: products.filter((product) => product.lowStock).length,
    withStock: products.filter((product) => product.stockEnabled).length,
  }), [products])

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase()
    return products.filter((product) => {
      const matchesSearch = !term || product.name.toLowerCase().includes(term) || product.sku?.toLowerCase().includes(term) || product.category?.toLowerCase().includes(term)
      if (!matchesSearch) return false
      if (filter === 'active') return product.active !== false
      if (filter === 'inactive') return product.active === false
      if (filter === 'low-stock') return Boolean(product.lowStock)
      return true
    })
  }, [filter, products, search])

  useEffect(() => { loadProducts() }, [])

  async function loadProducts() {
    setLoading(true)
    setError('')
    try {
      const result = await supplierApi.products()
      setProducts(result.products)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar produtos.')
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setProductForm(emptyProductForm)
    setProductModal({ mode: 'create' })
  }

  function openEditModal(product: SupplierProduct) {
    setProductForm({
      name: product.name || product.itemName || '',
      sku: product.sku || '',
      category: product.category || '',
      unit: product.unit || 'unit',
      quantity: asText(product.quantity, '1'),
      unitPrice: asText(product.unitPrice || product.price, ''),
      notes: product.notes || '',
      active: product.active !== false,
      stockEnabled: Boolean(product.stockEnabled),
      stockQuantity: asText(product.stockQuantity, '0'),
      minStockQuantity: asText(product.minStockQuantity, '0'),
    })
    setProductModal({ mode: 'edit', product })
  }

  function openStockModal(product: SupplierProduct, mode: 'set' | 'delta' = 'delta') {
    setStockForm({ delta: '1', stockQuantity: asText(product.stockQuantity, '0'), minStockQuantity: asText(product.minStockQuantity, '0') })
    setStockModal({ product, mode })
  }

  async function submitProduct(event: FormEvent) {
    event.preventDefault()
    const currentModal = productModal
    if (!currentModal) return
    if (!productForm.name.trim()) return setError('Informe o nome do produto.')

    setSaving(true)
    setError('')
    try {
      const payload = buildPayload(productForm)
      const result = currentModal.mode === 'create'
        ? await supplierApi.createProduct(payload)
        : await supplierApi.updateProduct(currentModal.product?.id || '', payload)
      setProducts(result.products)
      setProductModal(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar produto.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleProduct(product: SupplierProduct) {
    setSaving(true)
    setError('')
    try {
      const result = await supplierApi.updateProduct(product.id, { active: product.active === false })
      setProducts(result.products)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar status do produto.')
    } finally {
      setSaving(false)
    }
  }

  async function removeProduct(product: SupplierProduct) {
    if (!window.confirm(`Remover "${product.name}"?`)) return
    setSaving(true)
    setError('')
    try {
      const result = await supplierApi.deleteProduct(product.id)
      setProducts(result.products)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover produto.')
    } finally {
      setSaving(false)
    }
  }

  async function quickAdjustStock(product: SupplierProduct, delta: number) {
    setSaving(true)
    setError('')
    try {
      const result = await supplierApi.adjustProductStock(product.id, { mode: 'delta', delta })
      setProducts(result.products)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao ajustar estoque.')
    } finally {
      setSaving(false)
    }
  }

  async function submitStock(event: FormEvent) {
    event.preventDefault()
    const currentModal = stockModal
    if (!currentModal) return
    setSaving(true)
    setError('')
    try {
      const result = await supplierApi.adjustProductStock(currentModal.product.id, {
        mode: currentModal.mode,
        delta: currentModal.mode === 'delta' ? stockForm.delta : undefined,
        stockQuantity: currentModal.mode === 'set' ? stockForm.stockQuantity : undefined,
        minStockQuantity: stockForm.minStockQuantity,
      })
      setProducts(result.products)
      setStockModal(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao ajustar estoque.')
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
              <p className="supplier-chip supplier-chip-primary"><Package size={14} /> Catálogo</p>
              <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">Produtos</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[var(--supplier-muted)]">Cadastre produtos livremente. Depois escolha quais entram em cada tabela de preço.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={loadProducts} disabled={loading || saving} className="supplier-button"><RefreshCw size={17} className={loading ? 'animate-spin' : ''} />Atualizar</button>
              <button type="button" onClick={openCreateModal} className="supplier-button-primary"><PackagePlus size={18} />Novo produto</button>
            </div>
          </div>
          <div className="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Total" value={stats.total} />
            <StatCard label="Ativos" value={stats.active} />
            <StatCard label="Inativos" value={stats.inactive} />
            <StatCard label="Estoque baixo" value={stats.lowStock} danger={stats.lowStock > 0} />
            <StatCard label="Com estoque" value={stats.withStock} />
          </div>
        </div>
      </section>

      {error ? <div className="rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm font-black text-red-600 dark:text-red-200">{error}</div> : null}

      <section className="supplier-card-flat rounded-[1.5rem] p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <label className="flex items-center gap-3 rounded-2xl border border-[var(--supplier-border)] bg-[var(--supplier-card-muted)] px-4 py-3">
            <Search size={18} className="text-[var(--supplier-muted)]" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, SKU ou categoria..." className="w-full bg-transparent text-sm font-bold outline-none placeholder:text-[var(--supplier-muted-2)]" />
          </label>
          <div className="flex flex-wrap gap-2">
            <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>Todos</FilterButton>
            <FilterButton active={filter === 'active'} onClick={() => setFilter('active')}>Ativos</FilterButton>
            <FilterButton active={filter === 'inactive'} onClick={() => setFilter('inactive')}>Inativos</FilterButton>
            <FilterButton active={filter === 'low-stock'} onClick={() => setFilter('low-stock')}>Estoque baixo</FilterButton>
          </div>
        </div>
      </section>

      {loading ? <div className="grid gap-4 xl:grid-cols-2">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-48 animate-pulse rounded-[1.5rem] border border-[var(--supplier-border)] bg-[var(--supplier-card-muted)]" />)}</div> : null}
      {!loading && filteredProducts.length === 0 ? <EmptyProducts onCreate={openCreateModal} /> : null}
      {!loading && filteredProducts.length > 0 ? <section className="grid gap-4 xl:grid-cols-2">{filteredProducts.map((product) => <ProductCard key={product.id} product={product} saving={saving} onToggle={() => toggleProduct(product)} onEdit={() => openEditModal(product)} onRemove={() => removeProduct(product)} onStock={() => openStockModal(product, 'set')} onIncrement={() => quickAdjustStock(product, 1)} onDecrement={() => quickAdjustStock(product, -1)} />)}</section> : null}

      {productModal ? <ProductModal title={productModal.mode === 'create' ? 'Cadastrar produto' : 'Editar produto'} form={productForm} setForm={setProductForm} saving={saving} onClose={() => setProductModal(null)} onSubmit={submitProduct} /> : null}
      {stockModal ? <StockModalView modal={stockModal} form={stockForm} setForm={setStockForm} saving={saving} onClose={() => setStockModal(null)} onSubmit={submitStock} setModal={setStockModal} /> : null}
    </div>
  )
}

function ProductCard({ product, saving, onToggle, onEdit, onRemove, onStock, onIncrement, onDecrement }: { product: SupplierProduct; saving: boolean; onToggle: () => void; onEdit: () => void; onRemove: () => void; onStock: () => void; onIncrement: () => void; onDecrement: () => void }) {
  const isActive = product.active !== false
  return <article className="supplier-card-flat rounded-[1.5rem] p-5 transition hover:border-emerald-300">
    <div className="flex gap-4"><div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${isActive ? 'bg-emerald-500/10 text-[var(--supplier-primary-strong)] dark:text-[var(--supplier-primary)]' : 'bg-[var(--supplier-card-muted)] text-[var(--supplier-muted)]'}`}><Package size={22} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><StatusBadge active={isActive} />{product.lowStock ? <LowStockBadge /> : null}</div><h2 className="mt-2 line-clamp-2 text-lg font-black">{product.name}</h2><p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-[var(--supplier-muted)]">{product.category || 'Sem categoria'}</p></div><button type="button" onClick={onToggle} disabled={saving} className={isActive ? 'supplier-button' : 'supplier-button-primary'}><Power size={17} /></button></div>
    <div className="mt-5 grid gap-3 sm:grid-cols-4"><InfoBox label="Preço base" value={formatMoney(product.unitPrice || product.price)} /><InfoBox label="Qtd." value={`${product.quantity || 1} ${product.unit || 'unit'}`} /><InfoBox label="SKU" value={product.sku || '—'} /><InfoBox label="Status" value={isActive ? 'Ativo' : 'Inativo'} /></div>
    <div className="mt-4 rounded-2xl border border-[var(--supplier-border)] bg-[var(--supplier-card-muted)] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--supplier-muted)]">Estoque</p><p className="mt-1 text-sm font-black">{product.stockEnabled ? `${Number(product.stockQuantity || 0).toLocaleString('pt-BR')} em estoque` : 'Não controlado'}</p>{product.stockEnabled ? <p className="mt-1 text-xs font-bold text-[var(--supplier-muted)]">Mínimo: {Number(product.minStockQuantity || 0).toLocaleString('pt-BR')}</p> : null}</div>{product.stockEnabled ? <div className="flex gap-2"><button type="button" onClick={onDecrement} disabled={saving} className="stock-mini-button">-</button><button type="button" onClick={onIncrement} disabled={saving} className="stock-mini-button">+</button></div> : null}</div></div>
    <div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={onEdit} className="supplier-button flex-1"><Edit3 size={16} />Editar</button><button type="button" onClick={onStock} className="supplier-button flex-1"><SlidersHorizontal size={16} />Estoque</button><button type="button" onClick={onRemove} disabled={saving} className="supplier-button-danger"><Trash2 size={16} /></button></div>
  </article>
}

function ProductModal({ title, form, setForm, saving, onClose, onSubmit }: { title: string; form: ProductForm; setForm: React.Dispatch<React.SetStateAction<ProductForm>>; saving: boolean; onClose: () => void; onSubmit: (event: FormEvent) => void }) { return <Modal title={title} onClose={onClose}><form onSubmit={onSubmit} className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><Field label="Nome do produto"><input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="supplier-field" /></Field><Field label="SKU"><input value={form.sku} onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))} className="supplier-field" /></Field><Field label="Categoria"><input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="supplier-field" /></Field><Field label="Unidade"><select value={form.unit} onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))} className="supplier-field">{units.map((unit) => <option key={unit} value={unit}>{unit}</option>)}</select></Field><Field label="Quantidade"><input type="number" step="0.001" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} className="supplier-field" /></Field><Field label="Preço base"><input type="number" step="0.01" value={form.unitPrice} onChange={(event) => setForm((current) => ({ ...current, unitPrice: event.target.value }))} className="supplier-field" /></Field><Field label="Status"><select value={form.active ? 'active' : 'inactive'} onChange={(event) => setForm((current) => ({ ...current, active: event.target.value === 'active' }))} className="supplier-field"><option value="active">Ativo</option><option value="inactive">Inativo</option></select></Field></div><label className="flex items-center justify-between rounded-2xl border border-[var(--supplier-border)] bg-[var(--supplier-card-muted)] p-4"><div><p className="font-black">Controlar estoque</p><p className="text-xs font-semibold text-[var(--supplier-muted)]">Acompanhe estoque atual e mínimo.</p></div><input type="checkbox" checked={form.stockEnabled} onChange={(event) => setForm((current) => ({ ...current, stockEnabled: event.target.checked }))} className="h-5 w-5 accent-emerald-500" /></label>{form.stockEnabled ? <div className="grid gap-4 md:grid-cols-2"><Field label="Estoque atual"><input type="number" step="0.001" value={form.stockQuantity} onChange={(event) => setForm((current) => ({ ...current, stockQuantity: event.target.value }))} className="supplier-field" /></Field><Field label="Estoque mínimo"><input type="number" step="0.001" value={form.minStockQuantity} onChange={(event) => setForm((current) => ({ ...current, minStockQuantity: event.target.value }))} className="supplier-field" /></Field></div> : null}<Field label="Informações"><textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className="supplier-field min-h-24 resize-none" /></Field><div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="supplier-button">Cancelar</button><button type="submit" disabled={saving} className="supplier-button-primary">{saving ? 'Salvando...' : 'Salvar produto'}</button></div></form></Modal> }
function StockModalView({ modal, form, setForm, saving, onClose, onSubmit, setModal }: { modal: StockModal; form: StockForm; setForm: React.Dispatch<React.SetStateAction<StockForm>>; saving: boolean; onClose: () => void; onSubmit: (event: FormEvent) => void; setModal: React.Dispatch<React.SetStateAction<StockModal | null>> }) { return <Modal title="Ajustar estoque" onClose={onClose}><form onSubmit={onSubmit} className="space-y-4"><div className="rounded-2xl border border-[var(--supplier-border)] bg-[var(--supplier-card-muted)] p-4"><p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--supplier-muted)]">Produto</p><h3 className="mt-2 text-xl font-black">{modal.product.name}</h3><p className="mt-1 text-sm font-semibold text-[var(--supplier-muted)]">Estoque atual: {Number(modal.product.stockQuantity || 0).toLocaleString('pt-BR')}</p></div><div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setModal((current) => current ? { ...current, mode: 'delta' } : current)} className={modal.mode === 'delta' ? 'supplier-button-primary' : 'supplier-button'}>Somar / remover</button><button type="button" onClick={() => setModal((current) => current ? { ...current, mode: 'set' } : current)} className={modal.mode === 'set' ? 'supplier-button-primary' : 'supplier-button'}>Definir valor</button></div>{modal.mode === 'delta' ? <Field label="Ajuste"><input type="number" step="0.001" value={form.delta} onChange={(event) => setForm((current) => ({ ...current, delta: event.target.value }))} className="supplier-field" placeholder="Ex: 10 ou -5" /></Field> : <Field label="Novo estoque"><input type="number" step="0.001" value={form.stockQuantity} onChange={(event) => setForm((current) => ({ ...current, stockQuantity: event.target.value }))} className="supplier-field" /></Field>}<Field label="Estoque mínimo"><input type="number" step="0.001" value={form.minStockQuantity} onChange={(event) => setForm((current) => ({ ...current, minStockQuantity: event.target.value }))} className="supplier-field" /></Field><div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="supplier-button">Cancelar</button><button type="submit" disabled={saving} className="supplier-button-primary">{saving ? 'Ajustando...' : 'Salvar estoque'}</button></div></form></Modal> }
function EmptyProducts({ onCreate }: { onCreate: () => void }) { return <section className="supplier-card-flat rounded-[2rem] p-10 text-center"><PackagePlus className="mx-auto text-[var(--supplier-primary)]" size={34} /><h2 className="mt-4 text-xl font-black">Nenhum produto encontrado</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--supplier-muted)]">Cadastre um produto para usá-lo nas tabelas de preço.</p><button type="button" onClick={onCreate} className="supplier-button-primary mt-5"><Plus size={18} />Cadastrar produto</button></section> }
function StatCard({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) { return <div className={`rounded-2xl border p-4 ${danger ? 'border-amber-300/70 bg-amber-500/10 text-amber-700 dark:text-amber-100' : 'border-[var(--supplier-border)] bg-[var(--supplier-card-muted)]'}`}><p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--supplier-muted)]">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div> }
function InfoBox({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-[var(--supplier-border)] bg-[var(--supplier-card-muted)] px-3 py-3"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--supplier-muted)]">{label}</p><p className="mt-1 truncate text-sm font-black">{value}</p></div> }
function StatusBadge({ active }: { active: boolean }) { return <span className={active ? 'supplier-chip supplier-chip-primary' : 'supplier-chip'}>{active ? 'Ativo' : 'Inativo'}</span> }
function LowStockBadge() { return <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-amber-700 dark:text-amber-200"><AlertTriangle size={12} className="inline" /> Estoque baixo</span> }
function FilterButton({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) { return <button type="button" onClick={onClick} className={active ? 'supplier-button-primary' : 'supplier-button'}><Filter size={15} />{children}</button> }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-[var(--supplier-muted)]">{label}</span>{children}</label> }
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xl"><div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-[var(--supplier-border)] bg-[var(--supplier-card-solid)] p-5 text-[var(--supplier-text)] shadow-2xl lg:p-6"><div className="mb-5 flex items-center justify-between gap-4"><h2 className="text-2xl font-black">{title}</h2><button type="button" onClick={onClose} className="supplier-button"><X size={20} /></button></div>{children}</div></div> }
