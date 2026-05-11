import { auth } from '@/lib/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

type RequestOptions = RequestInit & { auth?: boolean }

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const session = auth.get()
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (options.auth !== false && session?.token) headers.set('Authorization', `Bearer ${session.token}`)

  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.message || data?.error || 'Erro ao comunicar com a API.')
  return data as T
}

export const supplierApi = {
  async login(username: string, password: string) {
    const result = await request<{ token?: string; user: NonNullable<ReturnType<typeof auth.get>>['user'] }>('/auth/login', {
      method: 'POST', auth: false, body: JSON.stringify({ username, password }),
    })

    if (String(result.user?.currentCompany?.companyType ?? '').toUpperCase() !== 'SUPPLIER') {
      throw new Error('Este acesso não pertence a uma empresa do tipo fornecedor.')
    }

    return {
      token: result.token,
      supplierId: result.user?.currentCompany?.id ?? result.user?.companyId,
      supplierName: result.user?.currentCompany?.name ?? result.user?.name ?? result.user?.username ?? 'Fornecedor',
      user: result.user,
    }
  },
  async dashboard() {
    return request<DashboardData>('/supplier-portal/dashboard')
  },
  async orders() {
    return request<{ orders: SupplierOrder[] }>('/supplier-portal/orders')
  },
  async priceTables() {
    return request<{ tables: SupplierPriceTable[] }>('/supplier-portal/price-tables')
  },
  async products() {
    return request<{ products: SupplierProduct[] }>('/supplier-portal/products')
  },
  async profile() {
    return request<{ supplier: SupplierProfile }>('/supplier-portal/profile')
  },
}

export type DashboardData = {
  pendingOrders: number
  monthlyRevenue: number
  activePriceTables: number
  linkedProducts: number
  recentOrders: SupplierOrder[]
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
  active: boolean
  updatedAt: string
  itemCount: number
  averagePrice: number
}

export type SupplierProduct = {
  id: string
  name: string
  category?: string | null
  unit: string
  price: number
  linkedStockProductName?: string | null
}

export type SupplierProfile = {
  id: string
  name: string
  document?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  photoData?: string | null
  photoUrl?: string | null
  categories: string[]
}
