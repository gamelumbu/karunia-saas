<script setup lang="ts">
import { Minus, Package, Plus, ShoppingBag } from '@lucide/vue'
import type { Product } from '../../types'
import type { CartProduct } from './types'

defineProps<{
  cartProducts: CartProduct[]
  relatedProducts: Product[]
  checkoutForm: {
    customer_name: string
    customer_email: string
    customer_phone: string
    shipping_address: string
    shipping_province: string
    shipping_city: string
    shipping_district: string
    shipping_postal_code: string
    shipping_method: string
    payment_method: string
  }
  notice: string
  error: string
  loading: boolean
  cartTotal: number
  storeSlug: string
  accent: string
  formatCurrency: (value: string | number) => string
  categoryLabel: (category?: string) => string
}>()

defineEmits<{
  createOrder: []
  setCartQuantity: [productId: string, quantity: number]
  addToCart: [product: Product]
}>()
</script>

<template>
  <section class="mx-auto grid max-w-[1440px] gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
    <div>
      <div class="mb-6 border-b border-zinc-200 pb-6">
        <p class="text-xs font-black uppercase tracking-wide" :style="{ color: accent }">Keranjang</p>
        <h2 class="mt-1 text-3xl font-black uppercase tracking-tight">Produk yang dipilih</h2>
        <p class="mt-2 text-sm font-semibold text-zinc-500">Checkout hanya menampilkan produk yang sudah user masukkan ke keranjang.</p>
      </div>
      <div v-if="notice" class="mb-5 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
        {{ notice }}
      </div>
      <div v-if="!cartProducts.length" class="grid min-h-96 place-items-center border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
        <div>
          <ShoppingBag class="mx-auto h-10 w-10 text-zinc-400" />
          <p class="mt-4 text-lg font-black uppercase text-zinc-800">Keranjang kosong</p>
          <p class="mt-2 text-sm font-semibold text-zinc-500">Masukkan produk dari katalog atau wishlist terlebih dahulu.</p>
          <a class="mt-6 inline-flex h-11 items-center justify-center px-5 text-sm font-black uppercase text-white shadow-sm transition hover:opacity-90" :style="{ backgroundColor: accent }" :href="`/${storeSlug}/produk`">
            Lihat produk
          </a>
        </div>
      </div>

      <div v-else class="grid gap-4">
        <article v-for="item in cartProducts" :key="item.product.id" class="grid gap-4 border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-400 hover:shadow-lg hover:shadow-zinc-200/70 sm:grid-cols-[180px_minmax(0,1fr)]">
          <a class="block bg-zinc-100" :href="`/${storeSlug}/products/${item.product.slug}`">
            <div class="aspect-[4/3] sm:aspect-square">
              <img v-if="item.product.image_url" :src="item.product.image_url" :alt="item.product.name" class="h-full w-full object-cover" />
              <div v-else class="grid h-full place-items-center text-zinc-400">
                <Package class="h-10 w-10" />
              </div>
            </div>
          </a>
          <div class="flex min-w-0 flex-col justify-between gap-5">
            <div>
              <p class="text-xs font-black uppercase tracking-wide" :style="{ color: accent }">{{ categoryLabel(item.product.category) }}</p>
              <a class="mt-1 block text-2xl font-black uppercase tracking-tight hover:text-zinc-600" :href="`/${storeSlug}/products/${item.product.slug}`">{{ item.product.name }}</a>
              <p class="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500">{{ item.product.description || item.product.sku || 'Produk toko.' }}</p>
            </div>
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="text-xs font-black uppercase text-zinc-400">Subtotal</p>
                <strong class="text-xl">{{ formatCurrency(Number(item.product.price) * item.quantity) }}</strong>
              </div>
              <div class="inline-flex items-center gap-3 border border-zinc-200 px-3 py-2">
                <button type="button" @click="$emit('setCartQuantity', item.product.id, item.quantity - 1)">
                  <Minus class="h-4 w-4" />
                </button>
                <span class="min-w-8 text-center text-sm font-black">{{ item.quantity }}</span>
                <button type="button" @click="$emit('setCartQuantity', item.product.id, item.quantity + 1)">
                  <Plus class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>

    <form class="h-max border border-zinc-200 bg-white p-5 shadow-xl shadow-zinc-200/60 lg:sticky lg:top-28" @submit.prevent="$emit('createOrder')">
      <p class="text-xs font-black uppercase tracking-wide" :style="{ color: accent }">Checkout</p>
      <h2 class="mt-1 text-xl font-black uppercase tracking-tight">Keranjang</h2>

      <div v-if="!cartProducts.length" class="mt-5 border border-zinc-200 bg-zinc-50 p-5 text-sm font-semibold text-zinc-500">
        Keranjang masih kosong. Tambahkan produk dari halaman Produk atau Wishlist.
      </div>
      <div v-else class="mt-5 grid gap-3">
        <div v-for="item in cartProducts" :key="item.product.id" class="flex gap-3 border border-zinc-200 p-3">
          <div class="h-16 w-16 shrink-0 bg-zinc-100">
            <img v-if="item.product.image_url" :src="item.product.image_url" :alt="item.product.name" class="h-full w-full object-cover" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-black uppercase">{{ item.product.name }}</p>
            <p class="text-xs font-semibold text-zinc-500">{{ formatCurrency(item.product.price) }}</p>
                <div class="mt-2 inline-flex items-center gap-2 border border-zinc-200 px-2 py-1">
              <button type="button" @click="$emit('setCartQuantity', item.product.id, item.quantity - 1)">
                <Minus class="h-3 w-3" />
              </button>
              <span class="min-w-6 text-center text-xs font-black">{{ item.quantity }}</span>
              <button type="button" @click="$emit('setCartQuantity', item.product.id, item.quantity + 1)">
                <Plus class="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
        <div class="flex items-center justify-between border-t border-zinc-200 pt-4">
          <span class="text-sm font-black uppercase">Total</span>
          <strong>{{ formatCurrency(cartTotal) }}</strong>
        </div>
      </div>

      <div v-if="notice" class="mt-5 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
        {{ notice }}
      </div>
      <div v-if="error" class="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
        {{ error }}
      </div>

      <div class="mt-5 grid gap-4">
        <label class="grid gap-2 text-sm font-bold text-zinc-700">
          Nama
          <input v-model="checkoutForm.customer_name" class="field-input" type="text" required />
        </label>
        <label class="grid gap-2 text-sm font-bold text-zinc-700">
          Email
          <input v-model="checkoutForm.customer_email" class="field-input" type="email" required />
        </label>
        <label class="grid gap-2 text-sm font-bold text-zinc-700">
          Telepon
          <input v-model="checkoutForm.customer_phone" class="field-input" type="text" />
        </label>
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="grid gap-2 text-sm font-bold text-zinc-700">
            Provinsi
            <input v-model="checkoutForm.shipping_province" class="field-input" type="text" />
          </label>
          <label class="grid gap-2 text-sm font-bold text-zinc-700">
            Kota
            <input v-model="checkoutForm.shipping_city" class="field-input" type="text" />
          </label>
          <label class="grid gap-2 text-sm font-bold text-zinc-700">
            Kecamatan
            <input v-model="checkoutForm.shipping_district" class="field-input" type="text" />
          </label>
          <label class="grid gap-2 text-sm font-bold text-zinc-700">
            Kode pos
            <input v-model="checkoutForm.shipping_postal_code" class="field-input" type="text" />
          </label>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="grid gap-2 text-sm font-bold text-zinc-700">
            Pengiriman
            <select v-model="checkoutForm.shipping_method" class="field-input">
              <option value="REGULER">Reguler</option>
              <option value="EXPRESS">Express</option>
              <option value="PICKUP">Ambil di toko</option>
            </select>
          </label>
          <label class="grid gap-2 text-sm font-bold text-zinc-700">
            Pembayaran
            <select v-model="checkoutForm.payment_method" class="field-input">
              <option value="COD">COD</option>
              <option value="BANK_TRANSFER">Bank transfer</option>
              <option value="EWALLET">E-wallet</option>
            </select>
          </label>
        </div>
        <label class="grid gap-2 text-sm font-bold text-zinc-700">
          Alamat
          <textarea v-model="checkoutForm.shipping_address" class="min-h-24 border border-zinc-200 bg-white px-4 py-3 text-zinc-950 shadow-sm outline-none transition focus:border-zinc-500 focus:ring-4 focus:ring-zinc-100" required />
        </label>
        <button class="inline-flex h-12 items-center justify-center gap-2 px-5 text-sm font-black uppercase tracking-wide text-white shadow-sm transition hover:opacity-90 disabled:opacity-60" :style="{ backgroundColor: accent }" type="submit" :disabled="loading || !cartProducts.length">
          <ShoppingBag class="h-4 w-4" />
          Buat order
        </button>
      </div>
      <section v-if="relatedProducts.length" class="mt-8 border-t border-zinc-200 pt-5">
        <p class="text-xs font-black uppercase tracking-wide" :style="{ color: accent }">Produk terkait</p>
        <div class="mt-3 grid gap-2">
          <button v-for="product in relatedProducts" :key="product.id" class="flex items-center justify-between gap-3 border border-zinc-200 px-3 py-2 text-left text-sm" type="button" @click="$emit('addToCart', product)">
            <span class="font-semibold">{{ product.name }}</span>
            <span class="font-black">{{ formatCurrency(product.price) }}</span>
          </button>
        </div>
      </section>
    </form>
  </section>
</template>
