'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Edit3, Grid2X2, List, Loader2, PackageSearch, Plus, Search, Trash2, X } from 'lucide-react'
import { SupplierShell } from '@/components/layout/supplier-shell'
import { supplierApi, type PriceTableItemPayload, type SupplierPriceTable, type SupplierProduct } from '@/lib/api'
import { clsx } from 'clsx'

function money(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const emptyItemForm: PriceTableItemPayload & { tableId: string } = {
  tableId: '',
  itemName: '',
  sku: '',
  category: '',
  unit: 'un.',
  quantity: '1',
  unitPrice: '0',
  notes: '',
}

const units = ['un.', 'ml', 'l', 'g', 'kg']

export default function ProdutosPage() {
  const [tables, setTables] = useState<SupplierPriceTable[]>([])
  const [products, setProducts] = useState<SupplierProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [query, setQuery] = useState('')
  const [itemModal, setItemModal] = useState<{ mode: 'create' | 'edit'; product?: SupplierProduct } | null>(null)
  const [itemForm, setItemForm] = useState(emptyItemForm)

  async function load() {
    setLoading(true)
    try {
      const result = await supplierApi.priceTables()
      const nextTables = result.tables ?? []
      setTables(nextTables)
      setProducts(nextTables.flatMap((table) => table.items.map((item) => ({
        ...item,
        tableId: table.id,
        tableName: table.name,
        tableActive: table.active,
      }))))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load().catch(() => setLoading(false))
  }, [])

  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return products
    return products.filter((product) => {
      return `${product.name} ${product.itemName} ${product.sku ?? ''} ${product.category ?? ''} ${product.tableName ?? ''} ${product.notes ?? ''}`.toLowerCase().includes(term)
    })
  }, [products, query])

  const activeTables = useMemo(() => tables.filter((table) => table.active), [tables])

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
    })
    setItemModal({ mode: 'edit', product })
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

  async function deleteProduct(product: SupplierProduct) {
    if (!product.tableId) return
    if (!confirm(`Remover "${product.name}" da tabela ${product.tableName ?? ''}?`)) return
    await supplierApi.deletePriceTableItem(product.tableId, product.id)
    await load()
  }

  return (
    <SupplierShell>
      <div className="space-y-4 pb-24 lg:pb-0">
        <section className="ordr-panel rounded-[2rem] p-5 md:p-7">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <span className="ordr-kicker"><PackageSearch className="size-3.5" /> Produtos</span>
              <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">Catálogo do fornecedor</h1>
              <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-muted-foreground">
                Cadastre e edite itens do catálogo sem sair desta tela. Cada produto fica vinculado a uma tabela de preço.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={openCreateProduct} disabled={tables.length === 0} className="ordr-button-primary disabled:cursor-not-allowed disabled:opacity-60">
                <Plus className="size-4" /> Novo produto
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

          <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="relative max-w-2xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar produto, SKU, categoria, tabela ou observação..." className="ordr-input pl-11" />
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-black text-muted-foreground">
              <span className="rounded-full border bg-background/60 px-3 py-2">{products.length} produtos</span>
              <span className="rounded-full border bg-background/60 px-3 py-2">{tables.length} tabelas</span>
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
              <ProductCard key={`${product.tableId}-${product.id}`} product={product} onEdit={openEditProduct} onDelete={deleteProduct} />
            ))}
          </section>
        ) : (
          <section className="ordr-panel overflow-hidden rounded-[2rem]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b bg-background/60 text-xs font-black uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-4">Produto</th>
                    <th className="px-5 py-4">SKU</th>
                    <th className="px-5 py-4">Categoria</th>
                    <th className="px-5 py-4">Tabela</th>
                    <th className="px-5 py-4">Quantidade</th>
                    <th className="px-5 py-4 text-right">Preço</th>
                    <th className="px-5 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={`${product.tableId}-${product.id}`} className="border-b last:border-0">
                      <td className="px-5 py-4">
                        <p className="font-black">{product.name}</p>
                        <p className="max-w-xs truncate text-xs font-bold text-muted-foreground">{product.notes ?? 'Sem observações'}</p>
                      </td>
                      <td className="px-5 py-4 font-bold text-muted-foreground">{product.sku ?? '—'}</td>
                      <td className="px-5 py-4 font-bold text-muted-foreground">{product.category ?? '—'}</td>
                      <td className="px-5 py-4 font-bold">{product.tableName ?? '—'}</td>
                      <td className="px-5 py-4 font-bold">{product.quantity} {product.unit}</td>
                      <td className="px-5 py-4 text-right font-black text-primary">{money(product.price)}</td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEditProduct(product)} className="grid size-9 place-items-center rounded-xl border hover:bg-secondary"><Edit3 className="size-4" /></button>
                          <button onClick={() => deleteProduct(product)} className="grid size-9 place-items-center rounded-xl border text-destructive hover:bg-destructive/10"><Trash2 className="size-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {!loading && filteredProducts.length === 0 ? (
          <div className="ordr-panel rounded-[2rem] p-10 text-center">
            <PackageSearch className="mx-auto mb-3 size-8 text-muted-foreground" />
            <p className="font-black">Nenhum produto encontrado</p>
            <p className="mt-1 text-sm font-bold text-muted-foreground">Cadastre o primeiro produto pelo botão acima.</p>
          </div>
        ) : null}

        {itemModal ? (
          <div className="modal-backdrop">
            <form onSubmit={submitProduct} className="modal-card ordr-panel p-5 md:p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <span className="ordr-kicker">Produto</span>
                  <h2 className="mt-3 text-2xl font-black tracking-tight">{itemModal.mode === 'create' ? 'Novo produto' : 'Editar produto'}</h2>
                  <p className="mt-1 text-sm font-bold text-muted-foreground">SKU, categoria e informações comerciais do item.</p>
                </div>
                <button type="button" onClick={() => setItemModal(null)} className="grid size-10 place-items-center rounded-2xl border bg-background/70"><X className="size-4" /></button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 md:col-span-2"><span className="text-sm font-black">Tabela de preço</span><select className="ordr-input" value={itemForm.tableId} onChange={(e) => setItemForm((f) => ({ ...f, tableId: e.target.value }))} required>{tables.map((table) => <option key={table.id} value={table.id}>{table.name}{table.active ? '' : ' (inativa)'}</option>)}</select></label>
                <label className="space-y-2 md:col-span-2"><span className="text-sm font-black">Nome do item</span><input className="ordr-input" value={itemForm.itemName} onChange={(e) => setItemForm((f) => ({ ...f, itemName: e.target.value }))} required /></label>
                <label className="space-y-2"><span className="text-sm font-black">SKU / Código interno</span><input className="ordr-input" value={itemForm.sku ?? ''} onChange={(e) => setItemForm((f) => ({ ...f, sku: e.target.value.toUpperCase() }))} placeholder="Ex: COCA-2L" /></label>
                <label className="space-y-2"><span className="text-sm font-black">Categoria</span><input className="ordr-input" value={itemForm.category ?? ''} onChange={(e) => setItemForm((f) => ({ ...f, category: e.target.value }))} placeholder="Bebidas, Carnes, Limpeza..." /></label>
                <label className="space-y-2"><span className="text-sm font-black">Unidade</span><select className="ordr-input" value={itemForm.unit} onChange={(e) => setItemForm((f) => ({ ...f, unit: e.target.value }))}>{units.map((unit) => <option key={unit}>{unit}</option>)}</select></label>
                <label className="space-y-2"><span className="text-sm font-black">Quantidade por preço</span><input type="number" step="0.001" className="ordr-input" value={itemForm.quantity} onChange={(e) => setItemForm((f) => ({ ...f, quantity: e.target.value }))} /></label>
                <label className="space-y-2 md:col-span-2"><span className="text-sm font-black">Preço unitário</span><input type="number" step="0.01" className="ordr-input" value={itemForm.unitPrice} onChange={(e) => setItemForm((f) => ({ ...f, unitPrice: e.target.value }))} /></label>
                <label className="space-y-2 md:col-span-2"><span className="text-sm font-black">Informações do item</span><textarea className="ordr-input min-h-28" value={itemForm.notes ?? ''} onChange={(e) => setItemForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Marca, embalagem, validade média, observações de entrega..." /></label>
              </div>

              <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setItemModal(null)} className="ordr-button-soft">Cancelar</button><button className="ordr-button-primary" disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : null}Salvar</button></div>
            </form>
          </div>
        ) : null}
      </div>
    </SupplierShell>
  )
}

