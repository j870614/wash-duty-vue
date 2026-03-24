<template>
  <div class="custom-datepicker-container">
    <div @click="openModal" class="datepicker-trigger w-100">
      <slot>
        <div class="form-control bg-white text-dark d-flex align-items-center justify-content-between" style="cursor: pointer;">
          <span>{{ displayValue || '請選擇日期' }}</span>
          <span class="text-muted small">📅</span>
        </div>
      </slot>
    </div>

    <!-- Backdrop & Modal -->
    <div v-if="isOpen" class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style="background-color: rgba(0,0,0,0.5); z-index: 1060; backdrop-filter: blur(2px);">
      <!-- Modal Content -->
      <div class="bg-white rounded-4 shadow-lg d-flex flex-column overflow-hidden position-relative" style="width: 90%; max-width: 380px; max-height: 85vh;">
        
        <!-- Header -->
        <div class="p-3 bg-light text-dark d-flex align-items-center justify-content-between border-bottom">
          <h3 class="m-0 fs-5 fw-bold mx-auto ps-4" style="color: #8b4513;">選擇日期</h3>
          <button @click="closeModal" class="btn btn-link text-muted text-decoration-none fs-4 p-0 lh-1">✕</button>
        </div>

        <!-- Weekdays -->
        <div class="d-flex bg-white text-muted p-2 border-bottom shadow-sm z-2">
          <div v-for="day in ['週日', '週一', '週二', '週三', '週四', '週五', '週六']" :key="day" class="flex-fill text-center small fw-bold">
            {{ day }}
          </div>
        </div>

        <!-- Calendar Body -->
        <div class="flex-grow-1 overflow-auto p-3 bg-white position-relative">
          <div v-for="monthData in calendarMonths" :key="monthData.key" class="mb-4">
            <div class="text-dark text-center fw-bold mb-3 fs-6" style="color: #8b4513 !important;">{{ monthData.year }}年{{ monthData.month + 1 }}月</div>
            <div class="d-flex flex-wrap">
              <template v-for="(dayObj, index) in monthData.days" :key="index">
                <div 
                  class="calendar-day-cell position-relative d-flex justify-content-center align-items-center mb-2"
                  style="width: 14.28%; height: 40px;"
                  :class="{ 
                    'in-range': isRange && isInRange(dayObj.fullDate) && dayObj.day,
                    'range-start': isRange && isStart(dayObj.fullDate) && dayObj.day,
                    'range-end': isRange && isEnd(dayObj.fullDate) && dayObj.day
                  }">
                  <!-- Background highlight for range -->
                  <div v-if="isRange && isInRange(dayObj.fullDate) && dayObj.day" class="position-absolute w-100 h-100" style="background-color: rgba(253, 126, 20, 0.15); z-index: 1;"></div>
                  <div v-if="isRange && isStart(dayObj.fullDate) && dayObj.day && tempEnd" class="position-absolute w-50 h-100 end-0" style="background-color: rgba(253, 126, 20, 0.15); z-index: 1;"></div>
                  <div v-if="isRange && isEnd(dayObj.fullDate) && dayObj.day && tempStart" class="position-absolute w-50 h-100 start-0" style="background-color: rgba(253, 126, 20, 0.15); z-index: 1;"></div>
                  
                  <!-- Day Button -->
                  <button 
                    v-if="dayObj.day"
                    class="btn p-0 rounded-circle fw-bold d-flex align-items-center justify-content-center border-0 z-2 transition-all"
                    style="width: 32px; height: 32px; font-size: 14px;"
                    :class="isSelected(dayObj.fullDate) ? 'text-white shadow-sm' : 'text-dark'"
                    :style="isSelected(dayObj.fullDate) ? 'background-color: #fd7e14 !important;' : (isToday(dayObj.fullDate) ? 'border: 1px solid #fd7e14 !important; color: #fd7e14 !important;' : '')"
                    @click="selectDate(dayObj.fullDate)"
                  >
                    {{ dayObj.day }}
                  </button>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div v-if="tempStart || tempSingle" class="p-3 bg-white text-center border-top shadow-sm mt-auto z-3">
          <div class="text-dark fw-bold mb-2 small">{{ previewText }}</div>
          <button 
            class="btn text-white w-100 fw-bold py-2 rounded-3" 
            style="background-color: #8b4513; border-color: #8b4513;"
            @click="confirmSelection"
            :disabled="isRange && (!tempStart || !tempEnd)"
          >
            確認
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';

