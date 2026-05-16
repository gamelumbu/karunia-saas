<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import DataTable from './components/DataTable.vue'
import {
  Building2,
  CheckCircle2,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Plus,
  RefreshCcw,
  Server,
  ShieldCheck,
  UserPlus,
  UsersRound,
} from '@lucide/vue'

type TenantOption = {
  tenant_id: string
  tenant_name?: string
  role?: string
}

type LoginResponse = {
  user_id: string
  email: string
  tenants: TenantOption[]
}

type ApiListResponse<T> = {
  data: T[]
  pagination?: {
    total_items: number
    total_pages: number
    current_page: number
    limit: number
  }
}

type Tenant = {
  id: string
  name: string
  code: string
  domain?: string | null
  active_status: number | string
  created_at?: string
}

type User = {
  id: string
  username: string
  email: string
  active_status: number | string
  created_at?: string
}

type ApiSingleResponse<T> = {
  data: T
  message?: string
}

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ||
  'http://localhost:3000'

const activeView = ref<'overview' | 'tenants' | 'users'>('overview')
const loading = ref(false)
const notice = ref('')
const error = ref('')
const accessToken = ref(localStorage.getItem('karunia_access_token') || '')
const selectedTenant = ref(localStorage.getItem('karunia_tenant_id') || '')
const authMode = ref<'login' | 'register'>('login')

const loginForm = reactive({
  email: '',
  password: '',
})

const registerForm = reactive({
  tenant_name: '',
  username: '',
  email: '',
  password: '',
})

const tenantForm = reactive({
  name: '',
  code: '',
  domain: '',
})

const userForm = reactive({
  username: '',
  email: '',
  password: '',
  role_id: '',
})

const session = reactive<{
  userId: string
  email: string
  tenants: TenantOption[]
}>({
  userId: localStorage.getItem('karunia_user_id') || '',
  email: localStorage.getItem('karunia_email') || '',
  tenants: [],
})

const tenants = ref<Tenant[]>([])
const users = ref<User[]>([])

const isAuthenticated = computed(() => Boolean(accessToken.value))
const selectedTenantName = computed(() => {
  return (
    session.tenants.find((tenant) => tenant.tenant_id === selectedTenant.value)
      ?.tenant_name || selectedTenant.value
  )
})

const stats = computed(() => [
  {
    label: 'Tenant aktif',
    value: tenants.value.length,
    detail: selectedTenantName.value || 'Belum memilih tenant',
    icon: Building2,
  },
  {
    label: 'User',
    value: users.value.length,
    detail: isAuthenticated.value ? 'Data dari API' : 'Login diperlukan',
    icon: UsersRound,
  },
  {
    label: 'Endpoint',
    value: apiBaseUrl.replace(/^https?:\/\//, ''),
    detail: 'VITE_API_BASE_URL',
    icon: Server,
  },
])

const navItems = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'tenants', label: 'Tenants', icon: Building2 },
  { key: 'users', label: 'Users', icon: UsersRound },
] as const

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')

  if (accessToken.value) {
    headers.set('Authorization', `Bearer ${accessToken.value}`)
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
  })

  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(body.message || `Request failed with ${response.status}`)
  }

  return body as T
}

async function login() {
  loading.value = true
  error.value = ''
  notice.value = ''

  try {
    const result = await request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginForm),
    })

    session.userId = result.user_id
    session.email = result.email
    session.tenants = result.tenants || []
    selectedTenant.value = result.tenants[0]?.tenant_id || ''

    localStorage.setItem('karunia_user_id', session.userId)
    localStorage.setItem('karunia_email', session.email)

    if (selectedTenant.value) {
      await selectTenant(selectedTenant.value)
    } else {
      notice.value = 'Login berhasil. User belum memiliki tenant.'
    }
  } catch (err) {
    error.value = getMessage(err)
  } finally {
    loading.value = false
  }
}

async function registerWorkspace() {
  loading.value = true
  error.value = ''
  notice.value = ''

  try {
    await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(registerForm),
    })

    loginForm.email = registerForm.email
    loginForm.password = registerForm.password
    notice.value = 'Workspace berhasil dibuat. Lanjutkan login dengan akun owner.'
    registerForm.tenant_name = ''
    registerForm.username = ''
    registerForm.email = ''
    registerForm.password = ''
    authMode.value = 'login'
  } catch (err) {
    error.value = getMessage(err)
  } finally {
    loading.value = false
  }
}

