<script setup lang="ts">
import type { Order } from '../../types'

defineProps<{
  trackingForm: {
    order_number: string
    email: string
  }
  trackedOrder: Order | null
  accent: string
  formatCurrency: (value: string | number) => string
}>()

defineEmits<{
  trackOrder: []
}>()
</script>

<template>
  <section class="mx-auto max-w-[1440px] border-t border-zinc-200 px-4 py-10 sm:px-6 lg:px-8">
    <div class="grid gap-6 lg:grid-cols-[380px_1fr]">
      <form class="border border-zinc-200 bg-white p-5" @submit.prevent="$emit('trackOrder')">
        <p class="text-xs font-black uppercase tracking-wide" :style="{ color: accent }">Tracking</p>
        <h2 class="mt-1 text-2xl font-black uppercase tracking-tight">Cek order</h2>
        <div class="mt-5 grid gap-4">
          <input v-model="trackingForm.order_number" class="field-input rounded-full" placeholder="Nomor order" required />
          <input v-model="trackingForm.email" class="field-input rounded-full" type="email" placeholder="Email checkout" required />
          <button class="inline-flex h-12 items-center justify-center rounded-full text-sm font-black uppercase text-white" :style="{ backgroundColor: accent }" type="submit">
            Cek status
          </button>
        </div>
      </form>
      <article v-if="trackedOrder" class="border border-zinc-200 bg-zinc-50 p-5">
        <p class="text-sm font-black uppercase">{{ trackedOrder.order_number }}</p>
        <h3 class="mt-2 text-3xl font-black uppercase">{{ trackedOrder.status }}</h3>
        <p class="mt-3 text-sm text-zinc-600">{{ trackedOrder.shipping_city }} {{ trackedOrder.shipping_postal_code }}</p>
        <div class="mt-5 grid gap-2">
          <p v-for="item in trackedOrder.items || []" :key="item.id" class="flex justify-between text-sm">
            <span>{{ item.product_name }} x{{ item.quantity }}</span>
            <strong>{{ formatCurrency(item.subtotal) }}</strong>
          </p>
        </div>
      </article>
    </div>
  </section>
</template>
