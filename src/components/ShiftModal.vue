<template>
  <div v-if="show" class="modal d-block bg-dark bg-opacity-50" tabindex="-1" style="z-index: 1050;" @click.self="closeModal">
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable mx-auto my-auto p-3" style="max-width: 400px;">
      <div class="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
        <!-- Header -->
        <div class="modal-header bg-light border-0 pb-0 d-flex flex-column align-items-start position-relative">
          <button type="button" class="btn-close position-absolute top-0 end-0 m-3" @click="closeModal" aria-label="Close"></button>
          <h5 class="modal-title fw-bold text-dark d-flex align-items-center gap-2" :style="{ fontSize: 'var(--fs-name, 1.25rem)' }">
            安排慈悲代班
            <span v-if="isEditMode" class="badge rounded-pill edit-mode-badge" style="font-size: 0.7rem; background-color: #fd7e14;">編輯模式</span>
          </h5>
          <p class="text-muted small mt-1 mb-0" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">
            替 <span class="fw-bold text-warning">{{ targetDebtor }}</span> 安排支援：
          </p>
        </div>
        
        <!-- Step 1: Selection -->
        <div v-if="step === 1" class="modal-body custom-scrollbar pt-3">
          <!-- 時段選擇 -->
          <div class="mb-4">
            <label class="form-label small fw-bold text-muted mb-2" :style="{ fontSize: 'var(--fs-main, 0.85rem)' }">選擇代班時段：</label>
            <div class="d-flex flex-wrap gap-2 p-2 rounded-3 shift-period-container" :class="{ 'is-invalid-border': errors.time }">
              <template v-for="p in periods" :key="p">
                <input type="checkbox" class="btn-check" :id="'m-p-' + p" :value="p" v-model="selectedPeriod" autocomplete="off">
                <label class="btn btn-outline-warning btn-sm px-3 fw-bold period-btn" :for="'m-p-' + p" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">{{ p }}</label>
              </template>
            </div>
            <div v-if="errors.time" class="invalid-feedback-text">請至少選擇一個代班時段</div>
          </div>

          <!-- 人員選擇 -->
          <div class="mb-3">
            <label class="form-label small fw-bold text-muted mb-2" :style="{ fontSize: 'var(--fs-main, 0.85rem)' }">選擇代班人員：</label>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="搜尋姓名..." 
              class="form-control mb-2 shadow-none search-input" 
              :class="{ 'is-invalid': errors.staff }"
              :style="{ fontSize: 'var(--fs-main, 0.95rem)' }"
            >
            <div v-if="errors.staff" class="invalid-feedback-text mb-2">請搜尋並點選一位代班法師</div>
            
            <div class="row g-2 member-grid custom-scrollbar">
              <div v-for="m in availableMembers" :key="m" class="col-6">
                <button 
                  class="btn w-100 text-truncate text-center py-2 member-btn"
                  :class="selectedCreditor === m ? 'btn-selected' : 'btn-outline-secondary'"
                  @click="selectedCreditor = m"
                  :style="{ fontSize: 'var(--fs-name, 1rem)' }">
                  {{ m }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2: Confirmation -->
        <div v-else-if="step === 2" class="modal-body pt-3">
          <div class="alert alert-warning border border-warning rounded-3 bg-opacity-10">
            <h6 class="fw-bold mb-3 mt-1 text-center" :style="{ fontSize: 'var(--fs-name, 1.1rem)' }">請確認代班資訊</h6>
            <div class="d-flex justify-content-between mb-2" :style="{ fontSize: 'var(--fs-main, 0.95rem)' }">
              <span class="text-muted small">正式值班：</span>
              <span class="fw-bold">{{ targetDebtor }}</span>
            </div>
            <div class="d-flex justify-content-between mb-2" :style="{ fontSize: 'var(--fs-main, 0.95rem)' }">
              <span class="text-muted small">代班人員：</span>
              <span class="fw-bold text-success">{{ selectedCreditor }}</span>
            </div>
            <div class="d-flex justify-content-between mb-2" :style="{ fontSize: 'var(--fs-main, 0.95rem)' }">
              <span class="text-muted small">代班時段：</span>
              <span class="badge bg-dark fw-bold">{{ selectedPeriod.join('、') }}</span>
            </div>
          </div>
          <p class="text-center small text-muted mb-0" :style="{ fontSize: 'var(--fs-main, 0.85rem)' }">以上資訊正確無誤嗎？</p>
        </div>

        <!-- Footer -->
        <div class="modal-footer bg-light border-0 pt-2 border-top d-flex justify-content-between px-3 pb-3">
          <button v-if="isEditMode && isAdmin" type="button" class="btn btn-outline-danger btn-sm fw-bold me-auto" @click="$emit('cancel', targetDebtor)" :disabled="isSyncing" :style="{ fontSize: 'var(--fs-main, 0.85rem)' }">🗑️ 取消代班</button>
          
          <div class="d-flex gap-2 ms-auto w-100 justify-content-end">
            <button v-if="step === 1" type="button" class="btn btn-light text-muted fw-bold px-3" @click="closeModal" :disabled="isSyncing" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">取消</button>
            <button v-if="step === 2" type="button" class="btn btn-light text-muted fw-bold px-3" @click="step = 1" :disabled="isSyncing" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">返回修改</button>
            
            <button v-if="step === 1" type="button" class="btn btn-primary fw-bold flex-grow-1" @click="goToConfirm" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">下一步：確認資訊 →</button>
            <button v-if="step === 2" type="button" class="btn btn-success fw-bold px-4 shadow-sm flex-grow-1" @click="handleSave" :disabled="isSyncing" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">✅ 確認儲存</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { state, isAdmin } from '../store.js';

const props = defineProps({
  show: Boolean,
  isEditMode: Boolean,
  targetDebtor: String,
  initialPeriod: { type: Array, default: () => [] },
  initialCreditor: { type: String, default: null },
  isSyncing: Boolean
});

const emit = defineEmits(['close', 'save', 'cancel']);

const searchQuery = ref('');
const selectedPeriod = ref([]);
const selectedCreditor = ref(null);
const step = ref(1);
const errors = ref({ time: false, staff: false });
const periods = ['早齋', '午齋', '藥石', '整天'];

// 當 Modal 開啟時初始化資料
watch(() => props.show, (newVal) => {
  if (newVal) {
    step.value = 1;
    errors.value = { time: false, staff: false };
    searchQuery.value = '';
    selectedPeriod.value = [...props.initialPeriod];
    selectedCreditor.value = props.initialCreditor;
  }
});

// 整天互斥邏輯
watch(() => [...selectedPeriod.value], (newVal, oldVal) => {
  if (newVal.includes('整天') && !oldVal.includes('整天')) {
    selectedPeriod.value = ['整天'];
  } else if (newVal.includes('整天') && newVal.length > 1) {
    selectedPeriod.value = newVal.filter(p => p !== '整天');
  } else {
    const allMeals = ['早齋', '午齋', '藥石'];
    if (allMeals.every(meal => newVal.includes(meal))) {
      selectedPeriod.value = ['整天'];
    }
  }
});

// 即時清除驗證錯誤
watch(() => selectedPeriod.value, (val) => {
  if (val.length > 0) errors.value.time = false;
}, { deep: true });

watch(selectedCreditor, (val) => {
  if (val) errors.value.staff = false;
});

const availableMembers = computed(() => {
  const term = searchQuery.value.trim().toLowerCase();
  const all = state.groups.flatMap(g => g.members);
  
  // 過濾掉被代班者本人
  return all.filter(m => 
    m !== props.targetDebtor && 
    m.toLowerCase().includes(term)
  );
});

const goToConfirm = () => {
  errors.value.time = selectedPeriod.value.length === 0;
  errors.value.staff = !selectedCreditor.value;
  if (errors.value.time || errors.value.staff) return;
  step.value = 2;
};

const handleSave = () => {
  emit('save', {
    debtor: props.targetDebtor,
    creditor: selectedCreditor.value,
    period: selectedPeriod.value.join('、')
  });
};

const closeModal = () => {
  if (props.isSyncing) return;
  emit('close');
};
</script>

<style scoped>
.edit-mode-badge {
  padding: 4px 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* 時段按鈕樣式 */
.period-btn {
  border: 1.5px solid #fd7e14;
  color: #fd7e14;
  border-radius: 10px;
  background: white;
  transition: all 0.2s;
}

.period-btn:hover {
  background: rgba(253, 126, 20, 0.05);
  color: #fd7e14;
}

.btn-check:checked + .period-btn {
  background: #fd7e14;
  border-color: #fd7e14;
  color: white;
  box-shadow: 0 4px 8px rgba(253, 126, 20, 0.2);
}

/* 人員按鈕樣式 */
.member-btn {
  border-radius: 10px;
  border: 1.5px solid #dee2e6;
  font-weight: 600;
}

.btn-selected {
  background: #fd7e14 !important;
  border-color: #fd7e14 !important;
  color: white !important;
  font-weight: 800;
  box-shadow: 0 4px 10px rgba(253, 126, 20, 0.2);
}

.member-grid {
  max-height: 200px;
  overflow-y: auto;
  padding: 4px;
}

/* 驗證樣式 */
.shift-period-container {
  border: 1.5px solid transparent;
  transition: all 0.2s;
}

.is-invalid-border {
  border-color: #dc3545 !important;
  background-color: rgba(220, 53, 69, 0.02);
}

.search-input.is-invalid {
  border-color: #dc3545 !important;
  border-width: 1.5px;
}

.invalid-feedback-text {
  font-size: 0.85rem;
  color: #dc3545;
  margin-top: 6px;
  font-weight: 600;
  animation: fadeInDown 0.2s ease-out;
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 自定義捲軸 */
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 10px;
}
</style>
