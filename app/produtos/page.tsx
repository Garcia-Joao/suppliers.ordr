'use client'

import { FormEvent, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  Grid2X2,
  Layers,
  List,
  Loader2,
  Minus,
  PackagePlus,
  PackageSearch,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react'
import { clsx } from 'clsx'
import { SupplierShell } from '@/components/layout/supplier-shell'
import { supplierApi, type PriceTableItemPayload, type SupplierPriceTable, type SupplierProduct } from '@/lib/api'

const units = ['unit', 'ml', 'l', 'g', 'kg']

const emptyItemForm: PriceTableItemPayload & { tableId: string } = {
  tableId: '',
  itemName: '',
  sku: '',
  category: '',
  unit: 'unit',
  quantity: '1',
  unitPrice: '0',
  notes: '',
  active: true,
  stockEnabled: false,
  stockQuantity: '0',
  minStockQuantity: '0',
}

function money(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function numberText(value?: number | null) {
  return Number(value ?? 0).toLocaleString('pt-BR', { maximumFractionDigits: 3 })
}

function productsFromTables(tables: SupplierPriceTable[]) {
  return tables.flatMap((table) =>
    table.items.map((item) => ({
      ...item,
      tableId: table.id,
      tableName: table.name,
      tableActive: table.active,
    }))
  )
}

export default function ProdutosPage() {
  const [tables, setTables] = useState<SupplierPriceTable[]>([])
  const [products, setProducts] = useState<SupplierProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'low-stock'>('all')
  const [itemModal, setItemModal] = useState<{ mode: 'create' | 'edit'; product?: SupplierProduct } | null>(null)
  const [stockModal, setStockModal] = useState<{ product: SupplierProduct } | null>(null)
  const [itemForm, setItemForm] = useState(emptyItemForm)
  const [stockForm, setStockForm] = useState({ stockQuantity: '0', minStockQuantity: '0' })

  async function load() {
    setLoading(true)
    try {
      const result = await supplierApi.priceTables()
      const nextTables = result.tables ?? []
      setTables(nextTables)
      setProducts(productsFromTables(nextTables))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load().catch(() => setLoading(false))
  }, [])

  const stats = useMemo(() => {
    const active = products.filter((product) => product.active !== false).length
    const inactive = products.filter((product) => product.active === false).length
    const lowStock = products.filter((product) => product.lowStock).length
    const stockControlled = products.filter((product) => product.stockEnabled).length

    return [
      { label: 'Produtos ativos', value: active, icon: CheckCircle2 },
      { label: 'Inativos', value: inactive, icon: EyeOff },
      { label: 'Estoque baixo', value: lowStock, icon: AlertTriangle },
      { label: 'Com estoque', value: stockControlled, icon: Archive },
    ]
  }, [products])

  const activeTables = useMemo(() => tables.filter((table) => table.active), [tables])

  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase()
    return products.filter((product) => {
      const matchesFilter =
        filter === 'all'
          ? true
          : filter === 'active'
            ? product.active !== false
            : filter === 'inactive'
              ? product.active === false
              : Boolean(product.lowStock)

      if (!matchesFilter) return false
      if (!term) return true

      return `${product.name} ${product.sku ?? ''} ${product.category ?? ''} ${product.tableName ?? ''} ${product.notes ?? ''}`
        .toLowerCase()
        .includes(term)
    })
  }, [products, query, filter])

  function openCreateProduct() {
    const firstTable = activeTables[0] ?? tables[0]
    setItemForm({ ...emptyItemForm, tableId: firstTable?.id ?? '' })
    setItemModal({ mode: 'create' })
  }

  function openEditProduct(product: SupplierProduct) {
    setItemForm({
      tableId: product.tableId ?? '',
      itemName: product.name ?? product.itemName,
      sku: product.sku ?? '',
      category: product.category ?? '',
      unit: product.unit,
      quantity: String(product.quantity),
      unitPrice: String(product.unitPrice),
      notes: product.notes ?? '',
      active: product.active !== false,
      stockEnabled: Boolean(product.stockEnabled),
      stockQuantity: String(product.stockQuantity ?? 0),
      minStockQuantity: String(product.minStockQuantity ?? 0),
    })
    setItemModal({ mode: 'edit', product })
  }

  function openStock(product: SupplierProduct) {
    setStockForm({
      stockQuantity: String(product.stockQuantity ?? 0),
      minStockQuantity: String(product.minStockQuantity ?? 0),
    })
    setStockModal({ product })
  }

  async function submitProduct(event: FormEvent) {
    event.preventDefault()
    if (!itemModal || !itemForm.tableId || !itemForm.itemName.trim()) return

    setSaving(true)
    try {
      const payload: PriceTableItemPayload = {
        itemName: itemForm.itemName.trim(),
        sku: itemForm.sku?.trim() || null,
        category: itemForm.category?.trim() || null,
        unit: itemForm.unit,
        quantity: itemForm.quantity,
        unitPrice: itemForm.unitPrice,
        notes: itemForm.notes?.trim() || null,
        active: itemForm.active !== false,
        stockEnabled: Boolean(itemForm.stockEnabled),
        stockQuantity: itemForm.stockQuantity ?? '0',
        minStockQuantity: itemForm.minStockQuantity ?? '0',
      }

      if (itemModal.mode === 'edit' && itemModal.product) {
        const previousTableId = itemModal.product.tableId ?? itemForm.tableId
        if (previousTableId !== itemForm.tableId) {
          await supplierApi.deletePriceTableItem(previousTableId, itemModal.product.id)
          await supplierApi.createPriceTableItem(itemForm.tableId, payload)
        } else {
          await supplierApi.updatePriceTableItem(itemForm.tableId, itemModal.product.id, payload)
        }
      } else {
        await supplierApi.createPriceTableItem(itemForm.tableId, payload)
      }

      setItemModal(null)
      await load()
    } finally {
      setSaving(false)
    }
  }

  async function toggleProduct(product: SupplierProduct) {
    if (!product.tableId) return
    const result = await supplierApi.togglePriceTableItemActive(product.tableId, product.id, !(product.active !== false))
    setTables(result.tables)
    setProducts(productsFromTables(result.tables))
  }

  async function quickStock(product: SupplierProduct, delta: number) {
    if (!product.tableId) return
    const result = await supplierApi.adjustItemStock(product.tableId, product.id, { delta, mode: 'delta' })
    setTables(result.tables)
    setProducts(productsFromTables(result.tables))
  }

  async function submitStock(event: FormEvent) {
    event.preventDefault()
    if (!stockModal.product.tableId) return
    setSaving(true)
    try {
      const result = await supplierApi.adjustItemStock(stockModal.product.tableId, stockModal.product.id, {
        mode: 'set',
        stockQuantity: stockForm.stockQuantity,
        minStockQuantity: stockForm.minStockQuantity,
      })
      setTables(result.tables)
      setProducts(productsFromTables(result.tables))
      setStockModal(null)
    } finally {
      setSaving(false)
    }
  }

  async function deleteProduct(product: SupplierProduct) {
    if (!product.tableId) return
    if (!confirm(`Remover "${product.name}" da tabela ${product.tableName ?? ''}?`)) return
    await supplierApi.deletePriceTableItem(product.tableId, product.id)
    await load()
  }

  return (
    <SupplierShell>
      <div className="space-y-5 pb-24 lg:pb-0">
        <section className="ordr-panel relative overflow-hidden rounded-[2rem] p-5 md:p-7">
          <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
            <div>
              <span className="ordr-kicker"><PackageSearch className="size-3.5" /> Produtos</span>
              <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">Catálogo operacional</h1>
              <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-muted-foreground">
                Cadastre produtos, controle estoque e pause itens sem remover histórico de preços.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={openCreateProduct} disabled={tables.length === 0} className="ordr-button-primary disabled:opacity-60">
                <PackagePlus className="size-4" /> Novo produto
              </button>
              <div className="flex rounded-2xl border bg-background/65 p-1">
                <button onClick={() => setView('grid')} className={clsx('grid size-10 place-items-center rounded-xl', view === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>
                  <Grid2X2 className="size-4" />
                </button>
                <button onClick={() => setView('list')} className={clsx('grid size-10 place-items-center rounded-xl', view === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>
                  <List className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <button key={stat.label} onClick={() => setFilter(stat.label === 'Produtos ativos' ? 'active' : stat.label === 'Inativos' ? 'inactive' : stat.label === 'Estoque baixo' ? 'low-stock' : 'all')} className="ordr-panel group rounded-[1.5rem] p-4 text-left transition hover:-translate-y-0.5 hover:border-primary">
                <div className="flex items-center justify-between gap-3">
                  <div className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="size-5" /></div>
                  <span className="text-3xl font-black tracking-tight">{stat.value}</span>
                </div>
                <p className="mt-4 text-sm font-black text-muted-foreground">{stat.label}</p>
              </button>
            )
          })}
        </section>

        <section className="ordr-panel rounded-[1.75rem] p-4">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por produto, SKU, categoria, tabela..." className="ordr-input pl-11" />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all', 'active', 'inactive', 'low-stock'] as const).map((option) => (
                <button key={option} onClick={() => setFilter(option)} className={clsx('rounded-2xl border px-3 py-2 text-xs font-black transition', filter === option ? 'border-primary bg-primary text-primary-foreground' : 'bg-background/70 text-muted-foreground hover:text-foreground')}>
                  {option === 'all' ? 'Todos' : option === 'active' ? 'Ativos' : option === 'inactive' ? 'Inativos' : 'Estoque baixo'}
                </button>
              ))}
            </div>
          </div>
        </section>

        {loading ? (
          <div className="ordr-panel flex items-center justify-center gap-3 rounded-[2rem] p-10 text-sm font-black text-muted-foreground">
            <Loader2 className="size-5 animate-spin text-primary" /> Carregando produtos...
          </div>
        ) : view === 'grid' ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard key={`${product.tableId}-${product.id}`} product={product} onEdit={openEditProduct} onDelete={deleteProduct} onToggle={toggleProduct} onStock={openStock} onQuickStock={quickStock} />
            ))}
          </section>
        ) : (
          <ProductTable products={filteredProducts} onEdit={openEditProduct} onDelete={deleteProduct} onToggle={toggleProduct} onStock={openStock} onQuickStock={quickStock} />
        )}

        {itemModal ? (
          <ItemModal tables={tables} title={itemModal.mode === 'create' ? 'Novo produto' : 'Editar produto'} form={itemForm} setForm={setItemForm} onSubmit={submitProduct} onClose={() => setItemModal(null)} saving={saving} />
        ) : null}

        {stockModal ? (
          <Modal title="Controle de estoque" onClose={() => setStockModal(null)}>
            <form onSubmit={submitStock} className="space-y-4">
              <div className="rounded-3xl border bg-secondary/45 p-4">
                <p className="text-sm font-black">{stockModal.product.name}</p>
                <p className="mt-1 text-xs font-bold text-muted-foreground">Atual: {numberText(stockModal.product.stockQuantity)} · mínimo: {numberText(stockModal.product.minStockQuantity)} {stockModal.product.unit}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2"><span className="text-sm font-black">Estoque atual</span><input className="ordr-input" type="number" step="0.001" value={stockForm.stockQuantity} onChange={(e) => setStockForm((f) => ({ ...f, stockQuantity: e.target.value }))} /></label>
                <label className="space-y-2"><span className="text-sm font-black">Estoque mínimo</span><input className="ordr-input" type="number" step="0.001" value={stockForm.minStockQuantity} onChange={(e) => setStockForm((f) => ({ ...f, minStockQuantity: e.target.value }))} /></label>
              </div>
              <Actions saving={saving} onCancel={() => setStockModal(null)} />
            </form>
          </Modal>
        ) : null}
      </div>
    </SupplierShell>
  )
}

