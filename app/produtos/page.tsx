'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, PackageSearch, Search, TableProperties } from 'lucide-react'
import { SupplierShell } from '@/components/layout/supplier-shell'
import { supplierApi, type SupplierProduct } from '@/lib/api'

export default function ProductsPage() {
  const [products, setProducts] = useState<SupplierProduct[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supplierApi.products()
      .then((result) => setProducts(result.products))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase()
    if (!search) return products
    return products.filter((product) =>
      [product.name, product.sku, product.category, product.tableName, product.linkedStockProductName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(search)
    )
  }, [products, query])

  return (
    <SupplierShell>
      <section className="space-y-4 pb-24 lg:pb-0">
        <div className="rounded-[2rem] border bg-card p-5 md:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-primary">Produtos</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">Catálogo de preços</h1>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                Os produtos são gerados a partir dos itens cadastrados nas suas tabelas de preço.
              </p>
            </div>
            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full rounded-2xl border bg-background py-3 pl-11 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
                placeholder="Buscar produto, tabela ou SKU..."
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[2rem] border bg-card p-8 text-center text-sm font-black text-muted-foreground">
            <Loader2 className="mx-auto mb-3 size-6 animate-spin text-primary" /> Carregando produtos...
          </div>
        ) : filtered.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((product) => (
              <article key={`${product.tableId}-${product.id}`} className="rounded-[1.75rem] border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl">
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div className="grid size-12 place-items-center rounded-2xl bg-secondary">
                    <PackageSearch className="size-5 text-primary" />
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-black uppercase">
                    {product.tableActive ? 'Ativo' : 'Tabela inativa'}
                  </span>
                </div>
                <h2 className="text-xl font-black">{product.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{product.category || 'Sem categoria'} · SKU {product.sku || '-'}</p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-secondary p-4">
                    <p className="text-xs font-bold text-muted-foreground">Preço</p>
                    <p className="text-2xl font-black">{money(product.unitPrice)}</p>
                  </div>
                  <div className="rounded-2xl bg-secondary p-4">
                    <p className="text-xs font-bold text-muted-foreground">Unidade</p>
                    <p className="text-2xl font-black">{formatQuantity(product.quantity)} {unitLabel(product.unit)}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-2xl border bg-background/60 px-3 py-2 text-xs font-bold text-muted-foreground">
                  <TableProperties className="size-4" /> {product.tableName || 'Tabela'}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border bg-card p-10 text-center">
            <PackageSearch className="mx-auto mb-4 size-10 text-primary" />
            <h2 className="text-2xl font-black">Nenhum produto encontrado</h2>
            <p className="mt-2 text-muted-foreground">Cadastre itens em uma tabela de preço para eles aparecerem aqui.</p>
          </div>
        )}
      </section>
    </SupplierShell>
  )
}

function money(value: number) { return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function formatQuantity(value: number) { return Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 3 }) }
function unitLabel(unit: string) { return unit === 'unit' ? 'un.' : unit }
