'use client'

import { ClipboardList, Construction, PackageCheck } from 'lucide-react'
import { SupplierShell } from '@/components/layout/supplier-shell'

export default function OrdersPage() {
  return (
    <SupplierShell>
      <section className="grid min-h-[70vh] place-items-center rounded-[2rem] border bg-card p-8 text-center">
        <div className="max-w-2xl">
          <div className="mx-auto mb-6 grid size-20 place-items-center rounded-[2rem] bg-secondary">
            <Construction className="size-9 text-primary" />
          </div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-primary">Pedidos</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">Pedidos pausados por enquanto</h1>
          <p className="mt-4 text-muted-foreground md:text-lg">
            Essa área vai receber as requisições de compra enviadas pelas empresas ORDR. Por enquanto, seguimos com foco em Dashboard, Produtos e Tabelas de preço.
          </p>
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            <Info icon={ClipboardList} title="Requisições" text="Aqui aparecerão pedidos recebidos, prazos e status." />
            <Info icon={PackageCheck} title="Entrega" text="Depois poderemos aceitar, separar e concluir pedidos." />
          </div>
        </div>
      </section>
    </SupplierShell>
  )
}

function Info({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return <div className="rounded-2xl border bg-background/60 p-4 text-left"><Icon className="mb-3 size-5 text-primary" /><h2 className="font-black">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{text}</p></div>
}
