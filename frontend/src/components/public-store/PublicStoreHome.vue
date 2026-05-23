<script setup lang="ts">
import { ChevronRight, Heart, Package, ShoppingBag } from '@lucide/vue'
import type { Product } from '../../types'
import type { HomeSection } from './types'

defineProps<{
  sections: HomeSection[]
  storeSlug: string
  wishlistIds: string[]
  accent: string
  formatCurrency: (value: string | number) => string
  categoryLabel: (category?: string) => string
}>()

defineEmits<{
  toggleWishlist: [product: Product]
  addToCart: [product: Product]
}>()
</script>

<template>
  <section class="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
    <section v-for="section in sections" :key="section.title" class="border-b border-zinc-200 py-10 first:pt-0 last:border-b-0">
      <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-wide" :style="{ color: accent }">{{ section.eyebrow }}</p>
          <h2 class="mt-1 text-3xl font-black uppercase tracking-tight">{{ section.title }}</h2>
        </div>
        <a class="inline-flex h-10 items-center gap-2 rounded-full border border-zinc-200 px-4 text-sm font-black uppercase tracking-wide" :href="section.href">
          Lihat semua
          <ChevronRight class="h-4 w-4" />
        </a>
      </div>

      <div v-if="!section.rows.length" class="grid min-h-48 place-items-center border border-zinc-200 bg-zinc-50 p-8 text-center">
        <div>
          <Package class="mx-auto h-8 w-8 text-zinc-400" />
          <p class="mt-4 font-semibold text-zinc-700">Belum ada produk</p>
        </div>
      </div>

      <div v-else class="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        <article v-for="product in section.rows" :key="product.id" class="group bg-white">
          <a class="block w-full text-left" :href="`/${storeSlug}/products/${product.slug}`">
            <div class="relative overflow-hidden bg-zinc-100">
              <div class="aspect-[4/5]">
                <img v-if="product.image_url" :src="product.image_url" :alt="product.name" class="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <div v-else class="grid h-full place-items-center text-zinc-400">
                  <Package class="h-12 w-12" />
                </div>
              </div>
              <span class="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-black uppercase shadow-sm">
                {{ categoryLabel(product.category) }}
              </span>
            </div>
            <h3 class="mt-4 truncate text-base font-black uppercase tracking-tight">{{ product.name }}</h3>
            <p class="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-zinc-500">
              {{ product.description || product.sku || 'Produk toko.' }}
            </p>
            <strong class="mt-3 block text-lg">{{ formatCurrency(product.price) }}</strong>
          </a>
          <div class="mt-4 flex gap-2">
            <button class="grid h-10 w-10 place-items-center rounded-full border border-zinc-200" type="button" @click="$emit('toggleWishlist', product)">
              <Heart class="h-4 w-4" :class="wishlistIds.includes(product.id) ? 'fill-zinc-950 text-zinc-950' : ''" />
            </button>
            <button class="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-black uppercase text-white" :style="{ backgroundColor: accent }" type="button" @click="$emit('addToCart', product)">
              <ShoppingBag class="h-4 w-4" />
              Keranjang
            </button>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>
