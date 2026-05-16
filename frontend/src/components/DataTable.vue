<script setup lang="ts">
import { Building2, UserRound } from '@lucide/vue'

type Row = {
  id: string
  name?: string
  code?: string
  username?: string
  email?: string
  active_status: number | string
}

const props = defineProps<{
  title: string
  rows: Row[]
  kind: 'tenant' | 'user'
}>()

function formatStatus(status: number | string) {
  return Number(status) === 1 || status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'
}

function primaryText(row: Row) {
  return props.kind === 'tenant' ? row.name : row.username
}

function secondaryText(row: Row) {
  return props.kind === 'tenant' ? row.code : row.email
}
</script>

<template>
  <article class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <header class="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
      <div>
        <p class="text-xs font-semibold uppercase text-cyan-700">
          {{ kind === 'tenant' ? 'Tenant' : 'User' }}
        </p>
        <h2 class="mt-1 text-lg font-semibold tracking-tight text-slate-950">{{ title }}</h2>
      </div>
      <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
        {{ rows.length }} item
      </span>
    </header>

    <div v-if="!rows.length" class="grid min-h-52 place-items-center px-5 py-10">
      <div class="text-center">
        <span class="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
          <component :is="kind === 'tenant' ? Building2 : UserRound" class="h-5 w-5" />
        </span>
        <p class="mt-4 text-sm font-semibold text-slate-700">Belum ada data</p>
        <p class="mt-1 text-sm text-slate-500">Klik refresh atau tambahkan data baru.</p>
      </div>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[560px] border-collapse">
        <thead>
          <tr class="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th class="px-5 py-3">Nama</th>
            <th class="px-5 py-3">{{ kind === 'tenant' ? 'Kode' : 'Email' }}</th>
            <th class="px-5 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.id"
            class="border-t border-slate-100 text-sm transition hover:bg-cyan-50/40"
          >
            <td class="px-5 py-4">
              <div class="flex items-center gap-3">
                <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700">
                  <component :is="kind === 'tenant' ? Building2 : UserRound" class="h-4 w-4" />
                </span>
                <div>
                  <p class="font-semibold text-slate-950">{{ primaryText(row) }}</p>
                  <p class="text-xs text-slate-500">{{ row.id.slice(0, 8) }}</p>
                </div>
              </div>
            </td>
            <td class="px-5 py-4 text-slate-600">{{ secondaryText(row) }}</td>
            <td class="px-5 py-4">
              <span
                class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                :class="
                  formatStatus(row.active_status) === 'Aktif'
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                    : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'
                "
              >
                {{ formatStatus(row.active_status) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </article>
</template>
