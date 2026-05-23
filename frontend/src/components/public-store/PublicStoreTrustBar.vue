<script setup lang="ts">
import { Check, ShieldCheck, Truck } from '@lucide/vue'

defineProps<{
  accent: string
}>()
</script>

<template>
  <section class="border-b border-zinc-200 bg-white">
    <div class="mx-auto grid max-w-[1440px] gap-3 px-4 py-5 sm:px-6 md:grid-cols-3 lg:px-8">
      <div class="flex items-center gap-4 border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-700">
        <span class="grid h-10 w-10 place-items-center bg-white shadow-sm">
          <Truck class="h-5 w-5" :style="{ color: accent }" />
        </span>
        Pengiriman fleksibel
      </div>
      <div class="flex items-center gap-4 border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-700">
        <span class="grid h-10 w-10 place-items-center bg-white shadow-sm">
          <ShieldCheck class="h-5 w-5" :style="{ color: accent }" />
        </span>
        Katalog toko terverifikasi
      </div>
      <div class="flex items-center gap-4 border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-700">
        <span class="grid h-10 w-10 place-items-center bg-white shadow-sm">
          <Check class="h-5 w-5" :style="{ color: accent }" />
        </span>
        Checkout tanpa register
      </div>
    </div>
  </section>
</template>
