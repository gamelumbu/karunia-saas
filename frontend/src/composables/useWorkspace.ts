import { computed, reactive, ref } from 'vue'
import { Building2, Package, ReceiptText, Server, UsersRound } from '@lucide/vue'
import { apiBaseUrl, apiRequest } from '../services/api'
import type {
  ActiveView,
  ApiListResponse,
  ApiSingleResponse,
  LoginResponse,
  Order,
  Product,
  Permission,
  RegisterResponse,
  Role,
  Storefront,
  Tenant,
  TenantOption,
  User,
} from '../types'

export function useWorkspace() {
  const activeView = ref<ActiveView>('overview')
  const authMode = ref<'login' | 'register'>('login')
  const loading = ref(false)
  const notice = ref('')
  const error = ref('')
  const accessToken = ref(localStorage.getItem('karunia_access_token') || '')
  const selectedTenant = ref(localStorage.getItem('karunia_tenant_id') || '')

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
    storefront_template: 'market',
    storefront_accent_color: '#0891b2',
  })

  const userForm = reactive({
    username: '',
    email: '',
    password: '',
    role_id: '',
  })

  const productForm = reactive({
    name: '',
    slug: '',
    description: '',
    sku: '',
    price: '',
    stock: 0,
    image_url: '',
  })

  const roleForm = reactive({
    name: '',
    description: '',
  })

  const selectedRoleId = ref('')
  const selectedPermissionIds = ref<string[]>([])

  const checkoutForm = reactive({
    product_id: '',
    quantity: 1,
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    shipping_address: '',
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
  const products = ref<Product[]>([])
  const orders = ref<Order[]>([])
  const roles = ref<Role[]>([])
  const permissions = ref<Permission[]>([])
  const storefront = ref<Storefront | null>(null)

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
      label: 'Produk',
      value: products.value.length,
      detail: 'Katalog toko aktif',
      icon: Package,
    },
    {
      label: 'Order',
      value: orders.value.length,
      detail: 'Order masuk toko aktif',
      icon: ReceiptText,
    },
    {
      label: 'Endpoint',
      value: apiBaseUrl.replace(/^https?:\/\//, ''),
      detail: 'VITE_API_BASE_URL',
      icon: Server,
    },
  ])

  async function request<T>(path: string, options: RequestInit = {}) {
    return apiRequest<T>(path, options, accessToken.value)
  }

  function persistSession(result: LoginResponse, token?: string) {
    session.userId = result.user_id
    session.email = result.email
    session.tenants = result.tenants || []
    selectedTenant.value = result.tenants[0]?.tenant_id || selectedTenant.value

    if (token) {
      accessToken.value = token
      localStorage.setItem('karunia_access_token', token)
    } else if (result.access_token) {
      accessToken.value = result.access_token
      localStorage.setItem('karunia_access_token', result.access_token)
    }

    localStorage.setItem('karunia_user_id', session.userId)
    localStorage.setItem('karunia_email', session.email)
    localStorage.setItem('karunia_tenant_id', selectedTenant.value)
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

      persistSession(result)

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
      const result = await request<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(registerForm),
      })

      persistSession(result, result.access_token)
      notice.value = 'Workspace berhasil dibuat. Anda sudah login sebagai OWNER.'
      registerForm.tenant_name = ''
      registerForm.username = ''
      registerForm.email = ''
      registerForm.password = ''
      authMode.value = 'login'
      await loadWorkspace()
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

    const [
      tenantResult,
      userResult,
      productResult,
      orderResult,
      roleResult,
      permissionResult,
    ] = await Promise.all([
      request<ApiListResponse<Tenant>>('/tenant?limit=5&type=active'),
      request<ApiListResponse<User>>('/user?limit=8&type=active'),
      request<ApiListResponse<Product>>('/product'),
      request<ApiListResponse<Order>>('/order'),
      request<ApiListResponse<Role>>('/role'),
      request<ApiListResponse<Permission>>('/role/permissions'),
    ])

    tenants.value = tenantResult.data || []
    users.value = userResult.data || []
    products.value = productResult.data || []
    orders.value = orderResult.data || []
    roles.value = roleResult.data || []
    permissions.value = permissionResult.data || []
    if (!selectedRoleId.value && roles.value[0]) {
      selectRole(roles.value[0].id)
    }
    await loadStorefront()
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
          storefront_template: tenantForm.storefront_template,
          storefront_accent_color: tenantForm.storefront_accent_color,
          active_status: 1,
        }),
      })

      tenantForm.name = ''
      tenantForm.code = ''
      tenantForm.domain = ''
      tenantForm.storefront_template = 'market'
      tenantForm.storefront_accent_color = '#0891b2'
      notice.value =
        'Tenant baru berhasil dibuat. Jika tenant belum muncul di pilihan, logout lalu login ulang.'
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

  async function createProduct() {
    loading.value = true
    error.value = ''
    notice.value = ''

    try {
      await request<ApiSingleResponse<Product>>('/product', {
        method: 'POST',
        body: JSON.stringify({
          name: productForm.name,
          slug: productForm.slug || undefined,
          description: productForm.description || undefined,
          sku: productForm.sku || undefined,
          price: productForm.price,
          stock: Number(productForm.stock),
          image_url: productForm.image_url || undefined,
        }),
      })

      productForm.name = ''
      productForm.slug = ''
      productForm.description = ''
      productForm.sku = ''
      productForm.price = ''
      productForm.stock = 0
      productForm.image_url = ''
      notice.value = 'Produk berhasil masuk ke katalog toko.'
      await loadWorkspace()
    } catch (err) {
      error.value = getMessage(err)
    } finally {
      loading.value = false
    }
  }

  async function createRole() {
    loading.value = true
    error.value = ''
    notice.value = ''

    try {
      const result = await request<ApiSingleResponse<Role>>('/role', {
        method: 'POST',
        body: JSON.stringify({
          name: roleForm.name,
          description: roleForm.description || undefined,
        }),
      })

      roleForm.name = ''
      roleForm.description = ''
      notice.value = 'Role maintenance berhasil dibuat.'
      await loadWorkspace()
      selectRole(result.data.id)
    } catch (err) {
      error.value = getMessage(err)
    } finally {
      loading.value = false
    }
  }

  function selectRole(roleId: string) {
    selectedRoleId.value = roleId
    const role = roles.value.find((item) => item.id === roleId)
    selectedPermissionIds.value =
      role?.role_permissions?.map((item) => item.permission_id) || []
  }

  async function saveRolePermissions() {
    if (!selectedRoleId.value) return

    loading.value = true
    error.value = ''
    notice.value = ''

    try {
      await request<ApiSingleResponse<Role>>(`/role/${selectedRoleId.value}/permissions`, {
        method: 'PATCH',
        body: JSON.stringify({
          permission_ids: selectedPermissionIds.value,
        }),
      })
      notice.value = 'Permission role berhasil diperbarui.'
      await loadWorkspace()
      selectRole(selectedRoleId.value)
    } catch (err) {
      error.value = getMessage(err)
    } finally {
      loading.value = false
    }
  }

  async function loadStorefront() {
    const storeCode = selectedTenantCode()
    if (!storeCode) return

    try {
      const result = await apiRequest<ApiSingleResponse<Storefront>>(
        `/marketplace/stores/${storeCode}`,
      )
      storefront.value = result.data
      if (!checkoutForm.product_id && result.data.products[0]) {
        checkoutForm.product_id = result.data.products[0].id
      }
    } catch {
      storefront.value = null
    }
  }

  async function createCheckoutOrder() {
    const storeCode = selectedTenantCode()
    if (!storeCode) return

    loading.value = true
    error.value = ''
    notice.value = ''

    try {
      await apiRequest<ApiSingleResponse<Order>>(`/marketplace/stores/${storeCode}/orders`, {
        method: 'POST',
        body: JSON.stringify({
          customer_name: checkoutForm.customer_name,
          customer_email: checkoutForm.customer_email,
          customer_phone: checkoutForm.customer_phone || undefined,
          shipping_address: checkoutForm.shipping_address,
          items: [
            {
              product_id: checkoutForm.product_id,
              quantity: Number(checkoutForm.quantity),
            },
          ],
        }),
      })

      checkoutForm.customer_name = ''
      checkoutForm.customer_email = ''
      checkoutForm.customer_phone = ''
      checkoutForm.shipping_address = ''
      checkoutForm.quantity = 1
      notice.value = 'Order demo berhasil dibuat dari storefront public.'
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
    products.value = []
    orders.value = []
    roles.value = []
    permissions.value = []
    storefront.value = null
    localStorage.removeItem('karunia_access_token')
    localStorage.removeItem('karunia_tenant_id')
    localStorage.removeItem('karunia_user_id')
    localStorage.removeItem('karunia_email')
  }

  function getMessage(err: unknown) {
    return err instanceof Error ? err.message : 'Terjadi kesalahan'
  }

  function selectedTenantCode() {
    const tenant = tenants.value.find((item) => item.id === selectedTenant.value)
    return tenant?.domain || tenant?.code
  }

  return {
    activeView,
    authMode,
    loading,
    notice,
    error,
    selectedTenant,
    loginForm,
    registerForm,
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
    isAuthenticated,
    selectedTenantName,
    stats,
    apiBaseUrl,
    login,
    registerWorkspace,
    selectTenant,
    loadWorkspace,
    createTenant,
    createUser,
    createProduct,
    createRole,
    selectRole,
    saveRolePermissions,
    loadStorefront,
    createCheckoutOrder,
    logout,
  }
}
