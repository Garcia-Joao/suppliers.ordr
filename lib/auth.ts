export type SupplierAuthCompany = {
  id: string
  name: string
  companyType?: 'BUSINESS' | 'SUPPLIER' | string
}

export type SupplierAuthUser = {
  id: string
  username: string
  name?: string | null
  companyId?: string
  currentCompany?: SupplierAuthCompany | null
  companies?: SupplierAuthCompany[]
}

export type SupplierSession = {
  user: SupplierAuthUser
  supplierId: string
  supplierName: string
}

const ORDR_APP_URL =
  process.env.NEXT_PUBLIC_ORDR_APP_URL ||
  process.env.NEXT_PUBLIC_MAIN_APP_URL ||
  'https://panelordr.com.br'

export function isSupplierUser(user?: SupplierAuthUser | null) {
  return String(user?.currentCompany?.companyType ?? '').toUpperCase() === 'SUPPLIER'
}

export function toSupplierSession(user: SupplierAuthUser): SupplierSession {
  return {
    user,
    supplierId: user.currentCompany?.id ?? user.companyId ?? '',
    supplierName:
      user.currentCompany?.name ??
      user.name ??
      user.username ??
      'Fornecedor',
  }
}

export function getMainLoginUrl() {
  const base = ORDR_APP_URL.replace(/\/$/, '')

  if (typeof window === 'undefined') return `${base}/login`

  return `${base}/login/`
}

export function redirectToMainLogin() {
  if (typeof window === 'undefined') return
  window.location.href = getMainLoginUrl()
}
