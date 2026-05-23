<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ArrowLeft, Store } from '@lucide/vue'
import { apiRequest } from '../services/api'
import type { ApiListResponse, ApiSingleResponse, Order, Product, Storefront, Tenant } from '../types'
import PublicStoreCatalog from './public-store/PublicStoreCatalog.vue'
import PublicStoreCheckout from './public-store/PublicStoreCheckout.vue'
import PublicStoreHeader from './public-store/PublicStoreHeader.vue'
import PublicStoreHero from './public-store/PublicStoreHero.vue'
import PublicStoreHome from './public-store/PublicStoreHome.vue'
import PublicStoreProductDetail from './public-store/PublicStoreProductDetail.vue'
import PublicStoreTracking from './public-store/PublicStoreTracking.vue'
import PublicStoreTrustBar from './public-store/PublicStoreTrustBar.vue'
import PublicStoreWishlist from './public-store/PublicStoreWishlist.vue'
import type { PublicPage } from './public-store/types'

const props = defineProps<{
  slug: string
  page: string
  productSlug: string
  showAdminLink: boolean
  showTenantLoginLink: boolean
}>()

const loading = ref(false)
const error = ref('')
const notice = ref('')
const storefront = ref<Storefront | null>(null)
const publicStores = ref<Tenant[]>([])
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
  shipping_province: '',
  shipping_city: '',
  shipping_district: '',
  shipping_postal_code: '',
  shipping_method: 'REGULER',
  payment_method: 'COD',
})
const trackingForm = reactive({
  order_number: '',
  email: '',
})
const trackedOrder = ref<Order | null>(null)

const accent = computed(
  () => storefront.value?.store.storefront_accent_color || '#111827',
)
const template = computed(
  () => storefront.value?.store.storefront_template || 'market',
)
const isAllStores = computed(() => props.slug === 'all')
const normalizedPage = computed<PublicPage>(() => {
  if (props.page === 'products' && props.productSlug) return 'product-detail'

  const allowed: PublicPage[] = [
    'home',
    'new-arrivals',
    'eksklusif',
    'produk',
    'wishlist',
    'checkout',
  ]

  return allowed.includes(props.page as PublicPage)
    ? (props.page as PublicPage)
    : 'home'
})
const storeSlug = computed(
  () =>
    isAllStores.value
      ? 'marketplace'
      : storefront.value?.store.domain || storefront.value?.store.code || props.slug,
)
const baseStorePath = computed(() => `/${storeSlug.value}`)
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
const newArrivals = computed(() =>
  filteredProducts.value.filter((product) => product.category === 'new_arrival'),
)
const exclusiveProducts = computed(() =>
  filteredProducts.value.filter((product) => product.category === 'exclusive'),
)
const wishlistProducts = computed(() =>
  allProducts.value.filter((product) => wishlistIds.value.includes(product.id)),
)
const pageProducts = computed(() => {
  if (normalizedPage.value === 'new-arrivals') return newArrivals.value
  if (normalizedPage.value === 'eksklusif') return exclusiveProducts.value
  if (normalizedPage.value === 'wishlist') return wishlistProducts.value
  if (normalizedPage.value === 'produk') return filteredProducts.value
  return filteredProducts.value
})
const featuredProduct = computed(() => allProducts.value[0] || null)
const detailProduct = computed(() =>
  allProducts.value.find((product) => product.slug === props.productSlug),
)
const heroTone = computed(() => {
  if (normalizedPage.value === 'new-arrivals') {
    return 'border-b border-zinc-200 bg-white text-zinc-950'
  }
  if (template.value === 'editorial') {
    return 'border-b border-zinc-200 bg-stone-100 text-zinc-950'
  }
  if (template.value === 'compact') {
    return 'border-b border-zinc-200 bg-zinc-50 text-zinc-950'
  }
  return 'border-b border-zinc-200 bg-neutral-50 text-zinc-950'
})
const pageMeta = computed(() => {
  const meta = {
    home: {
      eyebrow: 'Karunia storefront',
      title: isAllStores.value
        ? 'Marketplace'
        : storefront.value?.store.name || 'Storefront',
      description:
        isAllStores.value
          ? 'Produk dari semua toko aktif dalam satu marketplace.'
          : 'Storefront modern untuk katalog produk, checkout cepat, dan pengalaman belanja yang terasa seperti brand retail besar.',
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
    wishlist: {
      eyebrow: 'Saved items',
      title: 'Wishlist',
      description: 'Produk yang disimpan oleh pembeli public di browser ini.',
    },
    'product-detail': {
      eyebrow: 'Product detail',
      title: detailProduct.value?.name || 'Detail Produk',
      description:
        detailProduct.value?.description || 'Detail produk, wishlist, keranjang, dan produk terkait.',
    },
  }

  return meta[normalizedPage.value]
})
const navItems = computed(() => [
  { label: 'New Arrivals', href: `${baseStorePath.value}/new-arrivals` },
  { label: 'Eksklusif', href: `${baseStorePath.value}/eksklusif` },
  { label: 'Produk', href: `${baseStorePath.value}/produk` },
  { label: 'Wishlist', href: `${baseStorePath.value}/wishlist` },
  { label: 'Checkout', href: `${baseStorePath.value}/checkout` },
])
const homeSections = computed(() => [
  {
    eyebrow: 'Fresh drops',
    title: 'New Arrivals',
    href: `${baseStorePath.value}/new-arrivals`,
    rows: newArrivals.value.slice(0, 4),
  },
  {
    eyebrow: 'Selected collection',
    title: 'Eksklusif',
    href: `${baseStorePath.value}/eksklusif`,
    rows: exclusiveProducts.value.slice(0, 4),
  },
  {
    eyebrow: 'Full catalog',
    title: 'Produk',
    href: `${baseStorePath.value}/produk`,
    rows: filteredProducts.value.slice(0, 8),
  },
])
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
  const baseProduct =
    normalizedPage.value === 'product-detail'
      ? detailProduct.value
      : selectedProduct.value
  if (!baseProduct?.related_product_ids?.length) return []
  return allProducts.value.filter((product) =>
    baseProduct.related_product_ids?.includes(product.id),
  )
})
const shouldShowHero = computed(() =>
  ['home', 'new-arrivals', 'eksklusif', 'produk'].includes(normalizedPage.value),
)
const shouldShowTrustBar = computed(() =>
  ['home', 'produk'].includes(normalizedPage.value),
)
const wishlistStorageKey = computed(() => `karunia_wishlist:${props.slug}`)
const cartStorageKey = computed(() => `karunia_cart:${props.slug}`)

