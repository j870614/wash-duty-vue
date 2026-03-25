<template>
  <div v-if="state.editingPendingDebt" class="pde-overlay" @click.self="closeModal">
    <div class="pde-modal">
      <!-- Header -->
      <div class="pde-header">
        <h5 class="pde-title" :style="{ fontSize: 'var(--fs-name, 1.25rem)' }">安排慈悲代班 <span class="pde-title-badge">編輯模式</span></h5>
        <p class="pde-subtitle" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">
          替 <span class="pde-target-name">{{ state.editingPendingDebt?.debtor }}</span> 安排支援：
        </p>
      </div>

      <!-- Step 1: Selection -->
      <div v-if="step === 1" class="pde-body custom-scrollbar">
        <!-- Period Selection -->
        <div class="pde-section">
          <label class="pde-label" :style="{ fontSize: 'var(--fs-main, 0.85rem)' }">選擇代班時段：</label>
          <div class="pde-period-grid">
            <template v-for="p in periods" :key="p">
              <input type="checkbox" class="btn-check" :id="'pde-p-' + p" :value="p" v-model="selectedPeriod" @change="handlePeriodToggle(p)" autocomplete="off">
              <label class="pde-period-btn" :for="'pde-p-' + p" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">{{ p }}</label>
            </template>
          </div>
        </div>

        <!-- Member Selection -->
        <div class="pde-section">
          <label class="pde-label" :style="{ fontSize: 'var(--fs-main, 0.85rem)' }">選擇代班人員：</label>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="搜尋姓名..."
            class="pde-search-input"
            :style="{ fontSize: 'var(--fs-main, 0.95rem)' }"
          >
          <div class="pde-member-grid">
            <button
              v-for="m in filteredMembers"
              :key="m"
              class="pde-member-btn"
              :class="{ 'pde-member-btn--selected': selectedCreditor === m }"
              @click="selectedCreditor = m"
              :style="{ fontSize: 'var(--fs-name, 1rem)' }"
            >
              {{ m }}
            </button>
          </div>
        </div>

      </div>

      <!-- Validation Error Table (Moved outside scroll area for visibility) -->
      <div v-if="step === 1 && showErrors" class="pde-error-container-wrapper px-4">
        <div class="pde-error-card" role="alert">
          <div class="pde-error-header">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>請完成以下必填項目</span>
          </div>
          <table class="pde-error-table">
            <thead>
              <tr>
                <th>檢查項目</th>
                <th>狀態</th>
                <th>說明</th>
              </tr>
            </thead>
            <tbody>
              <tr :class="selectedPeriod.length > 0 ? 'pde-row--pass' : 'pde-row--fail'">
                <td class="pde-check-item">代班時段</td>
                <td>
                  <span v-if="selectedPeriod.length > 0" class="pde-status pde-status--pass">✅ 已選擇</span>
                  <span v-else class="pde-status pde-status--fail">❌ 未選擇</span>
                </td>
                <td class="pde-hint">{{ selectedPeriod.length > 0 ? selectedPeriod.join('、') : '請至少勾選一個時段' }}</td>
              </tr>
              <tr :class="selectedCreditor ? 'pde-row--pass' : 'pde-row--fail'">
                <td class="pde-check-item">代班人員</td>
                <td>
                  <span v-if="selectedCreditor" class="pde-status pde-status--pass">✅ 已選擇</span>
                  <span v-else class="pde-status pde-status--fail">❌ 未選擇</span>
                </td>
                <td class="pde-hint">{{ selectedCreditor ? selectedCreditor : '請搜尋並點選代班法師' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Step 2: Confirmation -->
      <div v-else-if="step === 2" class="pde-body">
        <div class="pde-confirm-card">
          <h6 class="pde-confirm-title" :style="{ fontSize: 'var(--fs-name, 1.1rem)' }">請確認代班資訊</h6>
          <div class="pde-confirm-row" :style="{ fontSize: 'var(--fs-main, 0.95rem)' }">
            <span class="pde-confirm-label">正式值班：</span>
            <span class="pde-confirm-value">{{ state.editingPendingDebt?.debtor }}</span>
          </div>
          <div class="pde-confirm-row" :style="{ fontSize: 'var(--fs-main, 0.95rem)' }">
            <span class="pde-confirm-label">代班人員：</span>
            <span class="pde-confirm-value pde-confirm-value--creditor">{{ selectedCreditor }}</span>
          </div>
          <div class="pde-confirm-row" :style="{ fontSize: 'var(--fs-main, 0.95rem)' }">
            <span class="pde-confirm-label">代班時段：</span>
            <span class="pde-confirm-badge">{{ selectedPeriod.join('、') }}</span>
          </div>
        </div>
        <p class="pde-confirm-hint" :style="{ fontSize: 'var(--fs-main, 0.85rem)' }">以上資訊正確無誤嗎？</p>
      </div>

      <!-- Footer -->
      <div class="pde-footer">
        <button v-if="step === 1" class="pde-btn pde-btn--cancel" @click="closeModal" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">取消</button>
        <button v-if="step === 2" class="pde-btn pde-btn--cancel" @click="step = 1" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">返回修改</button>

        <button v-if="step === 1" class="pde-btn pde-btn--next" @click="goToConfirm" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">下一步：確認資訊 →</button>
        <button v-if="step === 2" class="pde-btn pde-btn--save" @click="saveEdit" :disabled="state.isSyncing" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">✅ 確認儲存</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { state, syncToCloud } from '../store.js';

const periods = ['早齋', '午齋', '藥石', '整天'];
const searchQuery = ref('');
const selectedPeriod = ref([]);
const selectedCreditor = ref(null);
const step = ref(1);
const showErrors = ref(false);

// 當 editingPendingDebt 改變時，回填資料
watch(() => state.editingPendingDebt, (debt) => {
  if (debt) {
    step.value = 1;
    showErrors.value = false;
    searchQuery.value = '';

    // 回填時段
    if (debt.period) {
      const p = debt.period.split('、');
      selectedPeriod.value = [...p];
    } else {
      selectedPeriod.value = [];
    }

    // 回填代班人員
    selectedCreditor.value = debt.creditor || null;
  }
});

// 整天互斥邏輯
const handlePeriodToggle = (changedValue) => {
  const current = [...selectedPeriod.value];
  if (changedValue === '整天' && current.includes('整天')) {
    selectedPeriod.value = ['整天'];
  } else if (changedValue !== '整天' && current.includes('整天')) {
    selectedPeriod.value = current.filter(p => p !== '整天');
  } else {
    const allMeals = ['早齋', '午齋', '藥石'];
    if (allMeals.every(meal => current.includes(meal))) {
      selectedPeriod.value = ['整天'];
    }
  }
};

// 過濾人員名單
const filteredMembers = computed(() => {
  const term = searchQuery.value.trim().toLowerCase();
  const all = state.groups.flatMap(g => g.members);
  return all.filter(m => m.toLowerCase().includes(term));
});

// 驗證並進入下一步
const goToConfirm = () => {
  if (selectedPeriod.value.length === 0 || !selectedCreditor.value) {
    showErrors.value = true;
    return;
  }
  showErrors.value = false;
  step.value = 2;
};

// 儲存編輯
const saveEdit = async () => {
  if (state.isSyncing) return;
  const debt = state.editingPendingDebt;
  if (!debt) return;

  // 直接修改 state.debts 中的對應物件
  const target = state.debts.find(d => d.id === debt.id);
  if (target) {
    target.creditor = selectedCreditor.value;
    target.period = selectedPeriod.value.join('、');
  }

  await syncToCloud();
  closeModal();
};

const closeModal = () => {
  state.editingPendingDebt = null;
  searchQuery.value = '';
  selectedPeriod.value = [];
  selectedCreditor.value = null;
  step.value = 1;
  showErrors.value = false;
};
</script>

<style scoped>
/* Overlay */
.pde-overlay {
  position: fixed;
  inset: 0;
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  animation: pde-fadeIn 0.2s ease;
}

/* Modal Container */
.pde-modal {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.2);
  max-width: 420px;
  width: calc(100% - 24px);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: pde-slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Header */
.pde-header {
  padding: 20px 24px 12px;
  background: linear-gradient(135deg, #fef9f3 0%, #ffffff 100%);
  border-bottom: 1px solid #f0e8df;
}

.pde-title {
  margin: 0;
  font-weight: 800;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.pde-title-badge {
  font-size: 11px;
  font-weight: 700;
  background: linear-gradient(135deg, #fd7e14, #ff9e43);
  color: #fff;
  padding: 2px 10px;
  border-radius: 20px;
  letter-spacing: 0.5px;
}

.pde-subtitle {
  margin: 6px 0 0;
  color: #666;
}

.pde-target-name {
  font-weight: 700;
  color: #fd7e14;
}

/* Body */
.pde-body {
  padding: 16px 24px;
  overflow-y: auto;
  flex: 1;
}

.pde-section {
  margin-bottom: 20px;
}

.pde-label {
  display: block;
  font-weight: 700;
  color: #888;
  margin-bottom: 8px;
}

/* Period Buttons */
.pde-period-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pde-period-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 20px;
  border: 2px solid #fd7e14;
  border-radius: 12px;
  background: #fff;
  color: #fd7e14;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.pde-period-btn:hover {
  background: rgba(253, 126, 20, 0.06);
}

.btn-check:checked + .pde-period-btn {
  background: linear-gradient(135deg, #fd7e14, #ff9e43);
  color: #fff;
  border-color: #fd7e14;
  box-shadow: 0 4px 12px -2px rgba(253, 126, 20, 0.35);
}

/* Search Input */
.pde-search-input {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: inherit;
  margin-bottom: 12px;
}

.pde-search-input:focus {
  border-color: #fd7e14;
  box-shadow: 0 0 0 3px rgba(253, 126, 20, 0.12);
}

/* Member Grid */
.pde-member-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.pde-member-btn {
  padding: 10px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  font-family: inherit;
  color: #333;
}

.pde-member-btn:hover {
  border-color: #fd7e14;
  background: rgba(253, 126, 20, 0.04);
}

.pde-member-btn--selected {
  background: linear-gradient(135deg, #fd7e14, #ff9e43);
  color: #fff;
  border-color: #fd7e14;
  box-shadow: 0 4px 12px -2px rgba(253, 126, 20, 0.35);
  font-weight: 700;
}

.pde-error-container-wrapper {
  padding-bottom: 12px;
  background: white;
}

/* Error Card */
.pde-error-card {
  margin-top: 8px;
  border-radius: 14px;
  border: 1.5px solid #fecaca;
  background: linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%);
  overflow: hidden;
  animation: pde-shakeIn 0.4s ease;
}

.pde-error-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  font-weight: 700;
  color: #b91c1c;
  font-size: 0.9rem;
  border-bottom: 1px solid #fecaca;
  background: rgba(239, 68, 68, 0.06);
}

.pde-error-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.pde-error-table th {
  text-align: left;
  padding: 8px 12px;
  font-weight: 700;
  color: #991b1b;
  background: rgba(239, 68, 68, 0.04);
  border-bottom: 1px solid #fecaca;
  font-size: 0.8rem;
  letter-spacing: 0.5px;
}

.pde-error-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #fee2e2;
  vertical-align: middle;
}

.pde-error-table tr:last-child td {
  border-bottom: none;
}

.pde-check-item {
  font-weight: 700;
  color: #444;
}

.pde-status {
  font-weight: 700;
  white-space: nowrap;
}

.pde-status--pass {
  color: #16a34a;
}

.pde-status--fail {
  color: #dc2626;
}

.pde-hint {
  color: #666;
  font-size: 0.82rem;
}

.pde-row--pass {
  background: rgba(34, 197, 94, 0.04);
}

.pde-row--fail {
  background: rgba(239, 68, 68, 0.03);
}

/* Confirmation Card */
.pde-confirm-card {
  padding: 20px;
  border: 2px solid #fbbf24;
  border-radius: 14px;
  background: linear-gradient(135deg, #fffbeb 0%, #ffffff 100%);
}

.pde-confirm-title {
  font-weight: 800;
  text-align: center;
  margin: 0 0 16px;
  color: #1a1a1a;
}

.pde-confirm-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(251, 191, 36, 0.2);
}

.pde-confirm-row:last-of-type {
  border-bottom: none;
}

.pde-confirm-label {
  color: #888;
  font-size: 0.85em;
}

.pde-confirm-value {
  font-weight: 700;
  color: #1a1a1a;
}

.pde-confirm-value--creditor {
  color: #16a34a;
}

.pde-confirm-badge {
  font-weight: 700;
  background: #1a1a1a;
  color: #fff;
  padding: 3px 12px;
  border-radius: 20px;
  font-size: 0.85em;
}

.pde-confirm-hint {
  text-align: center;
  color: #999;
  margin: 12px 0 0;
}

/* Footer */
.pde-footer {
  padding: 14px 24px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.pde-btn {
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  font-family: inherit;
}

.pde-btn:active {
  transform: scale(0.96);
}

.pde-btn--cancel {
  background: #f0f0f0;
  color: #666;
}

.pde-btn--cancel:hover {
  background: #e0e0e0;
}

.pde-btn--next {
  flex: 1;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  font-size: 1rem;
  box-shadow: 0 4px 14px -3px rgba(59, 130, 246, 0.4);
}

.pde-btn--next:hover {
  box-shadow: 0 6px 20px -3px rgba(59, 130, 246, 0.5);
  transform: translateY(-1px);
}

.pde-btn--save {
  flex: 1;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #fff;
  box-shadow: 0 4px 14px -3px rgba(34, 197, 94, 0.4);
}

.pde-btn--save:hover {
  box-shadow: 0 6px 20px -3px rgba(34, 197, 94, 0.5);
  transform: translateY(-1px);
}

.pde-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Animations */
@keyframes pde-fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes pde-slideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes pde-shakeIn {
  0% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(5px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(2px); }
  100% { transform: translateX(0); }
}

/* Scrollbar */
.pde-body::-webkit-scrollbar {
  width: 5px;
}
.pde-body::-webkit-scrollbar-track {
  background: transparent;
}
.pde-body::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 10px;
}
</style>
