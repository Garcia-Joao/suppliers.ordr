import { Leaf, PackageCheck } from 'lucide-react'

export function SuppliersBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-emerald-500/20">
        <PackageCheck className="size-5" />
      </div>
      {!compact && (
        <div>
          <div className="flex items-center gap-2 text-lg font-black tracking-tight">
            ORDR Suppliers <Leaf className="size-4 text-primary" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Portal de fornecedores</p>
        </div>
      )}
    </div>
  )
}
