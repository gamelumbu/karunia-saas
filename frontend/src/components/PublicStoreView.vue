<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Grid2X2,
  Heart,
  Minus,
  Menu,
  Package,
  Plus,
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

type PublicPage = 'home' | 'new-arrivals' | 'eksklusif' | 'produk' | 'checkout'

const props = defineProps<{
  slug: string
  page: string
  showAdminLink: boolean
}>()

const loading = ref(false)
const error = ref('')
const notice = ref('')
const storefront = ref<Storefront | null>(null)
const search = ref('')
const selectedProduct = ref<Product | null>(null)
const wishlistIds = ref<string[]>([])
const cartItems = ref<Array<{ product_id: string; quantity: number }>>([])

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
const normalizedPage = computed<PublicPage>(() => {
  const allowed: PublicPage[] = [
    'home',
    'new-arrivals',
    'eksklusif',
    'produk',
    'checkout',
  ]
  return allowed.includes(props.page as PublicPage)
    ? (props.page as PublicPage)
    : 'home'
})
const storeSlug = computed(
  () => storefront.value?.store.domain || storefront.value?.store.code || props.slug,
)
const allProducts = computed(() => storefront.value?.products || [])
const filteredProducts = computed(() => {
  const keyword = search.value.toLowerCase().trim()
  if (!keyword) return allProducts.value

  return allProducts.value.filter((product) => {
    return [product.name, product.description, product.sku]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword))
  })
})
const newArrivals = computed(() => {
  const categorized = filteredProducts.value.filter(
    (product) => product.category === 'new_arrival',
  )
  return (categorized.length ? categorized : filteredProducts.value).slice(0, 8)
})
const exclusiveProducts = computed(() => {
  const categorized = filteredProducts.value.filter(
    (product) => product.category === 'exclusive',
  )
  const sorted = [...(categorized.length ? categorized : filteredProducts.value)].sort(
    (a, b) => Number(b.price) - Number(a.price),
  )
  return sorted.slice(0, Math.max(1, Math.min(6, sorted.length)))
})
const pageProducts = computed(() => {
  if (normalizedPage.value === 'new-arrivals') return newArrivals.value
  if (normalizedPage.value === 'eksklusif') return exclusiveProducts.value
  if (normalizedPage.value === 'produk') {
    return filteredProducts.value.filter(
      (product) => !product.category || product.category === 'product',
    )
  }
  return filteredProducts.value
})
const featuredProduct = computed(() => allProducts.value[0] || null)
const heroTone = computed(() => {
  if (template.value === 'editorial') return 'bg-[#111111] text-white'
  if (template.value === 'compact') return 'bg-zinc-50 text-zinc-950'
  return 'bg-white text-zinc-950'
})
const pageMeta = computed(() => {
  const meta = {
    home: {
      eyebrow: 'Karunia storefront',
      title: storefront.value?.store.name || 'Storefront',
      description:
        'Storefront modern untuk katalog produk, checkout cepat, dan pengalaman belanja yang terasa seperti brand retail besar.',
    },
    'new-arrivals': {
      eyebrow: 'Fresh drops',
      title: 'New Arrivals',
      description: 'Produk terbaru dari toko ini, siap dilihat dan dipesan.',
    },
    eksklusif: {
      eyebrow: 'Selected collection',
      title: 'Eksklusif',
      description: 'Pilihan produk premium dan koleksi unggulan toko.',
    },
    produk: {
      eyebrow: 'Full catalog',
      title: 'Produk',
      description: 'Semua produk aktif dari toko ini dalam satu katalog.',
    },
    checkout: {
      eyebrow: 'Fast order',
      title: 'Checkout',
      description: 'Pilih produk, isi data pembeli, lalu buat order langsung.',
    },
  }

  return meta[normalizedPage.value]
})
const navItems = computed(() => [
  { label: 'New Arrivals', href: `/${storeSlug.value}/new-arrivals` },
  { label: 'Eksklusif', href: `/${storeSlug.value}/eksklusif` },
  { label: 'Produk', href: `/${storeSlug.value}/produk` },
  { label: 'Checkout', href: `/${storeSlug.value}/checkout` },
])
const homeSections = computed(() => [
  {
    eyebrow: 'Fresh drops',
    title: 'New Arrivals',
    href: `/${storeSlug.value}/new-arrivals`,
    rows: newArrivals.value.slice(0, 4),
  },
  {
    eyebrow: 'Selected collection',
    title: 'Eksklusif',
    href: `/${storeSlug.value}/eksklusif`,
    rows: exclusiveProducts.value.slice(0, 4),
  },
  {
    eyebrow: 'Full catalog',
    title: 'Produk',
    href: `/${storeSlug.value}/produk`,
    rows: filteredProducts.value.slice(0, 8),
  },
])
const wishlistProducts = computed(() =>
  allProducts.value.filter((product) => wishlistIds.value.includes(product.id)),
)
const cartProducts = computed(() =>
  cartItems.value
    .map((item) => {
      const product = allProducts.value.find((row) => row.id === item.product_id)
      return product ? { product, quantity: item.quantity } : null
    })
    .filter(Boolean) as Array<{ product: Product; quantity: number }>,
)
const cartTotal = computed(() =>
  cartProducts.value.reduce(
    (total, item) => total + Number(item.product.price) * item.quantity,
    0,
  ),
)
const relatedProducts = computed(() => {
  if (!selectedProduct.value?.related_product_ids?.length) return []
  return allProducts.value.filter((product) =>
    selectedProduct.value?.related_product_ids?.includes(product.id),
  )
})
const wishlistStorageKey = computed(() => `karunia_wishlist:${props.slug}`)
const cartStorageKey = computed(() => `karunia_cart:${props.slug}`)

