<script setup lang="ts">
import { Building2, CheckCircle2, KeyRound, Plus, ShieldCheck, UsersRound } from '@lucide/vue'
import type { useWorkspace } from '../composables/useWorkspace'

const props = defineProps<{
  workspace: ReturnType<typeof useWorkspace>
}>()

const {
  authMode,
  loading,
  notice,
  error,
  loginForm,
  registerForm,
  login,
  registerWorkspace,
} = props.workspace
</script>

<template>
  <section class="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
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
            Setelah register, sistem langsung login sebagai OWNER untuk tenant baru.
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
</template>
