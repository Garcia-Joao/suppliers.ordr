import type { SupplierAuthUser } from '@/lib/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

type RequestOptions = RequestInit & { parseJson?: boolean }

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers)

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Erro ao comunicar com a API.')
  }

  return data as T
}

function json(method: string, body?: unknown): RequestInit {
  return {
    method,
    body: typeof body === 'undefined' ? undefined : JSON.stringify(body),
  }
}

export const supplierApi = {
  async me() {
    return request<{ user: SupplierAuthUser }>('/auth/me', { method: 'GET' })
  },
  async logout() {
    return request<{ ok: true }>('/auth/logout', { method: 'POST' })
  },
  async switchCompany(companyId: string) {
    return request<{ user: SupplierAuthUser }>('/auth/switch-company', json('POST', { companyId }))
  },
  async dashboard() {
    return request<DashboardData>('/supplier-portal/dashboard')
  },
  async orders() {
    return request<{ orders: SupplierOrder[]; paused?: boolean }>('/supplier-portal/orders')
  },
  async priceTables() {
    return request<{ tables: SupplierPriceTable[] }>('/supplier-portal/price-tables')
  },
  async createPriceTable(payload: PriceTablePayload) {
    return request<{ tables: SupplierPriceTable[] }>('/supplier-portal/price-tables', json('POST', payload))
  },
  async updatePriceTable(tableId: string, payload: Partial<PriceTablePayload> & { active?: boolean }) {
    return request<{ tables: SupplierPriceTable[] }>(`/supplier-portal/price-tables/${tableId}`, json('PATCH', payload))
  },
  async duplicatePriceTable(tableId: string, payload: DuplicateTablePayload) {
    return request<{ tables: SupplierPriceTable[] }>(`/supplier-portal/price-tables/${tableId}/duplicate`, json('POST', payload))
  },
  async bulkAdjustPriceTablePrices(tableId: string, payload: BulkPriceAdjustmentPayload) {
    return request<{ tables: SupplierPriceTable[] }>(`/supplier-portal/price-tables/${tableId}/bulk-prices`, json('PATCH', payload))
  },
  async deletePriceTable(tableId: string) {
    return request<{ tables: SupplierPriceTable[] }>(`/supplier-portal/price-tables/${tableId}`, json('DELETE'))
  },
  async createPriceTableItem(tableId: string, payload: PriceTableItemPayload) {
    return request<{ tables: SupplierPriceTable[] }>(`/supplier-portal/price-tables/${tableId}/items`, json('POST', payload))
  },
  async createPriceTableItemFromExisting(tableId: string, payload: ExistingProductPayload) {
    return request<{ tables: SupplierPriceTable[] }>(`/supplier-portal/price-tables/${tableId}/items/from-product`, json('POST', payload))
  },
  async updatePriceTableItem(tableId: string, itemId: string, payload: Partial<PriceTableItemPayload>) {
    return request<{ tables: SupplierPriceTable[] }>(`/supplier-portal/price-tables/${tableId}/items/${itemId}`, json('PATCH', payload))
  },
  async deletePriceTableItem(tableId: string, itemId: string) {
    return request<{ tables: SupplierPriceTable[] }>(`/supplier-portal/price-tables/${tableId}/items/${itemId}`, json('DELETE'))
  },
  async togglePriceTableItemActive(tableId: string, itemId: string, active: boolean) {
    return request<{ tables: SupplierPriceTable[] }>(`/supplier-portal/price-tables/${tableId}/items/${itemId}/active`, json('PATCH', { active }))
  },
  async adjustItemStock(tableId: string, itemId: string, payload: StockAdjustmentPayload) {
    return request<{ tables: SupplierPriceTable[] }>(`/supplier-portal/price-tables/${tableId}/items/${itemId}/stock-adjust`, json('PATCH', payload))
  },
  async updateItemStock(tableId: string, itemId: string, payload: StockPayload) {
    return request<{ tables: SupplierPriceTable[] }>(`/supplier-portal/price-tables/${tableId}/items/${itemId}/stock`, json('PATCH', payload))
  },
  async products() {
    return request<{ products: SupplierProduct[] }>('/supplier-portal/products')
  },
  async profile() {
    return request<{ supplier: SupplierProfile }>('/supplier-portal/profile')
  },
  async updateProfile(payload: Partial<SupplierProfile>) {
    return request<{ supplier: SupplierProfile }>('/supplier-portal/profile', json('PATCH', payload))
  },
  async updateAvailability(onlineEnabled: boolean) {
    return request<{ supplier: SupplierProfile }>('/supplier-portal/availability', json('PATCH', { onlineEnabled }))
  },
}

