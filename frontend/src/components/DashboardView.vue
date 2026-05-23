<script setup lang="ts">
import {
  Building2,
  CheckCircle2,
  LayoutDashboard,
  LogOut,
  Package,
  Plus,
  RefreshCcw,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  UserPlus,
  UsersRound,
} from '@lucide/vue'
import DataTable from './DataTable.vue'
import type { useWorkspace } from '../composables/useWorkspace'

const props = defineProps<{
  workspace: ReturnType<typeof useWorkspace>
}>()

const {
  activeView,
  loading,
  notice,
  error,
  selectedTenant,
  tenantForm,
  userForm,
  productForm,
  roleForm,
  checkoutForm,
  selectedRoleId,
  selectedPermissionIds,
  session,
  tenants,
  users,
  products,
  orders,
  roles,
  permissions,
  storefront,
  selectedTenantName,
  stats,
  apiBaseUrl,
  selectTenant,
  loadWorkspace,
  createTenant,
  createUser,
  createProduct,
  createRole,
  selectRole,
  saveRolePermissions,
  createCheckoutOrder,
  logout,
} = props.workspace

const navItems = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'tenants', label: 'Tenants', icon: Building2 },
  { key: 'users', label: 'Users', icon: UsersRound },
  { key: 'roles', label: 'Roles', icon: ShieldCheck },
  { key: 'products', label: 'Produk', icon: Package },
  { key: 'orders', label: 'Order', icon: ReceiptText },
  { key: 'storefront', label: 'Storefront', icon: ShoppingBag },
] as const

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

function viewTitle() {
  const titles = {
    overview: 'Overview marketplace',
    tenants: 'Kelola toko',
    users: 'Kelola staff',
    roles: 'Kelola role',
    products: 'Kelola produk',
    orders: 'Kelola order',
    storefront: 'Preview storefront',
  }

  return titles[activeView.value]
}
</script>

