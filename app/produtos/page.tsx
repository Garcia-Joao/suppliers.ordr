'use client'

import { useEffect, useState } from 'react'
import { SupplierShell } from '@/components/layout/supplier-shell'
import { supplierApi, type SupplierProduct } from '@/lib/api'

const fallback: SupplierProduct[] = [
  { id: '1', name: 'Cachaça branca 910ml', category: 'Bebidas', unit: 'un.', price: 32, linkedStockProductName: 'Cachaça Branca' },
  { id: '2', name: 'Limão tahiti', category: 'Hortifruti', unit: 'kg', price: 14, linkedStockProductName: 'Limão' },
  { id: '3', name: 'Copo descartável 300ml', category: 'Descartáveis', unit: 'pct.', price: 18.5 },
]

export default function ProductsPage() {
  const [products, setProducts] = useState<SupplierProduct[]>(fallback)
  const [query, setQuery] = useState('')
  const filtered = products.filter((p) => `${p.name} ${p.category} ${p.linkedStockProductName}`.toLowerCase().includes(query.toLowerCase()))

  useEffect(() => {
    supplierApi.products().then((r) => setProducts(r.products)).catch(() => setProducts(fallback))
  }, [])

  return (
    <SupplierShell>
      <section className="glass-card rounded-[2rem] p-5 md:p-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div><p className="text-sm font-black uppercase tracking-[0.25em] text-primary">Produtos</p><h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">Catálogo do fornecedor</h1><p className="mt-3 max-w-2xl text-muted-foreground">Consulte produtos livres e produtos vinculados ao estoque do ORDR.</p></div>
          <input value={query} onChange={(e) => setQuery(e.target.value)} className="rounded-2xl border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary" placeholder="Buscar produto..." />
        </div>
        <div className="overflow-hidden rounded-[1.5rem] border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary"><tr><th className="p-4 text-left">Produto</th><th className="p-4 text-left">Categoria</th><th className="p-4 text-left">Vínculo</th><th className="p-4 text-right">Preço</th></tr></thead>
            <tbody>{filtered.map((product) => <tr key={product.id} className="border-t"><td className="p-4 font-black">{product.name}</td><td className="p-4">{product.category || '-'}</td><td className="p-4 text-muted-foreground">{product.linkedStockProductName || 'Item livre'}</td><td className="p-4 text-right font-black">{money(product.price)} / {product.unit}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </SupplierShell>
  )
}
function money(value: number) { return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
