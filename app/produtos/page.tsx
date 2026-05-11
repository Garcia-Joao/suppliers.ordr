'use client'

import type { FormEvent, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Edit3,
  Filter,
  Package,
  PackagePlus,
  Plus,
  Power,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react'
import {
  supplierApi,
  type PriceTableItemPayload,
  type SupplierPriceTable,
  type SupplierProduct,
} from '@/lib/api'

type ProductFilter = 'all' | 'active' | 'inactive' | 'low-stock'
type ProductModalState = { mode: 'create' | 'edit'; product?: SupplierProduct }
type StockModalState = { product: SupplierProduct; mode: 'set' | 'delta' }

type ProductForm = {
  tableId: string
  itemName: string
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

type StockForm = {
  delta: string
  stockQuantity: string
  minStockQuantity: string
}

const units = ['un.', 'cx', 'pct', 'kg', 'g', 'l', 'ml']

const emptyProductForm: ProductForm = {
  tableId: '',
  itemName: '',
  sku: '',
  category: '',
  unit: 'un.',
  quantity: '1',
  unitPrice: '',
  notes: '',
  active: true,
  stockEnabled: false,
  stockQuantity: '0',
  minStockQuantity: '0',
}

const emptyStockForm: StockForm = {
  delta: '1',
  stockQuantity: '0',
  minStockQuantity: '0',
}

function formatMoney(value: number | string | null | undefined) {
  return Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function asText(value: number | string | null | undefined, fallback = '') {
  if (value === null || typeof value === 'undefined') return fallback
  return String(value)
}

function productsFromTables(tables: SupplierPriceTable[]) {
  return tables.flatMap((table) =>
    table.items.map((item) => ({
      ...item,
      tableId: item.tableId || table.id,
      tableName: item.tableName || table.name,
      tableActive: typeof item.tableActive === 'boolean' ? item.tableActive : table.active,
    }))
  )
}

function buildPayload(form: ProductForm): PriceTableItemPayload {
  return {
    itemName: form.itemName.trim(),
    sku: form.sku.trim() || null,
    category: form.category.trim() || null,
    unit: form.unit.trim() || 'un.',
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
  const [tables, setTables] = useState<SupplierPriceTable[]>([])
  const [products, setProducts] = useState<SupplierProduct[]>([])
  const [productModal, setProductModal] = useState<ProductModalState | null>(null)
  const [stockModal, setStockModal] = useState<StockModalState | null>(null)
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
      const matchesSearch =
        !term ||
        product.itemName.toLowerCase().includes(term) ||
        product.name?.toLowerCase().includes(term) ||
        product.sku?.toLowerCase().includes(term) ||
        product.category?.toLowerCase().includes(term) ||
        product.tableName?.toLowerCase().includes(term)

      if (!matchesSearch) return false
      if (filter === 'active') return product.active !== false
      if (filter === 'inactive') return product.active === false
      if (filter === 'low-stock') return Boolean(product.lowStock)
      return true
    })
  }, [filter, products, search])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [productsResult, tablesResult] = await Promise.all([supplierApi.products(), supplierApi.priceTables()])
      setProducts(productsResult.products)
      setTables(tablesResult.tables)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar produtos.')
    } finally {
      setLoading(false)
    }
  }

  function syncTables(updatedTables: SupplierPriceTable[]) {
    setTables(updatedTables)
    setProducts(productsFromTables(updatedTables))
  }

  function openCreateModal() {
    setProductForm({ ...emptyProductForm, tableId: tables.find((table) => table.active)?.id || tables[0]?.id || '' })
    setProductModal({ mode: 'create' })
  }

  function openEditModal(product: SupplierProduct) {
    setProductForm({
      tableId: product.tableId || '',
      itemName: product.itemName || product.name || '',
      sku: product.sku || '',
      category: product.category || '',
      unit: product.unit || 'un.',
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
    if (!productForm.tableId) return setError('Crie ou selecione uma tabela de preço antes de cadastrar produtos.')
    if (!productForm.itemName.trim()) return setError('Informe o nome do produto.')

    setSaving(true)
    setError('')
    try {
      const payload = buildPayload(productForm)
      const result = currentModal.mode === 'create'
        ? await supplierApi.createPriceTableItem(productForm.tableId, payload)
        : await supplierApi.updatePriceTableItem(currentModal.product?.tableId || productForm.tableId, currentModal.product?.id || '', payload)

      syncTables(result.tables)
      setProductModal(null)
      setProductForm(emptyProductForm)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar produto.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleProduct(product: SupplierProduct) {
    if (!product.tableId) return
    setSaving(true)
    setError('')
    try {
      const result = await supplierApi.updatePriceTableItem(product.tableId, product.id, { active: product.active === false })
      syncTables(result.tables)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar status do produto.')
    } finally {
      setSaving(false)
    }
  }

  async function removeProduct(product: SupplierProduct) {
    if (!product.tableId || !window.confirm(`Remover "${product.itemName || product.name}"?`)) return
    setSaving(true)
    setError('')
    try {
      const result = await supplierApi.deletePriceTableItem(product.tableId, product.id)
      syncTables(result.tables)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover produto.')
    } finally {
      setSaving(false)
    }
  }

  async function quickAdjustStock(product: SupplierProduct, delta: number) {
    if (!product.tableId) return
    setSaving(true)
    setError('')
    try {
      const result = await supplierApi.adjustItemStock(product.tableId, product.id, { mode: 'delta', delta })
      syncTables(result.tables)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao ajustar estoque.')
    } finally {
      setSaving(false)
    }
  }

  async function submitStock(event: FormEvent) {
    event.preventDefault()
    const currentModal = stockModal
    if (!currentModal?.product.tableId) return
    setSaving(true)
    setError('')
    try {
      const result = await supplierApi.adjustItemStock(currentModal.product.tableId, currentModal.product.id, {
        mode: currentModal.mode,
        delta: currentModal.mode === 'delta' ? stockForm.delta : undefined,
        stockQuantity: currentModal.mode === 'set' ? stockForm.stockQuantity : undefined,
        minStockQuantity: stockForm.minStockQuantity,
      })
      syncTables(result.tables)
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
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[var(--supplier-muted)]">Gerencie itens vendidos, SKU, categorias, disponibilidade e estoque.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={loadData} disabled={loading || saving} className="supplier-button"><RefreshCw size={17} className={loading ? 'animate-spin' : ''} />Atualizar</button>
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
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, SKU, categoria ou tabela..." className="w-full bg-transparent text-sm font-bold outline-none placeholder:text-[var(--supplier-muted-2)]" />
          </label>
          <div className="flex flex-wrap gap-2">
            <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>Todos</FilterButton>
            <FilterButton active={filter === 'active'} onClick={() => setFilter('active')}>Ativos</FilterButton>
            <FilterButton active={filter === 'inactive'} onClick={() => setFilter('inactive')}>Inativos</FilterButton>
            <FilterButton active={filter === 'low-stock'} onClick={() => setFilter('low-stock')}>Estoque baixo</FilterButton>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="grid gap-4 xl:grid-cols-2">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-48 animate-pulse rounded-[1.5rem] border border-[var(--supplier-border)] bg-[var(--supplier-card-muted)]" />)}</div>
      ) : filteredProducts.length === 0 ? (
        <section className="supplier-card-flat rounded-[2rem] p-10 text-center">
          <PackagePlus className="mx-auto text-[var(--supplier-primary)]" size={34} />
          <h2 className="mt-4 text-xl font-black">Nenhum produto encontrado</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--supplier-muted)]">Cadastre um produto ou ajuste os filtros para visualizar seus itens.</p>
          <button type="button" onClick={openCreateModal} className="supplier-button-primary mt-5"><Plus size={18} />Cadastrar produto</button>
        </section>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {filteredProducts.map((product) => (
            <ProductCard key={`${product.tableId}-${product.id}`} product={product} saving={saving} onToggle={() => toggleProduct(product)} onEdit={() => openEditModal(product)} onRemove={() => removeProduct(product)} onStock={() => openStockModal(product, 'set')} onIncrement={() => quickAdjustStock(product, 1)} onDecrement={() => quickAdjustStock(product, -1)} />
          ))}
        </section>
      )}

      {productModal ? (
        <Modal title={productModal.mode === 'create' ? 'Cadastrar produto' : 'Editar produto'} onClose={() => setProductModal(null)}>
          <form onSubmit={submitProduct} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Tabela de preço"><select value={productForm.tableId} onChange={(event) => setProductForm((form) => ({ ...form, tableId: event.target.value }))} disabled={productModal.mode === 'edit'} className="supplier-field"><option value="">Selecione uma tabela</option>{tables.map((table) => <option key={table.id} value={table.id}>{table.name} {table.active ? '' : '(pausada)'}</option>)}</select></Field>
              <Field label="Nome do produto"><input value={productForm.itemName} onChange={(event) => setProductForm((form) => ({ ...form, itemName: event.target.value }))} className="supplier-field" /></Field>
              <Field label="SKU"><input value={productForm.sku} onChange={(event) => setProductForm((form) => ({ ...form, sku: event.target.value }))} className="supplier-field" /></Field>
              <Field label="Categoria"><input value={productForm.category} onChange={(event) => setProductForm((form) => ({ ...form, category: event.target.value }))} className="supplier-field" /></Field>
              <Field label="Unidade"><select value={productForm.unit} onChange={(event) => setProductForm((form) => ({ ...form, unit: event.target.value }))} className="supplier-field">{units.map((unit) => <option key={unit} value={unit}>{unit}</option>)}</select></Field>
              <Field label="Quantidade"><input type="number" step="0.001" value={productForm.quantity} onChange={(event) => setProductForm((form) => ({ ...form, quantity: event.target.value }))} className="supplier-field" /></Field>
              <Field label="Preço"><input type="number" step="0.01" value={productForm.unitPrice} onChange={(event) => setProductForm((form) => ({ ...form, unitPrice: event.target.value }))} className="supplier-field" /></Field>
              <Field label="Status"><select value={productForm.active ? 'active' : 'inactive'} onChange={(event) => setProductForm((form) => ({ ...form, active: event.target.value === 'active' }))} className="supplier-field"><option value="active">Ativo</option><option value="inactive">Inativo</option></select></Field>
            </div>

            <label className="flex items-center justify-between rounded-2xl border border-[var(--supplier-border)] bg-[var(--supplier-card-muted)] p-4">
              <div><p className="font-black">Controlar estoque</p><p className="text-xs font-semibold text-[var(--supplier-muted)]">Acompanhe estoque atual e mínimo.</p></div>
              <input type="checkbox" checked={productForm.stockEnabled} onChange={(event) => setProductForm((form) => ({ ...form, stockEnabled: event.target.checked }))} className="h-5 w-5 accent-emerald-500" />
            </label>

            {productForm.stockEnabled ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Estoque atual"><input type="number" step="0.001" value={productForm.stockQuantity} onChange={(event) => setProductForm((form) => ({ ...form, stockQuantity: event.target.value }))} className="supplier-field" /></Field>
                <Field label="Estoque mínimo"><input type="number" step="0.001" value={productForm.minStockQuantity} onChange={(event) => setProductForm((form) => ({ ...form, minStockQuantity: event.target.value }))} className="supplier-field" /></Field>
              </div>
            ) : null}

            <Field label="Informações"><textarea value={productForm.notes} onChange={(event) => setProductForm((form) => ({ ...form, notes: event.target.value }))} className="supplier-field min-h-24 resize-none" /></Field>

            <div className="flex justify-end gap-3"><button type="button" onClick={() => setProductModal(null)} className="supplier-button">Cancelar</button><button type="submit" disabled={saving} className="supplier-button-primary">{saving ? 'Salvando...' : 'Salvar produto'}</button></div>
          </form>
        </Modal>
      ) : null}

      {stockModal ? (
        <Modal title="Ajustar estoque" onClose={() => setStockModal(null)}>
          <form onSubmit={submitStock} className="space-y-4">
            <div className="rounded-2xl border border-[var(--supplier-border)] bg-[var(--supplier-card-muted)] p-4"><p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--supplier-muted)]">Produto</p><h3 className="mt-2 text-xl font-black">{stockModal.product.itemName || stockModal.product.name}</h3><p className="mt-1 text-sm font-semibold text-[var(--supplier-muted)]">Estoque atual: {Number(stockModal.product.stockQuantity || 0).toLocaleString('pt-BR')}</p></div>
            <div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setStockModal((modal) => (modal ? { ...modal, mode: 'delta' } : modal))} className={stockModal.mode === 'delta' ? 'supplier-button-primary' : 'supplier-button'}>Somar / remover</button><button type="button" onClick={() => setStockModal((modal) => (modal ? { ...modal, mode: 'set' } : modal))} className={stockModal.mode === 'set' ? 'supplier-button-primary' : 'supplier-button'}>Definir valor</button></div>
            {stockModal.mode === 'delta' ? <Field label="Ajuste"><input type="number" step="0.001" value={stockForm.delta} onChange={(event) => setStockForm((form) => ({ ...form, delta: event.target.value }))} className="supplier-field" placeholder="Ex: 10 ou -5" /></Field> : <Field label="Novo estoque"><input type="number" step="0.001" value={stockForm.stockQuantity} onChange={(event) => setStockForm((form) => ({ ...form, stockQuantity: event.target.value }))} className="supplier-field" /></Field>}
            <Field label="Estoque mínimo"><input type="number" step="0.001" value={stockForm.minStockQuantity} onChange={(event) => setStockForm((form) => ({ ...form, minStockQuantity: event.target.value }))} className="supplier-field" /></Field>
            <div className="flex justify-end gap-3"><button type="button" onClick={() => setStockModal(null)} className="supplier-button">Cancelar</button><button type="submit" disabled={saving} className="supplier-button-primary">{saving ? 'Ajustando...' : 'Salvar estoque'}</button></div>
          </form>
        </Modal>
      ) : null}
    </div>
  )
}