export type WeekDayKey = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'

export type OperatingHour = {
  day: WeekDayKey
  label: string
  enabled: boolean
  startTime: string
  endTime: string
}

export type OnlineStatus = {
  onlineEnabled: boolean
  insideOperatingHours: boolean
  isOnline: boolean
  today?: OperatingHour | null
}

export type DashboardData = {
  supplier: SupplierProfile
  pendingOrders: number
  monthlyRevenue: number
  activePriceTables: number
  linkedProducts: number
  productCount: number
  lowStockProducts?: number
  categories: string[]
  onlineStatus: OnlineStatus
  recentOrders: SupplierOrder[]
  highlights: { label: string; value: string }[]
}

export type SupplierOrder = {
  id: string
  code: string
  status: 'pending' | 'accepted' | 'delivered' | 'cancelled'
  requestedAt: string
  neededBy?: string | null
  total: number
  items: { id: string; name: string; quantity: number; unit: string; price: number }[]
}

export type SupplierPriceTable = {
  id: string
  name: string
  description?: string | null
  active: boolean
  validFrom?: string | null
  validUntil?: string | null
  updatedAt: string
  itemCount: number
  averagePrice: number
  items: SupplierProduct[]
}

export type SupplierProduct = {
  id: string
  tableId?: string
  tableName?: string
  tableActive?: boolean
  productId?: string | null
  itemName: string
  name: string
  sku?: string | null
  category?: string | null
  unit: string
  quantity: number
  unitPrice: number
  price: number
  notes?: string | null
  active?: boolean
  stockEnabled?: boolean
  stockQuantity?: number
  minStockQuantity?: number
  lowStock?: boolean
  stockUpdatedAt?: string | null
  linkedStockProductName?: string | null
}

export type SupplierProfile = {
  id: string
  name: string
  document?: string | null
  contactName?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  notes?: string | null
  photoData?: string | null
  photoUrl?: string | null
  categories: string[]
  active: boolean
  ordrCode?: string | null
  onlineEnabled: boolean
  automaticAvailability?: boolean
  operatingHours: OperatingHour[]
  onlineStatus: OnlineStatus
}

export type PriceTablePayload = {
  name: string
  description?: string | null
  active?: boolean
  validFrom?: string | null
  validUntil?: string | null
}

export type PriceTableItemPayload = {
  itemName: string
  sku?: string | null
  category?: string | null
  unit: string
  quantity: number | string
  unitPrice: number | string
  notes?: string | null
  active?: boolean
  stockEnabled?: boolean
  stockQuantity?: number | string
  minStockQuantity?: number | string
}

export type ExistingProductPayload = {
  sourceItemId: string
  itemName?: string | null
  sku?: string | null
  category?: string | null
  unit?: string
  quantity?: number | string
  priceAdjustmentPercent?: number | string
  notes?: string | null
  active?: boolean
  stockEnabled?: boolean
  stockQuantity?: number | string
  minStockQuantity?: number | string
}

export type DuplicateTablePayload = {
  name: string
  description?: string | null
  active?: boolean
  validFrom?: string | null
  validUntil?: string | null
  priceAdjustmentPercent?: number | string
}

export type BulkPriceAdjustmentPayload = {
  priceAdjustmentPercent: number | string
}

export type StockPayload = {
  stockEnabled?: boolean
  stockQuantity?: number | string
  minStockQuantity?: number | string
}

export type StockAdjustmentPayload = {
  delta?: number | string
  mode?: 'set' | 'delta'
  stockQuantity?: number | string
  minStockQuantity?: number | string
}
