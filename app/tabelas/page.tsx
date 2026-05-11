'use client'

import { useEffect, useState } from 'react'
import { SupplierShell } from '@/components/layout/supplier-shell'
import { supplierApi, type SupplierPriceTable } from '@/lib/api'
import { Plus } from 'lucide-react'

const fallback: SupplierPriceTable[] = [
  { id: '1', name: 'Bebidas - Maio 2026', active: true, updatedAt: '2026-05-11', itemCount: 28, averagePrice: 31.9 },
  { id: '2', name: 'Hortifruti semanal', active: true, updatedAt: '2026-05-09', itemCount: 16, averagePrice: 12.4 },
  { id: '3', name: 'Descartáveis', active: false, updatedAt: '2026-04-28', itemCount: 12, averagePrice: 18.7 },
]

export default function PriceTablesPage() {
  const [tables, setTables] = useState<SupplierPriceTable[]>(fallback)

  useEffect(() => {
    supplierApi.priceTables().then((r) => setTables(r.tables)).catch(() => setTables(fallback))
  }, [])

  return (
    <SupplierShell>
      <section className="glass-card rounded-[2rem] p-5 md:p-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-primary">Tabelas</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">Tabelas de preço</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">Organize listas comerciais por categoria, período ou local de atendimento.</p>
          </div>
          <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 font-black text-primary-foreground"><Plus className="size-4" /> Nova tabela</button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tables.map((table) => (
            <article key={table.id} className="rounded-[1.5rem] border bg-card p-5">
              <div className="mb-8 flex items-center justify-between gap-3"><span className="rounded-full bg-secondary px-3 py-1 text-xs font-black uppercase">{table.active ? 'Ativa' : 'Inativa'}</span><span className="text-xs font-bold text-muted-foreground">{table.updatedAt}</span></div>
              <h2 className="text-2xl font-black">{table.name}</h2>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-secondary p-4"><p className="text-xs font-bold text-muted-foreground">Itens</p><p className="text-2xl font-black">{table.itemCount}</p></div>
                <div className="rounded-2xl bg-secondary p-4"><p className="text-xs font-bold text-muted-foreground">Média</p><p className="text-2xl font-black">{money(table.averagePrice)}</p></div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </SupplierShell>
  )
}
function money(value: number) { return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
