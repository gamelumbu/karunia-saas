<script setup lang="ts">
import { computed, onMounted } from 'vue'
import AuthView from './components/AuthView.vue'
import DashboardView from './components/DashboardView.vue'
import PublicStoreView from './components/PublicStoreView.vue'
import { useWorkspace } from './composables/useWorkspace'

const workspace = useWorkspace()
const publicStoreSlug = computed(() => {
  const segment = window.location.pathname.split('/').filter(Boolean)[0] || ''
  const reserved = new Set(['admin', 'dashboard', 'login', 'marketplace', 'api'])
  return segment && !reserved.has(segment) ? segment : ''
})

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
    <PublicStoreView v-if="publicStoreSlug" :slug="publicStoreSlug" />
    <AuthView v-else-if="!workspace.isAuthenticated.value" :workspace="workspace" />
    <DashboardView v-else :workspace="workspace" />
  </main>
</template>
