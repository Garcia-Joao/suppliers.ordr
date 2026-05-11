'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Edit3, Loader2, Plus, Search, TableProperties, Trash2, X } from 'lucide-react'
import { SupplierShell } from '@/components/layout/supplier-shell'
import { supplierApi, type PriceTableItemPayload, type PriceTablePayload, type SupplierPriceTable, type SupplierProduct } from '@/lib/api'

function money(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const emptyTableForm: PriceTablePayload = { name: '', description: '', active: true, validFrom: '', validUntil: '' }
const emptyItemForm: PriceTableItemPayload = { itemName: '', sku: '', unit: 'un.', quantity: '1', unitPrice: '0', notes: '' }

export default function TabelasPage() {
  const [tables, setTables] = useState<SupplierPriceTable[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [query, setQuery] = useState('')
  const [tableModal, setTableModal] = useState<{ mode: 'create' | 'edit'; table?: SupplierPriceTable } | null>(null)
  const [tableForm, setTableForm] = useState<PriceTablePayload>(emptyTableForm)
  const [itemModal, setItemModal] = useState<{ table: SupplierPriceTable; item?: SupplierProduct } | null>(null)
  const [itemForm, setItemForm] = useState<PriceTableItemPayload>(emptyItemForm)

  async function load() {
    setLoading(true)
    try {
      const result = await supplierApi.priceTables()
      setTables(result.tables ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load().catch(() => setLoading(false)) }, [])

  const filteredTables = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return tables
    return tables.filter((table) => {
      return `${table.name} ${table.description ?? ''} ${table.items.map((item) => item.name).join(' ')}`.toLowerCase().includes(term)
    })
  }, [query, tables])

  function openCreateTable() {
    setTableForm(emptyTableForm)
    setTableModal({ mode: 'create' })
  }

  function openEditTable(table: SupplierPriceTable) {
    setTableForm({
      name: table.name,
      description: table.description ?? '',
      active: table.active,
      validFrom: table.validFrom?.slice(0, 10) ?? '',
      validUntil: table.validUntil?.slice(0, 10) ?? '',
    })
    setTableModal({ mode: 'edit', table })
  }

  function openCreateItem(table: SupplierPriceTable) {
    setItemForm(emptyItemForm)
    setItemModal({ table })
  }

  function openEditItem(table: SupplierPriceTable, item: SupplierProduct) {
    setItemForm({
      itemName: item.name ?? item.itemName,
      sku: item.sku ?? '',
      unit: item.unit,
      quantity: String(item.quantity),
      unitPrice: String(item.unitPrice),
      notes: item.notes ?? '',
    })
    setItemModal({ table, item })
  }

  async function submitTable(event: FormEvent) {
    event.preventDefault()
    if (!tableForm.name.trim() || !tableModal) return
    setSaving(true)
    try {
      const payload = {
        ...tableForm,
        description: tableForm.description?.trim() || null,
        validFrom: tableForm.validFrom || null,
        validUntil: tableForm.validUntil || null,
      }
      const result = tableModal.mode === 'create'
        ? await supplierApi.createPriceTable(payload)
        : await supplierApi.updatePriceTable(tableModal.table!.id, payload)
      setTables(result.tables)
      setTableModal(null)
    } finally {
      setSaving(false)
    }
  }

  async function submitItem(event: FormEvent) {
    event.preventDefault()
    if (!itemForm.itemName.trim() || !itemModal) return
    setSaving(true)
    try {
      const result = itemModal.item
        ? await supplierApi.updatePriceTableItem(itemModal.table.id, itemModal.item.id, itemForm)
        : await supplierApi.createPriceTableItem(itemModal.table.id, itemForm)
      setTables(result.tables)
      setItemModal(null)
    } finally {
      setSaving(false)
    }
  }

  async function deleteTable(table: SupplierPriceTable) {
    if (!confirm(`Excluir a tabela "${table.name}"?`)) return
    const result = await supplierApi.deletePriceTable(table.id)
    setTables(result.tables)
  }

  async function deleteItem(table: SupplierPriceTable, item: SupplierProduct) {
    if (!confirm(`Remover "${item.name}" da tabela?`)) return
    const result = await supplierApi.deletePriceTableItem(table.id, item.id)
    setTables(result.tables)
  }

  return (
    <SupplierShell>
      <div className="space-y-4 pb-24 lg:pb-0">
        <section className="ordr-panel rounded-[2rem] p-5 md:p-7">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <span className="ordr-kicker"><TableProperties className="size-3.5" /> Tabelas</span>
              <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">Tabelas de preço</h1>
              <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-muted-foreground">
                Cadastre preços por fornecedor. Cada item vira produto no catálogo do portal.
              </p>
            </div>
            <button onClick={openCreateTable} className="ordr-button-primary"><Plus className="size-4" /> Nova tabela</button>
          </div>
          <div className="relative mt-6 max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar tabela ou produto..." className="ordr-input pl-11" />
          </div>
        </section>

        {loading ? (
          <div className="ordr-panel flex items-center justify-center gap-3 rounded-[2rem] p-10 text-sm font-black text-muted-foreground">
            <Loader2 className="size-5 animate-spin text-primary" /> Carregando tabelas...
          </div>
        ) : (
          <section className="grid gap-4">
            {filteredTables.map((table) => (
              <article key={table.id} className="ordr-panel rounded-[2rem] p-5">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-black tracking-tight">{table.name}</h2>
                      <span className={table.active ? 'rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase text-primary' : 'rounded-full bg-muted px-3 py-1 text-xs font-black uppercase text-muted-foreground'}>
                        {table.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-muted-foreground">{table.description || 'Sem descrição cadastrada.'}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-black text-muted-foreground">
                      <span className="rounded-full border px-3 py-1">{table.itemCount} item(ns)</span>
                      <span className="rounded-full border px-3 py-1">Preço médio {money(table.averagePrice ?? 0)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => openCreateItem(table)} className="ordr-button-primary"><Plus className="size-4" /> Item</button>
                    <button onClick={() => openEditTable(table)} className="ordr-button-soft"><Edit3 className="size-4" /> Editar</button>
                    <button onClick={() => deleteTable(table)} className="ordr-button-soft text-destructive"><Trash2 className="size-4" /> Excluir</button>
                  </div>
                </div>

                <div className="mt-5 overflow-x-auto rounded-2xl border">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="bg-background/70 text-xs font-black uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Item</th>
                        <th className="px-4 py-3">SKU</th>
                        <th className="px-4 py-3">Qtd.</th>
                        <th className="px-4 py-3 text-right">Preço un.</th>
                        <th className="px-4 py-3 text-right">Total</th>
                        <th className="px-4 py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {table.items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="px-4 py-3">
                            <p className="font-black">{item.name}</p>
                            <p className="text-xs font-bold text-muted-foreground">{item.notes || item.category || '—'}</p>
                          </td>
                          <td className="px-4 py-3 font-bold text-muted-foreground">{item.sku || '—'}</td>
                          <td className="px-4 py-3 font-bold">{item.quantity} {item.unit}</td>
                          <td className="px-4 py-3 text-right font-bold">{money(item.unitPrice)}</td>
                          <td className="px-4 py-3 text-right font-black text-primary">{money(item.price)}</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => openEditItem(table, item)} className="grid size-9 place-items-center rounded-xl border hover:bg-secondary"><Edit3 className="size-4" /></button>
                              <button onClick={() => deleteItem(table, item)} className="grid size-9 place-items-center rounded-xl border text-destructive hover:bg-destructive/10"><Trash2 className="size-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {table.items.length === 0 ? (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-sm font-bold text-muted-foreground">Nenhum item cadastrado nessa tabela.</td></tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </article>
            ))}
          </section>
        )}

        {!loading && filteredTables.length === 0 ? (
          <div className="ordr-panel rounded-[2rem] p-10 text-center">
            <TableProperties className="mx-auto mb-3 size-8 text-muted-foreground" />
            <p className="font-black">Nenhuma tabela encontrada</p>
            <p className="mt-1 text-sm font-bold text-muted-foreground">Crie a primeira tabela para liberar produtos no catálogo.</p>
          </div>
        ) : null}

        {tableModal ? (
          <div className="modal-backdrop">
            <form onSubmit={submitTable} className="modal-card ordr-panel p-5 md:p-6">
              <ModalHeader title={tableModal.mode === 'create' ? 'Nova tabela' : 'Editar tabela'} onClose={() => setTableModal(null)} />
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 md:col-span-2"><span className="text-sm font-black">Nome</span><input className="ordr-input" value={tableForm.name} onChange={(e) => setTableForm((f) => ({ ...f, name: e.target.value }))} required /></label>
                <label className="space-y-2 md:col-span-2"><span className="text-sm font-black">Descrição</span><textarea className="ordr-input" value={tableForm.description ?? ''} onChange={(e) => setTableForm((f) => ({ ...f, description: e.target.value }))} /></label>
                <label className="space-y-2"><span className="text-sm font-black">Válida de</span><input type="date" className="ordr-input" value={tableForm.validFrom ?? ''} onChange={(e) => setTableForm((f) => ({ ...f, validFrom: e.target.value }))} /></label>
                <label className="space-y-2"><span className="text-sm font-black">Válida até</span><input type="date" className="ordr-input" value={tableForm.validUntil ?? ''} onChange={(e) => setTableForm((f) => ({ ...f, validUntil: e.target.value }))} /></label>
                <label className="flex items-center gap-3 rounded-2xl border bg-background/60 p-4 md:col-span-2"><input type="checkbox" checked={tableForm.active ?? true} onChange={(e) => setTableForm((f) => ({ ...f, active: e.target.checked }))} /> <span className="text-sm font-black">Tabela ativa</span></label>
              </div>
              <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setTableModal(null)} className="ordr-button-soft">Cancelar</button><button className="ordr-button-primary" disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : null}Salvar</button></div>
            </form>
          </div>
        ) : null}

        {itemModal ? (
          <div className="modal-backdrop">
            <form onSubmit={submitItem} className="modal-card ordr-panel p-5 md:p-6">
              <ModalHeader title={itemModal.item ? 'Editar item' : `Novo item em ${itemModal.table.name}`} onClose={() => setItemModal(null)} />
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 md:col-span-2"><span className="text-sm font-black">Nome do item</span><input className="ordr-input" value={itemForm.itemName} onChange={(e) => setItemForm((f) => ({ ...f, itemName: e.target.value }))} required /></label>
                <label className="space-y-2"><span className="text-sm font-black">SKU</span><input className="ordr-input" value={itemForm.sku ?? ''} onChange={(e) => setItemForm((f) => ({ ...f, sku: e.target.value }))} /></label>
                <label className="space-y-2"><span className="text-sm font-black">Unidade</span><input className="ordr-input" value={itemForm.unit} onChange={(e) => setItemForm((f) => ({ ...f, unit: e.target.value }))} /></label>
                <label className="space-y-2"><span className="text-sm font-black">Quantidade</span><input type="number" step="0.001" className="ordr-input" value={itemForm.quantity} onChange={(e) => setItemForm((f) => ({ ...f, quantity: e.target.value }))} /></label>
                <label className="space-y-2"><span className="text-sm font-black">Preço unitário</span><input type="number" step="0.01" className="ordr-input" value={itemForm.unitPrice} onChange={(e) => setItemForm((f) => ({ ...f, unitPrice: e.target.value }))} /></label>
                <label className="space-y-2 md:col-span-2"><span className="text-sm font-black">Observações</span><textarea className="ordr-input" value={itemForm.notes ?? ''} onChange={(e) => setItemForm((f) => ({ ...f, notes: e.target.value }))} /></label>
              </div>
              <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setItemModal(null)} className="ordr-button-soft">Cancelar</button><button className="ordr-button-primary" disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : null}Salvar</button></div>
            </form>
          </div>
        ) : null}
      </div>
    </SupplierShell>
  )
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <div><span className="ordr-kicker">Cadastro</span><h2 className="mt-3 text-2xl font-black tracking-tight">{title}</h2></div>
      <button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-2xl border bg-background/70"><X className="size-4" /></button>
    </div>
  )
}
