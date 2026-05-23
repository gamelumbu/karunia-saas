<script setup lang="ts">
import { ChevronRight, Package, Sparkles } from '@lucide/vue'
import type { Product, Storefront } from '../../types'
import type { PageMeta, PublicPage } from './types'

defineProps<{
  storefront: Storefront
  storeSlug: string
  page: PublicPage
  pageMeta: PageMeta
  templateName: string
  heroTone: string
  accent: string
  featuredProduct: Product | null
  formatCurrency: (value: string | number) => string
}>()
</script>

<template>
  <section :class="heroTone">
    <div
      v-if="page === 'home'"
      class="mx-auto grid max-w-[1440px] gap-10 px-4 py-12 sm:px-6 lg:min-h-[560px] lg:grid-cols-[minmax(0,0.92fr)_minmax(440px,0.82fr)] lg:items-center lg:px-8"
    >
      <div class="max-w-3xl">
        <div class="inline-flex items-center gap-2 border border-zinc-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-zinc-700 shadow-sm">
          <Sparkles class="h-4 w-4" :style="{ color: accent }" />
          {{ pageMeta.eyebrow }}
        </div>
        <h1 class="mt-6 max-w-4xl text-6xl font-black uppercase leading-[0.9] tracking-tight sm:text-7xl xl:text-8xl">
          {{ pageMeta.title }}
        </h1>
        <p class="mt-6 max-w-2xl text-base font-medium leading-7 text-zinc-600">
          {{ storefront.store.storefront_tagline || pageMeta.description }}
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <a class="inline-flex h-12 items-center justify-center gap-2 px-6 text-sm font-black uppercase tracking-wide text-white shadow-sm transition hover:opacity-90" :style="{ backgroundColor: accent }" :href="`/${storeSlug}/produk`">
            Lihat produk
            <ChevronRight class="h-4 w-4" />
          </a>
          <a class="inline-flex h-12 items-center justify-center gap-2 border border-zinc-300 bg-white px-6 text-sm font-black uppercase tracking-wide text-zinc-950 shadow-sm transition hover:border-zinc-500" :href="`/${storeSlug}/checkout`">
            Checkout
          </a>
        </div>
        <div class="mt-10 grid max-w-xl grid-cols-3 border-y border-zinc-200 py-5">
          <div>
            <p class="text-2xl font-black">{{ storefront.products.length }}</p>
            <p class="mt-1 text-xs font-bold uppercase tracking-wide text-zinc-500">Produk</p>
          </div>
          <div class="border-x border-zinc-200 px-5">
            <p class="text-2xl font-black">24/7</p>
            <p class="mt-1 text-xs font-bold uppercase tracking-wide text-zinc-500">Order</p>
          </div>
          <div class="pl-5">
            <p class="text-2xl font-black">COD</p>
            <p class="mt-1 text-xs font-bold uppercase tracking-wide text-zinc-500">Payment</p>
          </div>
        </div>
      </div>

      <div class="relative">
        <div class="overflow-hidden border border-zinc-200 bg-white p-3 shadow-xl shadow-zinc-200/70">
          <div class="aspect-[5/4] bg-zinc-100">
            <img v-if="storefront.store.storefront_banner_url || featuredProduct?.image_url" :src="storefront.store.storefront_banner_url || featuredProduct?.image_url || ''" :alt="storefront.store.name" class="h-full w-full object-cover" />
            <div v-else class="grid h-full place-items-center bg-zinc-100 text-zinc-400">
              <Package class="h-20 w-20" />
            </div>
          </div>
        </div>
        <div class="absolute bottom-5 left-5 right-5 border border-zinc-200 bg-white/95 p-5 text-zinc-950 shadow-2xl backdrop-blur">
          <p class="text-xs font-black uppercase tracking-wide text-zinc-500">Featured drop</p>
          <div class="mt-2 flex items-end justify-between gap-4">
            <div>
              <h2 class="text-xl font-black">{{ featuredProduct?.name || 'Produk unggulan' }}</h2>
              <p class="mt-1 text-sm text-zinc-500">{{ featuredProduct ? formatCurrency(featuredProduct.price) : 'Segera hadir' }}</p>
            </div>
            <span class="px-3 py-1 text-xs font-black text-white" :style="{ backgroundColor: accent }">
              {{ storefront.products.length }} item
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="page === 'new-arrivals'" class="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
      <div class="grid gap-6 border border-zinc-200 bg-white p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:p-6">
        <div class="py-6 lg:py-10">
          <p class="text-xs font-black uppercase tracking-[0.28em]" :style="{ color: accent }">{{ pageMeta.eyebrow }}</p>
          <h1 class="mt-4 max-w-3xl text-5xl font-black uppercase leading-none tracking-tight sm:text-6xl">Fresh this week</h1>
          <p class="mt-5 max-w-xl text-sm font-semibold leading-7 text-zinc-600">{{ pageMeta.description }}</p>
          <a class="mt-8 inline-flex h-11 items-center justify-center gap-2 px-5 text-sm font-black uppercase text-white" :style="{ backgroundColor: accent }" :href="`/${storeSlug}/new-arrivals`">
            Browse drops
            <ChevronRight class="h-4 w-4" />
          </a>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="aspect-[3/4] bg-zinc-100">
            <img v-if="featuredProduct?.image_url" :src="featuredProduct.image_url" :alt="featuredProduct.name" class="h-full w-full object-cover" />
          </div>
          <div class="mt-10 aspect-[3/4] bg-zinc-100">
            <img v-if="storefront.store.storefront_banner_url" :src="storefront.store.storefront_banner_url" :alt="storefront.store.name" class="h-full w-full object-cover" />
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="page === 'eksklusif'" class="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
      <div class="grid gap-6 bg-stone-100 lg:grid-cols-[380px_minmax(0,1fr)]">
        <aside class="border border-zinc-200 bg-white p-6">
          <p class="text-xs font-black uppercase tracking-[0.28em]" :style="{ color: accent }">{{ pageMeta.eyebrow }}</p>
          <h1 class="mt-5 text-5xl font-black uppercase leading-none">Eksklusif</h1>
          <p class="mt-5 text-sm font-semibold leading-7 text-zinc-600">{{ pageMeta.description }}</p>
          <div class="mt-8 border-t border-zinc-200 pt-5">
            <p class="text-3xl font-black">{{ storefront.products.length }}</p>
            <p class="mt-1 text-xs font-bold uppercase tracking-wide text-zinc-500">Curated inventory</p>
          </div>
        </aside>
        <div class="border border-zinc-200 bg-white p-3">
          <div class="aspect-[16/7] bg-zinc-100">
            <img v-if="storefront.store.storefront_banner_url || featuredProduct?.image_url" :src="storefront.store.storefront_banner_url || featuredProduct?.image_url || ''" :alt="storefront.store.name" class="h-full w-full object-cover" />
          </div>
        </div>
      </div>
    </div>

    <div v-else class="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
      <div class="flex flex-col gap-5 border-b border-zinc-200 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.28em]" :style="{ color: accent }">{{ pageMeta.eyebrow }}</p>
          <h1 class="mt-3 text-4xl font-black uppercase tracking-tight sm:text-5xl">{{ pageMeta.title }}</h1>
          <p class="mt-3 max-w-2xl text-sm font-semibold leading-6 text-zinc-600">{{ pageMeta.description }}</p>
        </div>
        <a class="inline-flex h-11 items-center justify-center gap-2 border border-zinc-300 bg-white px-5 text-sm font-black uppercase text-zinc-950 shadow-sm" :href="`/${storeSlug}/checkout`">
          Keranjang
          <ChevronRight class="h-4 w-4" />
        </a>
      </div>
    </div>
  </section>
</template>
