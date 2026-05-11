import { Leaf } from 'lucide-react'

function OrdrMark() {
  return (
    <svg viewBox="0 0 188.6 187.58" aria-hidden="true" className="size-6 fill-current">
      <path d="M45.77,109.15c1.02-.59,1.56-1.78,1.3-2.93-.88-3.9-1.33-8.05-1.33-12.43,0-14.22,4.62-25.91,13.88-35.07,9.25-9.16,20.81-13.75,34.69-13.75s25.44,4.58,34.69,13.75c0,0,.01.01.02.02.88.88,2.23,1.07,3.31.45l35.15-20.3c1.46-.84,1.82-2.79.75-4.1-2.16-2.64-4.48-5.2-6.98-7.68C142.99,9.04,120.68,0,94.3,0S45.61,9.04,27.37,27.11C9.12,45.18,0,67.41,0,93.79c0,12.46,2.05,23.99,6.13,34.59.6,1.57,2.47,2.23,3.92,1.39l35.72-20.62Z" />
      <path d="M142.84,78.43c-1.02.59-1.56,1.78-1.3,2.93.88,3.9,1.33,8.05,1.33,12.43,0,14.22-4.62,25.91-13.88,35.07-9.25,9.17-20.81,13.75-34.69,13.75s-25.44-4.58-34.69-13.75c0,0-.01-.01-.02-.02-.88-.88-2.23-1.07-3.31-.45l-35.15,20.3c-1.46.84-1.82,2.79-.75,4.1,2.16,2.64,4.48,5.2,6.99,7.68,18.24,18.07,40.55,27.11,66.94,27.11s48.69-9.03,66.94-27.11c18.24-18.07,27.37-40.3,27.37-66.68,0-12.46-2.05-23.99-6.13-34.59-.6-1.57-2.47-2.23-3.92-1.39l-35.72,20.62Z" />
    </svg>
  )
}

export function SuppliersBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-emerald-500/20">
        <OrdrMark />
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
