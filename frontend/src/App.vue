<script setup lang="ts">
import { computed, onMounted } from 'vue'
import AuthView from './components/AuthView.vue'
import DashboardView from './components/DashboardView.vue'
import PublicStoreView from './components/PublicStoreView.vue'
import { useWorkspace } from './composables/useWorkspace'

const workspace = useWorkspace()
const publicPath = computed(() => window.location.pathname.split('/').filter(Boolean))
const isPublicMarketplace = computed(() => publicPath.value[0] === 'marketplace')
const isTenantLogin = computed(() => publicPath.value[0] === 'login-tenant')
const publicStoreSlug = computed(() => {
  if (!publicPath.value.length) return 'all'
  if (isPublicMarketplace.value) return 'all'
  if (isTenantLogin.value) return ''
  const segment = publicPath.value[0] || ''
  const reserved = new Set(['admin', 'dashboard', 'login', 'api', 'login-tenant'])
  return segment && !reserved.has(segment) ? segment : ''
})
const publicStorePage = computed(() =>
  isPublicMarketplace.value ? publicPath.value[1] || 'home' : publicPath.value[1] || 'home',
)
const publicProductSlug = computed(() =>
  publicPath.value[1] === 'products' ? publicPath.value[2] || '' : '',
)

onMounted(async () => {
  if (publicStoreSlug.value) return
  if (!workspace.isAuthenticated.value) return

  workspace.loading.value = true
  try {
    await workspace.loadWorkspace()
  } finally {
    workspace.loading.value = false
  }
})
</script>

<template>
  <main class="min-h-screen bg-slate-100 text-slate-950">
    <PublicStoreView
      v-if="publicStoreSlug"
      :slug="publicStoreSlug"
      :page="publicStorePage"
      :product-slug="publicProductSlug"
      :show-admin-link="workspace.isAuthenticated.value"
      :show-tenant-login-link="!workspace.isAuthenticated.value"
    />
    <AuthView v-else-if="!workspace.isAuthenticated.value" :workspace="workspace" />
    <DashboardView v-else :workspace="workspace" />
  </main>
</template>
