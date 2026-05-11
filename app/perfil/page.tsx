'use client'

import { useEffect, useState } from 'react'
import { SupplierShell } from '@/components/layout/supplier-shell'
import { supplierApi, type SupplierProfile } from '@/lib/api'

const fallback: SupplierProfile = { id: '1', name: 'Fornecedor Exemplo', document: '00.000.000/0001-00', email: 'comercial@fornecedor.com', phone: '(11) 99999-9999', address: 'São Paulo - SP', categories: ['Bebidas', 'Hortifruti', 'Descartáveis'] }

export default function ProfilePage() {
  const [supplier, setSupplier] = useState<SupplierProfile>(fallback)
  useEffect(() => { supplierApi.profile().then((r) => setSupplier(r.supplier)).catch(() => setSupplier(fallback)) }, [])
  const image = supplier.photoData || supplier.photoUrl

  return (
    <SupplierShell>
      <section className="glass-card rounded-[2rem] p-5 md:p-8">
        <div className="mb-8"><p className="text-sm font-black uppercase tracking-[0.25em] text-primary">Perfil</p><h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">Dados do fornecedor</h1></div>
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="rounded-[2rem] border bg-card p-5">
            <div className="grid aspect-square place-items-center overflow-hidden rounded-[1.5rem] bg-secondary">
              {image ? <img src={image} alt={supplier.name} className="h-full w-full object-cover" /> : <span className="text-6xl font-black text-primary">{supplier.name.slice(0, 1)}</span>}
            </div>
            <h2 className="mt-5 text-2xl font-black">{supplier.name}</h2>
            <div className="mt-3 flex flex-wrap gap-2">{supplier.categories.map((cat) => <span key={cat} className="rounded-full bg-secondary px-3 py-1 text-xs font-black">{cat}</span>)}</div>
          </div>
          <div className="rounded-[2rem] border bg-card p-5">
            <dl className="grid gap-4 md:grid-cols-2">
              <Info label="Documento" value={supplier.document} />
              <Info label="E-mail" value={supplier.email} />
              <Info label="Telefone" value={supplier.phone} />
              <Info label="Endereço" value={supplier.address} />
            </dl>
          </div>
        </div>
      </section>
    </SupplierShell>
  )
}
function Info({ label, value }: { label: string; value?: string | null }) { return <div className="rounded-2xl bg-secondary p-4"><dt className="text-xs font-black uppercase text-muted-foreground">{label}</dt><dd className="mt-1 font-bold">{value || '-'}</dd></div> }
