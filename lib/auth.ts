export type SupplierAuthCompany = {
  id: string
  name: string
  companyType?: 'BUSINESS' | 'SUPPLIER' | string
  isTest?: boolean
  licenseActive?: boolean
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
  companies: SupplierAuthCompany[]
}

const ORDR_APP_URL =
  process.env.NEXT_PUBLIC_ORDR_APP_URL ||
  process.env.NEXT_PUBLIC_MAIN_APP_URL ||
  'https://panelordr.com.br'

const SUPPLIERS_APP_URL =
  process.env.NEXT_PUBLIC_SUPPLIERS_APP_URL ||
  'https://suppliers.panelordr.com.br'

export function isSupplierCompany(company?: SupplierAuthCompany | null) {
  return String(company?.companyType ?? '').toUpperCase() === 'SUPPLIER'
}

export function isSupplierUser(user?: SupplierAuthUser | null) {
  return isSupplierCompany(user?.currentCompany)
}

export function toSupplierSession(user: SupplierAuthUser): SupplierSession {
  const companies = user.companies ?? []

  return {
    user,
    supplierId: user.currentCompany?.id ?? user.companyId ?? '',
    supplierName:
      user.currentCompany?.name ??
      user.name ??
      user.username ??
      'Fornecedor',
    companies,
  }
}

export function getMainAppUrl() {
  return ORDR_APP_URL.replace(/\/$/, '')
}

export function getSuppliersAppUrl() {
  return SUPPLIERS_APP_URL.replace(/\/$/, '')
}

export function getMainLoginUrl() {
  return `${getMainAppUrl()}/login/`
}

export function getMainSelectionUrl() {
  return `${getMainAppUrl()}/selecionar-empresa/`
}

export function redirectToMainLogin() {
  if (typeof window === 'undefined') return
  window.location.href = getMainLoginUrl()
}

export function redirectToMainApp() {
  if (typeof window === 'undefined') return
  window.location.href = getMainAppUrl()
}