function ProductCard({ product, onEdit, onDelete }: { product: SupplierProduct; onEdit: (product: SupplierProduct) => void; onDelete: (product: SupplierProduct) => void }) {
  return (
    <article className="ordr-panel rounded-[2rem] p-5 transition hover:-translate-y-1 hover:border-primary">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <PackageSearch className="size-6" />
        </div>
        <span className={product.tableActive === false ? 'rounded-full bg-muted px-3 py-1 text-[11px] font-black uppercase text-muted-foreground' : 'rounded-full bg-primary/10 px-3 py-1 text-[11px] font-black uppercase text-primary'}>
          {product.tableActive === false ? 'Inativo' : 'Ativo'}
        </span>
      </div>
      <h2 className="line-clamp-2 text-xl font-black tracking-tight">{product.name}</h2>
      <p className="mt-1 text-sm font-bold text-muted-foreground">{product.tableName ?? 'Sem tabela'}</p>
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm font-bold">
        <div className="rounded-2xl border bg-background/60 p-3">
          <p className="text-xs text-muted-foreground">Quantidade</p>
          <p className="mt-1 font-black">{product.quantity} {product.unit}</p>
        </div>
        <div className="rounded-2xl border bg-background/60 p-3">
          <p className="text-xs text-muted-foreground">Preço</p>
          <p className="mt-1 font-black text-primary">{money(product.price)}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {product.sku ? <span className="rounded-full border px-3 py-1 text-xs font-black text-muted-foreground">SKU {product.sku}</span> : null}
        {product.category ? <span className="rounded-full border px-3 py-1 text-xs font-black text-muted-foreground">{product.category}</span> : null}
        {product.linkedStockProductName ? <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">Vinculado</span> : null}
      </div>
      {product.notes ? <p className="mt-4 line-clamp-2 text-sm font-bold leading-6 text-muted-foreground">{product.notes}</p> : null}
      <div className="mt-5 flex gap-2 border-t pt-4">
        <button onClick={() => onEdit(product)} className="ordr-button-soft flex-1"><Edit3 className="size-4" /> Editar</button>
        <button onClick={() => onDelete(product)} className="ordr-button-soft text-destructive"><Trash2 className="size-4" /></button>
      </div>
    </article>
  )
}
