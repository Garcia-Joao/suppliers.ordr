'use client'

import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { Camera, CheckCircle2, Copy, Loader2, Save, UserCircle } from 'lucide-react'
import { SupplierShell } from '@/components/layout/supplier-shell'
import { supplierApi, type OperatingHour, type SupplierProfile } from '@/lib/api'

const days: OperatingHour[] = [
  { day: 'sun', label: 'Domingo', enabled: false, startTime: '09:00', endTime: '18:00' },
  { day: 'mon', label: 'Segunda', enabled: true, startTime: '09:00', endTime: '18:00' },
  { day: 'tue', label: 'Terça', enabled: true, startTime: '09:00', endTime: '18:00' },
  { day: 'wed', label: 'Quarta', enabled: true, startTime: '09:00', endTime: '18:00' },
  { day: 'thu', label: 'Quinta', enabled: true, startTime: '09:00', endTime: '18:00' },
  { day: 'fri', label: 'Sexta', enabled: true, startTime: '09:00', endTime: '18:00' },
  { day: 'sat', label: 'Sábado', enabled: false, startTime: '09:00', endTime: '14:00' },
]

function mergeHours(hours?: OperatingHour[]) {
  return days.map((day) => hours?.find((item) => item.day === day.day) ?? day)
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const image = new Image()
      image.onload = () => {
        const max = 420
        const scale = Math.min(1, max / Math.max(image.width, image.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(image.width * scale))
        canvas.height = Math.max(1, Math.round(image.height * scale))
        const context = canvas.getContext('2d')
        if (!context) return reject(new Error('Não foi possível preparar a imagem.'))
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/webp', 0.76))
      }
      image.onerror = reject
      image.src = String(reader.result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function PerfilPage() {
  const [profile, setProfile] = useState<SupplierProfile | null>(null)
  const [form, setForm] = useState<Partial<SupplierProfile>>({})
  const [categoryText, setCategoryText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    supplierApi.profile()
      .then(({ supplier }) => {
        setProfile(supplier)
        setForm({ ...supplier, operatingHours: mergeHours(supplier.operatingHours) })
        setCategoryText((supplier.categories ?? []).join(', '))
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      const result = await supplierApi.updateProfile({
        ...form,
        categories: categoryText.split(',').map((item) => item.trim()).filter(Boolean),
        operatingHours: mergeHours(form.operatingHours),
      })
      setProfile(result.supplier)
      setForm({ ...result.supplier, operatingHours: mergeHours(result.supplier.operatingHours) })
      setCategoryText((result.supplier.categories ?? []).join(', '))
    } finally {
      setSaving(false)
    }
  }

  async function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const photoData = await compressImage(file)
    setForm((current) => ({ ...current, photoData }))
  }

  function updateHour(index: number, patch: Partial<OperatingHour>) {
    setForm((current) => {
      const operatingHours = mergeHours(current.operatingHours)
      operatingHours[index] = { ...operatingHours[index], ...patch }
      return { ...current, operatingHours }
    })
  }

  async function copyCode() {
    const code = profile?.ordrCode
    if (!code) return
    await navigator.clipboard.writeText(code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <SupplierShell>
      <form onSubmit={handleSubmit} className="space-y-4 pb-24 lg:pb-0">
        <section className="ordr-panel rounded-[2rem] p-5 md:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <span className="ordr-kicker"><UserCircle className="size-3.5" /> Perfil</span>
              <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">Dados do fornecedor</h1>
              <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-muted-foreground">
                Configure dados comerciais, imagem, categorias e horários de expediente.
              </p>
            </div>
            <button className="ordr-button-primary" disabled={saving || loading}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Salvar alterações
            </button>
          </div>
        </section>

        {loading ? (
          <div className="ordr-panel flex items-center justify-center gap-3 rounded-[2rem] p-10 text-sm font-black text-muted-foreground">
            <Loader2 className="size-5 animate-spin text-primary" /> Carregando perfil...
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[0.75fr_1.25fr]">
            <section className="ordr-panel rounded-[2rem] p-5">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4 size-36 overflow-hidden rounded-[2rem] border bg-background">
                  {form.photoData || form.photoUrl ? (
                    <img src={form.photoData || form.photoUrl || ''} alt="Fornecedor" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-primary/10 text-primary"><UserCircle className="size-14" /></div>
                  )}
                </div>
                <label className="ordr-button-soft cursor-pointer">
                  <Camera className="size-4" /> Selecionar imagem
                  <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
                </label>

                <div className="mt-6 w-full rounded-[1.5rem] border bg-background/60 p-4 text-left">
                  <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Código ORDR</p>
                  <div className="mt-2 flex items-center gap-2">
                    <p className="flex-1 text-2xl font-black tracking-widest">{profile?.ordrCode ?? '—'}</p>
                    <button type="button" onClick={copyCode} className="grid size-10 place-items-center rounded-xl border hover:bg-secondary"><Copy className="size-4" /></button>
                  </div>
                  {copied ? <p className="mt-2 text-xs font-black text-primary">Copiado!</p> : null}
                  <p className="mt-2 text-xs font-bold text-muted-foreground">Esse código é gerado automaticamente e não pode ser alterado.</p>
                </div>

                <label className="mt-4 flex w-full items-center justify-between gap-4 rounded-[1.5rem] border bg-background/60 p-4 text-left">
                  <div>
                    <p className="text-sm font-black">Disponibilizar online</p>
                    <p className="text-xs font-bold text-muted-foreground">O status final também considera o expediente.</p>
                  </div>
                  <input type="checkbox" checked={Boolean(form.onlineEnabled)} onChange={(e) => setForm((current) => ({ ...current, onlineEnabled: e.target.checked }))} />
                </label>
              </div>
            </section>

            <section className="ordr-panel rounded-[2rem] p-5">
              <h2 className="mb-5 text-2xl font-black">Informações comerciais</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nome"><input className="ordr-input" value={form.name ?? ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
                <Field label="Documento"><input className="ordr-input" value={form.document ?? ''} onChange={(e) => setForm((f) => ({ ...f, document: e.target.value }))} /></Field>
                <Field label="Contato"><input className="ordr-input" value={form.contactName ?? ''} onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))} /></Field>
                <Field label="Telefone"><input className="ordr-input" value={form.phone ?? ''} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></Field>
                <Field label="E-mail"><input className="ordr-input" value={form.email ?? ''} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></Field>
                <Field label="Categorias"><input className="ordr-input" value={categoryText} onChange={(e) => setCategoryText(e.target.value)} placeholder="Bebidas, Carnes, Limpeza" /></Field>
                <Field label="Endereço" wide><textarea className="ordr-input" value={form.address ?? ''} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} /></Field>
                <Field label="Observações" wide><textarea className="ordr-input" value={form.notes ?? ''} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></Field>
              </div>
            </section>

            <section className="ordr-panel rounded-[2rem] p-5 xl:col-span-2">
              <div className="mb-5 flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary"><CheckCircle2 className="size-5" /></div>
                <div>
                  <h2 className="text-2xl font-black">Horário de expediente</h2>
                  <p className="text-sm font-bold text-muted-foreground">O online automático usa estes horários por dia da semana.</p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {mergeHours(form.operatingHours).map((hour, index) => (
                  <div key={hour.day} className="rounded-[1.35rem] border bg-background/60 p-4">
                    <label className="mb-4 flex items-center justify-between gap-3">
                      <span className="font-black">{hour.label}</span>
                      <input type="checkbox" checked={hour.enabled} onChange={(e) => updateHour(index, { enabled: e.target.checked })} />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="time" className="ordr-input" value={hour.startTime} onChange={(e) => updateHour(index, { startTime: e.target.value })} disabled={!hour.enabled} />
                      <input type="time" className="ordr-input" value={hour.endTime} onChange={(e) => updateHour(index, { endTime: e.target.value })} disabled={!hour.enabled} />
                    </div>
                    {!hour.enabled ? <p className="mt-3 text-xs font-black text-muted-foreground">Fechado</p> : null}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </form>
    </SupplierShell>
  )
}

function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <label className={wide ? 'space-y-2 md:col-span-2' : 'space-y-2'}><span className="text-sm font-black">{label}</span>{children}</label>
}
