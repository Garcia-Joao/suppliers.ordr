export function SuppliersBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid size-12 place-items-center overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-[0_18px_42px_color-mix(in_oklch,var(--primary)_34%,transparent)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,.36),transparent_32%),linear-gradient(135deg,rgba(255,255,255,.16),transparent)]" />
        <svg
          viewBox="0 0 188.6 187.58"
          aria-hidden="true"
          className="relative size-7 fill-current"
        >
          <path d="M45.77,109.15c1.02-.59,1.56-1.78,1.3-2.93-.88-3.9-1.33-8.05-1.33-12.43,0-14.22,4.62-25.91,13.88-35.07,9.25-9.16,20.81-13.75,34.69-13.75s25.44,4.58,34.69,13.75c0,0,.01.01.02.02.88.88,2.23,1.07,3.31.45l35.15-20.3c1.46-.84,1.82-2.79.75-4.1-2.16-2.64-4.48-5.2-6.98-7.68C142.99,9.04,120.68,0,94.3,0S45.61,9.04,27.37,27.11C9.12,45.18,0,67.41,0,93.79c0,12.46,2.05,23.99,6.13,34.59.6,1.57,2.47,2.23,3.92,1.39l35.72-20.62Z" />
          <path d="M142.84,78.43c-1.02.59-1.56,1.78-1.3,2.93.88,3.9,1.33,8.05,1.33,12.43,0,14.22-4.62,25.91-13.88,35.07-9.25,9.17-20.81,13.75-34.69,13.75s-25.44-4.58-34.69-13.75c0,0-.01-.01-.02-.02-.88-.88-2.23-1.07-3.31-.45l-35.15,20.3c-1.46.84-1.82,2.79-.75,4.1,2.16,2.64,4.48,5.2,6.99,7.68,18.24,18.07,40.55,27.11,66.94,27.11s48.69-9.03,66.94-27.11c18.24-18.07,27.37-40.3,27.37-66.68,0-12.46-2.05-23.99-6.13-34.59-.6-1.57-2.47-2.23-3.92-1.39l-35.72,20.62Z" />
        </svg>
      </div>
      {!compact ? (
        <div className="leading-tight">
          <p className="text-lg font-black tracking-tight">ORDR</p>
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">Suppliers</p>
        </div>
      ) : null}
    </div>
  )
}
