export type SupplierSession = {
  token?: string
  supplierId?: string
  supplierName?: string
  user?: {
    id: string
    username: string
    name?: string | null
    companyId?: string
    currentCompany?: {
      id: string
      name: string
      companyType?: string
    } | null
  }
}

const KEY = 'ordr_supplier_session'

export const auth = {
  get(): SupplierSession | null {
    if (typeof window === 'undefined') return null
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    try { return JSON.parse(raw) as SupplierSession } catch { return null }
  },
  set(session: SupplierSession) {
    window.localStorage.setItem(KEY, JSON.stringify(session))
  },
  clear() {
    window.localStorage.removeItem(KEY)
  },
}
