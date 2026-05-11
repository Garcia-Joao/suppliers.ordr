'use client'

import { Clock3, ClipboardList } from 'lucide-react'
import { SupplierShell } from '@/components/layout/supplier-shell'

export default function PedidosPage() {
  return (
    <SupplierShell>
      <div className="pb-24 lg:pb-0">
        <section className="ordr-panel relative overflow-hidden rounded-[2rem] p-6 md:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative max-w-3xl">
            <span className="ordr-kicker"><ClipboardList className="size-3.5" /> Pedidos</span>
            <h1 className="mt-4 text-3xl font-black tracking-tight md:text-6xl">Pedidos em breve</h1>
            <p className="mt-4 text-base font-semibold leading-7 text-muted-foreground md:text-lg">
              A área de pedidos está pausada por enquanto. Quando ativarmos, o fornecedor poderá receber, aceitar e acompanhar requisições diretamente por aqui.
            </p>
            <div className="mt-8 inline-flex items-center gap-3 rounded-[1.5rem] border bg-background/65 px-5 py-4 text-sm font-black text-muted-foreground">
              <Clock3 className="size-5 text-primary" /> Fluxo reservado para a próxima etapa
            </div>
          </div>
        </section>
      </div>
    </SupplierShell>
  )
}
