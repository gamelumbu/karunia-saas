<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Grid2X2,
  Heart,
  Menu,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Store,
  Truck,
} from '@lucide/vue'
import { apiRequest } from '../services/api'
import type { ApiSingleResponse, Order, Product, Storefront } from '../types'

const props = defineProps<{
  slug: string
}>()

const loading = ref(false)
const error = ref('')
const notice = ref('')
const storefront = ref<Storefront | null>(null)
const search = ref('')
const selectedProduct = ref<Product | null>(null)

const checkoutForm = reactive({
  quantity: 1,
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  shipping_address: '',
})

const accent = computed(
  () => storefront.value?.store.storefront_accent_color || '#111827',
)
const template = computed(
  () => storefront.value?.store.storefront_template || 'market',
)
const products = computed(() => {
  const keyword = search.value.toLowerCase().trim()
  const rows = storefront.value?.products || []
  if (!keyword) return rows

  return rows.filter((product) => {
    return [product.name, product.description, product.sku]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword))
  })
})
const featuredProduct = computed(() => products.value[0] || null)
const storeSlug = computed(
  () => storefront.value?.store.domain || storefront.value?.store.code || props.slug,
)
const heroTone = computed(() => {
  if (template.value === 'editorial') return 'bg-[#111111] text-white'
  if (template.value === 'compact') return 'bg-zinc-50 text-zinc-950'
  return 'bg-white text-zinc-950'
})

onMounted(loadStore)

async function loadStore() {
  loading.value = true
  error.value = ''

  try {
    const result = await apiRequest<ApiSingleResponse<Storefront>>(
      `/marketplace/stores/${props.slug}`,
    )
    storefront.value = result.data
    selectedProduct.value = result.data.products[0] || null
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Toko tidak ditemukan'
  } finally {
    loading.value = false
  }
}

async function createOrder(product: Product) {
  loading.value = true
  error.value = ''
  notice.value = ''

  try {
    await apiRequest<ApiSingleResponse<Order>>(
      `/marketplace/stores/${props.slug}/orders`,
      {
        method: 'POST',
        body: JSON.stringify({
          customer_name: checkoutForm.customer_name,
          customer_email: checkoutForm.customer_email,
          customer_phone: checkoutForm.customer_phone || undefined,
          shipping_address: checkoutForm.shipping_address,
          items: [
            {
              product_id: product.id,
              quantity: Number(checkoutForm.quantity),
            },
          ],
        }),
      },
    )

    checkoutForm.quantity = 1
    checkoutForm.customer_name = ''
    checkoutForm.customer_email = ''
    checkoutForm.customer_phone = ''
    checkoutForm.shipping_address = ''
    notice.value = 'Order berhasil dibuat. Penjual akan memproses pesanan.'
    await loadStore()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Checkout gagal'
  } finally {
    loading.value = false
  }
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase())
    .join('')
}
</script>

