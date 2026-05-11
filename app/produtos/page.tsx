'use client'

import { useEffect, useMemo, useState } from 'react'
import { Grid2X2, List, Loader2, PackageSearch, Search } from 'lucide-react'
import { SupplierShell } from '@/components/layout/supplier-shell'
import { supplierApi, type SupplierProduct } from '@/lib/api'
import { clsx } from 'clsx'

function money(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function ProdutosPage() {
  const [products, setProducts] = useState<SupplierProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [query, setQuery] = useState('')

  useEffect(() => {
    supplierApi.products()
      .then((result) => setProducts(result.products ?? []))
      .finally(() => setLoading(false))
  }, [])

  const filteredProducts = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return products
    return products.filter((product) => {
      return `${product.name} ${product.itemName} ${product.sku ?? ''} ${product.category ?? ''} ${product.tableName ?? ''}`.toLowerCase().includes(term)
    })
  }, [products, query])

  return (
    <SupplierShell>
      <div className="space-y-4 pb-24 lg:pb-0">
        <section className="ordr-panel rounded-[2rem] p-5 md:p-7">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <span className="ordr-kicker"><PackageSearch className="size-3.5" /> Produtos</span>
              <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">Catálogo do fornecedor</h1>
              <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-muted-foreground">
                Os produtos são montados a partir dos itens das tabelas de preço. Edite preços e cadastro pela tela de tabelas.
              </p>
            </div>
            <div className="flex rounded-2xl border bg-background/65 p-1">
              <button onClick={() => setView('grid')} className={clsx('grid size-10 place-items-center rounded-xl', view === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>
                <Grid2X2 className="size-4" />
              </button>
              <button onClick={() => setView('list')} className={clsx('grid size-10 place-items-center rounded-xl', view === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>
                <List className="size-4" />
              </button>
            </div>
          </div>

          <div className="relative mt-6 max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar produto, SKU, categoria ou tabela..." className="ordr-input pl-11" />
          </div>
        </section>

        {loading ? (
          <div className="ordr-panel flex items-center justify-center gap-3 rounded-[2rem] p-10 text-sm font-black text-muted-foreground">
            <Loader2 className="size-5 animate-spin text-primary" /> Carregando produtos...
          </div>
        ) : view === 'grid' ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard key={`${product.tableId}-${product.id}`} product={product} />
            ))}
          </section>
        ) : (
          <section className="ordr-panel overflow-hidden rounded-[2rem]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b bg-background/60 text-xs font-black uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-4">Produto</th>
                    <th className="px-5 py-4">SKU</th>
                    <th className="px-5 py-4">Tabela</th>
                    <th className="px-5 py-4">Quantidade</th>
                    <th className="px-5 py-4 text-right">Preço</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={`${product.tableId}-${product.id}`} className="border-b last:border-0">
                      <td className="px-5 py-4">
                        <p className="font-black">{product.name}</p>
                        <p className="text-xs font-bold text-muted-foreground">{product.category ?? 'Sem categoria'}</p>
                      </td>
                      <td className="px-5 py-4 font-bold text-muted-foreground">{product.sku ?? '—'}</td>
                      <td className="px-5 py-4 font-bold">{product.tableName ?? '—'}</td>
                      <td className="px-5 py-4 font-bold">{product.quantity} {product.unit}</td>
                      <td className="px-5 py-4 text-right font-black text-primary">{money(product.price)}</td>
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
            <p className="mt-1 text-sm font-bold text-muted-foreground">Cadastre itens em uma tabela de preços para eles aparecerem aqui.</p>
          </div>
        ) : null}
      </div>
    </SupplierShell>
  )
}

function ProductCard({ product }: { product: SupplierProduct }) {
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
    </article>
  )
}
