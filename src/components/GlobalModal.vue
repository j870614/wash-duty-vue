<template>
  <div v-if="state.modal.show" class="modal d-block bg-dark bg-opacity-50" tabindex="-1" style="z-index: 2000;">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
        <div class="modal-header border-0 pb-0" :class="headerClass">
          <h5 class="modal-title fw-bold" :class="textClass" :style="{ fontSize: 'var(--fs-name, 1.25rem)' }">{{ state.modal.title }}</h5>
          <button type="button" class="btn-close" @click="close"></button>
        </div>
        <div class="modal-body py-3">
          <p class="mb-0 text-dark" :style="{ fontSize: 'var(--fs-main, 1.1rem)' }">{{ state.modal.message }}</p>
        </div>
        <div class="modal-footer border-0 pt-0">
          <button v-if="state.modal.onConfirm" type="button" class="btn btn-light fw-bold px-4" @click="close" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">取消</button>
          <button v-if="state.modal.onConfirm" type="button" class="btn fw-bold px-4 shadow-sm" :class="btnClass" @click="confirm" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">確定</button>
          <button v-else type="button" class="btn fw-bold px-4 shadow-sm" :class="btnClass" @click="close" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">了解</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { state } from '../store.js';

const headerClass = computed(() => {
  if (state.modal.type === 'warning') return 'bg-warning bg-opacity-10';
  if (state.modal.type === 'danger') return 'bg-danger bg-opacity-10';
  return 'bg-light';
});

const textClass = computed(() => {
  if (state.modal.type === 'warning') return 'text-warning-emphasis';
  if (state.modal.type === 'danger') return 'text-danger';
  return 'text-dark';
});

const btnClass = computed(() => {
  if (state.modal.type === 'warning') return 'btn-warning';
  if (state.modal.type === 'danger') return 'btn-danger';
  return 'btn-dark';
});

const close = () => {
  state.modal.show = false;
};

const confirm = () => {
  if (state.modal.onConfirm) state.modal.onConfirm();
  close();
};
</script>
