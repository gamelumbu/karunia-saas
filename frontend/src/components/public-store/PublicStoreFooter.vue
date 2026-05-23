<script setup lang="ts">
import { ArrowUpRight, CreditCard, ShieldCheck, Store, Truck } from '@lucide/vue'
import type { Storefront } from '../../types'
import type { NavItem } from './types'

defineProps<{
  storefront: Storefront
  storeSlug: string
  navItems: NavItem[]
  accent: string
  productsCount: number
  storesCount: number
  initials: (value: string) => string
}>()
</script>

<template>
  <footer class="border-t border-zinc-200 bg-zinc-950 text-white">
    <div class="mx-auto grid max-w-[1440px] gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.15fr_0.85fr_0.9fr] lg:px-8">
      <section>
        <a class="inline-grid h-12 w-12 place-items-center overflow-hidden border border-white/15 bg-white text-sm font-black text-zinc-950" :href="`/${storeSlug}`">
          <img v-if="storefront.store.storefront_logo_url" :src="storefront.store.storefront_logo_url" :alt="storefront.store.name" class="h-full w-full object-cover" />
          <span v-else>{{ initials(storefront.store.name) || 'K' }}</span>
        </a>
        <h2 class="mt-6 max-w-xl text-3xl font-black uppercase leading-none tracking-tight sm:text-4xl">
          {{ storefront.store.name }}
        </h2>
        <p class="mt-4 max-w-lg text-sm font-semibold leading-6 text-zinc-400">
          {{ storefront.store.storefront_tagline || 'Marketplace modern untuk menemukan produk aktif, menyimpan wishlist, dan checkout tanpa register.' }}
        </p>
      </section>

      <section class="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-2">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.24em] text-zinc-500">Belanja</p>
          <div class="mt-5 grid gap-3 text-sm font-bold text-zinc-300">
            <a v-for="item in navItems" :key="item.href" class="transition hover:text-white" :href="item.href">
              {{ item.label }}
            </a>
          </div>
        </div>
        <div>
          <p class="text-xs font-black uppercase tracking-[0.24em] text-zinc-500">Marketplace</p>
          <div class="mt-5 grid gap-3 text-sm font-bold text-zinc-300">
            <a class="transition hover:text-white" href="/marketplace">Semua toko</a>
            <a class="transition hover:text-white" href="/marketplace/produk">Semua produk</a>
            <a class="transition hover:text-white" href="/login-tenant">Buat toko</a>
          </div>
        </div>
      </section>

      <section>
        <div class="grid gap-3">
          <div class="flex items-center justify-between border border-white/10 bg-white/[0.03] p-4">
            <div class="flex items-center gap-3">
              <Store class="h-5 w-5" :style="{ color: accent }" />
              <span class="text-sm font-black uppercase">Toko aktif</span>
            </div>
            <strong>{{ storesCount || 1 }}</strong>
          </div>
          <div class="flex items-center justify-between border border-white/10 bg-white/[0.03] p-4">
            <div class="flex items-center gap-3">
              <ShieldCheck class="h-5 w-5" :style="{ color: accent }" />
              <span class="text-sm font-black uppercase">Produk aktif</span>
            </div>
            <strong>{{ productsCount }}</strong>
          </div>
        </div>

        <div class="mt-5 grid grid-cols-2 gap-3 text-xs font-black uppercase tracking-wide text-zinc-300">
          <div class="border border-white/10 bg-white/[0.03] p-4">
            <Truck class="mb-3 h-5 w-5" :style="{ color: accent }" />
            Pengiriman fleksibel
          </div>
          <div class="border border-white/10 bg-white/[0.03] p-4">
            <CreditCard class="mb-3 h-5 w-5" :style="{ color: accent }" />
            Checkout cepat
          </div>
        </div>

        <a class="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 bg-white px-5 text-sm font-black uppercase text-zinc-950 transition hover:bg-zinc-200" href="/login-tenant">
          Buat Toko
          <ArrowUpRight class="h-4 w-4" />
        </a>
      </section>
    </div>

    <div class="border-t border-white/10 px-4 py-5 sm:px-6 lg:px-8">
      <div class="mx-auto flex max-w-[1440px] flex-col gap-2 text-xs font-bold uppercase tracking-wide text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Umbu Gammaliel</p>
        <p>Karunia SaaS Marketplace</p>
      </div>
    </div>
  </footer>
</template>
