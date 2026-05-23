<script setup lang="ts">
import { Grid2X2, Heart, Package, Search, SlidersHorizontal } from '@lucide/vue'
import type { Product } from '../../types'
import type { PageMeta, PublicPage } from './types'

defineProps<{
  page: PublicPage
  pageMeta: PageMeta
  products: Product[]
  search: string
  wishlistIds: string[]
  accent: string
  formatCurrency: (value: string | number) => string
  categoryLabel: (category?: string) => string
}>()

defineEmits<{
  'update:search': [value: string]
  selectProduct: [product: Product]
  toggleWishlist: [product: Product]
  addToCart: [product: Product]
}>()

function shellClass(page: PublicPage) {
  if (page === 'eksklusif') return 'bg-stone-50 text-zinc-950'
  if (page === 'new-arrivals') return 'bg-white text-zinc-950'
  return 'bg-zinc-50 text-zinc-950'
}

function layoutClass(page: PublicPage) {
  if (page === 'eksklusif') return 'lg:grid-cols-[340px_minmax(0,1fr)]'
  if (page === 'produk') return 'lg:grid-cols-[240px_minmax(0,1fr)]'
  return 'lg:grid-cols-[280px_minmax(0,1fr)]'
}

function asideClass(page: PublicPage) {
  if (page === 'eksklusif') return 'border-zinc-200 bg-white text-zinc-950 shadow-sm'
  if (page === 'produk') return 'border-zinc-200 bg-white text-zinc-950 shadow-sm'
  return 'border-zinc-200 bg-white text-zinc-950 shadow-sm'
}

function mutedTextClass(page: PublicPage) {
  return page === 'eksklusif' ? 'text-zinc-600' : 'text-zinc-500'
}

function cardClass(page: PublicPage) {
  if (page === 'eksklusif') return 'border border-zinc-300 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-200/70'
  if (page === 'produk') return 'border border-zinc-200 bg-white p-3 transition hover:-translate-y-1 hover:border-zinc-400 hover:shadow-lg hover:shadow-zinc-200/70'
  return 'border border-zinc-200 bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-200/70'
}

function mediaClass(page: PublicPage) {
  if (page === 'new-arrivals') return 'rounded-t-[2rem]'
  if (page === 'eksklusif') return 'border border-zinc-200'
  return ''
}

function mediaRatioClass(page: PublicPage) {
  if (page === 'eksklusif') return 'aspect-[16/11]'
  if (page === 'produk') return 'aspect-square'
  return 'aspect-[4/5]'
}

function gridClass(page: PublicPage) {
  if (page === 'eksklusif') return 'xl:grid-cols-2'
  if (page === 'produk') return 'xl:grid-cols-4'
  return 'xl:grid-cols-3'
}

function pageDescription(page: PublicPage) {
  if (page === 'new-arrivals') return 'Drop terbaru dengan visual editorial dan fokus produk baru.'
  if (page === 'eksklusif') return 'Koleksi pilihan dengan tampilan premium dan kontras tinggi.'
  return 'Katalog lengkap semua produk toko dalam layout yang lebih padat.'
}
</script>

