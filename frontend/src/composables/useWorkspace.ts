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
    storefront_logo_url: '',
    storefront_banner_url: '',
    storefront_tagline: '',
  })

  const userForm = reactive({
    username: '',
    email: '',
    password: '',
    role_name: '',
  })

  const productForm = reactive({
    name: '',
    slug: '',
    description: '',
    sku: '',
    category: 'product',
    related_product_ids: [] as string[],
    price: '',
    priceDisplay: '',
    stock: 0,
    image_url: '',
    image_urls: [] as string[],
  })

  const roleForm = reactive({
    name: '',
    description: '',
  })

  const selectedRoleId = ref('')
  const selectedPermissionIds = ref<string[]>([])
  const editingTenantId = ref('')
  const editingUserId = ref('')
  const editingRoleId = ref('')
  const editingProductId = ref('')

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
    tenants: loadStoredTenants(),
  })

  const tenants = ref<Tenant[]>([])
  const users = ref<User[]>([])
  const products = ref<Product[]>([])
  const orders = ref<Order[]>([])
  const roles = ref<Role[]>([])
  const permissions = ref<Permission[]>([])
  const storefront = ref<Storefront | null>(null)
  const manageableRoles = computed(() =>
    roles.value.filter((role) => !isSuperAdminRoleName(role.name)),
  )

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
    localStorage.setItem('karunia_tenants', JSON.stringify(session.tenants))
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
    await loadSessionTenants()

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
    mergeTenantOptions(tenants.value)
    users.value = userResult.data || []
    products.value = productResult.data || []
    orders.value = orderResult.data || []
    roles.value = roleResult.data || []
    permissions.value = permissionResult.data || []
    if (
      !selectedRoleId.value ||
      roles.value.some(
        (role) => role.id === selectedRoleId.value && isSuperAdminRoleName(role.name),
      )
    ) {
      const firstManageableRole = manageableRoles.value[0]
      if (firstManageableRole) {
        selectRole(firstManageableRole.id)
      } else {
        selectedRoleId.value = ''
        selectedPermissionIds.value = []
      }
    }
    await loadStorefront()
  }

  async function loadSessionTenants() {
    try {
      const result = await request<{ tenants: TenantOption[] }>('/auth/tenants')
      session.tenants = result.tenants || []
      persistTenantOptions()
    } catch {
      if (!session.tenants.length) {
        session.tenants = loadStoredTenants()
      }
    }
  }

  async function saveTenant() {
    loading.value = true
    error.value = ''
    notice.value = ''

    try {
      const isEditing = Boolean(editingTenantId.value)
      const payload = {
        name: tenantForm.name,
        code: tenantForm.code,
        domain: tenantForm.domain || undefined,
        storefront_template: tenantForm.storefront_template,
        storefront_accent_color: tenantForm.storefront_accent_color,
        storefront_logo_url: tenantForm.storefront_logo_url || undefined,
        storefront_banner_url: tenantForm.storefront_banner_url || undefined,
        storefront_tagline: tenantForm.storefront_tagline || undefined,
        active_status: 1,
      }

      const result = await request<ApiSingleResponse<Tenant>>(
        editingTenantId.value ? `/tenant/${editingTenantId.value}` : '/tenant',
        {
          method: editingTenantId.value ? 'PATCH' : 'POST',
          body: JSON.stringify(payload),
        },
      )

      upsertTenantOption(result.data, isEditing ? undefined : 'OWNER')
      resetTenantForm()
      notice.value = isEditing
        ? 'Tenant berhasil diperbarui.'
        : 'Tenant baru berhasil dibuat dan bisa dipilih sebagai tenant aktif.'
      await loadWorkspace()
    } catch (err) {
      error.value = getMessage(err)
    } finally {
      loading.value = false
    }
  }

  async function uploadTenantImage(type: 'logo' | 'banner', files: FileList | File[]) {
    const image = Array.from(files).find((file) => file.type.startsWith('image/'))
    if (!image) return

    loading.value = true
    error.value = ''
    notice.value = ''

    try {
      const formData = new FormData()
      formData.append('image', image)
      const result = await request<ApiSingleResponse<{ url: string }>>(
        `/tenant/uploads/${type}`,
        {
          method: 'POST',
          body: formData,
        },
      )

      if (type === 'logo') {
        tenantForm.storefront_logo_url = result.data.url
      } else {
        tenantForm.storefront_banner_url = result.data.url
      }
      notice.value =
        type === 'logo'
          ? 'Logo toko berhasil diupload.'
          : 'Banner toko berhasil diupload.'
    } catch (err) {
      error.value = getMessage(err)
    } finally {
      loading.value = false
    }
  }

  async function createTenant() {
    await saveTenant()
  }

  async function updateTenant() {
    await saveTenant()
  }

  function editTenant(tenant: Tenant) {
    editingTenantId.value = tenant.id
    tenantForm.name = tenant.name
    tenantForm.code = tenant.code
    tenantForm.domain = tenant.domain || ''
    tenantForm.storefront_template = tenant.storefront_template || 'market'
    tenantForm.storefront_accent_color =
      tenant.storefront_accent_color || '#0891b2'
    tenantForm.storefront_logo_url = tenant.storefront_logo_url || ''
    tenantForm.storefront_banner_url = tenant.storefront_banner_url || ''
    tenantForm.storefront_tagline = tenant.storefront_tagline || ''
  }

  function resetTenantForm() {
    editingTenantId.value = ''
    tenantForm.name = ''
    tenantForm.code = ''
    tenantForm.domain = ''
    tenantForm.storefront_template = 'market'
    tenantForm.storefront_accent_color = '#0891b2'
    tenantForm.storefront_logo_url = ''
    tenantForm.storefront_banner_url = ''
    tenantForm.storefront_tagline = ''
  }

  async function deleteTenant(id: string) {
    if (!window.confirm('Hapus tenant ini?')) return

    loading.value = true
    error.value = ''
    notice.value = ''

    try {
      await request(`/tenant/${id}`, { method: 'DELETE' })
      notice.value = 'Tenant berhasil dihapus.'
      await loadWorkspace()
    } catch (err) {
      error.value = getMessage(err)
    } finally {
      loading.value = false
    }
  }

  async function saveUser() {
    loading.value = true
    error.value = ''
    notice.value = ''

    try {
      const isEditing = Boolean(editingUserId.value)
      const payload: Record<string, unknown> = {
        username: userForm.username,
        email: userForm.email,
        role_name: userForm.role_name || undefined,
        tenant_id: selectedTenant.value || undefined,
        active_status: 1,
      }

      if (userForm.password) {
        payload.password = userForm.password
      }

      await request<ApiSingleResponse<User>>(
        editingUserId.value ? `/user/${editingUserId.value}` : '/user',
        {
          method: editingUserId.value ? 'PATCH' : 'POST',
          body: JSON.stringify(payload),
        },
      )

      resetUserForm()
      notice.value = isEditing
        ? 'User berhasil diperbarui.'
        : 'User baru berhasil dibuat.'
      await loadWorkspace()
    } catch (err) {
      error.value = getMessage(err)
    } finally {
      loading.value = false
    }
  }

  async function createUser() {
    await saveUser()
  }

  async function updateUser() {
    await saveUser()
  }

  function editUser(user: User) {
    editingUserId.value = user.id
    userForm.username = user.username
    userForm.email = user.email
    userForm.password = ''
    userForm.role_name = user.memberships?.[0]?.role?.name || ''
  }

  function resetUserForm() {
    editingUserId.value = ''
    userForm.username = ''
    userForm.email = ''
    userForm.password = ''
    userForm.role_name = ''
  }

  async function deleteUser(id: string) {
    if (!window.confirm('Hapus user ini?')) return

    loading.value = true
    error.value = ''
    notice.value = ''

    try {
      await request(`/user/${id}`, { method: 'DELETE' })
      notice.value = 'User berhasil dihapus.'
      await loadWorkspace()
    } catch (err) {
      error.value = getMessage(err)
    } finally {
      loading.value = false
    }
  }

  async function saveProduct() {
    loading.value = true
    error.value = ''
    notice.value = ''

    try {
      const isEditing = Boolean(editingProductId.value)
      if (!productForm.price) {
        throw new Error('Harga produk wajib diisi dengan angka')
      }

      await request<ApiSingleResponse<Product>>(
        editingProductId.value
          ? `/product/${editingProductId.value}`
          : '/product',
        {
          method: editingProductId.value ? 'PATCH' : 'POST',
          body: JSON.stringify({
            name: productForm.name,
            slug: productForm.slug || undefined,
            description: productForm.description || undefined,
            sku: productForm.sku || undefined,
            category: productForm.category,
            related_product_ids: productForm.related_product_ids,
            price: productForm.price,
            stock: Number(productForm.stock),
            image_url: productForm.image_url || undefined,
            image_urls: productForm.image_urls,
          }),
        },
      )

      resetProductForm()
      notice.value = isEditing
        ? 'Produk berhasil diperbarui.'
        : 'Produk berhasil masuk ke katalog toko.'
      await loadWorkspace()
    } catch (err) {
      error.value = getMessage(err)
    } finally {
      loading.value = false
    }
  }

  async function createProduct() {
    await saveProduct()
  }

  async function updateProduct() {
    await saveProduct()
  }

  function editProduct(product: Product) {
    editingProductId.value = product.id
    productForm.name = product.name
    productForm.slug = product.slug
    productForm.description = product.description || ''
    productForm.sku = product.sku || ''
    productForm.category = product.category || 'product'
    productForm.related_product_ids = product.related_product_ids || []
    productForm.price = String(Number(product.price))
    productForm.priceDisplay = formatRupiah(product.price)
    productForm.stock = product.stock
    productForm.image_url = product.image_url || ''
    productForm.image_urls = product.image_urls?.length
      ? [...product.image_urls]
      : product.image_url
        ? [product.image_url]
        : []
  }

  function resetProductForm() {
    editingProductId.value = ''
    productForm.name = ''
    productForm.slug = ''
    productForm.description = ''
    productForm.sku = ''
    productForm.category = 'product'
    productForm.related_product_ids = []
    productForm.price = ''
    productForm.priceDisplay = ''
    productForm.stock = 0
    productForm.image_url = ''
    productForm.image_urls = []
  }

  async function uploadProductImages(files: FileList | File[]) {
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/'),
    )
    if (!imageFiles.length) return

    loading.value = true
    error.value = ''
    notice.value = ''

    try {
      const formData = new FormData()
      imageFiles.forEach((file) => formData.append('images', file))
      const result = await request<ApiListResponse<{ url: string }>>(
        '/product/uploads',
        {
          method: 'POST',
          body: formData,
        },
      )
      const uploadedUrls = (result.data || []).map((item) => item.url)
      productForm.image_urls = Array.from(
        new Set([...productForm.image_urls, ...uploadedUrls]),
      )
      productForm.image_url = productForm.image_url || productForm.image_urls[0] || ''
      notice.value = `${uploadedUrls.length} gambar produk berhasil diupload.`
    } catch (err) {
      error.value = getMessage(err)
    } finally {
      loading.value = false
    }
  }

  function removeProductImage(url: string) {
    productForm.image_urls = productForm.image_urls.filter((item) => item !== url)
    if (productForm.image_url === url) {
      productForm.image_url = productForm.image_urls[0] || ''
    }
  }

  function setPrimaryProductImage(url: string) {
    productForm.image_url = url
    productForm.image_urls = Array.from(new Set([url, ...productForm.image_urls]))
  }

  async function deleteProduct(id: string) {
    if (!window.confirm('Hapus produk ini?')) return

    loading.value = true
    error.value = ''
    notice.value = ''

    try {
      await request(`/product/${id}`, { method: 'DELETE' })
      notice.value = 'Produk berhasil dihapus.'
      await loadWorkspace()
    } catch (err) {
      error.value = getMessage(err)
    } finally {
      loading.value = false
    }
  }

  async function saveRole() {
    if (isSuperAdminRoleName(roleForm.name)) {
      error.value = 'Role SUPER_ADMIN hanya bisa diatur langsung dari database.'
      return
    }

    loading.value = true
    error.value = ''
    notice.value = ''

    try {
      const isEditing = Boolean(editingRoleId.value)
      const result = await request<ApiSingleResponse<Role>>(
        editingRoleId.value ? `/role/${editingRoleId.value}` : '/role',
        {
          method: editingRoleId.value ? 'PATCH' : 'POST',
          body: JSON.stringify({
            name: roleForm.name,
            description: roleForm.description || undefined,
          }),
        },
      )

      resetRoleForm()
      notice.value = isEditing
        ? 'Role berhasil diperbarui.'
        : 'Role maintenance berhasil dibuat.'
      await loadWorkspace()
      selectRole(result.data.id)
    } catch (err) {
      error.value = getMessage(err)
    } finally {
      loading.value = false
    }
  }

  async function createRole() {
    await saveRole()
  }

  async function updateRole() {
    await saveRole()
  }

  function editRole(role: Role) {
    if (isSuperAdminRoleName(role.name)) return

    editingRoleId.value = role.id
    roleForm.name = role.name
    roleForm.description = role.description || ''
    selectRole(role.id)
  }

  function resetRoleForm() {
    editingRoleId.value = ''
    roleForm.name = ''
    roleForm.description = ''
  }

  async function deleteRole(id: string) {
    if (!window.confirm('Hapus role ini?')) return

    loading.value = true
    error.value = ''
    notice.value = ''

    try {
      await request(`/role/${id}`, { method: 'DELETE' })
      notice.value = 'Role berhasil dihapus.'
      if (selectedRoleId.value === id) {
        selectedRoleId.value = ''
        selectedPermissionIds.value = []
      }
      await loadWorkspace()
    } catch (err) {
      error.value = getMessage(err)
    } finally {
      loading.value = false
    }
  }

  function selectRole(roleId: string) {
    const role = roles.value.find((item) => item.id === roleId)
    if (!role || isSuperAdminRoleName(role.name)) {
      selectedRoleId.value = ''
      selectedPermissionIds.value = []
      return
    }

    selectedRoleId.value = roleId
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

  async function updateOrderStatus(orderId: string, status: string) {
    loading.value = true
    error.value = ''
    notice.value = ''

    try {
      await request<ApiSingleResponse<Order>>(`/order/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      notice.value = 'Status order berhasil diperbarui.'
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
    localStorage.removeItem('karunia_tenants')
  }

  function getMessage(err: unknown) {
    return err instanceof Error ? err.message : 'Terjadi kesalahan'
  }

  function isSuperAdminRoleName(roleName?: string) {
    return roleName?.trim().toUpperCase().replace(/[\s-]+/g, '_') === 'SUPER_ADMIN'
  }

  function loadStoredTenants(): TenantOption[] {
    try {
      const raw = localStorage.getItem('karunia_tenants')
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  function persistTenantOptions() {
    localStorage.setItem('karunia_tenants', JSON.stringify(session.tenants))
  }

  function upsertTenantOption(tenant: Tenant, role?: string) {
    const existing = session.tenants.find((item) => item.tenant_id === tenant.id)

    if (existing) {
      existing.tenant_name = tenant.name
      if (role) existing.role = role
    } else {
      session.tenants.push({
        tenant_id: tenant.id,
        tenant_name: tenant.name,
        role,
      })
    }

    persistTenantOptions()
  }

  function mergeTenantOptions(rows: Tenant[]) {
    rows.forEach((tenant) => {
      if (tenant.id === selectedTenant.value) {
        upsertTenantOption(tenant)
      }
    })
  }

  function selectedTenantCode() {
    const tenant = tenants.value.find((item) => item.id === selectedTenant.value)
    return tenant?.domain || tenant?.code
  }

  function setProductPrice(value: string) {
    const digits = value.replace(/\D/g, '')
    productForm.price = digits
    productForm.priceDisplay = digits ? formatRupiah(digits) : ''
  }

  function formatRupiah(value: string | number) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(Number(value || 0))
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
    editingTenantId,
    editingUserId,
    editingRoleId,
    editingProductId,
    session,
    tenants,
    users,
    products,
    orders,
    roles,
    manageableRoles,
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
    updateTenant,
    editTenant,
    resetTenantForm,
    deleteTenant,
    uploadTenantImage,
    createUser,
    updateUser,
    editUser,
    resetUserForm,
    deleteUser,
    createProduct,
    updateProduct,
    editProduct,
    resetProductForm,
    deleteProduct,
    uploadProductImages,
    removeProductImage,
    setPrimaryProductImage,
    createRole,
    updateRole,
    editRole,
    resetRoleForm,
    deleteRole,
    selectRole,
    saveRolePermissions,
    loadStorefront,
    createCheckoutOrder,
    updateOrderStatus,
    setProductPrice,
    logout,
  }
}
