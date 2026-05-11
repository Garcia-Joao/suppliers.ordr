'use client'

import type { FormEvent, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
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
  return Number(value ?? 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function asText(value: number | string | null | undefined, fallback = '') {
  if (value === null || typeof value === 'undefined') return fallback
  return String(value)
}

function productsFromTables(tables: SupplierPriceTable[]): SupplierProduct[] {
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

  const activeTables = useMemo(() => tables.filter((table) => table.active), [tables])

  const stats = useMemo(() => {
    return {
      total: products.length,
      active: products.filter((product) => product.active !== false).length,
      inactive: products.filter((product) => product.active === false).length,
      lowStock: products.filter((product) => product.lowStock).length,
      withStock: products.filter((product) => product.stockEnabled).length,
    }
  }, [products])

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
      const [productsResult, tablesResult] = await Promise.all([
        supplierApi.products(),
        supplierApi.priceTables(),
      ])

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
    setProductForm({
      ...emptyProductForm,
      tableId: activeTables[0]?.id || tables[0]?.id || '',
    })
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
    setStockForm({
      delta: '1',
      stockQuantity: asText(product.stockQuantity, '0'),
      minStockQuantity: asText(product.minStockQuantity, '0'),
    })
    setStockModal({ product, mode })
  }

  async function submitProduct(event: FormEvent) {
    event.preventDefault()

    const currentModal = productModal
    if (!currentModal) return

    if (!productForm.tableId) {
      setError('Crie ou selecione uma tabela de preço antes de cadastrar produtos.')
      return
    }

    if (!productForm.itemName.trim()) {
      setError('Informe o nome do produto.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const payload = buildPayload(productForm)

      if (currentModal.mode === 'create') {
        const result = await supplierApi.createPriceTableItem(productForm.tableId, payload)
        syncTables(result.tables)
      } else {
        const product = currentModal.product
        if (!product?.tableId) throw new Error('Produto sem tabela vinculada.')

        const result = await supplierApi.updatePriceTableItem(product.tableId, product.id, payload)
        syncTables(result.tables)
      }

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
      const result = await supplierApi.togglePriceTableItemActive(
        product.tableId,
        product.id,
        product.active === false
      )

      syncTables(result.tables)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar status do produto.')
    } finally {
      setSaving(false)
    }
  }

  async function removeProduct(product: SupplierProduct) {
    if (!product.tableId) return
    if (!window.confirm(`Remover "${product.itemName || product.name}"?`)) return

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
      const result = await supplierApi.adjustItemStock(product.tableId, product.id, {
        mode: 'delta',
        delta,
      })

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
      const result = await supplierApi.adjustItemStock(
        currentModal.product.tableId,
        currentModal.product.id,
        {
          mode: currentModal.mode,
          delta: currentModal.mode === 'delta' ? stockForm.delta : undefined,
          stockQuantity: currentModal.mode === 'set' ? stockForm.stockQuantity : undefined,
          minStockQuantity: stockForm.minStockQuantity,
        }
      )

      syncTables(result.tables)
      setStockModal(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao ajustar estoque.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 text-slate-950 dark:text-white">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950/80">
        <div className="relative p-5 sm:p-6 lg:p-7">
          <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-300/30 blur-3xl dark:bg-emerald-400/15" />

          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
                <Package size={14} />
                Catálogo
              </span>

              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Produtos</h1>

              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
                Gerencie itens vendidos, status comercial, SKU, categorias e estoque sem sair do painel.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={loadData}
                disabled={loading || saving}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100 dark:hover:bg-white/10"
              >
                <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
                Atualizar
              </button>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-400 dark:text-slate-950"
              >
                <PackagePlus size={18} />
                Novo produto
              </button>
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

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-100">
          {error}
        </div>
      ) : null}

      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950/70">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
            <Search size={18} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, SKU, categoria ou tabela..."
              className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
              Todos
            </FilterButton>
            <FilterButton active={filter === 'active'} onClick={() => setFilter('active')}>
              Ativos
            </FilterButton>
            <FilterButton active={filter === 'inactive'} onClick={() => setFilter('inactive')}>
              Inativos
            </FilterButton>
            <FilterButton active={filter === 'low-stock'} onClick={() => setFilter('low-stock')}>
              Estoque baixo
            </FilterButton>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-48 animate-pulse rounded-[1.5rem] border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.04]"
            />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <section className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center dark:border-white/15 dark:bg-slate-950/60">
          <PackagePlus className="mx-auto text-emerald-500" size={34} />
          <h2 className="mt-4 text-xl font-black">Nenhum produto encontrado</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">
            Cadastre um produto ou ajuste os filtros para visualizar seus itens.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-white dark:text-slate-950"
          >
            <Plus size={18} />
            Cadastrar produto
          </button>
        </section>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {filteredProducts.map((product) => (
            <ProductCard
              key={`${product.tableId}-${product.id}`}
              product={product}
              saving={saving}
              onToggle={() => toggleProduct(product)}
              onEdit={() => openEditModal(product)}
              onRemove={() => removeProduct(product)}
              onStock={() => openStockModal(product, 'set')}
              onIncrement={() => quickAdjustStock(product, 1)}
              onDecrement={() => quickAdjustStock(product, -1)}
            />
          ))}
        </section>
      )}

      {productModal ? (
        <Modal
          title={productModal.mode === 'create' ? 'Cadastrar produto' : 'Editar produto'}
          onClose={() => setProductModal(null)}
        >
          <form onSubmit={submitProduct} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Tabela de preço">
                <select
                  value={productForm.tableId}
                  onChange={(event) => setProductForm((form) => ({ ...form, tableId: event.target.value }))}
                  disabled={productModal.mode === 'edit'}
                  className="supplier-field"
                >
                  <option value="">Selecione uma tabela</option>
                  {tables.map((table) => (
                    <option key={table.id} value={table.id}>
                      {table.name} {table.active ? '' : '(pausada)'}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Nome do produto">
                <input
                  value={productForm.itemName}
                  onChange={(event) => setProductForm((form) => ({ ...form, itemName: event.target.value }))}
                  className="supplier-field"
                  placeholder="Ex: Coca-Cola lata 350ml"
                />
              </Field>

              <Field label="SKU">
                <input
                  value={productForm.sku}
                  onChange={(event) => setProductForm((form) => ({ ...form, sku: event.target.value }))}
                  className="supplier-field"
                  placeholder="Ex: COCA-LATA-350"
                />
              </Field>

              <Field label="Categoria">
                <input
                  value={productForm.category}
                  onChange={(event) => setProductForm((form) => ({ ...form, category: event.target.value }))}
                  className="supplier-field"
                  placeholder="Ex: Bebidas"
                />
              </Field>

              <Field label="Unidade">
                <select
                  value={productForm.unit}
                  onChange={(event) => setProductForm((form) => ({ ...form, unit: event.target.value }))}
                  className="supplier-field"
                >
                  {units.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Quantidade">
                <input
                  type="number"
                  step="0.001"
                  value={productForm.quantity}
                  onChange={(event) => setProductForm((form) => ({ ...form, quantity: event.target.value }))}
                  className="supplier-field"
                />
              </Field>

              <Field label="Preço">
                <input
                  type="number"
                  step="0.01"
                  value={productForm.unitPrice}
                  onChange={(event) => setProductForm((form) => ({ ...form, unitPrice: event.target.value }))}
                  className="supplier-field"
                />
              </Field>

              <Field label="Status">
                <select
                  value={productForm.active ? 'active' : 'inactive'}
                  onChange={(event) => setProductForm((form) => ({ ...form, active: event.target.value === 'active' }))}
                  className="supplier-field"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </Field>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <label className="flex cursor-pointer items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black">Controlar estoque</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Use para acompanhar estoque atual e estoque mínimo.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={productForm.stockEnabled}
                  onChange={(event) => setProductForm((form) => ({ ...form, stockEnabled: event.target.checked }))}
                  className="h-5 w-5 accent-emerald-500"
                />
              </label>

              {productForm.stockEnabled ? (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Field label="Estoque atual">
                    <input
                      type="number"
                      step="0.001"
                      value={productForm.stockQuantity}
                      onChange={(event) => setProductForm((form) => ({ ...form, stockQuantity: event.target.value }))}
                      className="supplier-field"
                    />
                  </Field>

                  <Field label="Estoque mínimo">
                    <input
                      type="number"
                      step="0.001"
                      value={productForm.minStockQuantity}
                      onChange={(event) => setProductForm((form) => ({ ...form, minStockQuantity: event.target.value }))}
                      className="supplier-field"
                    />
                  </Field>
                </div>
              ) : null}
            </div>

            <Field label="Informações">
              <textarea
                value={productForm.notes}
                onChange={(event) => setProductForm((form) => ({ ...form, notes: event.target.value }))}
                className="supplier-field min-h-24 resize-none"
                placeholder="Embalagem, prazo, observações comerciais..."
              />
            </Field>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setProductModal(null)} className="supplier-button">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="supplier-button-primary">
                {saving ? 'Salvando...' : 'Salvar produto'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {stockModal ? (
        <Modal title="Ajustar estoque" onClose={() => setStockModal(null)}>
          <form onSubmit={submitStock} className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Produto</p>
              <h3 className="mt-2 text-xl font-black">{stockModal.product.itemName || stockModal.product.name}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                Estoque atual: {Number(stockModal.product.stockQuantity || 0).toLocaleString('pt-BR')}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setStockModal((modal) => (modal ? { ...modal, mode: 'delta' } : modal))}
                className={stockModal.mode === 'delta' ? 'supplier-button-primary' : 'supplier-button'}
              >
                Somar / remover
              </button>
              <button
                type="button"
                onClick={() => setStockModal((modal) => (modal ? { ...modal, mode: 'set' } : modal))}
                className={stockModal.mode === 'set' ? 'supplier-button-primary' : 'supplier-button'}
              >
                Definir valor
              </button>
            </div>

            {stockModal.mode === 'delta' ? (
              <Field label="Ajuste">
                <input
                  type="number"
                  step="0.001"
                  value={stockForm.delta}
                  onChange={(event) => setStockForm((form) => ({ ...form, delta: event.target.value }))}
                  className="supplier-field"
                  placeholder="Ex: 10 ou -5"
                />
              </Field>
            ) : (
              <Field label="Novo estoque">
                <input
                  type="number"
                  step="0.001"
                  value={stockForm.stockQuantity}
                  onChange={(event) => setStockForm((form) => ({ ...form, stockQuantity: event.target.value }))}
                  className="supplier-field"
                />
              </Field>
            )}

            <Field label="Estoque mínimo">
              <input
                type="number"
                step="0.001"
                value={stockForm.minStockQuantity}
                onChange={(event) => setStockForm((form) => ({ ...form, minStockQuantity: event.target.value }))}
                className="supplier-field"
              />
            </Field>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setStockModal(null)} className="supplier-button">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="supplier-button-primary">
                {saving ? 'Ajustando...' : 'Salvar estoque'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  )
}

function ProductCard({
  product,
  saving,
  onToggle,
  onEdit,
  onRemove,
  onStock,
  onIncrement,
  onDecrement,
}: {
  product: SupplierProduct
  saving: boolean
  onToggle: () => void
  onEdit: () => void
  onRemove: () => void
  onStock: () => void
  onIncrement: () => void
  onDecrement: () => void
}) {
  const isActive = product.active !== false

  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md dark:border-white/10 dark:bg-slate-950/70 dark:hover:border-emerald-400/25">
      <div className="flex gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${isActive ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-200' : 'bg-slate-100 text-slate-400 dark:bg-white/5'}`}>
          <Package size={22} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge active={isActive} />
            {product.lowStock ? <LowStockBadge /> : null}
          </div>

          <h2 className="mt-2 line-clamp-2 text-lg font-black">{product.itemName || product.name}</h2>
          <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            {product.tableName || 'Sem tabela'}
          </p>
        </div>

        <button
          type="button"
          onClick={onToggle}
          disabled={saving}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition disabled:opacity-50 ${
            isActive
              ? 'border-slate-200 bg-slate-50 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-red-400/30 dark:hover:bg-red-400/10 dark:hover:text-red-200'
              : 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-200'
          }`}
          title={isActive ? 'Desativar produto' : 'Ativar produto'}
        >
          <Power size={17} />
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <InfoBox label="Preço" value={formatMoney(product.unitPrice || product.price)} />
        <InfoBox label="Qtd." value={`${product.quantity || 1} ${product.unit || 'un.'}`} />
        <InfoBox label="SKU" value={product.sku || '—'} />
        <InfoBox label="Categoria" value={product.category || '—'} />
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Estoque</p>
            <p className="mt-1 text-sm font-black">
              {product.stockEnabled
                ? `${Number(product.stockQuantity || 0).toLocaleString('pt-BR')} em estoque`
                : 'Não controlado'}
            </p>
            {product.stockEnabled ? (
              <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                Mínimo: {Number(product.minStockQuantity || 0).toLocaleString('pt-BR')}
              </p>
            ) : null}
          </div>

          {product.stockEnabled ? (
            <div className="flex gap-2">
              <button type="button" onClick={onDecrement} disabled={saving} className="stock-mini-button">-</button>
              <button type="button" onClick={onIncrement} disabled={saving} className="stock-mini-button">+</button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={onEdit} className="supplier-button flex-1">
          <Edit3 size={16} />
          Editar
        </button>
        <button type="button" onClick={onStock} className="supplier-button flex-1">
          <SlidersHorizontal size={16} />
          Estoque
        </button>
        <button type="button" onClick={onRemove} disabled={saving} className="supplier-button-danger">
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  )
}

function StatCard({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${danger ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-100' : 'border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.04]'}`}>
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  )
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/[0.04]">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1 truncate text-sm font-black">{value}</p>
    </div>
  )
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200' : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300'}`}>
      {active ? 'Ativo' : 'Inativo'}
    </span>
  )
}

function LowStockBadge() {
  return (
    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-amber-700 dark:bg-amber-400/10 dark:text-amber-200">
      Estoque baixo
    </span>
  )
}

function FilterButton({ children, active, onClick }: { children: ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${
        active
          ? 'bg-emerald-500 text-white dark:text-slate-950'
          : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/10'
      }`}
    >
      <Filter size={15} />
      {children}
    </button>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
        {label}
      </span>
      {children}
    </label>
  )
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xl">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-5 text-slate-950 shadow-2xl dark:border-white/10 dark:bg-slate-950 dark:text-white lg:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-500">Produto</p>
            <h2 className="mt-1 text-2xl font-black">{title}</h2>
          </div>

          <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}