async function selectTenant(tenantId: string) {
  if (!session.userId || !tenantId) return

  loading.value = true
  error.value = ''
  notice.value = ''

  try {
    const result = await request<{ access_token: string }>('/auth/select-tenant', {
      method: 'POST',
      body: JSON.stringify({
        user_id: session.userId,
        tenant_id: tenantId,
      }),
    })

    accessToken.value = result.access_token
    selectedTenant.value = tenantId
    localStorage.setItem('karunia_access_token', accessToken.value)
    localStorage.setItem('karunia_tenant_id', selectedTenant.value)
    notice.value = 'Tenant aktif diperbarui.'
    await loadWorkspace()
  } catch (err) {
    error.value = getMessage(err)
  } finally {
    loading.value = false
  }
}

async function loadWorkspace() {
  if (!accessToken.value) return

  error.value = ''

  const [tenantResult, userResult] = await Promise.all([
    request<ApiListResponse<Tenant>>('/tenant?limit=5&type=active'),
    request<ApiListResponse<User>>('/user?limit=8&type=active'),
  ])

  tenants.value = tenantResult.data || []
  users.value = userResult.data || []
}

async function createTenant() {
  loading.value = true
  error.value = ''
  notice.value = ''

  try {
    await request<ApiSingleResponse<Tenant>>('/tenant', {
      method: 'POST',
      body: JSON.stringify({
        name: tenantForm.name,
        code: tenantForm.code,
        domain: tenantForm.domain || undefined,
        active_status: 1,
      }),
    })

    tenantForm.name = ''
    tenantForm.code = ''
    tenantForm.domain = ''
    notice.value = 'Tenant baru berhasil dibuat.'
    await loadWorkspace()
  } catch (err) {
    error.value = getMessage(err)
  } finally {
    loading.value = false
  }
}

async function createUser() {
  loading.value = true
  error.value = ''
  notice.value = ''

  try {
    await request<ApiSingleResponse<User>>('/user', {
      method: 'POST',
      body: JSON.stringify({
        username: userForm.username,
        email: userForm.email,
        password: userForm.password,
        role_id: userForm.role_id || undefined,
        tenant_id: selectedTenant.value || undefined,
        active_status: 1,
      }),
    })

    userForm.username = ''
    userForm.email = ''
    userForm.password = ''
    userForm.role_id = ''
    notice.value = 'User baru berhasil dibuat.'
    await loadWorkspace()
  } catch (err) {
    error.value = getMessage(err)
  } finally {
    loading.value = false
  }
}

function logout() {
  accessToken.value = ''
  selectedTenant.value = ''
  session.userId = ''
  session.email = ''
  session.tenants = []
  tenants.value = []
  users.value = []
  localStorage.removeItem('karunia_access_token')
  localStorage.removeItem('karunia_tenant_id')
  localStorage.removeItem('karunia_user_id')
  localStorage.removeItem('karunia_email')
}

function getMessage(err: unknown) {
  return err instanceof Error ? err.message : 'Terjadi kesalahan'
}