onMounted(loadStore)

watch(allProducts, (rows) => {
  if (!selectedProduct.value && rows[0]) {
    selectedProduct.value = rows[0]
  }
})

async function loadStore() {
  loading.value = true
  error.value = ''

  try {
    const result = await apiRequest<ApiSingleResponse<Storefront>>(
      `/marketplace/stores/${props.slug}`,
    )
    storefront.value = result.data
    selectedProduct.value = result.data.products[0] || null
    loadLocalBuyerState()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Toko tidak ditemukan'
  } finally {
    loading.value = false
  }
}

async function createOrder() {
  loading.value = true
  error.value = ''
  notice.value = ''

  try {
    if (!cartItems.value.length) {
      throw new Error('Keranjang masih kosong')
    }

    await apiRequest<ApiSingleResponse<Order>>(
      `/marketplace/stores/${props.slug}/orders`,
      {
        method: 'POST',
        body: JSON.stringify({
          customer_name: checkoutForm.customer_name,
          customer_email: checkoutForm.customer_email,
          customer_phone: checkoutForm.customer_phone || undefined,
          shipping_address: checkoutForm.shipping_address,
          items: cartItems.value,
        }),
      },
    )

    checkoutForm.customer_name = ''
    checkoutForm.customer_email = ''
    checkoutForm.customer_phone = ''
    checkoutForm.shipping_address = ''
    cartItems.value = []
    persistCart()
    notice.value = 'Order berhasil dibuat. Penjual akan memproses pesanan.'
    await loadStore()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Checkout gagal'
  } finally {
    loading.value = false
  }
}

function loadLocalBuyerState() {
  wishlistIds.value = JSON.parse(
    localStorage.getItem(wishlistStorageKey.value) || '[]',
  )
  cartItems.value = JSON.parse(localStorage.getItem(cartStorageKey.value) || '[]')
}

function persistWishlist() {
  localStorage.setItem(wishlistStorageKey.value, JSON.stringify(wishlistIds.value))
}

function persistCart() {
  localStorage.setItem(cartStorageKey.value, JSON.stringify(cartItems.value))
}

function toggleWishlist(product: Product) {
  if (wishlistIds.value.includes(product.id)) {
    wishlistIds.value = wishlistIds.value.filter((id) => id !== product.id)
  } else {
    wishlistIds.value = [...wishlistIds.value, product.id]
  }
  persistWishlist()
}

function addToCart(product: Product, quantity = 1) {
  const existing = cartItems.value.find((item) => item.product_id === product.id)
  if (existing) {
    existing.quantity += quantity
  } else {
    cartItems.value.push({ product_id: product.id, quantity })
  }
  selectedProduct.value = product
  persistCart()
}

