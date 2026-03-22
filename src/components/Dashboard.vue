<template>
  <div>
    <!-- Sync Status -->
    <div class="text-end mb-2 small text-muted fst-italic">
      雲端同步狀態：{{ state.syncStatusText }}
    </div>

    <!-- Top Bar: Current Shift & Admin Actions -->
    <div class="row g-3 mb-4">
      <div :class="isAdmin ? 'col-12 col-md-8' : 'col-12'">
        <!-- Giant Shift Indicator -->
        <div class="bg-white p-4 rounded-4 shadow-sm border-start border-5 h-100 d-flex flex-column flex-sm-row align-items-center justify-content-center gap-4" style="border-color: #8b4513 !important;">
          <button v-if="isAdmin" @click="syncGroupChange(-1)" class="btn btn-outline-secondary rounded-circle fw-bold fs-4 p-0 d-flex align-items-center justify-content-center flex-shrink-0" style="width: 48px; height: 48px;">←</button>
          
          <div class="text-center d-flex flex-column align-items-center justify-content-center">
            <span class="d-block fw-bold text-muted mb-2" style="letter-spacing: 4px; font-size: 14px;">當前輪值組別</span>
            <span class="fw-bold" style="font-size: 3.5rem; line-height: 1; color: #8b4513;">第 {{ currentGroup?.id || '?' }} 組</span>
          </div>
          
          <button v-if="isAdmin" @click="syncGroupChange(1)" class="btn btn-outline-secondary rounded-circle fw-bold fs-4 p-0 d-flex align-items-center justify-content-center flex-shrink-0" style="width: 48px; height: 48px;">→</button>
        </div>
      </div>
      
      <div v-if="isAdmin" class="col-12 col-md-4">
        <button 
          @click="completeCurrentShift"
          :disabled="state.isSyncing || state.groups.length === 0"
          class="btn btn-success w-100 h-100 fw-bold shadow-sm d-flex flex-column align-items-center justify-content-center gap-2 rounded-4 py-3">
          <span class="fs-2">{{ state.isSyncing ? '⏳' : '✨' }}</span> 
          <span class="fs-5">{{ state.isSyncing ? '處理中...' : '完成本次值班' }}</span>
          <span class="small text-white-50">自動紀錄並切換下一組</span>
        </button>
      </div>
    </div>

    <!-- Official & Compensation -->
    <div class="row g-4 mb-4">
      <div class="col-12 col-md-6">
        <div class="card h-100 shadow-sm border-0 rounded-4 overflow-hidden">
          <div class="card-header bg-light border-bottom fw-bold text-dark p-3">
            <span class="fs-5 me-2">📋</span> 本次正式值班名單
          </div>
          <div class="card-body d-flex flex-column gap-3 p-4">
            <div v-for="member in currentGroup?.members" :key="member" class="d-flex justify-content-between align-items-center p-3 bg-white rounded-3 border">
              <span class="fw-bold d-flex align-items-center gap-2 text-dark">
                <span class="badge bg-secondary bg-opacity-25 text-dark rounded-circle p-2">👤</span> {{ member }}
              </span>
              <button class="btn btn-sm btn-outline-secondary fw-bold bg-white" @click="state.modalTargetDebtor = member">
                ➕ 安排代班
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-6">
        <div class="card h-100 shadow-sm border-0 rounded-4 overflow-hidden">
          <div class="card-header bg-warning bg-opacity-10 border-bottom border-warning border-opacity-25 fw-bold p-3 text-warning-emphasis">
            <span class="fs-5 me-2">🤝</span> 本次應回饋支援人員
          </div>
          <div class="card-body p-4">
            <div v-if="compensationList.length === 0" class="text-center text-muted p-5 border rounded-3 bg-light d-flex flex-column align-items-center h-100 justify-content-center" style="border-style: dashed !important;">
              <span class="fs-1 d-block opacity-50 mb-2">✨</span>
              <p class="mb-0">本次無人需前來還班</p>
            </div>
            <div v-else class="d-flex flex-column gap-3">
              <div v-for="debt in compensationList" :key="debt.id" class="p-3 bg-warning bg-opacity-10 border border-warning border-opacity-25 rounded-3 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
                <div>
                  <div class="text-dark fw-bold fs-5" style="color: #995c00 !important;">{{ debt.debtor }}</div>
                  <div class="small mt-1 text-muted">{{ debt.dateCreated }} 由 {{ debt.creditor }} 支援</div>
                </div>
                <button v-if="isAdmin" class="btn btn-warning text-white fw-bold shadow-sm" :disabled="state.isSyncing" @click="settleDebt(debt.id)" style="background-color: #fd7e14; border-color: #fd7e14;">
                  ✅ 已完成回饋
                </button>
                <div v-else class="badge bg-warning text-dark bg-opacity-25 border border-warning border-opacity-50 p-2 opacity-75">
                  ⏱ 待回饋
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts & Logs -->
    <div class="row g-4 mb-4">
      <div class="col-12 col-lg-8">
        <div class="card shadow-sm border-0 rounded-4 p-4 h-100">
          <h2 class="h5 fw-bold text-dark mb-4"><span class="fs-4 me-2">📊</span> 互助與值班數據統計</h2>
          <div style="height: 300px; position: relative;" class="w-100">
            <canvas id="debtStatsChart"></canvas>
          </div>
        </div>
      </div>
      <div class="col-12 col-lg-4">
        <div class="card shadow-sm border-0 rounded-4 h-100 d-flex flex-column overflow-hidden">
          <div class="card-header bg-dark text-white d-flex justify-content-between align-items-center p-3 border-0">
             <h2 class="h6 fw-bold mb-0"><span class="me-2">📜</span>最近 5 筆紀錄</h2>
             <span class="badge bg-secondary rounded-pill">{{ state.history.length }}/5</span>
          </div>
          <div class="card-body bg-light flex-grow-1 overflow-auto p-3 d-flex flex-column gap-2" style="background-color: #f8f9fa;">
             <div v-for="item in state.history" :key="item.id" class="mb-2">
               <!-- 編輯模式 -->
               <div v-if="editingHistoryId === item.id" class="bg-white p-3 border border-warning rounded-3 shadow-sm">
                 <div class="mb-2">
                   <label class="form-label small text-muted mb-1">值班日期</label>
                   <input type="date" v-model="editData.date" class="form-control form-control-sm focus-ring focus-ring-warning">
                 </div>
                 <div class="mb-2">
                   <label class="form-label small text-muted mb-1">值班人員</label>
                   <input v-model="editData.members" class="form-control form-control-sm focus-ring focus-ring-warning">
                 </div>
                 <div class="mb-2">
                   <label class="form-label small text-muted mb-1">實際代班 (若無可留空)</label>
                   <div class="input-group input-group-sm mb-2">
                     <input v-model="editData.substitutes" class="form-control focus-ring focus-ring-warning" placeholder="例如：某某某">
                   </div>
                   <label class="form-label small text-muted mb-1">代班時段 (多選)</label>
                   <div class="d-flex flex-wrap gap-1">
                     <template v-for="p in ['早齋', '午齋', '藥食', '整天']" :key="p">
                       <input type="checkbox" class="btn-check" :id="'p-' + p" :value="p" v-model="editData.shiftPeriods" autocomplete="off">
                       <label class="btn btn-outline-warning btn-sm py-0 px-2 fw-bold" :for="'p-' + p">{{ p }}</label>
                     </template>
                   </div>
                 </div>
                 <div class="d-flex justify-content-end gap-2 mt-3">
                   <button class="btn btn-sm btn-light border fw-bold" @click="editingHistoryId = null" :disabled="state.isSyncing">取消</button>
                   <button class="btn btn-sm btn-warning fw-bold text-dark" @click="saveHistory(item)" :disabled="state.isSyncing">💾 儲存</button>
                 </div>
               </div>

               <!-- 檢視模式 -->
               <div v-else class="bg-white p-3 border rounded-3 shadow-sm hover-border h-100">
                 <div class="d-flex justify-content-between align-items-center mb-2">
                   <strong class="text-dark fs-6" style="color: #8b4513 !important;">第 {{ item.groupId }} 組</strong>
                   <div class="d-flex align-items-center gap-2">
                     <span class="text-muted" style="font-size: 11px; font-family: monospace;">{{ item.date }}</span>
                     <button v-if="isAdmin" @click="startEditHistory(item)" class="btn btn-sm btn-link text-decoration-none p-0 text-secondary" title="編輯這筆紀錄">✏️</button>
                   </div>
                 </div>
                 <div class="text-secondary small">輪值名單：{{ item.members }}</div>
                 <div v-if="item.substitutes" class="small mt-2 px-2 py-1 bg-warning bg-opacity-10 text-dark rounded border border-warning" style="border-style: dashed !important;">
                   <span class="fw-bold">🔀 實際代班：</span>{{ item.substitutes }}
                   <span v-if="item.shiftPeriods?.length" class="ms-1 text-muted">({{ item.shiftPeriods.join('、') }})</span>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>

    <!-- pending debts -->
    <section class="card shadow-sm border-0 rounded-4 p-4">
      <h2 class="h5 fw-bold text-dark mb-4"><span class="fs-4 me-2">📝</span> 待圓滿互助紀錄清單</h2>
      <div class="row g-3">
        <div v-if="pendingDebts.length === 0" class="col-12 text-center text-muted fst-italic py-4">目前無待圓滿的互助紀錄。</div>
        <div v-for="d in pendingDebts" :key="d.id" class="col-12 col-sm-6 col-md-4">
          <div class="p-3 bg-light border rounded-3 d-flex justify-content-between align-items-center shadow-sm">
            <div class="d-flex align-items-center gap-2">
              <span class="fw-bold" style="color: #fd7e14;">{{ d.debtor }}</span>
              <span class="text-muted" style="font-size: 10px;">←支援─</span>
              <span class="fw-bold text-success">{{ d.creditor }}</span>
            </div>
            <span class="text-muted" style="font-size: 10px;">{{ d.dateCreated }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, watch, onMounted, nextTick, ref, reactive } from 'vue';