onMounted(() => {
  void loadStore()
  void loadPublicStores()
})

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
      props.slug === 'all' ? '/marketplace/all' : `/marketplace/stores/${props.slug}`,
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

async function loadPublicStores() {
  try {
    const result = await apiRequest<ApiListResponse<Tenant>>('/marketplace/stores')
    publicStores.value = result.data || []
  } catch {
    publicStores.value = []
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
          shipping_province: checkoutForm.shipping_province || undefined,
          shipping_city: checkoutForm.shipping_city || undefined,
          shipping_district: checkoutForm.shipping_district || undefined,
          shipping_postal_code: checkoutForm.shipping_postal_code || undefined,
          shipping_method: checkoutForm.shipping_method || undefined,
          payment_method: checkoutForm.payment_method || undefined,
          items: cartItems.value,
        }),
      },
    )

    checkoutForm.customer_name = ''
    checkoutForm.customer_email = ''
    checkoutForm.customer_phone = ''
    checkoutForm.shipping_address = ''
    checkoutForm.shipping_province = ''
    checkoutForm.shipping_city = ''
    checkoutForm.shipping_district = ''
    checkoutForm.shipping_postal_code = ''
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

async function trackOrder() {
  loading.value = true
  error.value = ''
  notice.value = ''

  try {
    const params = new URLSearchParams({
      order_number: trackingForm.order_number,
      email: trackingForm.email,
    })
    const result = await apiRequest<ApiSingleResponse<Order>>(
      `/marketplace/orders/track?${params.toString()}`,
    )
    trackedOrder.value = result.data
  } catch (err) {
    trackedOrder.value = null
    error.value = err instanceof Error ? err.message : 'Order tidak ditemukan'
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
    notice.value = `${product.name} dihapus dari wishlist.`
  } else {
    wishlistIds.value = [...wishlistIds.value, product.id]
    notice.value = `${product.name} masuk wishlist.`
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
  notice.value = `${product.name} masuk keranjang.`
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

function selectPublicStore(slug: string) {
  if (slug === '__all__') {
    window.location.href = '/marketplace'
    return
  }
  if (!slug || slug === storeSlug.value) return
  window.location.href = `/${slug}`
}

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

function categoryLabel(category?: string) {
  if (category === 'new_arrival') return 'New Arrival'
  if (category === 'exclusive') return 'Exclusive'
  return 'Product'
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
        <a class="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-zinc-900 px-5 text-sm font-semibold text-white" href="/">
          <ArrowLeft class="h-4 w-4" />
          Kembali
        </a>
      </div>
    </section>

    <template v-else-if="storefront">
      <PublicStoreHeader
        :storefront="storefront"
        :store-slug="storeSlug"
        :nav-items="navItems"
        :wishlist-count="wishlistIds.length"
        :cart-count="cartItems.length"
        :stores="publicStores"
        :accent="accent"
        :show-admin-link="props.showAdminLink"
        :show-tenant-login-link="props.showTenantLoginLink"
        :initials="initials"
        @select-store="selectPublicStore"
      />

      <PublicStoreHero
        v-if="shouldShowHero"
        :storefront="storefront"
        :store-slug="storeSlug"
        :page="normalizedPage"
        :page-meta="pageMeta"
        :template-name="template"
        :hero-tone="heroTone"
        :accent="accent"
        :featured-product="featuredProduct"
        :format-currency="formatCurrency"
      />

      <PublicStoreTrustBar v-if="shouldShowTrustBar" :accent="accent" />

      <PublicStoreProductDetail
        v-if="normalizedPage === 'product-detail'"
        :product="detailProduct || null"
        :related-products="relatedProducts"
        :cart-products="cartProducts"
        :wishlist-ids="wishlistIds"
        :store-slug="storeSlug"
        :accent="accent"
        :format-currency="formatCurrency"
        @toggle-wishlist="toggleWishlist"
        @add-to-cart="addToCart"
      />

      <PublicStoreHome
        v-else-if="normalizedPage === 'home'"
        :sections="homeSections"
        :store-slug="storeSlug"
        :wishlist-ids="wishlistIds"
        :accent="accent"
        :format-currency="formatCurrency"
        :category-label="categoryLabel"
        @toggle-wishlist="toggleWishlist"
        @add-to-cart="addToCart"
      />

      <PublicStoreWishlist
        v-else-if="normalizedPage === 'wishlist'"
        :products="wishlistProducts"
        :store-slug="storeSlug"
        :accent="accent"
        :format-currency="formatCurrency"
        :category-label="categoryLabel"
        @toggle-wishlist="toggleWishlist"
        @add-to-cart="addToCart"
      />

      <PublicStoreCatalog
        v-else-if="normalizedPage === 'new-arrivals' || normalizedPage === 'eksklusif' || normalizedPage === 'produk'"
        v-model:search="search"
        :page="normalizedPage"
        :page-meta="pageMeta"
        :products="pageProducts"
        :wishlist-ids="wishlistIds"
        :accent="accent"
        :format-currency="formatCurrency"
        :category-label="categoryLabel"
        @select-product="selectedProduct = $event"
        @toggle-wishlist="toggleWishlist"
        @add-to-cart="addToCart"
      />

      <PublicStoreCheckout
        v-else
        :cart-products="cartProducts"
        :related-products="relatedProducts"
        :checkout-form="checkoutForm"
        :notice="notice"
        :error="error"
        :loading="loading"
        :cart-total="cartTotal"
        :store-slug="storeSlug"
        :accent="accent"
        :format-currency="formatCurrency"
        :category-label="categoryLabel"
        @create-order="createOrder"
        @set-cart-quantity="setCartQuantity"
        @add-to-cart="addToCart"
      />

      <PublicStoreTracking
        v-if="normalizedPage === 'wishlist' || normalizedPage === 'checkout'"
        :tracking-form="trackingForm"
        :tracked-order="trackedOrder"
        :accent="accent"
        :format-currency="formatCurrency"
        @track-order="trackOrder"
      />

      <footer class="border-t border-zinc-200 px-4 py-8 text-center text-sm font-semibold text-zinc-500 sm:px-6 lg:px-8">
        © 2026 Umbu Gammaliel
      </footer>
    </template>
  </main>
</template>
