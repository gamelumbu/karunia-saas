<script setup lang="ts">
import { computed } from 'vue'
import { Heart, Menu, ShoppingBag, Store } from '@lucide/vue'
import type { Storefront, Tenant } from '../../types'
import type { NavItem } from './types'

const props = defineProps<{
  storefront: Storefront
  storeSlug: string
  navItems: NavItem[]
  wishlistCount: number
  cartCount: number
  stores: Tenant[]
  accent: string
  showAdminLink: boolean
  showTenantLoginLink: boolean
  initials: (value: string) => string
}>()

defineEmits<{
  selectStore: [slug: string]
}>()

function tenantSlug(store: Tenant) {
  return store.domain || store.code
}

const isAllStores = computed(() => props.storeSlug === 'marketplace')
const selectedStoreValue = computed(() =>
  isAllStores.value ? '__all__' : props.storeSlug,
)
const primaryNavItems = computed(() =>
  props.navItems.filter((item) => !['Wishlist', 'Checkout'].includes(item.label)),
)
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur-xl">
    <div class="border-b border-zinc-100 bg-zinc-50 px-4 py-2 text-center text-[11px] font-black uppercase tracking-wide text-zinc-600 sm:px-6 lg:px-8">
      New collection available now · Checkout tanpa register
    </div>
    <div class="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
      <div class="flex min-w-0 items-center gap-3">
        <button class="grid h-10 w-10 place-items-center rounded-full border border-zinc-200 lg:hidden" type="button">
          <Menu class="h-5 w-5" />
        </button>
        <a class="grid h-11 w-11 shrink-0 place-items-center overflow-hidden border border-zinc-200 bg-white text-sm font-black text-zinc-950 shadow-sm" :href="`/${storeSlug}`">
          <img v-if="storefront.store.storefront_logo_url" :src="storefront.store.storefront_logo_url" :alt="storefront.store.name" class="h-full w-full object-cover" />
          <span v-else>{{ initials(storefront.store.name) || 'K' }}</span>
        </a>
        <div class="min-w-0">
          <p class="truncate text-base font-black uppercase tracking-wide">{{ storefront.store.name }}</p>
          <p class="truncate text-xs font-semibold text-zinc-500">Official store /{{ storeSlug }}</p>
        </div>
      </div>

      <label class="hidden min-w-[220px] max-w-xs gap-1 text-xs font-black uppercase tracking-wide text-zinc-500 md:grid">
        Pilih toko
        <select
          class="h-10 border border-zinc-200 bg-white px-3 text-sm font-bold normal-case tracking-normal text-zinc-950 outline-none transition focus:border-zinc-500"
          :value="selectedStoreValue"
          @change="$emit('selectStore', ($event.target as HTMLSelectElement).value)"
        >
          <option value="__all__">Semua toko aktif</option>
          <option v-if="!isAllStores" :value="storeSlug">{{ storefront.store.name }}</option>
          <option v-for="store in stores" v-show="tenantSlug(store) !== storeSlug" :key="store.id" :value="tenantSlug(store)">
            {{ store.name }}
          </option>
        </select>
      </label>

      <nav class="hidden items-center gap-7 text-sm font-black uppercase tracking-wide text-zinc-600 lg:flex">
        <a v-for="item in primaryNavItems" :key="item.href" :href="item.href" class="border-b-2 border-transparent py-2 transition hover:border-zinc-950 hover:text-zinc-950">
          {{ item.label }}
        </a>
      </nav>

      <div class="flex items-center gap-2">
        <a
          v-if="showTenantLoginLink"
          class="inline-flex h-11 items-center justify-center gap-2 border border-zinc-950 bg-zinc-950 px-4 text-xs font-black uppercase tracking-wide text-white shadow-sm transition hover:bg-zinc-800"
          href="/login-tenant"
        >
          <Store class="h-4 w-4" />
          Buat Toko
        </a>
        <a
          v-if="showAdminLink"
          class="inline-flex h-11 items-center justify-center border border-zinc-950 bg-zinc-950 px-4 text-xs font-black uppercase tracking-wide text-white shadow-sm transition hover:bg-zinc-800"
          href="/login-tenant"
        >
          Dashboard
        </a>
        <a class="relative grid h-11 w-11 place-items-center rounded-full border border-zinc-200 bg-white shadow-sm transition hover:border-zinc-400" :href="`/${storeSlug}/wishlist`" aria-label="Wishlist">
          <Heart class="h-4 w-4" />
          <span v-if="wishlistCount" class="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-zinc-900 px-1 text-[10px] font-black text-white">
            {{ wishlistCount }}
          </span>
        </a>
        <a class="relative grid h-11 w-11 place-items-center rounded-full text-white shadow-sm transition hover:opacity-90" :style="{ backgroundColor: accent }" :href="`/${storeSlug}/checkout`" aria-label="Checkout">
          <ShoppingBag class="h-4 w-4" />
          <span v-if="cartCount" class="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-zinc-900 px-1 text-[10px] font-black text-white">
            {{ cartCount }}
          </span>
        </a>
      </div>
    </div>
    <div class="border-t border-zinc-100 px-4 py-3 md:hidden">
      <select
        class="h-11 w-full border border-zinc-200 bg-white px-3 text-sm font-bold text-zinc-950 outline-none"
        :value="selectedStoreValue"
        @change="$emit('selectStore', ($event.target as HTMLSelectElement).value)"
      >
        <option value="__all__">Semua toko aktif</option>
        <option v-if="!isAllStores" :value="storeSlug">{{ storefront.store.name }}</option>
        <option v-for="store in stores" v-show="tenantSlug(store) !== storeSlug" :key="store.id" :value="tenantSlug(store)">
          {{ store.name }}
        </option>
      </select>
    </div>
  </header>
</template>
