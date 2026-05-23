import type { Component } from 'vue'

export type TenantOption = {
  tenant_id: string
  tenant_name?: string
  role?: string
}

export type LoginResponse = {
  user_id: string
  email: string
  access_token?: string
  tenants: TenantOption[]
}

export type RegisterResponse = LoginResponse & {
  access_token: string
  message?: string
}

export type ApiListResponse<T> = {
  data: T[]
  pagination?: {
    total_items: number
    total_pages: number
    current_page: number
    limit: number
  }
}

export type ApiSingleResponse<T> = {
  data: T
  message?: string
}

export type Tenant = {
  id: string
  name: string
  code: string
  domain?: string | null
  storefront_template?: 'market' | 'editorial' | 'compact' | string
  storefront_accent_color?: string | null
  storefront_logo_url?: string | null
  storefront_banner_url?: string | null
  storefront_tagline?: string | null
  active_status: number | string
  created_at?: string
}

export type User = {
  id: string
  username: string
  email: string
  active_status: number | string
  created_at?: string
  memberships?: Array<{
    role?: {
      id: string
      name: string
    }
  }>
}

export type Product = {
  id: string
  tenant_id: string
  name: string
  slug: string
  description?: string | null
  sku?: string | null
  category?: 'new_arrival' | 'exclusive' | 'product' | string
  related_product_ids?: string[]
  price: string
  stock: number
  image_url?: string | null
  active_status: number | string
  created_at?: string
}

export type OrderItem = {
  id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: string
  subtotal: string
}

export type Order = {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone?: string | null
  shipping_address: string
  shipping_province?: string | null
  shipping_city?: string | null
  shipping_district?: string | null
  shipping_postal_code?: string | null
  shipping_method?: string | null
  payment_method?: string | null
  total_amount: string
  status: string
  items?: OrderItem[]
  created_at?: string
}

export type Storefront = {
  store: Tenant
  products: Product[]
  stores?: Tenant[]
}

export type Permission = {
  id: string
  resource: string
  action: string
  description?: string | null
}

export type RolePermission = {
  id: string
  permission_id: string
  permission: Permission
}

export type Role = {
  id: string
  name: string
  description?: string | null
  role_permissions?: RolePermission[]
}

export type ActiveView =
  | 'overview'
  | 'tenants'
  | 'users'
  | 'roles'
  | 'products'
  | 'orders'
  | 'storefront'

export type StatItem = {
  label: string
  value: number | string
  detail: string
  icon: Component
}
