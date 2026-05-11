'use client'

import { Clock } from 'lucide-react'
import type { OperatingHour } from '@/lib/api'

const fallbackDays = [
  { day: 'mon', label: 'Segunda' },
  { day: 'tue', label: 'Terça' },
  { day: 'wed', label: 'Quarta' },
  { day: 'thu', label: 'Quinta' },
  { day: 'fri', label: 'Sexta' },
  { day: 'sat', label: 'Sábado' },
  { day: 'sun', label: 'Domingo' },
] as const

const timeOptions = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2)
  const minute = index % 2 === 0 ? '00' : '30'
  return `${String(hour).padStart(2, '0')}:${minute}`
})

type Props = {
  value: OperatingHour[]
  onChange: (value: OperatingHour[]) => void
}

function normalizeHours(value: OperatingHour[]) {
  return fallbackDays.map((day) => {
    const existing = value.find((item) => item.day === day.day)

    return {
      day: day.day,
      label: existing?.label || day.label,
      enabled: existing?.enabled ?? day.day !== 'sun',
      startTime: existing?.startTime || '08:00',
      endTime: existing?.endTime || '18:00',
    } as OperatingHour
  })
}

export function OperatingHoursGrid({ value, onChange }: Props) {
  const hours = normalizeHours(value)

  function updateDay(day: OperatingHour['day'], patch: Partial<OperatingHour>) {
    onChange(hours.map((item) => (item.day === day ? { ...item, ...patch } : item)))
  }

  function applyBusinessHours() {
    onChange(
      hours.map((item) => ({
        ...item,
        enabled: item.day !== 'sun',
        startTime: '08:00',
        endTime: item.day === 'sat' ? '14:00' : '18:00',
      }))
    )
  }

  function closeAll() {
    onChange(hours.map((item) => ({ ...item, enabled: false })))
  }

  return (
    <section className="supplier-card-flat rounded-[2rem] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="supplier-chip supplier-chip-primary">
            <Clock size={14} />
            Expediente
          </p>
          <h2 className="mt-3 text-2xl font-black text-[var(--supplier-text)]">
            Horários de expediente
          </h2>
          <p className="mt-1 text-sm font-semibold text-[var(--supplier-muted)]">
            Os horários usam formato 24h, por exemplo 08:00 às 18:00.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={applyBusinessHours} className="supplier-button">
            Comercial padrão
          </button>
          <button type="button" onClick={closeAll} className="supplier-button">
            Fechar todos
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-7">
        {hours.map((item) => (
          <article
            key={item.day}
            className={`rounded-[1.35rem] border p-4 transition ${
              item.enabled
                ? 'border-emerald-300/60 bg-emerald-500/10'
                : 'border-[var(--supplier-border)] bg-[var(--supplier-card-muted)]'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-[var(--supplier-text)]">{item.label}</p>
                <p
                  className={`mt-1 text-[11px] font-black uppercase tracking-[0.14em] ${
                    item.enabled ? 'text-[var(--supplier-primary-strong)] dark:text-[var(--supplier-primary)]' : 'text-[var(--supplier-muted)]'
                  }`}
                >
                  {item.enabled ? 'Aberto' : 'Fechado'}
                </p>
              </div>

              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={item.enabled}
                  onChange={(event) => updateDay(item.day, { enabled: event.target.checked })}
                  className="peer sr-only"
                />
                <span className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-[var(--supplier-primary)] dark:bg-slate-700" />
                <span className="absolute left-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />
              </label>
            </div>

            <div className="mt-4 grid gap-2">
              <label className="block">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.14em] text-[var(--supplier-muted)]">
                  Início
                </span>
                <select
                  value={item.startTime}
                  disabled={!item.enabled}
                  onChange={(event) => updateDay(item.day, { startTime: event.target.value })}
                  className="supplier-field px-3 py-2 text-sm disabled:opacity-45"
                >
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-[0.14em] text-[var(--supplier-muted)]">
                  Fim
                </span>
                <select
                  value={item.endTime}
                  disabled={!item.enabled}
                  onChange={(event) => updateDay(item.day, { endTime: event.target.value })}
                  className="supplier-field px-3 py-2 text-sm disabled:opacity-45"
                >
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
