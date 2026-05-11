'use client'

import Link from 'next/link'
import { ClipboardList, Clock, Package, Sparkles } from 'lucide-react'

export default function PedidosPage() {
  return (
    <div className="supplier-page space-y-6">
      <section className="supplier-card overflow-hidden rounded-[2rem]">
        <div className="relative p-5 md:p-8">
          <div className="pointer-events-none absolute right-0 top-0 h-52 w-52 rounded-full bg-emerald-300/20 blur-3xl" />
          <p className="supplier-chip supplier-chip-primary">
            <ClipboardList size={14} />
            Pedidos
          </p>
          <h1 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">Pedidos em breve</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[var(--supplier-muted)]">
            Esta área está pausada por enquanto. Quando ativada, fornecedores poderão receber solicitações de compra diretamente pelo painel.
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <InfoCard icon={<Package size={22} />} title="Produtos já funcionais" text="Mantenha seu catálogo e estoque preparados para pedidos futuros." href="/produtos" />
        <InfoCard icon={<Clock size={22} />} title="Horários de expediente" text="O status online já considera sua disponibilidade e expediente." href="/perfil" />
        <InfoCard icon={<Sparkles size={22} />} title="Próxima etapa" text="Pedidos poderão ser aceitos, separados e concluídos pelo fornecedor." href="/tabelas" />
      </section>
    </div>
  )
}

function InfoCard({ icon, title, text, href }: { icon: React.ReactNode; title: string; text: string; href: string }) {
  return (
    <Link href={href} className="supplier-card-flat block rounded-[2rem] p-5 transition hover:-translate-y-1 hover:border-emerald-300">
      <span className="grid size-12 place-items-center rounded-2xl bg-emerald-500/10 text-[var(--supplier-primary-strong)] dark:text-[var(--supplier-primary)]">
        {icon}
      </span>
      <h2 className="mt-5 text-xl font-black">{title}</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-[var(--supplier-muted)]">{text}</p>
    </Link>
  )
}
