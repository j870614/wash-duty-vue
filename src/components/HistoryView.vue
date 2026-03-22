<template>
  <div class="card shadow-sm border-0 rounded-4 overflow-hidden">
    <div class="card-header bg-dark text-white p-4">
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div>
          <h2 class="h4 fw-bold mb-1">📜 完整值班紀錄</h2>
          <p class="mb-0 text-white-50 small">查詢與管理歷年值班與互助資料</p>
        </div>
        <div class="d-flex gap-2">
          <button @click="state.activeTab = 'dashboard'" class="btn btn-outline-light btn-sm fw-bold">← 返回報到頁</button>
        </div>
      </div>
    </div>

    <div class="card-body p-4 bg-light">
      <!-- Filters -->
      <div class="row g-3 mb-4 align-items-end">
        <div class="col-12 col-md-6">
          <label class="form-label small fw-bold text-muted mb-2">📅 查詢日期區間 (從 ~ 到)</label>
          <div class="d-flex align-items-center gap-2 bg-white p-2 rounded-3 border shadow-sm">
            <input 
              type="date" 
              v-model="startDate" 
              class="form-control border-0 shadow-none bg-transparent"
              style="cursor: pointer;"
            />
            <span class="text-muted">➔</span>
            <input 
              type="date" 
              v-model="endDate" 
              class="form-control border-0 shadow-none bg-transparent"
              style="cursor: pointer;"
            />
          </div>
        </div>
        <div class="col-6 col-md-2">
          <button @click="setQuickRange('month')" class="btn btn-outline-warning w-100 btn-sm fw-bold border-2">最近一個月</button>
        </div>
        <div class="col-6 col-md-2">
          <button @click="setQuickRange('year')" class="btn btn-outline-warning w-100 btn-sm fw-bold border-2">最近一年</button>
        </div>
        <div class="col-12 col-md-2">
          <div class="input-group input-group-sm mb-0">
            <span class="input-group-text bg-white border-end-0">🔍</span>
            <input type="text" v-model="searchQuery" class="form-control border-start-0 ps-0" placeholder="搜尋...">
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="table-responsive rounded-3 border bg-white shadow-sm">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th style="width: 120px;">日期</th>
              <th style="width: 100px;">組別</th>
              <th>正式值班人員</th>
              <th>代班紀錄</th>
              <th v-if="isAdmin" style="width: 100px;" class="text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredHistory.length === 0">
              <td colspan="5" class="text-center py-5 text-muted fst-italic">
                沒有符合條件的紀錄
              </td>
            </tr>
            <tr v-for="item in filteredHistory" :key="item.id">
              <td class="small fw-bold text-secondary">{{ item.date }}</td>
              <td><span class="badge bg-secondary bg-opacity-10 text-dark border">第 {{ item.groupId }} 組</span></td>
              <td class="small">{{ item.members }}</td>
              <td>
                <div v-if="item.substitutesList && item.substitutesList.length">
                  <div v-for="(sub, idx) in item.substitutesList" :key="idx" class="small mb-1">
                    <span class="fw-bold text-warning-emphasis">{{ sub.creditor }}</span>
                    <span class="text-muted mx-1">代</span>
                    <span class="fw-bold text-dark">{{ sub.debtor }}</span>
                    <span class="badge bg-light text-muted ms-1 border">{{ sub.period }}</span>
                  </div>
                </div>
                <div v-else-if="item.substitutes" class="small text-muted">
                  {{ item.substitutes }}
                </div>
                <div v-else class="small text-white-50">—</div>
              </td>
              <td v-if="isAdmin" class="text-center">
                <button @click="deleteRecord(item.id)" class="btn btn-sm btn-outline-danger border-0 p-1" title="刪除紀錄">
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="mt-3 text-muted small">
        共顯示 {{ filteredHistory.length }} / {{ state.history.length }} 筆紀錄
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { state, isAdmin, syncToCloud } from '../store.js';

const startDate = ref('');
const endDate = ref('');
const searchQuery = ref('');

const setQuickRange = (type) => {
  const now = new Date();
  const start = new Date();
  if (type === 'month') {
    start.setMonth(start.getMonth() - 1);
  } else if (type === 'year') {
    start.setFullYear(start.getFullYear() - 1);
  }
  
  startDate.value = start.toISOString().split('T')[0];
  endDate.value = now.toISOString().split('T')[0];
};

const filteredHistory = computed(() => {
  let list = state.history;

  // Date Filter
  if (startDate.value) {
    list = list.filter(item => item.date >= startDate.value);
  }
  if (endDate.value) {
    list = list.filter(item => item.date <= endDate.value);
  }

  // Search Filter
  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    list = list.filter(item => 
      item.members.toLowerCase().includes(q) || 
      item.substitutes?.toLowerCase().includes(q) ||
      `第 ${item.groupId} 組`.includes(q)
    );
  }

  return list;
});

const deleteRecord = async (id) => {
  showConfirm('刪除紀錄', '確定要刪除這筆值班紀錄嗎？', async () => {
    const index = state.history.findIndex(h => h.id === id);
    if (index !== -1) {
      state.history.splice(index, 1);
      await syncToCloud();
    }
  });
};
</script>

<style scoped>
.table th { font-weight: 600; font-size: 0.85rem; }
.badge { font-weight: 500; }
</style>
