'use client'

import { useEffect, useState } from 'react'
import { SupplierShell } from '@/components/layout/supplier-shell'
import { supplierApi, type SupplierOrder } from '@/lib/api'

const fallback: SupplierOrder[] = [
  { id: '1', code: 'REQ-1042', status: 'pending', requestedAt: '2026-05-11', neededBy: '2026-05-13', total: 840, items: [{ id: 'a', name: 'Cachaça branca', quantity: 12, unit: 'un.', price: 32 }, { id: 'b', name: 'Limão tahiti', quantity: 20, unit: 'kg', price: 14 }] },
  { id: '2', code: 'REQ-1038', status: 'accepted', requestedAt: '2026-05-10', neededBy: '2026-05-12', total: 520, items: [{ id: 'c', name: 'Gelo', quantity: 30, unit: 'kg', price: 9 }] },
]

export default function OrdersPage() {
  const [orders, setOrders] = useState<SupplierOrder[]>(fallback)
  const [selected, setSelected] = useState<SupplierOrder | null>(null)

  useEffect(() => {
    supplierApi.orders().then((r) => setOrders(r.orders)).catch(() => setOrders(fallback))
  }, [])

  return (
    <SupplierShell>
      <section className="glass-card rounded-[2rem] p-5 md:p-8">
        <Header eyebrow="Pedidos" title="Requisições de compra" description="Veja os pedidos enviados pelo ORDR e acompanhe itens, prazos e valores." />
        <div className="grid gap-4">
          {orders.map((order) => (
            <button key={order.id} onClick={() => setSelected(order)} className="rounded-[1.5rem] border bg-card p-5 text-left transition hover:-translate-y-0.5 hover:shadow-xl">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div><p className="text-xl font-black">{order.code}</p><p className="text-sm text-muted-foreground">{order.items.length} itens · criado em {order.requestedAt}</p></div>
                <div className="flex items-center gap-3"><Badge>{statusLabel(order.status)}</Badge><strong>{money(order.total)}</strong></div>
              </div>
            </button>
          ))}
        </div>
      </section>
      {selected && <OrderModal order={selected} onClose={() => setSelected(null)} />}
    </SupplierShell>
  )
}

function OrderModal({ order, onClose }: { order: SupplierOrder; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"><div className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-[2rem] bg-background p-6 shadow-2xl"><div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-sm font-black text-primary">{statusLabel(order.status)}</p><h2 className="text-3xl font-black">{order.code}</h2><p className="text-muted-foreground">Necessário até {order.neededBy || '-'}</p></div><button onClick={onClose} className="rounded-2xl border px-4 py-2 font-bold">Fechar</button></div><div className="overflow-hidden rounded-2xl border"><table className="w-full text-sm"><thead className="bg-secondary"><tr><th className="p-3 text-left">Item</th><th className="p-3 text-left">Qtd.</th><th className="p-3 text-right">Preço</th></tr></thead><tbody>{order.items.map((item) => <tr key={item.id} className="border-t"><td className="p-3 font-bold">{item.name}</td><td className="p-3">{item.quantity}{item.unit}</td><td className="p-3 text-right">{money(item.price)}</td></tr>)}</tbody></table></div></div></div>
}
function Header({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) { return <div className="mb-8"><p className="text-sm font-black uppercase tracking-[0.25em] text-primary">{eyebrow}</p><h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">{title}</h1><p className="mt-3 max-w-2xl text-muted-foreground">{description}</p></div> }
function Badge({ children }: { children: React.ReactNode }) { return <span className="rounded-full bg-secondary px-3 py-1 text-xs font-black uppercase">{children}</span> }
function money(value: number) { return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }
function statusLabel(status: string) { return ({ pending: 'Pendente', accepted: 'Aceito', delivered: 'Entregue', cancelled: 'Cancelado' } as Record<string, string>)[status] || status }
