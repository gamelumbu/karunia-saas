<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Search, Store } from '@lucide/vue'
import { apiRequest } from '../services/api'
import type { ApiListResponse, Tenant } from '../types'

const loading = ref(false)
const error = ref('')
const stores = ref<Tenant[]>([])

onMounted(loadStores)

async function loadStores() {
  loading.value = true
  error.value = ''

  try {
    const result = await apiRequest<ApiListResponse<Tenant>>('/marketplace/stores')
    stores.value = result.data || []
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat toko'
  } finally {
    loading.value = false
  }
}

function tenantSlug(store: Tenant) {
  return store.domain || store.code
}
</script>

<template>
  <main class="min-h-screen bg-white text-zinc-950">
    <header class="border-b border-zinc-200 bg-zinc-50">
      <div class="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
        <a class="inline-flex h-10 items-center border border-zinc-200 bg-white px-4 text-sm font-black uppercase tracking-wide text-zinc-700" href="/">
          Admin
        </a>
        <div class="mt-10 max-w-4xl">
          <p class="text-xs font-black uppercase tracking-[0.28em] text-zinc-500">Marketplace</p>
          <h1 class="mt-4 text-5xl font-black uppercase leading-none tracking-tight sm:text-7xl">Pilih toko aktif</h1>
          <p class="mt-5 max-w-2xl text-base font-semibold leading-7 text-zinc-600">
            Jelajahi semua tenant/toko yang aktif dan pilih tempat belanja yang ingin dibuka.
          </p>
        </div>
      </div>
    </header>

    <section class="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
      <div v-if="loading" class="grid min-h-72 place-items-center border border-zinc-200 bg-zinc-50">
        <div class="text-center">
          <Store class="mx-auto h-8 w-8 text-zinc-400" />
          <p class="mt-4 text-sm font-semibold text-zinc-600">Memuat toko aktif...</p>
        </div>
      </div>

      <div v-else-if="error" class="border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
        {{ error }}
      </div>

      <div v-else-if="!stores.length" class="grid min-h-72 place-items-center border border-dashed border-zinc-300 bg-zinc-50">
        <div class="text-center">
          <Search class="mx-auto h-8 w-8 text-zinc-400" />
          <p class="mt-4 text-sm font-semibold text-zinc-600">Belum ada toko aktif.</p>
        </div>
      </div>

      <div v-else class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <a
          v-for="store in stores"
          :key="store.id"
          class="group border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-zinc-400 hover:shadow-xl hover:shadow-zinc-200/70"
          :href="`/${tenantSlug(store)}`"
        >
          <div class="aspect-[4/3] bg-zinc-100">
            <img v-if="store.storefront_banner_url || store.storefront_logo_url" :src="store.storefront_banner_url || store.storefront_logo_url || ''" :alt="store.name" class="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            <div v-else class="grid h-full place-items-center text-zinc-400">
              <Store class="h-12 w-12" />
            </div>
          </div>
          <p class="mt-4 text-xs font-black uppercase tracking-wide text-zinc-500">/{{ tenantSlug(store) }}</p>
          <h2 class="mt-1 truncate text-xl font-black uppercase tracking-tight">{{ store.name }}</h2>
          <p class="mt-2 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-zinc-500">
            {{ store.storefront_tagline || 'Toko aktif di marketplace.' }}
          </p>
          <span class="mt-5 inline-flex h-10 items-center justify-center border border-zinc-200 px-4 text-sm font-black uppercase transition group-hover:border-zinc-950">
            Buka toko
          </span>
        </a>
      </div>
    </section>
  </main>
</template>