import Chart from 'chart.js/auto';
import { state, syncToCloud, isAdmin } from '../store.js';

const editingHistoryId = ref(null);
const editData = reactive({ date: '', members: '', substitutes: '', shiftPeriods: [] });

const startEditHistory = (item) => {
  editingHistoryId.value = item.id;
  
  // 嘗試標準化日期格式供 <input type="date"> 使用
  let d = item.date || '';
  if (d && !d.includes('-')) {
    // 如果是舊格式 "MM/DD HH:mm" 或其他，嘗試轉為今年 YYYY-MM-DD
    const year = new Date().getFullYear();
    const match = d.match(/(\d{1,2})\/(\d{1,2})/);
    if (match) {
      const m = match[1].padStart(2, '0');
      const day = match[2].padStart(2, '0');
      d = `${year}-${m}-${day}`;
    }
  }
  
  editData.date = d;
  editData.members = item.members || '';
  editData.substitutes = item.substitutes || '';
  editData.shiftPeriods = Array.isArray(item.shiftPeriods) ? [...item.shiftPeriods] : [];
};

const saveHistory = async (item) => {
  item.date = editData.date.trim();
  item.members = editData.members.trim();
  item.substitutes = editData.substitutes.trim();
  item.shiftPeriods = [...editData.shiftPeriods];
  await syncToCloud();
  editingHistoryId.value = null;
};

