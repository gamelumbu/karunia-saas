import type { Product } from '../../types'

export type PublicPage =
  | 'home'
  | 'new-arrivals'
  | 'eksklusif'
  | 'produk'
  | 'wishlist'
  | 'checkout'
  | 'product-detail'

export type PageMeta = {
  eyebrow: string
  title: string
  description: string
}

export type NavItem = {
  label: string
  href: string
}

export type HomeSection = {
  eyebrow: string
  title: string
  href: string
  rows: Product[]
}

export type CartProduct = {
  product: Product
  quantity: number
}