const props = defineProps({
  modelValue: { type: [String, Array], default: '' },
  isRange: { type: Boolean, default: false }
});
const emit = defineEmits(['update:modelValue']);

const isOpen = ref(false);
const tempSingle = ref('');
const tempStart = ref('');
const tempEnd = ref('');
const todayStr = new Date().toISOString().split('T')[0];

const displayValue = computed(() => {
  if (props.isRange && Array.isArray(props.modelValue)) {
    if (props.modelValue[0] && props.modelValue[1]) {
      return `${props.modelValue[0].replace(/-/g, '/')} - ${props.modelValue[1].replace(/-/g, '/')}`;
    }
  } else if (!props.isRange && props.modelValue) {
    return props.modelValue.replace(/-/g, '/');
  }
  return '';
});

const previewText = computed(() => {
  if (props.isRange) {
    const s = tempStart.value ? tempStart.value.replace(/-/g, '/') : '開始日期';
    const e = tempEnd.value ? tempEnd.value.replace(/-/g, '/') : '結束日期';
    return `${s} - ${e}`;
  }
  return tempSingle.value ? tempSingle.value.replace(/-/g, '/') : '';
});

const openModal = () => {
  if (props.isRange && Array.isArray(props.modelValue)) {
    tempStart.value = props.modelValue[0] || '';
    tempEnd.value = props.modelValue[1] || '';
  } else {
    tempSingle.value = props.modelValue || todayStr;
  }
  isOpen.value = true;
};

const closeModal = () => {
  isOpen.value = false;
};

const confirmSelection = () => {
  if (props.isRange) {
    if (tempStart.value && tempEnd.value) {
      emit('update:modelValue', [tempStart.value, tempEnd.value]);
      closeModal();
    }
  } else {
    if (tempSingle.value) {
      emit('update:modelValue', tempSingle.value);
      closeModal();
    }
  }
};

const generateMonths = () => {
  const months = [];
  const now = new Date();
  let currentYear = now.getFullYear();
  let currentMonth = now.getMonth();
  
  // start one month ago, generate 12 months ahead
  currentMonth -= 1; 
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear -= 1;
  }

  for (let i = 0; i < 12; i++) {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
    const days = [];
    
    // empty padding
    for (let j = 0; j < firstDay; j++) {
      days.push({ day: null });
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dd = String(d).padStart(2, '0');
      const mm = String(currentMonth + 1).padStart(2, '0');
      days.push({ day: d, fullDate: `${currentYear}-${mm}-${dd}` });
    }
    
    months.push({ key: `${currentYear}-${currentMonth}`, year: currentYear, month: currentMonth, days });
    
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
  }
  return months;
};

const calendarMonths = ref([]);
onMounted(() => {
  calendarMonths.value = generateMonths();
});

const isToday = (d) => d === todayStr;

const selectDate = (dateStr) => {
  if (!props.isRange) {
    tempSingle.value = dateStr;
    return;
  }
  
  // Range selection logic
  if (!tempStart.value || (tempStart.value && tempEnd.value)) {
    tempStart.value = dateStr;
    tempEnd.value = '';
  } else {
    if (dateStr < tempStart.value) {
      tempEnd.value = tempStart.value;
      tempStart.value = dateStr;
    } else {
      tempEnd.value = dateStr;
    }
  }
};

const isSelected = (d) => {
  if (props.isRange) {
    return d === tempStart.value || d === tempEnd.value;
  }
  return d === tempSingle.value;
};

const isInRange = (d) => {
  if (!props.isRange || !tempStart.value || !tempEnd.value || !d) return false;
  return d > tempStart.value && d < tempEnd.value;
};

const isStart = (d) => props.isRange && d === tempStart.value;
const isEnd = (d) => props.isRange && d === tempEnd.value;
</script>

<style scoped>
.calendar-day-cell {
  color: #adb5bd;
}
</style>
