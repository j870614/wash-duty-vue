<template>
  <div v-if="state.modalTargetDebtor" class="modal d-block bg-dark bg-opacity-50" tabindex="-1" style="z-index: 1050;">
    <div class="modal-dialog modal-dialog-centered w-100" style="max-width: 400px;">
      <div class="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
        <div class="modal-header bg-light border-0 pb-0 d-flex flex-column align-items-start">
          <h5 class="modal-title fw-bold text-dark">安排慈悲代班</h5>
          <p class="text-muted small mt-1 mb-0">請選擇替 <span class="fw-bold text-warning">{{ state.modalTargetDebtor }}</span> 支援的法師：</p>
        </div>
    <div class="modal-body custom-scrollbar" style="max-height: 50vh; overflow-y: auto;">
      <div class="mb-3">
        <label class="form-label small fw-bold text-muted mb-1">選擇代班時段：</label>
        <div class="d-flex flex-wrap gap-2">
          <template v-for="p in ['午齋', '藥食', '整天']" :key="p">
            <input type="radio" class="btn-check" :id="'m-p-' + p" :value="p" v-model="selectedPeriod" autocomplete="off">
            <label class="btn btn-outline-warning btn-sm px-3 fw-bold" :for="'m-p-' + p">{{ p }}</label>
          </template>
        </div>
      </div>

      <label class="form-label small fw-bold text-muted mb-1">選擇代班人員：</label>
      <input type="text" v-model="searchQuery" placeholder="搜尋姓名..." class="form-control mb-3 shadow-none border-secondary">
      <div class="row g-2">
        <div v-for="m in availableMembers" :key="m" class="col-6">
          <button 
            class="btn btn-outline-secondary w-100 text-truncate text-start"
            :class="{ 'disabled opacity-50': state.isSyncing }"
            @click="createDebt(m)">
            {{ m }}
          </button>
        </div>
      </div>
    </div>
    <div class="modal-footer bg-light border-0 pt-2 border-top">
      <button type="button" class="btn btn-light text-muted fw-bold" @click="closeModal" :disabled="state.isSyncing">取消</button>
    </div>
  </div>
</div>
</div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { state, syncToCloud } from '../store.js';

const searchQuery = ref('');
const selectedPeriod = ref('午齋');

const currentGroup = computed(() => {
  return state.groups.length ? state.groups[state.currentGroupIndex] : null;
});

const currentGroupMembers = computed(() => {
  return currentGroup.value?.members || [];
});

const availableMembers = computed(() => {
  const term = searchQuery.value.trim().toLowerCase();
  const all = state.groups.flatMap(g => g.members);
  
  // 找出目前這組已經被安排代班的人選 (排除已安排的代班者)
  const currentGroupCreditors = state.debts
    .filter(d => !d.isSettled && currentGroupMembers.value.includes(d.debtor))
    .map(d => d.creditor);

  return all.filter(m => 
    !currentGroupMembers.value.includes(m) && 
    !currentGroupCreditors.includes(m) &&
    m.toLowerCase().includes(term)
  );
});

const createDebt = async (creditor) => {
  if (state.isSyncing) return;
  
  state.debts.push({
    id: 'debt-' + Date.now(),
    debtor: state.modalTargetDebtor,
    creditor: creditor,
    period: selectedPeriod.value,
    dateCreated: new Date().toLocaleDateString(),
    isSettled: false
  });
  
  await syncToCloud();
  closeModal();
};

const closeModal = () => {
  state.modalTargetDebtor = null;
  searchQuery.value = '';
  selectedPeriod.value = '午齋';
};
</script>
