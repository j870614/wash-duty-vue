<template>
  <div>
    <!-- Sync Status & Action -->
    <div class="row g-3 mb-4">
      <div class="col-12 col-md-8">
        <div class="bg-white p-3 rounded-4 shadow-sm border-start border-4 border-warning d-flex flex-column flex-sm-row align-items-sm-center justify-content-between h-100 gap-3">
          <div>
            <span class="fw-bold text-dark">雲端同步狀態：</span>
            <span class="text-secondary fst-italic">{{ state.syncStatusText }}</span>
          </div>
          <div class="d-flex align-items-center gap-3 bg-warning bg-opacity-10 px-3 py-2 rounded-3 border border-warning border-opacity-25">
            <button @click="syncGroupChange(-1)" class="btn btn-sm btn-outline-warning rounded-circle fw-bold">←</button>
            <div class="text-center" style="min-width: 80px;">
              <span class="d-block text-warning fw-bold" style="font-size: 10px;">輪值組別</span>
              <span class="fs-5 fw-bold text-warning">第 {{ currentGroup?.id || '?' }} 組</span>
            </div>
            <button @click="syncGroupChange(1)" class="btn btn-sm btn-outline-warning rounded-circle fw-bold">→</button>
          </div>
        </div>
      </div>
      <div class="col-12 col-md-4">
        <button 
          @click="completeCurrentShift"
          :disabled="state.isSyncing || state.groups.length === 0"
          class="btn btn-success w-100 h-100 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 rounded-4 py-3">
          <span>{{ state.isSyncing ? '⏳' : '✨' }}</span> 
          <span>{{ state.isSyncing ? '處理中...' : '完成今日值班並切換下一組' }}</span>
        </button>
      </div>
    </div>

    <!-- Official & Compensation -->
    <div class="row g-4 mb-4">
      <div class="col-12 col-md-6">
        <div class="card h-100 shadow-sm border-0 rounded-4 overflow-hidden">
          <div class="card-header bg-light border-bottom fw-bold text-dark p-3">
            <span class="fs-5 me-2">📋</span> 今日正式值班名單
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
            <span class="fs-5 me-2">🤝</span> 今日應回饋支援人員
          </div>
          <div class="card-body p-4">
            <div v-if="compensationList.length === 0" class="text-center text-muted p-5 border rounded-3 bg-light d-flex flex-column align-items-center h-100 justify-content-center" style="border-style: dashed !important;">
              <span class="fs-1 d-block opacity-50 mb-2">✨</span>
              <p class="mb-0">今日無人需前來還班</p>
            </div>
            <div v-else class="d-flex flex-column gap-3">
              <div v-for="debt in compensationList" :key="debt.id" class="p-3 bg-warning bg-opacity-10 border border-warning border-opacity-25 rounded-3 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
                <div>
                  <div class="text-dark fw-bold fs-5" style="color: #995c00 !important;">{{ debt.debtor }}</div>
                  <div class="small mt-1 text-muted">{{ debt.dateCreated }} 由 {{ debt.creditor }} 支援</div>
                </div>
                <button class="btn btn-warning text-white fw-bold shadow-sm" :disabled="state.isSyncing" @click="settleDebt(debt.id)" style="background-color: #fd7e14; border-color: #fd7e14;">
                  ✅ 已完成回饋
                </button>
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
             <p v-if="state.history.length === 0" class="text-muted text-center py-4 fst-italic mb-0">尚無歷史紀錄</p>
             <div v-for="item in state.history" :key="item.id" class="bg-white p-3 border rounded-3 shadow-sm hover-border">
               <div class="d-flex justify-content-between mb-1">
                 <strong class="text-dark">第 {{ item.groupId }} 組</strong>
                 <span class="text-muted" style="font-size: 10px; font-family: monospace;">{{ item.date }}</span>
               </div>
               <div class="text-muted small text-truncate">值班人員：{{ item.members }}</div>
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
import { computed, watch, onMounted, nextTick } from 'vue';
import Chart from 'chart.js/auto';
import { state, syncToCloud } from '../store.js';

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
  const record = {
    id: Date.now(),
    date: new Date().toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
    groupId: currentGroup.value.id,
    members: currentGroup.value.members.join(", ")
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
