<script setup lang="ts">
import { Heart, Package, ShoppingBag } from '@lucide/vue'
import type { Product } from '../../types'
import type { CartProduct } from './types'

defineProps<{
  product: Product | null
  relatedProducts: Product[]
  cartProducts: CartProduct[]
  wishlistIds: string[]
  storeSlug: string
  accent: string
  formatCurrency: (value: string | number) => string
}>()

defineEmits<{
  toggleWishlist: [product: Product]
  addToCart: [product: Product]
}>()
</script>

<template>
  <section class="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
    <div class="mb-8 border-b border-zinc-200 pb-5">
      <a class="text-xs font-black uppercase tracking-wide text-zinc-500 hover:text-zinc-950" :href="`/${storeSlug}/produk`">Produk / Detail</a>
    </div>
    <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
    <article v-if="product" class="grid gap-8 lg:grid-cols-[0.9fr_1fr]">
      <div class="border border-zinc-200 bg-white p-3 shadow-sm">
        <div class="aspect-[4/5]">
          <img v-if="product.image_url" :src="product.image_url" :alt="product.name" class="h-full w-full object-cover" />
          <div v-else class="grid h-full place-items-center text-zinc-400">
            <Package class="h-16 w-16" />
          </div>
        </div>
      </div>
      <div class="lg:pt-8">
        <p class="text-xs font-black uppercase tracking-wide" :style="{ color: accent }">{{ product.category || 'product' }}</p>
        <h2 class="mt-2 text-5xl font-black uppercase leading-none tracking-tight">{{ product.name }}</h2>
        <p class="mt-5 text-2xl font-black">{{ formatCurrency(product.price) }}</p>
        <p class="mt-5 leading-7 text-zinc-600">{{ product.description || 'Produk toko.' }}</p>
        <div class="mt-8 flex gap-3">
          <button class="grid h-12 w-12 place-items-center border border-zinc-200 bg-white transition hover:border-zinc-500" type="button" @click="$emit('toggleWishlist', product)">
            <Heart class="h-5 w-5" :class="wishlistIds.includes(product.id) ? 'fill-zinc-950 text-zinc-950' : ''" />
          </button>
          <button class="inline-flex h-12 flex-1 items-center justify-center gap-2 px-6 text-sm font-black uppercase text-white shadow-sm transition hover:opacity-90" :style="{ backgroundColor: accent }" type="button" @click="$emit('addToCart', product)">
            <ShoppingBag class="h-4 w-4" />
            Tambah ke keranjang
          </button>
        </div>
        <section v-if="relatedProducts.length" class="mt-10 border-t border-zinc-200 pt-6">
          <p class="text-xs font-black uppercase tracking-wide" :style="{ color: accent }">Produk terkait</p>
          <div class="mt-4 grid gap-3">
            <a v-for="row in relatedProducts" :key="row.id" class="flex items-center justify-between border border-zinc-200 p-3 text-sm font-semibold hover:bg-zinc-50" :href="`/${storeSlug}/products/${row.slug}`">
              <span>{{ row.name }}</span>
              <span>{{ formatCurrency(row.price) }}</span>
            </a>
          </div>
        </section>
      </div>
    </article>
    <aside class="h-max border border-zinc-200 bg-white p-5 shadow-sm lg:sticky lg:top-28">
      <h3 class="text-lg font-black uppercase">Keranjang</h3>
      <p class="mt-2 text-sm text-zinc-500">{{ cartProducts.length }} produk di keranjang.</p>
      <a class="mt-5 inline-flex h-11 w-full items-center justify-center text-sm font-black uppercase text-white shadow-sm transition hover:opacity-90" :style="{ backgroundColor: accent }" :href="`/${storeSlug}/checkout`">
        Checkout
      </a>
    </aside>
    </div>
  </section>
</template>
