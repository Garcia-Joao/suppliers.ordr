'use client'

import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { Camera, Loader2, Save } from 'lucide-react'
import { SupplierShell } from '@/components/layout/supplier-shell'
import { supplierApi, type OperatingHour, type SupplierProfile } from '@/lib/api'

const DEFAULT_HOURS: OperatingHour[] = [
  { day: 'sun', label: 'Domingo', enabled: false, startTime: '09:00', endTime: '13:00' },
  { day: 'mon', label: 'Segunda', enabled: true, startTime: '08:00', endTime: '18:00' },
  { day: 'tue', label: 'Terça', enabled: true, startTime: '08:00', endTime: '18:00' },
  { day: 'wed', label: 'Quarta', enabled: true, startTime: '08:00', endTime: '18:00' },
  { day: 'thu', label: 'Quinta', enabled: true, startTime: '08:00', endTime: '18:00' },
  { day: 'fri', label: 'Sexta', enabled: true, startTime: '08:00', endTime: '18:00' },
  { day: 'sat', label: 'Sábado', enabled: true, startTime: '09:00', endTime: '13:00' },
]

export default function ProfilePage() {
  const [profile, setProfile] = useState<SupplierProfile | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [categoryText, setCategoryText] = useState('')

  useEffect(() => {
    supplierApi.profile().then((result) => {
      setProfile(result.supplier)
      setCategoryText(result.supplier.categories.join(', '))
    }).finally(() => setLoading(false))
  }, [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!profile) return
    setSaving(true)
    try {
      const result = await supplierApi.updateProfile({
        ...profile,
        categories: categoryText.split(',').map((item) => item.trim()).filter(Boolean),
        operatingHours: profile.operatingHours,
      })
      setProfile(result.supplier)
      setCategoryText(result.supplier.categories.join(', '))
    } finally {
      setSaving(false)
    }
  }

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !profile) return
    const photoData = await compressImage(file)
    setProfile({ ...profile, photoData })
  }

  function setHour(index: number, patch: Partial<OperatingHour>) {
    if (!profile) return
    const operatingHours = [...(profile.operatingHours || DEFAULT_HOURS)]
    operatingHours[index] = { ...operatingHours[index], ...patch }
    setProfile({ ...profile, operatingHours })
  }

  return (
    <SupplierShell>
      <section className="space-y-4 pb-24 lg:pb-0">
        <div className="rounded-[2rem] border bg-card p-5 md:p-8">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-primary">Perfil</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">Dados do fornecedor</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">Configure visual, categorias, expediente e disponibilidade no portal ORDR.</p>
        </div>

        {loading || !profile ? (
          <div className="rounded-[2rem] border bg-card p-8 text-center text-sm font-black text-muted-foreground"><Loader2 className="mx-auto mb-3 size-6 animate-spin text-primary" />Carregando perfil...</div>
        ) : (
          <form onSubmit={submit} className="grid gap-4 xl:grid-cols-[0.75fr_1.25fr]">
            <aside className="rounded-[2rem] border bg-card p-5">
              <div className="relative overflow-hidden rounded-[1.75rem] border bg-secondary aspect-video">
                {profile.photoData || profile.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.photoData || profile.photoUrl || ''} alt={profile.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-5xl font-black text-primary">{profile.name.slice(0, 2).toUpperCase()}</div>
                )}
              </div>
              <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black hover:bg-secondary">
                <Camera className="size-4" /> Selecionar imagem
                <input type="file" accept="image/*" className="hidden" onChange={onFile} />
              </label>

              <div className="mt-5 rounded-2xl bg-secondary p-4">
                <p className="text-xs font-black uppercase text-muted-foreground">Código ORDR</p>
                <p className="mt-1 text-3xl font-black tracking-widest">{profile.ordrCode || '-'}</p>
                <p className="mt-2 text-xs text-muted-foreground">Esse código é gerado automaticamente e não pode ser alterado.</p>
              </div>

              <label className="mt-4 flex items-center justify-between rounded-2xl border p-4 font-black">
                <span>Disponibilizar online</span>
                <input type="checkbox" checked={profile.onlineEnabled} onChange={(e) => setProfile({ ...profile, onlineEnabled: e.target.checked })} />
              </label>
            </aside>

            <main className="space-y-4">
              <div className="rounded-[2rem] border bg-card p-5">
                <h2 className="mb-5 text-2xl font-black">Informações principais</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Nome" value={profile.name} onChange={(name) => setProfile({ ...profile, name })} required />
                  <Field label="Documento" value={profile.document || ''} onChange={(document) => setProfile({ ...profile, document })} />
                  <Field label="Contato" value={profile.contactName || ''} onChange={(contactName) => setProfile({ ...profile, contactName })} />
                  <Field label="Telefone" value={profile.phone || ''} onChange={(phone) => setProfile({ ...profile, phone })} />
                  <Field label="E-mail" value={profile.email || ''} onChange={(email) => setProfile({ ...profile, email })} />
                  <Field label="Categorias" value={categoryText} onChange={setCategoryText} placeholder="Bebidas, Carnes, Hortifruti" />
                </div>
                <Field label="Endereço" value={profile.address || ''} onChange={(address) => setProfile({ ...profile, address })} className="mt-4" />
                <label className="mt-4 grid gap-2 text-sm font-black">Observações<textarea value={profile.notes || ''} onChange={(e) => setProfile({ ...profile, notes: e.target.value })} className="min-h-28 rounded-2xl border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary" /></label>
              </div>

              <div className="rounded-[2rem] border bg-card p-5">
                <h2 className="mb-1 text-2xl font-black">Horário de funcionamento</h2>
                <p className="mb-5 text-sm text-muted-foreground">O status online automático só fica ativo dentro dos horários habilitados.</p>
                <div className="space-y-3">
                  {(profile.operatingHours || DEFAULT_HOURS).map((hour, index) => (
                    <div key={hour.day} className="grid gap-3 rounded-2xl border bg-background/60 p-3 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
                      <label className="flex items-center gap-3 font-black"><input type="checkbox" checked={hour.enabled} onChange={(e) => setHour(index, { enabled: e.target.checked })} />{hour.label}</label>
                      <input type="time" value={hour.startTime} onChange={(e) => setHour(index, { startTime: e.target.value })} className="rounded-xl border bg-background px-3 py-2 font-bold" />
                      <span className="hidden text-muted-foreground md:block">até</span>
                      <input type="time" value={hour.endTime} onChange={(e) => setHour(index, { endTime: e.target.value })} className="rounded-xl border bg-background px-3 py-2 font-bold" />
                    </div>
                  ))}
                </div>
              </div>

              <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 font-black text-primary-foreground shadow-lg shadow-emerald-500/20 disabled:opacity-60">
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </main>
          </form>
        )}
      </section>
    </SupplierShell>
  )
}

function Field({ label, value, onChange, required, placeholder, className = '' }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; placeholder?: string; className?: string }) {
  return <label className={`grid gap-2 text-sm font-black ${className}`}>{label}<input value={value} required={required} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="rounded-2xl border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary" /></label>
}

async function compressImage(file: File) {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })

  const maxSize = 420
  const ratio = Math.min(1, maxSize / Math.max(image.width, image.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(image.width * ratio)
  canvas.height = Math.round(image.height * ratio)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas indisponível')
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
  URL.revokeObjectURL(image.src)
  return canvas.toDataURL('image/webp', 0.72)
}
