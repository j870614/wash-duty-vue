<template>
  <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 2500;">
    <div v-if="state.toast.show" class="toast show align-items-center border-0 shadow-lg rounded-3" :class="toastClass" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body fw-bold py-3 px-4">
          {{ state.toast.message }}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" @click="state.toast.show = false"></button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { state } from '../store.js';

const toastClass = computed(() => {
  if (state.toast.type === 'danger') return 'bg-danger text-white';
  if (state.toast.type === 'warning') return 'bg-warning text-dark';
  return 'bg-success text-white';
});
</script>
