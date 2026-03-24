<template>
  <div v-if="state.modalTargetDebtor" class="modal d-block bg-dark bg-opacity-50" tabindex="-1" style="z-index: 1050;">
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable mx-auto my-auto p-3" style="max-width: 400px;">
      <div class="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
        <div class="modal-header bg-light border-0 pb-0 d-flex flex-column align-items-start">
          <h5 class="modal-title fw-bold text-dark">{{ isEditing ? '修改代班安排' : '安排慈悲代班' }}</h5>
          <p class="text-muted small mt-1 mb-0">替 <span class="fw-bold text-warning">{{ state.modalTargetDebtor }}</span> 安排支援：</p>
        </div>
        
        <!-- Step 1: Selection -->
        <div v-if="step === 1" class="modal-body custom-scrollbar">
          <div class="mb-3">
            <label class="form-label small fw-bold text-muted mb-1">選擇代班時段：</label>
            <div class="d-flex flex-wrap gap-2">
              <template v-for="p in ['早齋', '午齋', '藥石', '整天']" :key="p">
                <input type="checkbox" class="btn-check" :id="'m-p-' + p" :value="p" v-model="selectedPeriod" autocomplete="off">
                <label class="btn btn-outline-warning btn-sm px-3 fw-bold" :for="'m-p-' + p">{{ p }}</label>
              </template>
            </div>
          </div>

          <label class="form-label small fw-bold text-muted mb-1">選擇代班人員：</label>
          <input type="text" v-model="searchQuery" placeholder="搜尋姓名..." class="form-control mb-3 shadow-none border-secondary">
          <div class="row g-2">
            <div v-for="m in availableMembers" :key="m" class="col-6">
              <button 
                class="btn w-100 text-truncate text-start"
                :class="selectedCreditor === m ? 'btn-warning fw-bold text-dark border-warning shadow-sm' : 'btn-outline-secondary'"
                @click="selectedCreditor = m">
                {{ m }}
              </button>
            </div>
          </div>
        </div>

        <!-- Step 2: Confirmation -->
        <div v-else-if="step === 2" class="modal-body">
          <div class="alert alert-warning border border-warning">
            <h6 class="fw-bold mb-3 mt-1 text-center">請確認代班資訊</h6>
            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted small">正式值班：</span>
              <span class="fw-bold">{{ state.modalTargetDebtor }}</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted small">代班人員：</span>
              <span class="fw-bold text-success">{{ selectedCreditor }}</span>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted small">代班時段：</span>
              <span class="badge bg-dark">{{ selectedPeriod.join('、') }}</span>
            </div>
          </div>
          <p class="text-center small text-muted mb-0">以上資訊正確無誤嗎？</p>
        </div>

        <div class="modal-footer bg-light border-0 pt-2 border-top d-flex justify-content-between">
          <button v-if="isEditing && isAdmin" type="button" class="btn btn-outline-danger btn-sm fw-bold me-auto" @click="cancelSubstitute" :disabled="state.isSyncing">🗑️ 取消代班</button>
          
          <div class="d-flex gap-2 ms-auto">
            <button v-if="step === 1" type="button" class="btn btn-light text-muted fw-bold" @click="closeModal" :disabled="state.isSyncing">取消</button>
            <button v-if="step === 2" type="button" class="btn btn-light text-muted fw-bold" @click="step = 1" :disabled="state.isSyncing">返回修改</button>
            
            <button v-if="step === 1" type="button" class="btn btn-primary fw-bold" @click="goToConfirm" :disabled="!selectedCreditor || selectedPeriod.length === 0">前往確認</button>
            <button v-if="step === 2" type="button" class="btn btn-success fw-bold px-4 shadow-sm" @click="saveDebt" :disabled="state.isSyncing">✅ 確認儲存</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { state, syncToCloud, isAdmin } from '../store.js';

const searchQuery = ref('');
const selectedPeriod = ref(['午齋']);
const selectedCreditor = ref(null);
const step = ref(1);

const currentGroup = computed(() => state.groups.length ? state.groups[state.currentGroupIndex] : null);
const currentGroupMembers = computed(() => currentGroup.value?.members || []);

const existingDebt = computed(() => {
  return state.debts.find(d => !d.isSettled && d.debtor === state.modalTargetDebtor && currentGroupMembers.value.includes(d.debtor));
});
const isEditing = computed(() => !!existingDebt.value);

watch(() => state.modalTargetDebtor, (newVal) => {
  if (newVal) {
    step.value = 1;
    if (existingDebt.value) {
      selectedCreditor.value = existingDebt.value.creditor;
      selectedPeriod.value = existingDebt.value.period.split('、');
    } else {
      selectedCreditor.value = null;
      selectedPeriod.value = ['午齋'];
    }
  }
});

watch(() => [...selectedPeriod.value], (newVal, oldVal) => {
  if (newVal.includes('整天') && !oldVal.includes('整天')) {
    selectedPeriod.value = ['整天'];
  } else if (newVal.includes('整天') && newVal.length > 1) {
    selectedPeriod.value = newVal.filter(p => p !== '整天');
  } else {
    // Check if 早齋, 午齋, 藥石 are all selected
    const allMeals = ['早齋', '午齋', '藥石'];
    if (allMeals.every(meal => newVal.includes(meal))) {
      selectedPeriod.value = ['整天'];
    }
  }
});

const availableMembers = computed(() => {
  const term = searchQuery.value.trim().toLowerCase();
  const all = state.groups.flatMap(g => g.members);
  const currentGroupCreditors = state.debts
    .filter(d => !d.isSettled && currentGroupMembers.value.includes(d.debtor) && d.debtor !== state.modalTargetDebtor)
    .map(d => d.creditor);

  return all.filter(m => 
    !currentGroupMembers.value.includes(m) && 
    !currentGroupCreditors.includes(m) &&
    m.toLowerCase().includes(term)
  );
});

const goToConfirm = () => {
  if (selectedPeriod.value.length === 0) {
    alert("請至少選擇一個代班時段");
    return;
  }
  step.value = 2;
};

const saveDebt = async () => {
  if (state.isSyncing) return;
  
  if (isEditing.value) {
    existingDebt.value.creditor = selectedCreditor.value;
    existingDebt.value.period = selectedPeriod.value.join('、');
  } else {
    state.debts.push({
      id: 'debt-' + Date.now(),
      debtor: state.modalTargetDebtor,
      creditor: selectedCreditor.value,
      period: selectedPeriod.value.join('、'),
      dateCreated: new Date().toLocaleDateString(),
      isSettled: false
    });
  }
  
  await syncToCloud();
  closeModal();
};

const cancelSubstitute = async () => {
  if (!isAdmin.value || !existingDebt.value) return;
  if (confirm("確定要取消此代班安排嗎？")) {
    const idx = state.debts.findIndex(d => d.id === existingDebt.value.id);
    if (idx !== -1) {
      state.debts.splice(idx, 1);
      await syncToCloud();
      closeModal();
    }
  }
};

const closeModal = () => {
  state.modalTargetDebtor = null;
  searchQuery.value = '';
  selectedPeriod.value = ['午齋'];
  selectedCreditor.value = null;
  step.value = 1;
};
</script>
