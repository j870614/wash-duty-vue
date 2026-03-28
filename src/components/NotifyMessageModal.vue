<template>
  <div v-if="show" class="modal d-block bg-dark bg-opacity-50" tabindex="-1" style="z-index: 1050;" @click.self="$emit('close')">
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable mx-auto my-auto p-3" style="max-width: 420px;">
      <div class="modal-content shadow-lg border-0 rounded-4 overflow-hidden">

        <!-- Header -->
        <div class="modal-header bg-light border-0 pb-0 d-flex flex-column align-items-start position-relative">
          <button type="button" class="btn-close position-absolute top-0 end-0 m-3" @click="$emit('close')" aria-label="Close"></button>
          <h5 class="modal-title fw-bold text-dark d-flex align-items-center gap-2" :style="{ fontSize: 'var(--fs-name, 1.25rem)' }">
            📣 生成提醒訊息
          </h5>
          <p class="text-muted small mt-1 mb-3" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">設定後自動生成 Line 通知訊息</p>
        </div>

        <div class="modal-body pt-3 custom-scrollbar">

          <!-- 無組別提示 -->
          <div v-if="!currentGroup" class="alert alert-warning rounded-3 text-center fw-bold">
            ⚠️ 請先設定值班組別
          </div>

          <template v-else>
            <!-- A. 日期選擇 -->
            <div class="mb-4">
              <label class="form-label small fw-bold text-muted mb-2" :style="{ fontSize: 'var(--fs-main, 0.85rem)' }">選擇日期：</label>
              <div class="d-flex gap-2 flex-wrap mb-2">
                <template v-for="opt in dateOptions" :key="opt.value">
                  <input type="radio" class="btn-check" :id="'dt-' + opt.value" :value="opt.value" v-model="dateType" autocomplete="off">
                  <label class="btn btn-outline-primary btn-sm px-3 fw-bold date-btn" :for="'dt-' + opt.value" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">{{ opt.label }}</label>
                </template>
              </div>
              <div v-if="dateType === 'custom'" class="mt-2">
                <CustomDatePicker v-model="customDate" />
              </div>
            </div>

            <!-- B. 值班組別 -->
            <div class="mb-4">
              <label class="form-label small fw-bold text-muted mb-2" :style="{ fontSize: 'var(--fs-main, 0.85rem)' }">本次值班組別：</label>
              <div class="p-3 rounded-3 border bg-light d-flex align-items-center gap-3">
                <span class="fw-bold" style="color: #8b4513; font-size: 1.1rem;">第 {{ currentGroup.id }} 組</span>
                <span class="text-muted" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">{{ currentGroup.members.join('、') }}</span>
              </div>
            </div>

            <!-- C. 時段選擇 -->
            <div class="mb-4">
              <label class="form-label small fw-bold text-muted mb-2" :style="{ fontSize: 'var(--fs-main, 0.85rem)' }">選擇時段：</label>
              <div class="d-flex flex-wrap gap-2 p-2 rounded-3 period-container">
                <template v-for="p in periods" :key="p">
                  <input type="checkbox" class="btn-check" :id="'np-' + p" :value="p" v-model="selectedPeriod" autocomplete="off">
                  <label class="btn btn-outline-warning btn-sm px-3 fw-bold period-btn" :for="'np-' + p" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">{{ p }}</label>
                </template>
              </div>
            </div>

            <!-- 訊息預覽 -->
            <div class="mb-3">
              <label class="form-label small fw-bold text-muted mb-2" :style="{ fontSize: 'var(--fs-main, 0.85rem)' }">訊息預覽：</label>
              <pre class="message-preview rounded-3 p-3 border bg-white" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">{{ generatedMessage }}</pre>
            </div>
          </template>
        </div>

        <!-- Footer -->
        <div class="modal-footer bg-light border-0 pt-2 border-top d-flex justify-content-between px-3 pb-3 gap-2">
          <button type="button" class="btn btn-light text-muted fw-bold px-3" @click="$emit('close')" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">關閉</button>
          <button
            v-if="currentGroup && selectedPeriod.length > 0 && computedDate"
            type="button"
            class="btn fw-bold px-4 flex-grow-1 copy-btn"
            :class="copied ? 'btn-success' : 'btn-primary'"
            @click="copyToClipboard"
            :style="{ fontSize: 'var(--fs-main, 0.9rem)' }"
          >
            {{ copied ? '✅ 已複製！' : '📋 一鍵複製' }}
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { state } from '../store.js';
import CustomDatePicker from './CustomDatePicker.vue';

