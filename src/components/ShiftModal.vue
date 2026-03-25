<template>
  <div v-if="state.modalTargetDebtor" class="modal d-block bg-dark bg-opacity-50" tabindex="-1" style="z-index: 1050;">
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable mx-auto my-auto p-3" style="max-width: 400px;">
      <div class="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
        <div class="modal-header bg-light border-0 pb-0 d-flex flex-column align-items-start">
          <h5 class="modal-title fw-bold text-dark" :style="{ fontSize: 'var(--fs-name, 1.25rem)' }">{{ isEditing ? '修改代班安排' : '安排慈悲代班' }}</h5>
          <p class="text-muted small mt-1 mb-0" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">替 <span class="fw-bold text-warning">{{ state.modalTargetDebtor }}</span> 安排支援：</p>
        </div>
        
        <!-- Step 1: Selection -->
        <div v-if="step === 1" class="modal-body custom-scrollbar">
          <div class="mb-3">
            <label class="form-label small fw-bold text-muted mb-1" :style="{ fontSize: 'var(--fs-main, 0.85rem)' }">選擇代班時段：</label>
            <div class="d-flex flex-wrap gap-2 p-2 rounded-3 shift-period-group" :class="{ 'is-invalid': errors.time }">
              <template v-for="p in periods" :key="p">
                <input type="checkbox" class="btn-check" :id="'m-p-' + p" :value="p" v-model="selectedPeriod" autocomplete="off">
                <label class="btn btn-outline-warning btn-sm px-3 fw-bold" :for="'m-p-' + p" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">{{ p }}</label>
              </template>
            </div>
            <div v-if="errors.time" class="invalid-feedback d-block">請至少選擇一個代班時段</div>
          </div>

          <label class="form-label small fw-bold text-muted mb-1" :style="{ fontSize: 'var(--fs-main, 0.85rem)' }">選擇代班人員：</label>
          <input type="text" v-model="searchQuery" placeholder="搜尋姓名..." class="form-control shadow-none" :class="errors.staff ? 'border-danger' : 'border-secondary'" :style="{ fontSize: 'var(--fs-main, 0.95rem)' }">
          <div v-if="errors.staff" class="invalid-feedback d-block">請搜尋並點選一位代班法師</div>
          <div class="row g-2 mb-3 mt-2">
            <div v-for="m in availableMembers" :key="m" class="col-6">
              <button 
                class="btn w-100 text-truncate text-start"
                :class="selectedCreditor === m ? 'btn-warning fw-bold text-dark border-warning shadow-sm' : 'btn-outline-secondary'"
                @click="selectedCreditor = m"
                :style="{ fontSize: 'var(--fs-name, 1rem)' }">
                {{ m }}
              </button>
            </div>
          </div>

        </div>



        <!-- Step 2: Confirmation -->
        <div v-else-if="step === 2" class="modal-body">
          <div class="alert alert-warning border border-warning">
            <h6 class="fw-bold mb-3 mt-1 text-center" :style="{ fontSize: 'var(--fs-name, 1.1rem)' }">請確認代班資訊</h6>
            <div class="d-flex justify-content-between mb-2" :style="{ fontSize: 'var(--fs-main, 0.95rem)' }">
              <span class="text-muted small">正式值班：</span>
              <span class="fw-bold">{{ state.modalTargetDebtor }}</span>
            </div>
            <div class="d-flex justify-content-between mb-2" :style="{ fontSize: 'var(--fs-main, 0.95rem)' }">
              <span class="text-muted small">代班人員：</span>
              <span class="fw-bold text-success">{{ selectedCreditor }}</span>
            </div>
            <div class="d-flex justify-content-between mb-2" :style="{ fontSize: 'var(--fs-main, 0.95rem)' }">
              <span class="text-muted small">代班時段：</span>
              <span class="badge bg-dark">{{ selectedPeriod.join('、') }}</span>
            </div>
          </div>
          <p class="text-center small text-muted mb-0" :style="{ fontSize: 'var(--fs-main, 0.85rem)' }">以上資訊正確無誤嗎？</p>
        </div>

        <div class="modal-footer bg-light border-0 pt-2 border-top d-flex justify-content-between">
          <button v-if="isEditing && isAdmin" type="button" class="btn btn-outline-danger btn-sm fw-bold me-auto" @click="cancelSubstitute" :disabled="state.isSyncing" :style="{ fontSize: 'var(--fs-main, 0.85rem)' }">🗑️ 取消代班</button>
          
          <div class="d-flex gap-2 ms-auto">
            <button v-if="step === 1" type="button" class="btn btn-light text-muted fw-bold" @click="closeModal" :disabled="state.isSyncing" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">取消</button>
            <button v-if="step === 2" type="button" class="btn btn-light text-muted fw-bold" @click="step = 1" :disabled="state.isSyncing" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">返回修改</button>
            
            <button v-if="step === 1" type="button" class="btn btn-primary fw-bold" @click="goToConfirm" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">下一步：確認資訊 →</button>
            <button v-if="step === 2" type="button" class="btn btn-success fw-bold px-4 shadow-sm" @click="saveDebt" :disabled="state.isSyncing" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">✅ 確認儲存</button>
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
const selectedPeriod = ref([]);
const selectedCreditor = ref(null);
const step = ref(1);
const errors = ref({ time: false, staff: false });
const periods = ['早齋', '午齋', '藥石', '整天'];

const currentGroup = computed(() => state.groups.length ? state.groups[state.currentGroupIndex] : null);
const currentGroupMembers = computed(() => currentGroup.value?.members || []);

const existingDebt = computed(() => {
  return state.debts.find(d => !d.isSettled && d.debtor === state.modalTargetDebtor && currentGroupMembers.value.includes(d.debtor));
});
const isEditing = computed(() => !!existingDebt.value);

watch(() => state.modalTargetDebtor, (newVal) => {
  if (newVal) {
    step.value = 1;
    errors.value = { time: false, staff: false };
    if (existingDebt.value) {
      selectedCreditor.value = existingDebt.value.creditor;
      selectedPeriod.value = existingDebt.value.period.split('、');
    } else {
      selectedCreditor.value = null;
      selectedPeriod.value = [];
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

// 即時清除驗證錯誤
watch(selectedPeriod, (val) => {
  if (val.length > 0) errors.value.time = false;
});
watch(selectedCreditor, (val) => {
  if (val) errors.value.staff = false;
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
  errors.value.time = selectedPeriod.value.length === 0;
  errors.value.staff = !selectedCreditor.value;
  if (errors.value.time || errors.value.staff) return;
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
  selectedPeriod.value = [];
  selectedCreditor.value = null;
  step.value = 1;
  errors.value = { time: false, staff: false };
};
</script>

<style scoped>
/* Inline Validation */
.shift-period-group {
  border: 1.5px solid transparent;
  transition: border-color 0.2s ease;
}
.shift-period-group.is-invalid {
  border-color: var(--bs-danger, #dc3545);
  background: rgba(220, 53, 69, 0.03);
}

.invalid-feedback {
  font-size: 0.8rem;
  color: var(--bs-danger, #dc3545);
  margin-top: 4px;
  font-weight: 500;
  animation: fadeSlideIn 0.25s ease;
}

.border-danger {
  border-color: var(--bs-danger, #dc3545) !important;
}

@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