function ProductCard({ product, saving, onToggle, onEdit, onRemove, onStock, onIncrement, onDecrement }: { product: SupplierProduct; saving: boolean; onToggle: () => void; onEdit: () => void; onRemove: () => void; onStock: () => void; onIncrement: () => void; onDecrement: () => void }) {
  const isActive = product.active !== false
  return (
    <article className="supplier-card-flat rounded-[1.5rem] p-5 transition hover:border-emerald-300">
      <div className="flex gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${isActive ? 'bg-emerald-500/10 text-[var(--supplier-primary-strong)] dark:text-[var(--supplier-primary)]' : 'bg-[var(--supplier-card-muted)] text-[var(--supplier-muted)]'}`}><Package size={22} /></div>
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><StatusBadge active={isActive} />{product.lowStock ? <LowStockBadge /> : null}</div><h2 className="mt-2 line-clamp-2 text-lg font-black">{product.itemName || product.name}</h2><p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-[var(--supplier-muted)]">{product.tableName || 'Sem tabela'}</p></div>
        <button type="button" onClick={onToggle} disabled={saving} className={isActive ? 'supplier-button' : 'supplier-button-primary'} title={isActive ? 'Desativar produto' : 'Ativar produto'}><Power size={17} /></button>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-4"><InfoBox label="Preço" value={formatMoney(product.unitPrice || product.price)} /><InfoBox label="Qtd." value={`${product.quantity || 1} ${product.unit || 'un.'}`} /><InfoBox label="SKU" value={product.sku || '—'} /><InfoBox label="Categoria" value={product.category || '—'} /></div>
      <div className="mt-4 rounded-2xl border border-[var(--supplier-border)] bg-[var(--supplier-card-muted)] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--supplier-muted)]">Estoque</p><p className="mt-1 text-sm font-black">{product.stockEnabled ? `${Number(product.stockQuantity || 0).toLocaleString('pt-BR')} em estoque` : 'Não controlado'}</p>{product.stockEnabled ? <p className="mt-1 text-xs font-bold text-[var(--supplier-muted)]">Mínimo: {Number(product.minStockQuantity || 0).toLocaleString('pt-BR')}</p> : null}</div>{product.stockEnabled ? <div className="flex gap-2"><button type="button" onClick={onDecrement} disabled={saving} className="stock-mini-button">-</button><button type="button" onClick={onIncrement} disabled={saving} className="stock-mini-button">+</button></div> : null}</div></div>
      <div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={onEdit} className="supplier-button flex-1"><Edit3 size={16} />Editar</button><button type="button" onClick={onStock} className="supplier-button flex-1"><SlidersHorizontal size={16} />Estoque</button><button type="button" onClick={onRemove} disabled={saving} className="supplier-button-danger"><Trash2 size={16} /></button></div>
    </article>
  )
}