<template>
  <section class="min-h-screen lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
    <aside class="border-b border-slate-200 bg-white p-4 lg:border-b-0 lg:border-r lg:p-5">
      <div class="flex items-center gap-3">
        <span class="grid h-11 w-11 place-items-center rounded-xl bg-slate-950 text-lg font-black text-white">K</span>
        <div>
          <p class="font-semibold leading-tight">Karunia SaaS</p>
          <p class="text-xs text-slate-500">Tenant console</p>
        </div>
      </div>

      <nav class="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1" aria-label="Main navigation">
        <button
          v-for="item in navItems"
          :key="item.key"
          class="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition lg:justify-start"
          :class="activeView === item.key ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'"
          type="button"
          @click="activeView = item.key"
        >
          <component :is="item.icon" class="h-4 w-4" />
          {{ item.label }}
        </button>
      </nav>

      <div class="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p class="text-xs font-semibold uppercase text-slate-500">Tenant aktif</p>
        <p class="mt-2 break-all text-sm font-medium text-slate-950">
          {{ selectedTenantName || 'Dari token aktif' }}
        </p>
      </div>
    </aside>

    <section class="min-w-0 p-4 sm:p-6 lg:p-8">
      <header class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p class="text-sm font-semibold text-cyan-700">Dashboard</p>
            <h1 class="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              {{ viewTitle() }}
            </h1>
            <p class="mt-2 text-sm text-slate-500">API aktif: {{ apiBaseUrl }}</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button class="secondary-action h-11" type="button" :disabled="loading" @click="loadWorkspace">
              <RefreshCcw class="h-4 w-4" />
              Refresh data
            </button>
            <button class="primary-action h-11" type="button" @click="logout">
              <LogOut class="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div v-if="notice" class="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
        <CheckCircle2 class="mt-0.5 h-4 w-4 shrink-0" />
        {{ notice }}
      </div>
      <div v-if="error" class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
        {{ error }}
      </div>

      <section class="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label class="grid gap-2 text-sm font-semibold text-slate-700">
          Pilih tenant
          <select
            v-model="selectedTenant"
            class="field-input"
            :disabled="!session.tenants.length || loading"
            @change="selectTenant(selectedTenant)"
          >
            <option v-if="!session.tenants.length" value="">Tenant dari token aktif</option>
            <option v-for="tenant in session.tenants" :key="tenant.tenant_id" :value="tenant.tenant_id">
              {{ tenant.tenant_name || tenant.tenant_id }} - {{ tenant.role || 'role' }}
            </option>
          </select>
        </label>
      </section>

      <section v-if="activeView === 'overview'" class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <article v-for="item in stats" :key="item.label" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-center justify-between gap-4">
            <span class="text-sm font-semibold text-slate-600">{{ item.label }}</span>
            <span class="rounded-xl bg-cyan-50 p-2 text-cyan-700">
              <component :is="item.icon" class="h-5 w-5" />
            </span>
          </div>
          <strong class="mt-4 block break-all text-3xl font-semibold text-slate-950">{{ item.value }}</strong>
          <p class="mt-2 text-sm text-slate-500">{{ item.detail }}</p>
        </article>
      </section>

      <section v-if="activeView === 'overview'" class="mt-4 grid gap-4 xl:grid-cols-2">
        <DataTable title="Tenant terbaru" :rows="tenants" kind="tenant" />
        <DataTable title="User terbaru" :rows="users" kind="user" />
      </section>

      <section v-if="activeView === 'tenants'" class="mt-4 grid gap-4">
        <form class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" @submit.prevent="createTenant">
          <div class="mb-5 flex items-center gap-3">
            <Building2 class="h-5 w-5 text-cyan-700" />
            <div>
              <h2 class="text-lg font-semibold">Tambah tenant</h2>
              <p class="text-sm text-slate-500">Domain adalah slug halaman toko, misalnya /buku-bahagia.</p>
            </div>
          </div>
          <div class="grid gap-4 lg:grid-cols-[1fr_0.8fr_1fr_auto] lg:items-end">
            <label class="grid gap-2 text-sm font-semibold text-slate-700">
              Nama tenant
              <input v-model="tenantForm.name" class="field-input" type="text" required />
            </label>
            <label class="grid gap-2 text-sm font-semibold text-slate-700">
              Kode
              <input v-model="tenantForm.code" class="field-input" type="text" required />
            </label>
            <label class="grid gap-2 text-sm font-semibold text-slate-700">
              Domain toko
              <input v-model="tenantForm.domain" class="field-input" type="text" placeholder="buku-bahagia" />
            </label>
            <button class="primary-action" type="submit" :disabled="loading">
              <Plus class="h-4 w-4" />
              Simpan
            </button>
          </div>
          <div class="mt-4 grid gap-4 lg:grid-cols-[1fr_220px]">
            <label class="grid gap-2 text-sm font-semibold text-slate-700">
              Template storefront
              <select v-model="tenantForm.storefront_template" class="field-input">
                <option value="market">Market grid</option>
                <option value="editorial">Editorial brand</option>
                <option value="compact">Compact catalog</option>
              </select>
            </label>
            <label class="grid gap-2 text-sm font-semibold text-slate-700">
              Warna aksen
              <input v-model="tenantForm.storefront_accent_color" class="field-input h-12" type="color" />
            </label>
          </div>
        </form>
        <DataTable title="Daftar tenant" :rows="tenants" kind="tenant" />
      </section>

      <section v-if="activeView === 'users'" class="mt-4 grid gap-4">
        <form class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" @submit.prevent="createUser">
          <div class="mb-5 flex items-center gap-3">
            <UserPlus class="h-5 w-5 text-cyan-700" />
            <div>
              <h2 class="text-lg font-semibold">Tambah user</h2>
              <p class="text-sm text-slate-500">Role ID opsional. Kosongkan untuk memakai role default backend.</p>
            </div>
          </div>
          <div class="grid gap-4 xl:grid-cols-[1fr_1fr_0.8fr_1fr_auto] xl:items-end">
            <label class="grid gap-2 text-sm font-semibold text-slate-700">
              Username
              <input v-model="userForm.username" class="field-input" type="text" required />
            </label>
            <label class="grid gap-2 text-sm font-semibold text-slate-700">
              Email
              <input v-model="userForm.email" class="field-input" type="email" required />
            </label>
            <label class="grid gap-2 text-sm font-semibold text-slate-700">
              Password
              <input v-model="userForm.password" class="field-input" type="password" required />
            </label>
            <label class="grid gap-2 text-sm font-semibold text-slate-700">
              Role ID
              <input v-model="userForm.role_id" class="field-input" type="text" />
            </label>
            <button class="primary-action" type="submit" :disabled="loading">
              <Plus class="h-4 w-4" />
              Simpan
            </button>
          </div>
        </form>
        <DataTable title="Daftar user" :rows="users" kind="user" />
      </section>

      <section v-if="activeView === 'roles'" class="mt-4 grid gap-4 xl:grid-cols-[360px_1fr]">
        <div class="grid gap-4">
          <form class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" @submit.prevent="createRole">
            <div class="mb-5 flex items-center gap-3">
              <ShieldCheck class="h-5 w-5 text-cyan-700" />
              <div>
                <h2 class="text-lg font-semibold">Tambah role</h2>
                <p class="text-sm text-slate-500">Role untuk staff maintenance toko.</p>
              </div>
            </div>
            <div class="grid gap-4">
              <label class="grid gap-2 text-sm font-semibold text-slate-700">
                Nama role
                <input v-model="roleForm.name" class="field-input" type="text" placeholder="PRODUCT_ADMIN" required />
              </label>
              <label class="grid gap-2 text-sm font-semibold text-slate-700">
                Deskripsi
                <input v-model="roleForm.description" class="field-input" type="text" />
              </label>
              <button class="primary-action" type="submit" :disabled="loading">
                <Plus class="h-4 w-4" />
                Simpan role
              </button>
            </div>
          </form>

          <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="text-lg font-semibold">Role toko</h2>
            <div class="mt-4 grid gap-2">
              <button
                v-for="role in roles"
                :key="role.id"
                class="rounded-xl border px-4 py-3 text-left text-sm transition"
                :class="selectedRoleId === role.id ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'"
                type="button"
                @click="selectRole(role.id)"
              >
                <span class="block font-semibold">{{ role.name }}</span>
                <span class="block text-xs opacity-75">{{ role.description || 'Tanpa deskripsi' }}</span>
              </button>
            </div>
          </article>
        </div>

        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-xs font-semibold uppercase text-cyan-700">Permission</p>
              <h2 class="mt-1 text-lg font-semibold tracking-tight text-slate-950">Hak akses role</h2>
            </div>
            <button class="primary-action" type="button" :disabled="loading || !selectedRoleId" @click="saveRolePermissions">
              <ShieldCheck class="h-4 w-4" />
              Simpan permission
            </button>
          </div>

          <div v-if="!permissions.length" class="mt-6 rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">
            Belum ada permission. Jalankan seed permission backend.
          </div>
          <div v-else class="mt-6 grid gap-3 md:grid-cols-2">
            <label
              v-for="permission in permissions"
              :key="permission.id"
              class="flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-sm"
            >
              <input
                v-model="selectedPermissionIds"
                class="mt-1 h-4 w-4"
                type="checkbox"
                :value="permission.id"
                :disabled="!selectedRoleId"
              />
              <span>
                <span class="block font-semibold text-slate-950">
                  {{ permission.resource }}.{{ permission.action }}
                </span>
                <span class="mt-1 block text-xs text-slate-500">{{ permission.description }}</span>
              </span>
            </label>
          </div>
        </article>
      </section>

      <section v-if="activeView === 'products'" class="mt-4 grid gap-4">
        <form class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" @submit.prevent="createProduct">
          <div class="mb-5 flex items-center gap-3">
            <Package class="h-5 w-5 text-cyan-700" />
            <div>
              <h2 class="text-lg font-semibold">Tambah produk</h2>
              <p class="text-sm text-slate-500">Produk akan muncul di storefront public toko aktif.</p>
            </div>
          </div>
          <div class="grid gap-4 xl:grid-cols-[1fr_0.8fr_0.7fr_0.5fr] xl:items-end">
            <label class="grid gap-2 text-sm font-semibold text-slate-700">
              Nama produk
              <input v-model="productForm.name" class="field-input" type="text" required />
            </label>
            <label class="grid gap-2 text-sm font-semibold text-slate-700">
              Harga
              <input v-model="productForm.price" class="field-input" type="number" min="0" required />
            </label>
            <label class="grid gap-2 text-sm font-semibold text-slate-700">
              Stok
              <input v-model.number="productForm.stock" class="field-input" type="number" min="0" required />
            </label>
            <button class="primary-action" type="submit" :disabled="loading">
              <Plus class="h-4 w-4" />
              Simpan
            </button>
          </div>
          <div class="mt-4 grid gap-4 xl:grid-cols-[0.7fr_1fr_1fr]">
            <label class="grid gap-2 text-sm font-semibold text-slate-700">
              SKU
              <input v-model="productForm.sku" class="field-input" type="text" />
            </label>
            <label class="grid gap-2 text-sm font-semibold text-slate-700">
              URL gambar
              <input v-model="productForm.image_url" class="field-input" type="url" />
            </label>
            <label class="grid gap-2 text-sm font-semibold text-slate-700">
              Slug
              <input v-model="productForm.slug" class="field-input" type="text" placeholder="otomatis jika kosong" />
            </label>
          </div>
          <label class="mt-4 grid gap-2 text-sm font-semibold text-slate-700">
            Deskripsi
            <textarea v-model="productForm.description" class="min-h-24 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" />
          </label>
        </form>

        <article class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header class="border-b border-slate-200 px-5 py-4">
            <p class="text-xs font-semibold uppercase text-cyan-700">Katalog</p>
            <h2 class="mt-1 text-lg font-semibold tracking-tight text-slate-950">Produk toko aktif</h2>
          </header>
          <div v-if="!products.length" class="grid min-h-48 place-items-center p-6 text-center text-sm text-slate-500">
            Belum ada produk.
          </div>
          <div v-else class="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
            <article v-for="product in products" :key="product.id" class="rounded-xl border border-slate-200 p-4">
              <div class="aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">
                <img v-if="product.image_url" :src="product.image_url" :alt="product.name" class="h-full w-full object-cover" />
                <div v-else class="grid h-full place-items-center text-slate-400">
                  <Package class="h-8 w-8" />
                </div>
              </div>
              <h3 class="mt-3 font-semibold text-slate-950">{{ product.name }}</h3>
              <p class="mt-1 text-sm text-slate-500">{{ product.sku || product.slug }}</p>
              <div class="mt-3 flex items-center justify-between gap-3">
                <strong class="text-slate-950">{{ formatCurrency(product.price) }}</strong>
                <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  Stok {{ product.stock }}
                </span>
              </div>
            </article>
          </div>
        </article>
      </section>

      <section v-if="activeView === 'orders'" class="mt-4 grid gap-4">
        <article class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header class="border-b border-slate-200 px-5 py-4">
            <p class="text-xs font-semibold uppercase text-cyan-700">Order</p>
            <h2 class="mt-1 text-lg font-semibold tracking-tight text-slate-950">Order masuk</h2>
          </header>
          <div v-if="!orders.length" class="grid min-h-48 place-items-center p-6 text-center text-sm text-slate-500">
            Belum ada order.
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full min-w-[720px] border-collapse">
              <thead>
                <tr class="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th class="px-5 py-3">Order</th>
                  <th class="px-5 py-3">Customer</th>
                  <th class="px-5 py-3">Total</th>
                  <th class="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in orders" :key="order.id" class="border-t border-slate-100 text-sm">
                  <td class="px-5 py-4 font-semibold text-slate-950">{{ order.order_number }}</td>
                  <td class="px-5 py-4 text-slate-600">
                    {{ order.customer_name }}
                    <span class="block text-xs text-slate-400">{{ order.customer_email }}</span>
                  </td>
                  <td class="px-5 py-4 text-slate-700">{{ formatCurrency(order.total_amount) }}</td>
                  <td class="px-5 py-4">
                    <span class="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 ring-1 ring-cyan-200">
                      {{ order.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section v-if="activeView === 'storefront'" class="mt-4 grid gap-4 xl:grid-cols-[1fr_360px]">
        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-semibold uppercase text-cyan-700">Public marketplace</p>
              <h2 class="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                {{ storefront?.store.name || selectedTenantName }}
              </h2>
              <p class="mt-2 text-sm text-slate-500">
                URL toko: /{{ storefront?.store.domain || storefront?.store.code || 'kode-toko' }}
              </p>
              <a
                v-if="storefront"
                class="mt-3 inline-flex text-sm font-semibold text-cyan-700 hover:text-cyan-900"
                :href="`/${storefront.store.domain || storefront.store.code}`"
              >
                Buka halaman public
              </a>
            </div>
            <ShoppingBag class="h-6 w-6 text-cyan-700" />
          </div>
          <div v-if="!storefront?.products.length" class="mt-6 rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">
            Storefront belum punya produk aktif.
          </div>
          <div v-else class="mt-6 grid gap-4 md:grid-cols-2">
            <article v-for="product in storefront.products" :key="product.id" class="rounded-xl border border-slate-200 p-4">
              <h3 class="font-semibold text-slate-950">{{ product.name }}</h3>
              <p class="mt-1 line-clamp-2 text-sm text-slate-500">{{ product.description || 'Produk toko.' }}</p>
              <div class="mt-4 flex items-center justify-between gap-3">
                <strong>{{ formatCurrency(product.price) }}</strong>
                <span class="text-xs font-semibold text-slate-500">Stok {{ product.stock }}</span>
              </div>
            </article>
          </div>
        </article>

        <form class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" @submit.prevent="createCheckoutOrder">
          <h2 class="text-lg font-semibold">Simulasi checkout</h2>
          <p class="mt-1 text-sm text-slate-500">Membuat order lewat endpoint public marketplace.</p>
          <div class="mt-5 grid gap-4">
            <label class="grid gap-2 text-sm font-semibold text-slate-700">
              Produk
              <select v-model="checkoutForm.product_id" class="field-input" required>
                <option v-for="product in storefront?.products || []" :key="product.id" :value="product.id">
                  {{ product.name }}
                </option>
              </select>
            </label>
            <label class="grid gap-2 text-sm font-semibold text-slate-700">
              Qty
              <input v-model.number="checkoutForm.quantity" class="field-input" type="number" min="1" required />
            </label>
            <label class="grid gap-2 text-sm font-semibold text-slate-700">
              Nama pembeli
              <input v-model="checkoutForm.customer_name" class="field-input" type="text" required />
            </label>
            <label class="grid gap-2 text-sm font-semibold text-slate-700">
              Email
              <input v-model="checkoutForm.customer_email" class="field-input" type="email" required />
            </label>
            <label class="grid gap-2 text-sm font-semibold text-slate-700">
              Telepon
              <input v-model="checkoutForm.customer_phone" class="field-input" type="text" />
            </label>
            <label class="grid gap-2 text-sm font-semibold text-slate-700">
              Alamat
              <textarea v-model="checkoutForm.shipping_address" class="min-h-24 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100" required />
            </label>
            <button class="primary-action" type="submit" :disabled="loading || !storefront?.products.length">
              <ShoppingBag class="h-4 w-4" />
              Buat order demo
            </button>
          </div>
        </form>
      </section>
    </section>
  </section>
</template>
