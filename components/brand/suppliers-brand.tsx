import { PackageCheck } from 'lucide-react'

export function SuppliersBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-emerald-500/20">
        <span className="absolute inset-1 rounded-xl border border-primary-foreground/25" />
        <PackageCheck className="relative size-5" />
      </div>
      {!compact ? (
        <div className="leading-tight">
          <p className="text-base font-black tracking-tight">ORDR</p>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">Suppliers</p>
        </div>
      ) : null}
    </div>
  )
}