function setCartQuantity(productId: string, quantity: number) {
  if (quantity <= 0) {
    cartItems.value = cartItems.value.filter((item) => item.product_id !== productId)
  } else {
    const item = cartItems.value.find((row) => row.product_id === productId)
    if (item) item.quantity = quantity
  }
  persistCart()
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
            <a class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-zinc-950 text-sm font-black text-white" :href="`/${storeSlug}`">
              {{ initials(storefront.store.name) || 'K' }}
            </a>
            <div class="min-w-0">
              <p class="truncate text-sm font-black uppercase tracking-wide">{{ storefront.store.name }}</p>
              <p class="truncate text-xs font-semibold text-zinc-500">/{{ storeSlug }}</p>
            </div>
          </div>

          <nav class="hidden items-center gap-8 text-sm font-bold uppercase tracking-wide text-zinc-700 lg:flex">
            <a
              v-for="item in navItems"
              :key="item.href"
              :href="item.href"
              class="hover:text-zinc-950"
            >
              {{ item.label }}
            </a>
            <a v-if="props.showAdminLink" href="/" class="hover:text-zinc-950">Admin</a>
          </nav>

          <div class="flex items-center gap-2">
            <button class="relative grid h-10 w-10 place-items-center rounded-full border border-zinc-200" type="button" aria-label="Wishlist">
              <Heart class="h-4 w-4" />
              <span v-if="wishlistIds.length" class="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-zinc-950 px-1 text-[10px] font-black text-white">
                {{ wishlistIds.length }}
              </span>
            </button>
            <a class="relative grid h-10 w-10 place-items-center rounded-full bg-zinc-950 text-white" :href="`/${storeSlug}/checkout`" aria-label="Checkout">
              <ShoppingBag class="h-4 w-4" />
              <span v-if="cartItems.length" class="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-black text-white" :style="{ backgroundColor: accent }">
                {{ cartItems.length }}
              </span>
            </a>
          </div>
        </div>
      </header>

      <section class="border-b border-zinc-200" :class="heroTone">
        <div
          class="mx-auto grid max-w-[1440px] gap-8 px-4 py-10 sm:px-6 lg:px-8"
          :class="template === 'compact' ? 'lg:grid-cols-[1fr_320px]' : 'lg:min-h-[520px] lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.8fr)] lg:items-center'"
        >
          <div class="max-w-3xl">
            <div class="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-wide" :class="template === 'editorial' ? 'border-white/20 text-white' : 'border-zinc-200 text-zinc-700'">
              <Sparkles class="h-4 w-4" :style="{ color: accent }" />
              {{ pageMeta.eyebrow }}
            </div>
            <h1
              class="mt-6 max-w-4xl font-black uppercase leading-none"
              :class="template === 'compact' ? 'text-5xl sm:text-6xl' : 'text-6xl sm:text-7xl xl:text-8xl'"
            >
              {{ pageMeta.title }}
            </h1>
            <p class="mt-6 max-w-2xl text-base leading-7" :class="template === 'editorial' ? 'text-zinc-300' : 'text-zinc-600'">
              {{ pageMeta.description }}
            </p>
            <div class="mt-8 flex flex-wrap gap-3">
              <a class="inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-black uppercase tracking-wide text-white" :style="{ backgroundColor: accent }" :href="normalizedPage === 'checkout' ? `/${storeSlug}/produk` : `/${storeSlug}/produk`">
                Lihat produk
                <ChevronRight class="h-4 w-4" />
              </a>
              <a class="inline-flex h-12 items-center justify-center gap-2 rounded-full border px-6 text-sm font-black uppercase tracking-wide" :class="template === 'editorial' ? 'border-white/25 text-white' : 'border-zinc-300 text-zinc-950'" :href="`/${storeSlug}/checkout`">
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

      <section v-if="normalizedPage === 'home'" class="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
        <section
          v-for="section in homeSections"
          :key="section.title"
          class="border-b border-zinc-200 py-10 first:pt-0 last:border-b-0"
        >
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
              <button class="block w-full text-left" type="button" @click="selectedProduct = product">
                <div class="relative overflow-hidden bg-zinc-100">
                  <div class="aspect-[4/5]">
                    <img v-if="product.image_url" :src="product.image_url" :alt="product.name" class="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    <div v-else class="grid h-full place-items-center text-zinc-400">
                      <Package class="h-12 w-12" />
                    </div>
                  </div>
                  <span class="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-black uppercase shadow-sm">
                    {{ section.title === 'Eksklusif' ? 'Exclusive' : 'New' }}
                  </span>
                </div>
                <h3 class="mt-4 truncate text-base font-black uppercase tracking-tight">{{ product.name }}</h3>
                <p class="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-zinc-500">
                  {{ product.description || product.sku || 'Produk toko.' }}
                </p>
                <strong class="mt-3 block text-lg">{{ formatCurrency(product.price) }}</strong>
              </button>
              <div class="mt-4 flex gap-2">
                <button class="grid h-10 w-10 place-items-center rounded-full border border-zinc-200" type="button" @click="toggleWishlist(product)">
                  <Heart class="h-4 w-4" :class="wishlistIds.includes(product.id) ? 'fill-zinc-950 text-zinc-950' : ''" />
                </button>
                <button class="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-black uppercase text-white" :style="{ backgroundColor: accent }" type="button" @click="addToCart(product)">
                  <ShoppingBag class="h-4 w-4" />
                  Keranjang
                </button>
              </div>
            </article>
          </div>
        </section>
      </section>

      <section v-else-if="normalizedPage !== 'checkout'" class="mx-auto grid max-w-[1440px] gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8">
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
              <strong>{{ pageProducts.length }}</strong>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="font-semibold text-zinc-600">Halaman</span>
              <strong>{{ pageMeta.title }}</strong>
            </div>
          </div>
        </aside>

        <div>
          <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p class="text-xs font-black uppercase tracking-wide" :style="{ color: accent }">{{ pageMeta.eyebrow }}</p>
              <h2 class="mt-1 text-3xl font-black uppercase tracking-tight">{{ pageMeta.title }}</h2>
            </div>
            <div class="inline-flex h-10 items-center gap-2 rounded-full border border-zinc-200 px-4 text-sm font-bold text-zinc-600">
              <Grid2X2 class="h-4 w-4" />
              Grid view
            </div>
          </div>

          <div v-if="!pageProducts.length" class="grid min-h-80 place-items-center border border-zinc-200 bg-zinc-50 p-8 text-center">
            <div>
              <Package class="mx-auto h-8 w-8 text-zinc-400" />
              <p class="mt-4 font-semibold text-zinc-700">Belum ada produk</p>
            </div>
          </div>

          <div v-else class="grid gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
            <article v-for="product in pageProducts" :key="product.id" class="group bg-white">
              <div class="relative overflow-hidden bg-zinc-100">
                <button class="block w-full text-left" type="button" @click="selectedProduct = product">
                  <div class="aspect-[4/5]">
                    <img v-if="product.image_url" :src="product.image_url" :alt="product.name" class="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    <div v-else class="grid h-full place-items-center text-zinc-400">
                      <Package class="h-12 w-12" />
                    </div>
                  </div>
                </button>
                <span class="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-black uppercase shadow-sm">
                  {{ normalizedPage === 'eksklusif' ? 'Exclusive' : 'New' }}
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
                  <button class="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-zinc-200 text-zinc-600" type="button" aria-label="Wishlist" @click="toggleWishlist(product)">
                    <Heart class="h-4 w-4" :class="wishlistIds.includes(product.id) ? 'fill-zinc-950 text-zinc-950' : ''" />
                  </button>
                </div>
                <div class="mt-4 flex items-center justify-between gap-3">
                  <strong class="text-lg">{{ formatCurrency(product.price) }}</strong>
                  <button
                    class="text-xs font-black uppercase tracking-wide"
                    :style="{ color: accent }"
                    type="button"
                    @click="addToCart(product)"
                  >
                    + Keranjang
                  </button>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section v-else class="mx-auto grid max-w-[1440px] gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
        <div>
          <div class="mb-6">
            <p class="text-xs font-black uppercase tracking-wide" :style="{ color: accent }">Pilih produk</p>
            <h2 class="mt-1 text-3xl font-black uppercase tracking-tight">Checkout</h2>
          </div>
          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <button
              v-for="product in filteredProducts"
              :key="product.id"
              class="border p-3 text-left transition"
              :class="selectedProduct?.id === product.id ? 'border-zinc-950 bg-zinc-50' : 'border-zinc-200 bg-white hover:bg-zinc-50'"
              type="button"
              @click="selectedProduct = product"
            >
              <div class="aspect-[4/3] bg-zinc-100">
                <img v-if="product.image_url" :src="product.image_url" :alt="product.name" class="h-full w-full object-cover" />
                <div v-else class="grid h-full place-items-center text-zinc-400">
                  <Package class="h-8 w-8" />
                </div>
              </div>
              <h3 class="mt-3 truncate font-black uppercase">{{ product.name }}</h3>
              <p class="mt-1 text-sm font-semibold text-zinc-500">{{ formatCurrency(product.price) }}</p>
            </button>
          </div>
          <section v-if="wishlistProducts.length" class="mt-10 border-t border-zinc-200 pt-8">
            <p class="text-xs font-black uppercase tracking-wide" :style="{ color: accent }">Wishlist</p>
            <h2 class="mt-1 text-2xl font-black uppercase tracking-tight">Disimpan</h2>
            <div class="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <button
                v-for="product in wishlistProducts"
                :key="product.id"
                class="border border-zinc-200 p-3 text-left transition hover:bg-zinc-50"
                type="button"
                @click="addToCart(product)"
              >
                <p class="font-black uppercase">{{ product.name }}</p>
                <p class="mt-1 text-sm font-semibold text-zinc-500">{{ formatCurrency(product.price) }}</p>
                <p class="mt-3 text-xs font-black uppercase" :style="{ color: accent }">Tambah ke keranjang</p>
              </button>
            </div>
          </section>
        </div>

        <form class="h-max border border-zinc-200 bg-white p-5 shadow-xl shadow-zinc-200/60 lg:sticky lg:top-24" @submit.prevent="createOrder">
          <p class="text-xs font-black uppercase tracking-wide" :style="{ color: accent }">Checkout</p>
          <h2 class="mt-1 text-xl font-black uppercase tracking-tight">Keranjang</h2>

          <div v-if="!cartProducts.length" class="mt-5 border border-zinc-200 bg-zinc-50 p-5 text-sm font-semibold text-zinc-500">
            Keranjang masih kosong. Pilih produk di sebelah kiri.
          </div>
          <div v-else class="mt-5 grid gap-3">
            <div v-for="item in cartProducts" :key="item.product.id" class="flex gap-3 border border-zinc-200 p-3">
              <div class="h-16 w-16 shrink-0 bg-zinc-100">
                <img v-if="item.product.image_url" :src="item.product.image_url" :alt="item.product.name" class="h-full w-full object-cover" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-black uppercase">{{ item.product.name }}</p>
                <p class="text-xs font-semibold text-zinc-500">{{ formatCurrency(item.product.price) }}</p>
                <div class="mt-2 inline-flex items-center gap-2 rounded-full border border-zinc-200 px-2 py-1">
                  <button type="button" @click="setCartQuantity(item.product.id, item.quantity - 1)">
                    <Minus class="h-3 w-3" />
                  </button>
                  <span class="min-w-6 text-center text-xs font-black">{{ item.quantity }}</span>
                  <button type="button" @click="setCartQuantity(item.product.id, item.quantity + 1)">
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
              :disabled="loading || !cartProducts.length"
            >
              <ShoppingBag class="h-4 w-4" />
              Buat order
            </button>
          </div>
          <section v-if="relatedProducts.length" class="mt-8 border-t border-zinc-200 pt-5">
            <p class="text-xs font-black uppercase tracking-wide" :style="{ color: accent }">Produk terkait</p>
            <div class="mt-3 grid gap-2">
              <button v-for="product in relatedProducts" :key="product.id" class="flex items-center justify-between gap-3 border border-zinc-200 px-3 py-2 text-left text-sm" type="button" @click="addToCart(product)">
                <span class="font-semibold">{{ product.name }}</span>
                <span class="font-black">{{ formatCurrency(product.price) }}</span>
              </button>
            </div>
          </section>
        </form>
      </section>
    </template>
  </main>
</template>