<template>
  <main class="min-h-screen bg-white text-zinc-950" :style="{ '--store-accent': accent }">
    <section v-if="loading && !storefront" class="grid min-h-screen place-items-center px-4">
      <div class="text-center">
        <Store class="mx-auto h-8 w-8 text-zinc-400" />
        <p class="mt-4 text-sm font-semibold text-zinc-600">Memuat toko...</p>
      </div>
    </section>

    <section v-else-if="error && !storefront" class="grid min-h-screen place-items-center px-4">
      <div class="max-w-md text-center">
        <Store class="mx-auto h-10 w-10 text-zinc-400" />
        <h1 class="mt-5 text-2xl font-semibold">Toko tidak ditemukan</h1>
        <p class="mt-2 text-sm text-zinc-500">{{ error }}</p>
        <a class="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white" href="/">
          <ArrowLeft class="h-4 w-4" />
          Kembali
        </a>
      </div>
    </section>

    <template v-else-if="storefront">
      <header class="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div class="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div class="flex min-w-0 items-center gap-3">
            <button class="grid h-10 w-10 place-items-center rounded-full border border-zinc-200 lg:hidden" type="button">
              <Menu class="h-5 w-5" />
            </button>
            <a class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-zinc-950 text-sm font-black text-white" href="/">
              {{ initials(storefront.store.name) || 'K' }}
            </a>
            <div class="min-w-0">
              <p class="truncate text-sm font-black uppercase tracking-wide">{{ storefront.store.name }}</p>
              <p class="truncate text-xs font-semibold text-zinc-500">/{{ storeSlug }}</p>
            </div>
          </div>

          <nav class="hidden items-center gap-8 text-sm font-bold uppercase tracking-wide text-zinc-700 lg:flex">
            <a href="#produk" class="hover:text-zinc-950">Produk</a>
            <a href="#checkout" class="hover:text-zinc-950">Checkout</a>
            <a href="/" class="hover:text-zinc-950">Admin</a>
          </nav>

          <div class="flex items-center gap-2">
            <button class="grid h-10 w-10 place-items-center rounded-full border border-zinc-200" type="button" aria-label="Wishlist">
              <Heart class="h-4 w-4" />
            </button>
            <a class="grid h-10 w-10 place-items-center rounded-full bg-zinc-950 text-white" href="#checkout" aria-label="Checkout">
              <ShoppingBag class="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      <section class="border-b border-zinc-200" :class="heroTone">
        <div
          class="mx-auto grid max-w-[1440px] gap-8 px-4 py-10 sm:px-6 lg:px-8"
          :class="template === 'compact' ? 'lg:grid-cols-[1fr_320px]' : 'lg:min-h-[560px] lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.8fr)] lg:items-center'"
        >
          <div class="max-w-3xl">
            <div class="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-wide" :class="template === 'editorial' ? 'border-white/20 text-white' : 'border-zinc-200 text-zinc-700'">
              <Sparkles class="h-4 w-4" :style="{ color: accent }" />
              Karunia storefront
            </div>
            <h1
              class="mt-6 max-w-4xl font-black uppercase leading-none"
              :class="template === 'compact' ? 'text-5xl sm:text-6xl' : 'text-6xl sm:text-7xl xl:text-8xl'"
            >
              {{ storefront.store.name }}
            </h1>
            <p class="mt-6 max-w-2xl text-base leading-7" :class="template === 'editorial' ? 'text-zinc-300' : 'text-zinc-600'">
              Storefront modern untuk katalog produk, checkout cepat, dan pengalaman belanja yang terasa seperti brand retail besar.
            </p>
            <div class="mt-8 flex flex-wrap gap-3">
              <a class="inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-black uppercase tracking-wide text-white" :style="{ backgroundColor: accent }" href="#produk">
                Belanja sekarang
                <ChevronRight class="h-4 w-4" />
              </a>
              <a class="inline-flex h-12 items-center justify-center gap-2 rounded-full border px-6 text-sm font-black uppercase tracking-wide" :class="template === 'editorial' ? 'border-white/25 text-white' : 'border-zinc-300 text-zinc-950'" href="#checkout">
                Checkout
              </a>
            </div>
          </div>

          <div class="relative">
            <div class="overflow-hidden border" :class="template === 'editorial' ? 'border-white/15 bg-white/10' : 'border-zinc-200 bg-zinc-100'">
              <div class="aspect-[4/5]">
                <img
                  v-if="featuredProduct?.image_url"
                  :src="featuredProduct.image_url"
                  :alt="featuredProduct.name"
                  class="h-full w-full object-cover"
                />
                <div v-else class="grid h-full place-items-center" :class="template === 'editorial' ? 'bg-zinc-900 text-zinc-600' : 'bg-zinc-100 text-zinc-400'">
                  <Package class="h-20 w-20" />
                </div>
              </div>
            </div>
            <div class="absolute bottom-5 left-5 right-5 bg-white p-5 text-zinc-950 shadow-2xl">
              <p class="text-xs font-black uppercase tracking-wide text-zinc-500">Featured drop</p>
              <div class="mt-2 flex items-end justify-between gap-4">
                <div>
                  <h2 class="text-xl font-black">{{ featuredProduct?.name || 'Produk unggulan' }}</h2>
                  <p class="mt-1 text-sm text-zinc-500">{{ featuredProduct ? formatCurrency(featuredProduct.price) : 'Segera hadir' }}</p>
                </div>
                <span class="rounded-full px-3 py-1 text-xs font-black text-white" :style="{ backgroundColor: accent }">
                  {{ storefront.products.length }} item
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="border-b border-zinc-200 bg-white">
        <div class="mx-auto grid max-w-[1440px] gap-3 px-4 py-4 sm:px-6 md:grid-cols-3 lg:px-8">
          <div class="flex items-center gap-3 text-sm font-semibold text-zinc-700">
            <Truck class="h-5 w-5" :style="{ color: accent }" />
            Checkout langsung ke seller
          </div>
          <div class="flex items-center gap-3 text-sm font-semibold text-zinc-700">
            <ShieldCheck class="h-5 w-5" :style="{ color: accent }" />
            Katalog toko terverifikasi
          </div>
          <div class="flex items-center gap-3 text-sm font-semibold text-zinc-700">
            <Check class="h-5 w-5" :style="{ color: accent }" />
            Stok sinkron realtime
          </div>
        </div>
      </section>

      <section id="produk" class="mx-auto grid max-w-[1440px] gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)_380px] lg:px-8">
        <aside class="h-max border border-zinc-200 bg-white p-5 lg:sticky lg:top-24">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-sm font-black uppercase tracking-wide">Filter</h2>
            <SlidersHorizontal class="h-4 w-4 text-zinc-500" />
          </div>
          <div class="relative mt-5">
            <Search class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              v-model="search"
              class="h-12 w-full rounded-full border border-zinc-200 bg-white pl-11 pr-4 text-sm text-zinc-950 outline-none ring-[var(--store-accent)]/20 focus:ring-4"
              type="search"
              placeholder="Cari produk"
            />
          </div>
          <div class="mt-6 space-y-3 border-t border-zinc-200 pt-5">
            <div class="flex items-center justify-between text-sm">
              <span class="font-semibold text-zinc-600">Produk</span>
              <strong>{{ products.length }}</strong>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="font-semibold text-zinc-600">Template</span>
              <strong class="capitalize">{{ template }}</strong>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="font-semibold text-zinc-600">Slug</span>
              <strong>/{{ storeSlug }}</strong>
            </div>
          </div>
        </aside>

        <div>
          <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p class="text-xs font-black uppercase tracking-wide" :style="{ color: accent }">Latest collection</p>
              <h2 class="mt-1 text-3xl font-black uppercase tracking-tight">Produk toko</h2>
            </div>
            <div class="inline-flex h-10 items-center gap-2 rounded-full border border-zinc-200 px-4 text-sm font-bold text-zinc-600">
              <Grid2X2 class="h-4 w-4" />
              Grid view
            </div>
          </div>

          <div v-if="notice" class="mb-5 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            {{ notice }}
          </div>
          <div v-if="error" class="mb-5 border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
            {{ error }}
          </div>

          <div v-if="!products.length" class="grid min-h-80 place-items-center border border-zinc-200 bg-zinc-50 p-8 text-center">
            <div>
              <Package class="mx-auto h-8 w-8 text-zinc-400" />
              <p class="mt-4 font-semibold text-zinc-700">Belum ada produk</p>
            </div>
          </div>

          <div v-else class="grid gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
            <article
              v-for="product in products"
              :key="product.id"
              class="group bg-white"
            >
              <button class="block w-full text-left" type="button" @click="selectedProduct = product">
                <div class="relative overflow-hidden bg-zinc-100">
                  <div class="aspect-[4/5]">
                    <img
                      v-if="product.image_url"
                      :src="product.image_url"
                      :alt="product.name"
                      class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div v-else class="grid h-full place-items-center text-zinc-400">
                      <Package class="h-12 w-12" />
                    </div>
                  </div>
                  <span class="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-black uppercase shadow-sm">
                    New
                  </span>
                  <span class="absolute bottom-3 right-3 rounded-full bg-zinc-950 px-3 py-1 text-xs font-black text-white">
                    Stok {{ product.stock }}
                  </span>
                </div>
                <div class="pt-4">
                  <div class="flex items-start justify-between gap-4">
                    <div class="min-w-0">
                      <h3 class="truncate text-base font-black uppercase tracking-tight">{{ product.name }}</h3>
                      <p class="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-zinc-500">
                        {{ product.description || product.sku || 'Produk toko.' }}
                      </p>
                    </div>
                    <button class="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-zinc-200 text-zinc-600" type="button" aria-label="Wishlist">
                      <Heart class="h-4 w-4" />
                    </button>
                  </div>
                  <div class="mt-4 flex items-center justify-between gap-3">
                    <strong class="text-lg">{{ formatCurrency(product.price) }}</strong>
                    <span class="text-xs font-black uppercase tracking-wide" :style="{ color: accent }">
                      Quick buy
                    </span>
                  </div>
                </div>
              </button>
            </article>
          </div>
        </div>

        <form id="checkout" class="h-max border border-zinc-200 bg-white p-5 shadow-xl shadow-zinc-200/60 lg:sticky lg:top-24" @submit.prevent="selectedProduct && createOrder(selectedProduct)">
          <p class="text-xs font-black uppercase tracking-wide" :style="{ color: accent }">Checkout</p>
          <div class="mt-4 overflow-hidden bg-zinc-100">
            <div class="aspect-[4/3]">
              <img
                v-if="selectedProduct?.image_url"
                :src="selectedProduct.image_url"
                :alt="selectedProduct.name"
                class="h-full w-full object-cover"
              />
              <div v-else class="grid h-full place-items-center text-zinc-400">
                <ShoppingBag class="h-10 w-10" />
              </div>
            </div>
          </div>
          <h2 class="mt-4 text-xl font-black uppercase tracking-tight">{{ selectedProduct?.name || 'Pilih produk' }}</h2>
          <p v-if="selectedProduct" class="mt-1 text-sm font-semibold text-zinc-500">
            {{ formatCurrency(selectedProduct.price) }}
          </p>

          <div class="mt-5 grid gap-4">
            <label class="grid gap-2 text-sm font-bold text-zinc-700">
              Jumlah
              <input v-model.number="checkoutForm.quantity" class="field-input rounded-full" type="number" min="1" required />
            </label>
            <label class="grid gap-2 text-sm font-bold text-zinc-700">
              Nama
              <input v-model="checkoutForm.customer_name" class="field-input rounded-full" type="text" required />
            </label>
            <label class="grid gap-2 text-sm font-bold text-zinc-700">
              Email
              <input v-model="checkoutForm.customer_email" class="field-input rounded-full" type="email" required />
            </label>
            <label class="grid gap-2 text-sm font-bold text-zinc-700">
              Telepon
              <input v-model="checkoutForm.customer_phone" class="field-input rounded-full" type="text" />
            </label>
            <label class="grid gap-2 text-sm font-bold text-zinc-700">
              Alamat
              <textarea v-model="checkoutForm.shipping_address" class="min-h-24 rounded-3xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 shadow-sm outline-none transition focus:border-zinc-500 focus:ring-4 focus:ring-zinc-100" required />
            </label>
            <button
              class="inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-black uppercase tracking-wide text-white disabled:opacity-60"
              :style="{ backgroundColor: accent }"
              type="submit"
              :disabled="loading || !selectedProduct"
            >
              <ShoppingBag class="h-4 w-4" />
              Buat order
            </button>
          </div>
        </form>
      </section>
    </template>
  </main>
</template>
