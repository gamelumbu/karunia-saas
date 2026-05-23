<script setup lang="ts">
import { ChevronRight, Heart, Package, ShoppingBag } from '@lucide/vue'
import type { Product } from '../../types'

defineProps<{
  products: Product[]
  storeSlug: string
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
    <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div>
        <div class="mb-6 flex flex-col gap-3 border-b border-zinc-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="text-xs font-black uppercase tracking-wide" :style="{ color: accent }">Wishlist</p>
            <h2 class="mt-1 text-3xl font-black uppercase tracking-tight">Produk tersimpan</h2>
            <p class="mt-2 text-sm font-semibold text-zinc-500">Hanya produk yang dipilih user untuk disimpan di browser ini.</p>
          </div>
          <a class="inline-flex h-11 items-center justify-center gap-2 border border-zinc-200 bg-white px-5 text-sm font-black uppercase shadow-sm transition hover:border-zinc-500" :href="`/${storeSlug}/produk`">
            Tambah produk
            <ChevronRight class="h-4 w-4" />
          </a>
        </div>

        <div v-if="!products.length" class="grid min-h-96 place-items-center border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
          <div>
            <Heart class="mx-auto h-10 w-10 text-zinc-400" />
            <p class="mt-4 text-lg font-black uppercase text-zinc-800">Wishlist kosong</p>
            <p class="mt-2 text-sm font-semibold text-zinc-500">Simpan produk dari katalog sebelum checkout.</p>
          </div>
        </div>

        <div v-else class="grid gap-4">
          <article v-for="product in products" :key="product.id" class="grid gap-4 border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-400 hover:shadow-lg hover:shadow-zinc-200/70 sm:grid-cols-[180px_minmax(0,1fr)]">
            <a class="block bg-zinc-100" :href="`/${storeSlug}/products/${product.slug}`">
              <div class="aspect-[4/3] sm:aspect-square">
                <img v-if="product.image_url" :src="product.image_url" :alt="product.name" class="h-full w-full object-cover" />
                <div v-else class="grid h-full place-items-center text-zinc-400">
                  <Package class="h-10 w-10" />
                </div>
              </div>
            </a>
            <div class="flex min-w-0 flex-col justify-between gap-5">
              <div>
                <p class="text-xs font-black uppercase tracking-wide" :style="{ color: accent }">{{ categoryLabel(product.category) }}</p>
                <a class="mt-1 block text-2xl font-black uppercase tracking-tight hover:text-zinc-600" :href="`/${storeSlug}/products/${product.slug}`">{{ product.name }}</a>
                <p class="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500">{{ product.description || product.sku || 'Produk toko.' }}</p>
              </div>
              <div class="flex flex-wrap items-center justify-between gap-3">
                <strong class="text-xl">{{ formatCurrency(product.price) }}</strong>
                <div class="flex gap-2">
                  <button class="inline-flex h-11 items-center justify-center border border-zinc-200 px-4 text-sm font-black uppercase transition hover:border-zinc-500" type="button" @click="$emit('toggleWishlist', product)">
                    Hapus
                  </button>
                  <button class="inline-flex h-11 items-center justify-center gap-2 px-5 text-sm font-black uppercase text-white shadow-sm transition hover:opacity-90" :style="{ backgroundColor: accent }" type="button" @click="$emit('addToCart', product)">
                    <ShoppingBag class="h-4 w-4" />
                    Keranjang
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>

      <aside class="h-max border border-zinc-200 bg-white p-5 text-zinc-950 shadow-sm lg:sticky lg:top-24">
        <p class="text-xs font-black uppercase tracking-wide text-zinc-500">Ringkasan</p>
        <h3 class="mt-1 text-2xl font-black uppercase">{{ products.length }} item</h3>
        <p class="mt-3 text-sm font-semibold leading-6 text-zinc-500">Pindahkan produk pilihan ke keranjang untuk lanjut membuat order tanpa register.</p>
        <a class="mt-6 inline-flex h-11 w-full items-center justify-center text-sm font-black uppercase text-white shadow-sm transition hover:opacity-90" :style="{ backgroundColor: accent }" :href="`/${storeSlug}/checkout`">
          Buka keranjang
        </a>
      </aside>
    </div>
  </section>
</template>