function ProductCard({ product, onEdit, onDelete, onToggle, onStock, onQuickStock }: { product: SupplierProduct; onEdit: (product: SupplierProduct) => void; onDelete: (product: SupplierProduct) => void; onToggle: (product: SupplierProduct) => void; onStock: (product: SupplierProduct) => void; onQuickStock: (product: SupplierProduct, delta: number) => void }) {
  const active = product.active !== false
  return (
    <article className={clsx('ordr-panel rounded-[1.75rem] p-5 transition hover:-translate-y-0.5', !active && 'opacity-70')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className={clsx('rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide', active ? 'bg-primary/12 text-primary' : 'bg-muted text-muted-foreground')}>{active ? 'Ativo' : 'Inativo'}</span>
            {product.lowStock ? <span className="rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-amber-600">Estoque baixo</span> : null}
          </div>
          <h3 className="truncate text-xl font-black tracking-tight">{product.name}</h3>
          <p className="mt-1 text-xs font-bold text-muted-foreground">{product.tableName ?? 'Sem tabela'} · SKU {product.sku ?? '—'}</p>
        </div>
        <button onClick={() => onToggle(product)} className={clsx('grid size-10 shrink-0 place-items-center rounded-2xl border', active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')} title={active ? 'Desativar produto' : 'Ativar produto'}>
          {active ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Info label="Preço" value={money(product.price)} highlight />
        <Info label="Unidade" value={`${numberText(product.quantity)} ${product.unit}`} />
        <Info label="Categoria" value={product.category ?? '—'} />
        <Info label="Tabela" value={product.tableActive ? 'Ativa' : 'Pausada'} />
      </div>

      <div className="mt-4 rounded-2xl border bg-background/55 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Estoque</p>
            <p className="mt-1 text-sm font-black">{product.stockEnabled ? `${numberText(product.stockQuantity)} / mín. ${numberText(product.minStockQuantity)}` : 'Não controlado'}</p>
          </div>
          <div className="flex gap-1">
            <button onClick={() => onQuickStock(product, -1)} disabled={!product.stockEnabled} className="grid size-8 place-items-center rounded-xl border disabled:opacity-40"><Minus className="size-3.5" /></button>
            <button onClick={() => onQuickStock(product, 1)} disabled={!product.stockEnabled} className="grid size-8 place-items-center rounded-xl border disabled:opacity-40"><Plus className="size-3.5" /></button>
            <button onClick={() => onStock(product)} className="grid size-8 place-items-center rounded-xl border text-primary"><SlidersHorizontal className="size-3.5" /></button>
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button onClick={() => onEdit(product)} className="ordr-button-soft"><Edit3 className="size-4" /> Editar</button>
        <button onClick={() => onDelete(product)} className="grid size-10 place-items-center rounded-2xl border text-destructive hover:bg-destructive/10"><Trash2 className="size-4" /></button>
      </div>
    </article>
  )
}

function ProductTable({ products, onEdit, onDelete, onToggle, onStock, onQuickStock }: { products: SupplierProduct[]; onEdit: (product: SupplierProduct) => void; onDelete: (product: SupplierProduct) => void; onToggle: (product: SupplierProduct) => void; onStock: (product: SupplierProduct) => void; onQuickStock: (product: SupplierProduct, delta: number) => void }) {
  return (
    <section className="ordr-panel overflow-hidden rounded-[2rem]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b bg-background/70 text-xs font-black uppercase tracking-wide text-muted-foreground">
            <tr><th className="px-5 py-4">Produto</th><th className="px-5 py-4">SKU</th><th className="px-5 py-4">Categoria</th><th className="px-5 py-4">Tabela</th><th className="px-5 py-4">Preço</th><th className="px-5 py-4">Estoque</th><th className="px-5 py-4 text-right">Ações</th></tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={`${product.tableId}-${product.id}`} className={clsx('border-b last:border-0', product.active === false && 'opacity-60')}>
                <td className="px-5 py-4"><p className="font-black">{product.name}</p><p className="text-xs font-bold text-muted-foreground">{product.active === false ? 'Inativo' : 'Ativo'} · {numberText(product.quantity)} {product.unit}</p></td>
                <td className="px-5 py-4 font-bold text-muted-foreground">{product.sku ?? '—'}</td>
                <td className="px-5 py-4 font-bold text-muted-foreground">{product.category ?? '—'}</td>
                <td className="px-5 py-4 font-bold">{product.tableName ?? '—'}</td>
                <td className="px-5 py-4 font-black text-primary">{money(product.price)}</td>
                <td className="px-5 py-4 font-bold">{product.stockEnabled ? `${numberText(product.stockQuantity)} / mín. ${numberText(product.minStockQuantity)}` : '—'}</td>
                <td className="px-5 py-4"><div className="flex justify-end gap-2"><button onClick={() => onToggle(product)} className="grid size-9 place-items-center rounded-xl border">{product.active === false ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button><button onClick={() => onQuickStock(product, -1)} disabled={!product.stockEnabled} className="grid size-9 place-items-center rounded-xl border disabled:opacity-40"><Minus className="size-4" /></button><button onClick={() => onQuickStock(product, 1)} disabled={!product.stockEnabled} className="grid size-9 place-items-center rounded-xl border disabled:opacity-40"><Plus className="size-4" /></button><button onClick={() => onStock(product)} className="grid size-9 place-items-center rounded-xl border text-primary"><SlidersHorizontal className="size-4" /></button><button onClick={() => onEdit(product)} className="grid size-9 place-items-center rounded-xl border"><Edit3 className="size-4" /></button><button onClick={() => onDelete(product)} className="grid size-9 place-items-center rounded-xl border text-destructive"><Trash2 className="size-4" /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ItemModal({ title, tables, form, setForm, onSubmit, onClose, saving }: { title: string; tables: SupplierPriceTable[]; form: PriceTableItemPayload & { tableId: string }; setForm: (updater: (value: PriceTableItemPayload & { tableId: string }) => PriceTableItemPayload & { tableId: string }) => void; onSubmit: (event: FormEvent) => void; onClose: () => void; saving: boolean }) {
  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2"><span className="text-sm font-black">Tabela de preço</span><select className="ordr-input" value={form.tableId} onChange={(e) => setForm((f) => ({ ...f, tableId: e.target.value }))} required>{tables.map((table) => <option key={table.id} value={table.id}>{table.name}{table.active ? '' : ' · pausada'}</option>)}</select></label>
          <label className="space-y-2 md:col-span-2"><span className="text-sm font-black">Nome</span><input className="ordr-input" value={form.itemName} onChange={(e) => setForm((f) => ({ ...f, itemName: e.target.value }))} required /></label>
          <label className="space-y-2"><span className="text-sm font-black">SKU</span><input className="ordr-input" value={form.sku ?? ''} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value.toUpperCase() }))} /></label>
          <label className="space-y-2"><span className="text-sm font-black">Categoria</span><input className="ordr-input" value={form.category ?? ''} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} /></label>
          <label className="space-y-2"><span className="text-sm font-black">Unidade</span><select className="ordr-input" value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}>{units.map((unit) => <option key={unit}>{unit}</option>)}</select></label>
          <label className="space-y-2"><span className="text-sm font-black">Quantidade</span><input type="number" step="0.001" className="ordr-input" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} /></label>
          <label className="space-y-2 md:col-span-2"><span className="text-sm font-black">Preço unitário</span><input type="number" step="0.01" className="ordr-input" value={form.unitPrice} onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))} /></label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex items-center justify-between rounded-2xl border bg-background/45 p-4"><span className="font-black">Produto ativo</span><input type="checkbox" checked={form.active !== false} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="size-5 accent-emerald-500" /></label>
          <label className="flex items-center justify-between rounded-2xl border bg-background/45 p-4"><span className="font-black">Controlar estoque</span><input type="checkbox" checked={Boolean(form.stockEnabled)} onChange={(e) => setForm((f) => ({ ...f, stockEnabled: e.target.checked }))} className="size-5 accent-emerald-500" /></label>
        </div>
        {form.stockEnabled ? <div className="grid gap-4 md:grid-cols-2"><label className="space-y-2"><span className="text-sm font-black">Estoque atual</span><input type="number" step="0.001" className="ordr-input" value={form.stockQuantity ?? '0'} onChange={(e) => setForm((f) => ({ ...f, stockQuantity: e.target.value }))} /></label><label className="space-y-2"><span className="text-sm font-black">Estoque mínimo</span><input type="number" step="0.001" className="ordr-input" value={form.minStockQuantity ?? '0'} onChange={(e) => setForm((f) => ({ ...f, minStockQuantity: e.target.value }))} /></label></div> : null}
        <label className="space-y-2"><span className="text-sm font-black">Informações do item</span><textarea className="ordr-input min-h-24" value={form.notes ?? ''} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></label>
        <Actions saving={saving} onCancel={onClose} />
      </form>
    </Modal>
  )
}

function Info({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return <div className="rounded-2xl border bg-background/55 p-3"><p className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">{label}</p><p className={clsx('mt-1 truncate text-sm font-black', highlight && 'text-primary')}>{value}</p></div>
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <div className="modal-backdrop"><div className="modal-card ordr-panel max-h-[92vh] overflow-y-auto p-5 md:p-6"><div className="mb-5 flex items-start justify-between gap-4"><div><span className="ordr-kicker"><Layers className="size-3.5" /> Gestão</span><h2 className="mt-3 text-2xl font-black tracking-tight">{title}</h2></div><button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-2xl border bg-background/70"><X className="size-4" /></button></div>{children}</div></div>
}

function Actions({ saving, onCancel }: { saving: boolean; onCancel: () => void }) {
  return <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onCancel} className="ordr-button-soft">Cancelar</button><button className="ordr-button-primary" disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : null}Salvar</button></div>
}