const props = defineProps({ show: Boolean });
const emit = defineEmits(['close']);

const dateOptions = [
  { value: 'tomorrow', label: '明天' },
  { value: 'today', label: '今天' },
  { value: 'custom', label: '自由選定' },
];

const dateType = ref('tomorrow');
const customDate = ref('');
const periods = ['早齋', '午齋', '藥石', '整天'];
const selectedPeriod = ref(['整天']);
const copied = ref(false);

const currentGroup = computed(() => state.groups[state.currentGroupIndex]);

const computedDate = computed(() => {
  if (dateType.value === 'today') {
    return new Date();
  }
  if (dateType.value === 'tomorrow') {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  }
  if (customDate.value) {
    // customDate is YYYY-MM-DD
    const [y, m, d] = customDate.value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return null;
});

const datePrefix = computed(() => {
  if (dateType.value === 'today') return '今天';
  if (dateType.value === 'tomorrow') return '明天';
  return '';
});

const formattedDate = computed(() => {
  const d = computedDate.value;
  if (!d) return '';
  return `${d.getMonth() + 1}/${d.getDate()}`;
});

const dateString = computed(() => {
  if (!formattedDate.value) return '';
  if (datePrefix.value) return `${datePrefix.value} ${formattedDate.value}`;
  return formattedDate.value;
});

const periodDescription = computed(() => {
  const p = selectedPeriod.value;
  if (!p.length) return '';
  const allMeals = ['早齋', '午齋', '藥石'];
  if (p.includes('整天') || allMeals.every(m => p.includes(m))) {
    return '三餐：早齋、午齋、藥石用齋完畢即需要洗餐盤';
  }
  const selected = allMeals.filter(m => p.includes(m));
  if (selected.length === 1) return `${selected[0]}用齋完畢即需要洗餐盤`;
  return `${selected.join('、')}用齋完畢即需要洗餐盤`;
});

const generatedMessage = computed(() => {
  if (!currentGroup.value) return '';
  const g = currentGroup.value;
  return `${dateString.value} 需要法師支援洗碗

本次輪到：第${g.id}組 ${g.members.join('、')}

時段：${periodDescription.value}

如需要查看班表，可進入洗碗支援排班系統查閱：
https://j870614.github.io/wash-duty-vue/`;
});

// 整天互斥邏輯（同 ShiftModal）
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

watch(() => props.show, (val) => {
  if (val) {
    dateType.value = 'tomorrow';
    customDate.value = '';
    selectedPeriod.value = ['整天'];
    copied.value = false;
  }
});

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(generatedMessage.value);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2500);
  } catch {
    // fallback for older browsers
    const el = document.createElement('textarea');
    el.value = generatedMessage.value;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2500);
  }
};
</script>

<style scoped>
.date-btn {
  border-radius: 10px;
  border: 1.5px solid #0d6efd;
  color: #0d6efd;
  background: white;
  transition: all 0.2s;
}
.btn-check:checked + .date-btn {
  background: #0d6efd;
  border-color: #0d6efd;
  color: white;
  box-shadow: 0 4px 8px rgba(13, 110, 253, 0.2);
}
.period-btn {
  border: 1.5px solid #fd7e14;
  color: #fd7e14;
  border-radius: 10px;
  background: white;
  transition: all 0.2s;
}
.btn-check:checked + .period-btn {
  background: #fd7e14;
  border-color: #fd7e14;
  color: white;
  box-shadow: 0 4px 8px rgba(253, 126, 20, 0.2);
}
.period-container {
  border: 1.5px solid transparent;
}
.message-preview {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  line-height: 1.7;
  background: #f8f9fa;
  color: #333;
  min-height: 120px;
}
.copy-btn {
  transition: all 0.2s;
}
.custom-scrollbar::-webkit-scrollbar { width: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #ddd; border-radius: 10px; }
</style>