const currentGroup = computed(() => state.groups[state.currentGroupIndex]);
const pendingDebts = computed(() => state.debts.filter(d => !d.isSettled));
const compensationList = computed(() => {
  if (!currentGroup.value) return [];
  return pendingDebts.value.filter(d => currentGroup.value.members.includes(d.creditor));
});

const syncGroupChange = async (step) => {
  if (state.isSyncing || state.groups.length === 0) return;
  let newIndex = state.currentGroupIndex + step;
  if (newIndex < 0) newIndex = state.groups.length - 1;
  if (newIndex >= state.groups.length) newIndex = 0;
  state.currentGroupIndex = newIndex;
  await syncToCloud();
};

const completeCurrentShift = async () => {
  if (state.isSyncing || state.groups.length === 0) return;
  
  // 自動找出此組別的代班法師 (自己是 debtor, 別人是 creditor 且尚未圓滿)
  const currentSubs = state.debts
    .filter(d => !d.isSettled && currentGroup.value.members.includes(d.debtor))
    .map(d => d.creditor);
    
  const record = {
    id: Date.now(),
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    groupId: currentGroup.value.id,
    members: currentGroup.value.members.join(", "),
    substitutes: [...new Set(currentSubs)].join(", "),
    shiftPeriods: []
  };
  state.history.unshift(record);
  if (state.history.length > 5) state.history = state.history.slice(0, 5);
  state.currentGroupIndex = (state.currentGroupIndex + 1) % state.groups.length;
  await syncToCloud();
};

const settleDebt = async (debtId) => {
  if (state.isSyncing) return;
  const d = state.debts.find(d => d.id === debtId);
  if (d) {
    d.isSettled = true;
    await syncToCloud();
  }
};

let chartInstance = null;

const updateChart = () => {
  const canvas = document.getElementById('debtStatsChart');
  if (!canvas) return;
  
  const allMembers = state.groups.flatMap(g => g.members);
  const stats = {};
  allMembers.forEach(m => stats[m] = { helped: 0, owed: 0 });
  state.debts.forEach(d => {
    if (!d.isSettled) {
      if (stats[d.creditor]) stats[d.creditor].helped += 1;
      if (stats[d.debtor]) stats[d.debtor].owed += 1;
    }
  });
  const activeMembers = allMembers.filter(m => stats[m].helped > 0 || stats[m].owed > 0);
  
  if (chartInstance) {
    chartInstance.data.labels = activeMembers;
    chartInstance.data.datasets[0].data = activeMembers.map(m => stats[m].helped);
    chartInstance.data.datasets[1].data = activeMembers.map(m => stats[m].owed);
    chartInstance.update();
  } else {
    chartInstance = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: activeMembers,
        datasets: [
          { label: '布施支援次數', data: activeMembers.map(m => stats[m].helped), backgroundColor: 'rgba(25, 135, 84, 0.8)' },
          { label: '待還回饋次數', data: activeMembers.map(m => stats[m].owed), backgroundColor: 'rgba(255, 193, 7, 0.8)' }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } } } }
    });
  }
};

watch(() => [state.groups, state.debts], () => {
  nextTick(updateChart);
}, { deep: true });

onMounted(() => {
  nextTick(updateChart);
});
</script>