<template>
  <section
    class="px-4 py-12 sm:px-6 lg:px-8"
    :class="shellClass(page)"
  >
    <div class="mx-auto grid max-w-[1440px] gap-8" :class="layoutClass(page)">
    <aside class="h-max border p-5 lg:sticky lg:top-28" :class="asideClass(page)">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-sm font-black uppercase tracking-wide">Filter</h2>
        <SlidersHorizontal class="h-4 w-4" :class="mutedTextClass(page)" />
      </div>
      <div class="relative mt-5">
        <Search class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          :value="search"
          class="h-12 w-full border border-zinc-200 bg-white pl-11 pr-4 text-sm font-semibold text-zinc-950 outline-none ring-[var(--store-accent)]/20 focus:ring-4"
          type="search"
          placeholder="Cari produk"
          @input="$emit('update:search', ($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="mt-6 space-y-3 border-t border-zinc-200 pt-5">
        <div class="flex items-center justify-between text-sm">
          <span class="font-semibold" :class="mutedTextClass(page)">Produk</span>
          <strong>{{ products.length }}</strong>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="font-semibold" :class="mutedTextClass(page)">Halaman</span>
          <strong>{{ pageMeta.title }}</strong>
        </div>
      </div>
    </aside>

    <div>
      <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-wide" :style="{ color: accent }">{{ pageMeta.eyebrow }}</p>
          <h2 class="mt-1 text-3xl font-black uppercase tracking-tight">{{ pageMeta.title }}</h2>
          <p class="mt-2 max-w-2xl text-sm font-semibold leading-6" :class="mutedTextClass(page)">
            {{ pageDescription(page) }}
          </p>
        </div>
        <div class="inline-flex h-10 items-center gap-2 border bg-white px-4 text-sm font-bold shadow-sm" :class="page === 'eksklusif' ? 'border-zinc-300 text-zinc-600' : 'border-zinc-200 text-zinc-600'">
          <Grid2X2 class="h-4 w-4" />
          {{ page === 'produk' ? 'Catalog view' : page === 'eksklusif' ? 'Premium view' : 'Drop view' }}
        </div>
      </div>

      <div v-if="!products.length" class="grid min-h-80 place-items-center border border-zinc-200 bg-zinc-50 p-8 text-center">
        <div>
          <Package class="mx-auto h-8 w-8 text-zinc-400" />
          <p class="mt-4 font-semibold text-zinc-700">Belum ada produk</p>
        </div>
      </div>

      <div v-else class="grid gap-x-5 gap-y-8 sm:grid-cols-2" :class="gridClass(page)">
        <article v-for="product in products" :key="product.id" class="group" :class="cardClass(page)">
          <div class="relative overflow-hidden bg-zinc-100" :class="mediaClass(page)">
            <button class="block w-full text-left" type="button" @click="$emit('selectProduct', product)">
              <div :class="mediaRatioClass(page)">
                <img v-if="product.image_url" :src="product.image_url" :alt="product.name" class="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <div v-else class="grid h-full place-items-center text-zinc-400">
                  <Package class="h-12 w-12" />
                </div>
              </div>
            </button>
            <span class="absolute left-3 top-3 bg-white px-3 py-1 text-xs font-black uppercase shadow-sm">
              {{ categoryLabel(product.category) }}
            </span>
            <span class="absolute bottom-3 right-3 bg-zinc-900 px-3 py-1 text-xs font-black text-white">
              Stok {{ product.stock }}
            </span>
          </div>
          <div class="pt-4">
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <h3 class="truncate text-base font-black uppercase tracking-tight">{{ product.name }}</h3>
                <p class="mt-1 line-clamp-2 min-h-10 text-sm leading-5" :class="mutedTextClass(page)">
                  {{ product.description || product.sku || 'Produk toko.' }}
                </p>
              </div>
              <button class="grid h-10 w-10 shrink-0 place-items-center rounded-full border text-zinc-600 transition hover:border-zinc-400 hover:bg-zinc-50" :class="page === 'eksklusif' ? 'border-zinc-200 bg-white text-zinc-950' : 'border-zinc-200'" type="button" aria-label="Wishlist" @click="$emit('toggleWishlist', product)">
                <Heart class="h-4 w-4" :class="wishlistIds.includes(product.id) ? 'fill-zinc-950 text-zinc-950' : ''" />
              </button>
            </div>
            <div class="mt-4 flex items-center justify-between gap-3">
              <strong class="text-lg">{{ formatCurrency(product.price) }}</strong>
              <button class="border border-zinc-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide transition hover:border-zinc-500" :style="{ color: accent }" type="button" @click="$emit('addToCart', product)">
                Keranjang
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
    </div>
  </section>
</template>
