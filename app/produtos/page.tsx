'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Archive,
  Box,
  CheckCircle2,
  Edit3,
  Filter,
  Layers,
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
type ProductModalMode = 'create' | 'edit'
type StockModalMode = 'set' | 'delta'

type ProductModalState = {
  mode: ProductModalMode
  product?: SupplierProduct
}

type StockModalState = {
  product: SupplierProduct
  mode: StockModalMode
}

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

const unitOptions = ['un.', 'cx', 'pct', 'kg', 'g', 'l', 'ml', 'm', 'cm']

function money(value: number | string | null | undefined) {
  const numberValue = Number(value ?? 0)

  return numberValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function toFormNumber(value: number | string | null | undefined) {
  if (value === null || typeof value === 'undefined') return ''
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

  const activeTables = useMemo(() => tables.filter((table) => table.active), [tables])

  const stats = useMemo(() => {
    const activeProducts = products.filter((product) => product.active !== false)
    const inactiveProducts = products.filter((product) => product.active === false)
    const lowStockProducts = products.filter((product) => product.lowStock)

    return {
      total: products.length,
      active: activeProducts.length,
      inactive: inactiveProducts.length,
      lowStock: lowStockProducts.length,
      stockEnabled: products.filter((product) => product.stockEnabled).length,
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
      quantity: toFormNumber(product.quantity || 1),
      unitPrice: toFormNumber(product.unitPrice || product.price || 0),
      notes: product.notes || '',
      active: product.active !== false,
      stockEnabled: Boolean(product.stockEnabled),
      stockQuantity: toFormNumber(product.stockQuantity || 0),
      minStockQuantity: toFormNumber(product.minStockQuantity || 0),
    })
    setProductModal({ mode: 'edit', product })
  }

  function openStockModal(product: SupplierProduct, mode: StockModalMode = 'delta') {
    setStockForm({
      delta: mode === 'delta' ? '1' : '',
      stockQuantity: toFormNumber(product.stockQuantity || 0),
      minStockQuantity: toFormNumber(product.minStockQuantity || 0),
    })
    setStockModal({ product, mode })
  }

  async function submitProduct(event: FormEvent) {
    event.preventDefault()

    const currentModal = productModal
    if (!currentModal) return

    if (!productForm.tableId) {
      setError('Selecione uma tabela de preço para cadastrar o produto.')
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

        if (!product?.tableId) {
          throw new Error('Produto sem tabela vinculada.')
        }

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

    const confirmed = window.confirm(`Remover "${product.itemName}" da tabela ${product.tableName || ''}?`)
    if (!confirmed) return

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
    <main className="min-h-screen px-5 py-6 text-slate-100 lg:px-8">
      <section className="mb-6 overflow-hidden rounded-[2rem] border border-emerald-400/20 bg-slate-950/80 shadow-2xl shadow-emerald-950/30">
        <div className="relative p-6 lg:p-8">
          <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-teal-400/10 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
                <Box size={14} />
                Catálogo do fornecedor
              </span>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-white lg:text-5xl">
                Produtos
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Cadastre produtos, controle disponibilidade, estoque e organize os itens que aparecem
                nas suas tabelas de preço.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={loadData}
                disabled={loading || saving}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-100 transition hover:border-emerald-300/40 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
                Atualizar
              </button>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-300"
              >
                <PackagePlus size={18} />
                Novo produto
              </button>
            </div>
          </div>

          <div className="relative mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Total" value={stats.total} icon={<Layers size={18} />} />
            <StatCard label="Ativos" value={stats.active} icon={<CheckCircle2 size={18} />} />
            <StatCard label="Inativos" value={stats.inactive} icon={<Archive size={18} />} />
            <StatCard label="Estoque baixo" value={stats.lowStock} icon={<AlertTriangle size={18} />} danger={stats.lowStock > 0} />
            <StatCard label="Com estoque" value={stats.stockEnabled} icon={<SlidersHorizontal size={18} />} />
          </div>
        </div>
      </section>

      {error ? (
        <div className="mb-5 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-100">
          {error}
        </div>
      ) : null}

      <section className="mb-5 rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4 shadow-xl shadow-slate-950/20">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <Search size={18} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, SKU, categoria ou tabela..."
              className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-500"
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-56 animate-pulse rounded-[1.5rem] border border-white/10 bg-white/[0.04]"
            />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <section className="rounded-[2rem] border border-dashed border-white/15 bg-slate-950/60 p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-200">
            <PackagePlus size={26} />
          </div>
          <h2 className="mt-4 text-xl font-black text-white">Nenhum produto encontrado</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-400">
            Cadastre um novo produto ou altere os filtros de busca para visualizar seus itens.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950"
          >
            <Plus size={18} />
            Cadastrar produto
          </button>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <article
              key={`${product.tableId}-${product.id}`}
              className={`group rounded-[1.6rem] border p-5 shadow-xl transition ${
                product.active === false
                  ? 'border-white/10 bg-slate-950/50 opacity-70'
                  : product.lowStock
                    ? 'border-amber-300/25 bg-amber-400/[0.05] shadow-amber-950/20'
                    : 'border-white/10 bg-slate-950/70 shadow-slate-950/20 hover:border-emerald-300/30'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${
                        product.active === false
                          ? 'bg-slate-700/70 text-slate-300'
                          : 'bg-emerald-400/10 text-emerald-200'
                      }`}
                    >
                      {product.active === false ? 'Inativo' : 'Ativo'}
                    </span>

                    {product.lowStock ? (
                      <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-amber-200">
                        Estoque baixo
                      </span>
                    ) : null}
                  </div>

                  <h2 className="mt-3 line-clamp-2 text-xl font-black leading-tight text-white">
                    {product.itemName || product.name}
                  </h2>

                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {product.tableName || 'Sem tabela'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleProduct(product)}
                  disabled={saving}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition disabled:opacity-60 ${
                    product.active === false
                      ? 'border-emerald-300/30 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20'
                      : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-red-300/30 hover:bg-red-400/10 hover:text-red-200'
                  }`}
                  title={product.active === false ? 'Ativar produto' : 'Desativar produto'}
                >
                  <Power size={17} />
                </button>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <InfoPill label="Preço" value={money(product.unitPrice || product.price)} />
                <InfoPill label="Qtd." value={`${product.quantity || 1} ${product.unit || 'un.'}`} />
                <InfoPill label="SKU" value={product.sku || '—'} />
                <InfoPill label="Categoria" value={product.category || '—'} />
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                      Estoque
                    </p>
                    {product.stockEnabled ? (
                      <p className="mt-1 text-lg font-black text-white">
                        {Number(product.stockQuantity || 0).toLocaleString('pt-BR')}
                        <span className="ml-1 text-sm text-slate-400">un.</span>
                      </p>
                    ) : (
                      <p className="mt-1 text-sm font-semibold text-slate-400">Não controlado</p>
                    )}
                  </div>

                  {product.stockEnabled ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => quickAdjustStock(product, -1)}
                        disabled={saving}
                        className="h-9 w-9 rounded-xl border border-white/10 bg-white/[0.04] text-lg font-black text-white transition hover:bg-white/10 disabled:opacity-50"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => quickAdjustStock(product, 1)}
                        disabled={saving}
                        className="h-9 w-9 rounded-xl border border-white/10 bg-white/[0.04] text-lg font-black text-white transition hover:bg-white/10 disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openStockModal(product, 'set')}
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black text-slate-200 transition hover:bg-white/10"
                  >
                    Ajustar estoque
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(product)}
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black text-slate-200 transition hover:bg-white/10"
                  >
                    Editar produto
                  </button>
                </div>
              </div>

              {product.notes ? (
                <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-400">{product.notes}</p>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(product)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-slate-100 transition hover:bg-white/10"
                >
                  <Edit3 size={16} />
                  Editar
                </button>

                <button
                  type="button"
                  onClick={() => removeProduct(product)}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm font-black text-red-100 transition hover:bg-red-400/20 disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  Remover
                </button>
              </div>
            </article>
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
                  className="input-supplier"
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
                  className="input-supplier"
                  placeholder="Ex: Coca-Cola lata 350ml"
                />
              </Field>

              <Field label="SKU">
                <input
                  value={productForm.sku}
                  onChange={(event) => setProductForm((form) => ({ ...form, sku: event.target.value }))}
                  className="input-supplier"
                  placeholder="Ex: COCA-LATA-350"
                />
              </Field>

              <Field label="Categoria">
                <input
                  value={productForm.category}
                  onChange={(event) => setProductForm((form) => ({ ...form, category: event.target.value }))}
                  className="input-supplier"
                  placeholder="Ex: Bebidas"
                />
              </Field>

              <Field label="Unidade">
                <select
                  value={productForm.unit}
                  onChange={(event) => setProductForm((form) => ({ ...form, unit: event.target.value }))}
                  className="input-supplier"
                >
                  {unitOptions.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Quantidade por item">
                <input
                  type="number"
                  step="0.001"
                  value={productForm.quantity}
                  onChange={(event) => setProductForm((form) => ({ ...form, quantity: event.target.value }))}
                  className="input-supplier"
                />
              </Field>

              <Field label="Preço unitário">
                <input
                  type="number"
                  step="0.01"
                  value={productForm.unitPrice}
                  onChange={(event) => setProductForm((form) => ({ ...form, unitPrice: event.target.value }))}
                  className="input-supplier"
                  placeholder="0,00"
                />
              </Field>

              <Field label="Status">
                <select
                  value={productForm.active ? 'active' : 'inactive'}
                  onChange={(event) => setProductForm((form) => ({ ...form, active: event.target.value === 'active' }))}
                  className="input-supplier"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </Field>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <label className="flex cursor-pointer items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-white">Controlar estoque</p>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    Ative para acompanhar estoque atual e estoque mínimo.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={productForm.stockEnabled}
                  onChange={(event) => setProductForm((form) => ({ ...form, stockEnabled: event.target.checked }))}
                  className="h-5 w-5 accent-emerald-400"
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
                      className="input-supplier"
                    />
                  </Field>

                  <Field label="Estoque mínimo">
                    <input
                      type="number"
                      step="0.001"
                      value={productForm.minStockQuantity}
                      onChange={(event) => setProductForm((form) => ({ ...form, minStockQuantity: event.target.value }))}
                      className="input-supplier"
                    />
                  </Field>
                </div>
              ) : null}
            </div>

            <Field label="Informações do item">
              <textarea
                value={productForm.notes}
                onChange={(event) => setProductForm((form) => ({ ...form, notes: event.target.value }))}
                className="input-supplier min-h-28 resize-none"
                placeholder="Observações, embalagem, condições comerciais, prazo, etc."
              />
            </Field>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProductModal(null)}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-slate-100 transition hover:bg-white/10"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Salvando...' : 'Salvar produto'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {stockModal ? (
        <Modal title="Ajustar estoque" onClose={() => setStockModal(null)}>
          <form onSubmit={submitStock} className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Produto
              </p>
              <h3 className="mt-2 text-xl font-black text-white">
                {stockModal.product.itemName || stockModal.product.name}
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Estoque atual: {Number(stockModal.product.stockQuantity || 0).toLocaleString('pt-BR')}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setStockModal((modal) => (modal ? { ...modal, mode: 'delta' } : modal))}
                className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${
                  stockModal.mode === 'delta'
                    ? 'border-emerald-300/40 bg-emerald-400/15 text-emerald-100'
                    : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10'
                }`}
              >
                Somar / remover
              </button>

              <button
                type="button"
                onClick={() => setStockModal((modal) => (modal ? { ...modal, mode: 'set' } : modal))}
                className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${
                  stockModal.mode === 'set'
                    ? 'border-emerald-300/40 bg-emerald-400/15 text-emerald-100'
                    : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10'
                }`}
              >
                Definir valor
              </button>
            </div>

            {stockModal.mode === 'delta' ? (
              <Field label="Ajuste de estoque">
                <input
                  type="number"
                  step="0.001"
                  value={stockForm.delta}
                  onChange={(event) => setStockForm((form) => ({ ...form, delta: event.target.value }))}
                  className="input-supplier"
                  placeholder="Ex: 10 ou -5"
                />
              </Field>
            ) : (
              <Field label="Novo estoque atual">
                <input
                  type="number"
                  step="0.001"
                  value={stockForm.stockQuantity}
                  onChange={(event) => setStockForm((form) => ({ ...form, stockQuantity: event.target.value }))}
                  className="input-supplier"
                />
              </Field>
            )}

            <Field label="Estoque mínimo">
              <input
                type="number"
                step="0.001"
                value={stockForm.minStockQuantity}
                onChange={(event) => setStockForm((form) => ({ ...form, minStockQuantity: event.target.value }))}
                className="input-supplier"
              />
            </Field>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStockModal(null)}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-slate-100 transition hover:bg-white/10"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Ajustando...' : 'Salvar estoque'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </main>
  )
}

function StatCard({
  label,
  value,
  icon,
  danger = false,
}: {
  label: string
  value: number
  icon: React.ReactNode
  danger?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        danger
          ? 'border-amber-300/25 bg-amber-400/10 text-amber-100'
          : 'border-white/10 bg-white/[0.04] text-slate-100'
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
        <span className={danger ? 'text-amber-200' : 'text-emerald-200'}>{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-black">{value}</p>
    </div>
  )
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-white">{value}</p>
    </div>
  )
}

function FilterButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${
        active
          ? 'bg-emerald-400 text-slate-950'
          : 'border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/10'
      }`}
    >
      <Filter size={15} />
      {children}
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </span>
      {children}
    </label>
  )
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xl">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/10 bg-slate-950 p-5 shadow-2xl shadow-black/50 lg:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
              Suppliers
            </p>
            <h2 className="mt-1 text-2xl font-black text-white">{title}</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-200 transition hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}