function StatCard({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return <div className={`rounded-2xl border p-4 ${danger ? 'border-amber-300/70 bg-amber-500/10 text-amber-700 dark:text-amber-100' : 'border-[var(--supplier-border)] bg-[var(--supplier-card-muted)]'}`}><p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--supplier-muted)]">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>
}
function InfoBox({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-[var(--supplier-border)] bg-[var(--supplier-card-muted)] px-3 py-3"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--supplier-muted)]">{label}</p><p className="mt-1 truncate text-sm font-black">{value}</p></div> }
function StatusBadge({ active }: { active: boolean }) { return <span className={active ? 'supplier-chip supplier-chip-primary' : 'supplier-chip'}>{active ? 'Ativo' : 'Inativo'}</span> }
function LowStockBadge() { return <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-amber-700 dark:text-amber-200"><AlertTriangle size={12} className="inline" /> Estoque baixo</span> }
function FilterButton({ children, active, onClick }: { children: ReactNode; active: boolean; onClick: () => void }) { return <button type="button" onClick={onClick} className={active ? 'supplier-button-primary' : 'supplier-button'}><Filter size={15} />{children}</button> }
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-[var(--supplier-muted)]">{label}</span>{children}</label> }
function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xl"><div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-[var(--supplier-border)] bg-[var(--supplier-card-solid)] p-5 text-[var(--supplier-text)] shadow-2xl lg:p-6"><div className="mb-5 flex items-center justify-between gap-4"><h2 className="text-2xl font-black">{title}</h2><button type="button" onClick={onClose} className="supplier-button"><X size={20} /></button></div>{children}</div></div> }
