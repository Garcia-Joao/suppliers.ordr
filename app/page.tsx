'use client'

import { useEffect, useState } from 'react'
import { SupplierShell } from '@/components/layout/supplier-shell'
import { supplierApi, type DashboardData } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/auth'
import { ClipboardList, PackageCheck, TableProperties, TrendingUp } from 'lucide-react'

const fallback: DashboardData = {
  pendingOrders: 8,
  monthlyRevenue: 12840,
  activePriceTables: 3,
  linkedProducts: 42,
  recentOrders: [
    { id: '1', code: 'REQ-1042', status: 'pending', requestedAt: '2026-05-11', neededBy: '2026-05-13', total: 840, items: [{ id: 'a', name: 'Cachaça branca', quantity: 12, unit: 'un.', price: 32 }] },
    { id: '2', code: 'REQ-1038', status: 'accepted', requestedAt: '2026-05-10', neededBy: '2026-05-12', total: 520, items: [{ id: 'b', name: 'Limão tahiti', quantity: 10, unit: 'kg', price: 14 }] },
  ],
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData>(fallback)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth.get()) {
      router.push('/login')
      return
    }
    supplierApi.dashboard().then(setData).catch(() => setData(fallback)).finally(() => setLoading(false))
  }, [router])

  return (
    <SupplierShell>
      <section className="glass-card rounded-[2rem] p-5 md:p-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-primary">Resumo</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">Portal do fornecedor</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">Acompanhe requisições de compra, tabelas de preço e produtos vinculados ao ORDR.</p>
          </div>
          <span className="rounded-2xl border bg-background/60 px-4 py-2 text-sm font-bold text-muted-foreground">{loading ? 'Sincronizando...' : 'Atualizado'}</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric icon={ClipboardList} label="Pedidos pendentes" value={data.pendingOrders.toString()} />
          <Metric icon={TrendingUp} label="Faturamento mês" value={money(data.monthlyRevenue)} />
          <Metric icon={TableProperties} label="Tabelas ativas" value={data.activePriceTables.toString()} />
          <Metric icon={PackageCheck} label="Produtos vinculados" value={data.linkedProducts.toString()} />
        </div>

        <div className="mt-8 rounded-[1.5rem] border bg-background/55 p-4">
          <h2 className="mb-4 text-xl font-black">Últimas requisições</h2>
          <div className="space-y-3">
            {data.recentOrders.map((order) => (
              <div key={order.id} className="flex flex-col justify-between gap-3 rounded-2xl border bg-card p-4 md:flex-row md:items-center">
                <div>
                  <p className="font-black">{order.code}</p>
                  <p className="text-sm text-muted-foreground">{order.items.length} itens · necessário até {order.neededBy || '-'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-black uppercase">{statusLabel(order.status)}</span>
                  <strong>{money(order.total)}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SupplierShell>
  )
}

function Metric({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return <div className="rounded-[1.5rem] border bg-card p-5"><Icon className="mb-4 size-6 text-primary" /><p className="text-sm font-bold text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-black">{value}</p></div>
}
function money(value: number) { return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function statusLabel(status: string) { return ({ pending: 'Pendente', accepted: 'Aceito', delivered: 'Entregue', cancelled: 'Cancelado' } as Record<string, string>)[status] || status }