onMounted(async () => {
  if (!accessToken.value) return

  loading.value = true
  try {
    await loadWorkspace()
  } catch (err) {
    error.value = getMessage(err)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="min-h-screen bg-slate-100 text-slate-950">
    <section v-if="!isAuthenticated" class="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div class="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.9fr_1fr]">
        <div class="space-y-6">
          <div class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
            <ShieldCheck class="h-4 w-4 text-cyan-700" />
            Karunia SaaS Console
          </div>

          <div class="space-y-4">
            <h1 class="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Dashboard SaaS yang jelas untuk tenant dan user.
            </h1>
            <p class="max-w-xl text-base leading-7 text-slate-600">
              Login untuk mengelola workspace yang sudah ada, atau buat tenant pertama jika aplikasi baru dipasang.
            </p>
          </div>

          <div class="grid max-w-xl gap-3 sm:grid-cols-3">
            <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <Building2 class="h-5 w-5 text-cyan-700" />
              <p class="mt-4 text-sm font-semibold">Tenant</p>
              <p class="mt-1 text-xs text-slate-500">Kelola workspace</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <UsersRound class="h-5 w-5 text-cyan-700" />
              <p class="mt-4 text-sm font-semibold">User</p>
              <p class="mt-1 text-xs text-slate-500">Tambah anggota</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <KeyRound class="h-5 w-5 text-cyan-700" />
              <p class="mt-4 text-sm font-semibold">Akses</p>
              <p class="mt-1 text-xs text-slate-500">Role & permission</p>
            </div>
          </div>
        </div>

        <article class="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
          <div>
            <p class="text-sm font-semibold text-cyan-700">Mulai</p>
            <h2 class="mt-2 text-2xl font-semibold tracking-tight">Masuk atau daftar workspace</h2>
            <p class="mt-2 text-sm leading-6 text-slate-500">
              Gunakan tab di bawah sesuai kebutuhan. Setelah register, email dan password otomatis masuk ke form login.
            </p>
          </div>

          <div class="mt-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
            <button
              class="h-11 rounded-lg text-sm font-semibold transition"
              :class="authMode === 'login' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'"
              type="button"
              @click="authMode = 'login'"
            >
              Login
            </button>
            <button
              class="h-11 rounded-lg text-sm font-semibold transition"
              :class="authMode === 'register' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'"
              type="button"
              @click="authMode = 'register'"
            >
              Register
            </button>
          </div>

          <form v-if="authMode === 'login'" class="mt-6 grid gap-4" @submit.prevent="login">
            <label class="grid gap-2 text-sm font-semibold text-slate-700">
              Email
              <input v-model="loginForm.email" class="field-input" type="email" autocomplete="email" required />
            </label>
            <label class="grid gap-2 text-sm font-semibold text-slate-700">
              Password
              <input v-model="loginForm.password" class="field-input" type="password" autocomplete="current-password" required />
            </label>
            <button class="primary-action" type="submit" :disabled="loading">
              <ShieldCheck class="h-4 w-4" />
              {{ loading ? 'Memproses...' : 'Login ke dashboard' }}
            </button>
          </form>

          <form v-else class="mt-6 grid gap-4" @submit.prevent="registerWorkspace">
            <label class="grid gap-2 text-sm font-semibold text-slate-700">
              Nama tenant
              <input v-model="registerForm.tenant_name" class="field-input" type="text" required />
            </label>
            <label class="grid gap-2 text-sm font-semibold text-slate-700">
              Username owner
              <input v-model="registerForm.username" class="field-input" type="text" required />
            </label>
            <label class="grid gap-2 text-sm font-semibold text-slate-700">
              Email owner
              <input v-model="registerForm.email" class="field-input" type="email" required />
            </label>
            <label class="grid gap-2 text-sm font-semibold text-slate-700">
              Password
              <input v-model="registerForm.password" class="field-input" type="password" required />
            </label>
            <button class="secondary-action" type="submit" :disabled="loading">
              <Plus class="h-4 w-4" />
              {{ loading ? 'Membuat...' : 'Buat workspace' }}
            </button>
          </form>

          <div v-if="notice" class="mt-5 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            <CheckCircle2 class="mt-0.5 h-4 w-4 shrink-0" />
            {{ notice }}
          </div>
          <div v-if="error" class="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {{ error }}
          </div>
        </article>
      </div>
    </section>

    <section v-else class="min-h-screen lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside class="border-b border-slate-200 bg-white p-4 lg:border-b-0 lg:border-r lg:p-5">
        <div class="flex items-center gap-3">
          <span class="grid h-11 w-11 place-items-center rounded-xl bg-slate-950 text-lg font-black text-white">K</span>
          <div>
            <p class="font-semibold leading-tight">Karunia SaaS</p>
            <p class="text-xs text-slate-500">Tenant console</p>
          </div>
        </div>

        <nav class="mt-5 grid grid-cols-3 gap-2 lg:grid-cols-1" aria-label="Main navigation">
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
                {{ activeView === 'overview' ? 'Overview workspace' : activeView === 'tenants' ? 'Kelola tenant' : 'Kelola user' }}
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

        <section v-if="activeView === 'overview'" class="mt-4 grid gap-4 md:grid-cols-3">
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
                <p class="text-sm text-slate-500">Isi data tenant baru, lalu simpan.</p>
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
                Domain
                <input v-model="tenantForm.domain" class="field-input" type="text" />
              </label>
              <button class="primary-action" type="submit" :disabled="loading">
                <Plus class="h-4 w-4" />
                Simpan
              </button>
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
      </section>
    </section>
  </main>
</template>
