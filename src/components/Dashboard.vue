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
        <div class="bg-white p-3 p-sm-4 rounded-4 shadow-sm border-start border-5 h-100 d-flex flex-row align-items-center justify-content-center gap-2 gap-sm-4" style="border-color: #8b4513 !important;">
          <button v-if="isAdmin" @click="syncGroupChange(-1)" class="btn btn-outline-secondary rounded-circle fw-bold fs-4 p-0 d-flex align-items-center justify-content-center flex-shrink-0" style="width: 44px; height: 44px;">←</button>
          
          <div class="text-center d-flex flex-column align-items-center justify-content-center mx-1 mx-sm-0">
            <span class="d-block fw-bold text-muted mb-1 mb-sm-2" style="letter-spacing: 2px; font-size: 13px;">當前輪值組別</span>
            <span class="fw-bold" style="font-size: 2.8rem; line-height: 1; color: #8b4513;">第 {{ currentGroup?.id || '?' }} 組</span>
          </div>
          
          <button v-if="isAdmin" @click="syncGroupChange(1)" class="btn btn-outline-secondary rounded-circle fw-bold fs-4 p-0 d-flex align-items-center justify-content-center flex-shrink-0" style="width: 44px; height: 44px;">→</button>
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
        <div class="card shadow-sm border-0 rounded-4 overflow-hidden transition-all hover-border h-100">
          <div class="card-header bg-white border-0 p-4 pb-2" style="background: linear-gradient(135deg, #fff5ec 0%, #ffffff 100%);">
            <div class="d-flex align-items-center fw-bold text-dark" :style="{ fontSize: 'var(--fs-name, 1.25rem)' }">
              <span class="fs-5 me-2">📋</span> 本次正式值班名單
            </div>
          </div>
          <div class="card-body d-flex flex-column gap-3 p-4">
            <div v-for="member in currentGroup?.members" :key="member" class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center p-3 bg-white rounded-3 border gap-3">
              <div class="w-100">
                <span class="fw-bold d-flex align-items-center gap-2 text-dark" :style="{ fontSize: 'var(--fs-name, 1rem)' }">
                  <span class="badge bg-secondary bg-opacity-25 text-dark rounded-circle p-2">👤</span> {{ member }}
                </span>
                <div v-if="getActiveSubstitute(member)" class="mt-2 text-muted px-2 py-1 bg-light rounded-2 border ms-4" :style="{ fontSize: 'var(--fs-main, 0.9rem)', display: 'inline-block' }">
                  <span class="fw-bold text-success">{{ getActiveSubstitute(member).creditor }}</span> 代 {{ member }}
                  <span class="badge bg-white text-dark border ms-2">{{ getActiveSubstitute(member).period }}</span>
                </div>
              </div>
              <div class="w-100 d-sm-flex justify-content-sm-end" style="max-width: fit-content; min-width: 100px;" :class="{ 'ms-auto': false }"> 
                <!-- 在手機版按鈕佔全寬，sm以上自適應 -->
                <button v-if="getActiveSubstitute(member)" class="btn btn-sm btn-outline-primary fw-bold bg-white w-100" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }" @click="state.modalTargetDebtor = member">
                  ✏️ 編輯代班
                </button>
                <button v-else class="btn btn-sm btn-outline-secondary fw-bold bg-white w-100" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }" @click="state.modalTargetDebtor = member">
                  ➕ 安排代班
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-6">
        <div class="card shadow-sm border-0 rounded-4 overflow-hidden transition-all hover-border h-100">
          <div class="card-header border-0 p-4 pb-2" style="background: linear-gradient(135deg, #fff9db 0%, #ffffff 100%);">
            <div class="d-flex align-items-center fw-bold text-dark" :style="{ fontSize: 'var(--fs-name, 1.25rem)' }">
              <span class="fs-5 me-2">✨</span> 本次應回饋支援人員
            </div>
          </div>
          <div class="card-body p-4">
            <div v-if="compensationList.length === 0" class="text-center text-muted p-5 border rounded-3 bg-light d-flex flex-column align-items-center h-100 justify-content-center" style="border-style: dashed !important;">
              <span class="fs-1 d-block opacity-50 mb-2">✨</span>
              <p class="mb-0">本次無人需前來還班</p>
            </div>
            <div v-else class="d-flex flex-column gap-3">
              <div v-for="debt in compensationList" :key="debt.id" class="p-3 bg-warning bg-opacity-10 border border-warning border-opacity-25 rounded-3 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
                <div>
                  <div class="fw-bold" style="color: #995c00;" :style="{ fontSize: 'var(--fs-name, 1rem)' }">{{ debt.debtor }}</div>
                  <div class="mt-1 text-muted" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">{{ debt.dateCreated }} 由 {{ debt.creditor }} 支援</div>
                </div>
                <button v-if="isAdmin" class="btn btn-warning text-white fw-bold shadow-sm" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }" :disabled="state.isSyncing" @click="settleDebt(debt.id)" style="background-color: #fd7e14; border-color: #fd7e14;">
                  ✅ 已完成回饋
                </button>
                <div v-else class="badge bg-warning text-dark bg-opacity-25 border border-warning border-opacity-50 p-2 opacity-75" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">
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
        <div class="card shadow-sm border-0 rounded-4 p-4 h-100 transition-all hover-border">
          <h2 class="h5 fw-bold text-dark mb-4" :style="{ fontSize: 'var(--fs-name, 1.25rem)' }"><span class="fs-4 me-2">📊</span> 互助與值班數據統計</h2>
          <div style="height: 300px; position: relative;" class="w-100">
            <canvas id="debtStatsChart"></canvas>
          </div>
        </div>
      </div>
      <div class="col-12 col-lg-4">
        <div class="card shadow-sm border-0 rounded-4 h-100 d-flex flex-column overflow-hidden transition-all hover-border">
          <div class="card-header bg-dark text-white d-flex justify-content-between align-items-center p-3 border-0" style="background: linear-gradient(135deg, #212529 0%, #424951 100%);">
             <h2 class="h6 fw-bold mb-0" :style="{ fontSize: 'var(--fs-name, 1rem)' }"><span class="me-2">📜</span>最近 5 筆紀錄</h2>
             <button @click="state.activeTab = 'history'" class="btn btn-sm btn-outline-light border-0 py-0 px-2 fw-bold" style="font-size: 11px;">查看更多 →</button>
          </div>
          <div class="card-body bg-light flex-grow-1 overflow-auto p-3 d-flex flex-column gap-2 custom-scrollbar" style="background-color: #f8f9fa;">
             <div v-for="item in state.history.slice(0, 5)" :key="item.id" class="mb-2">
               <!-- 編輯模式 -->
               <div v-if="editingHistoryId === item.id" class="bg-white p-3 border border-warning rounded-4 shadow-sm">
                 <div class="mb-3">
                   <label class="form-label small text-muted mb-1 fw-bold">📅 值班日期</label>
                   <CustomDatePicker v-model="editData.date" />
                 </div>
                 
                 <!-- 值班組別卡片 -->
                 <div class="mb-3">
                   <label class="form-label small text-muted mb-1 fw-bold">👥 值班組別</label>
                   <div class="d-flex align-items-center justify-content-between p-2 border rounded-3 bg-light shadow-sm">
                     <button @click="changeEditGroup(-1)" class="btn btn-sm btn-outline-secondary py-0 px-2 fw-bold text-dark border-0 fs-5">←</button>
                     <div class="text-center">
                       <span class="fw-bold d-block fs-6 mb-1" style="color: #8b4513;">第 {{ editData.groupId }} 組</span>
                       <span class="small text-muted">{{ getGroupMembers(editData.groupId) }}</span>
                     </div>
                     <button @click="changeEditGroup(1)" class="btn btn-sm btn-outline-secondary py-0 px-2 fw-bold text-dark border-0 fs-5">→</button>
                   </div>
                 </div>

                 <!-- 代班按鈕與顯示 -->
                 <div class="mb-3">
                   <div class="d-flex justify-content-between align-items-center mb-2">
                     <label class="form-label small text-muted mb-0 fw-bold">🔀 代班紀錄</label>
                     <button @click="openSubEditModal" class="btn btn-sm btn-outline-primary py-0 px-3 rounded-pill fw-bold shadow-sm border-2">✏️ 安排代班</button>
                   </div>
                   <div class="p-2 border rounded-3 bg-light shadow-sm">
                     <div v-if="editData.substitutesList && editData.substitutesList.length > 0" class="d-flex flex-column gap-2">
                       <div v-for="(sub, i) in editData.substitutesList" :key="i" class="small bg-white p-2 border rounded-3 d-flex flex-column justify-content-center align-items-center shadow-sm text-center">
                         <div class="fw-bold d-flex align-items-center gap-2" :style="{ fontSize: 'var(--fs-name, 1rem)' }">
                           <span class="text-success fs-6">{{ sub.creditor }}</span> 
                           <span class="text-muted" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">支援</span> 
                           <span class="text-dark fs-6">{{ sub.debtor }}</span>
                         </div>
                         <div class="mt-1">
                           <span class="badge bg-warning bg-opacity-25 text-dark border border-warning" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">{{ sub.period }}</span>
                         </div>
                       </div>
                     </div>
                     <div v-else class="text-center small text-muted py-3 fst-italic">— 無代班紀錄 —</div>
                   </div>
                 </div>

                 <div class="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                   <button class="btn btn-light border fw-bold px-4 rounded-3 shadow-sm" @click="editingHistoryId = null" :disabled="state.isSyncing">取消</button>
                   <button class="btn btn-warning fw-bold text-dark px-4 shadow-sm rounded-3" @click="saveHistory(item)" :disabled="state.isSyncing">💾 儲存</button>
                 </div>
               </div>

               <!-- 檢視模式 -->
               <div v-else class="bg-white p-3 border rounded-3 shadow-sm hover-border h-100">
                 <div class="d-flex justify-content-between align-items-center mb-2">
                   <strong class="text-dark fs-6" style="color: #8b4513 !important;" :style="{ fontSize: 'var(--fs-name, 1rem)' }">第 {{ item.groupId }} 組</strong>
                   <div class="d-flex align-items-center gap-2">
                     <span class="text-muted" style="font-family: monospace;" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">{{ item.date }}</span>
                     <button v-if="isAdmin" @click="startEditHistory(item)" class="btn btn-sm btn-link text-decoration-none p-0 text-secondary" title="編輯這筆紀錄" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">✏️</button>
                   </div>
                 </div>
                 <div class="text-secondary" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">輪值名單：{{ item.members }}</div>
                 <div v-if="item.substitutes" class="mt-2 px-2 py-1 bg-warning bg-opacity-10 text-dark rounded border border-warning" style="border-style: dashed !important;" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">
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
    <section class="card shadow-sm border-0 rounded-4 p-4 transition-all hover-border">
      <h2 class="h5 fw-bold text-dark mb-4" :style="{ fontSize: 'var(--fs-name, 1.25rem)' }"><span class="fs-4 me-2">📝</span> 待圓滿互助紀錄清單</h2>
      <div class="row g-3">
        <div v-if="pendingDebts.length === 0" class="col-12 text-center text-muted fst-italic py-4">目前無待圓滿的互助紀錄。</div>
        <div v-for="d in pendingDebts" :key="d.id" class="col-12 col-sm-6 col-lg-4">
          <div class="p-3 bg-light border rounded-3 shadow-sm d-flex flex-column align-items-center gap-2 h-100 text-center">

            <!-- 第一行：人員 + 箭頭（置中） -->
            <div class="d-flex align-items-center justify-content-center gap-2 w-100">
              <!-- 被代班人 -->
              <div>
                <div class="fw-bold" style="color: #fd7e14; font-size: var(--fs-name, 1rem);">{{ d.debtor }}</div>
                <div class="text-muted" style="font-size: var(--fs-main, 0.9rem);">{{ getMemberGroup(d.debtor) }}</div>
              </div>

              <!-- 箭頭 + 支援 -->
              <div class="d-flex flex-column align-items-center" style="min-width:40px;">
                <span class="badge rounded-pill bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 mb-1" style="font-size: 10px; padding: 1px 6px;">支援</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-secondary opacity-75">
                  <line x1="21" y1="12" x2="3" y2="12"></line>
                  <polyline points="9 18 3 12 9 6"></polyline>
                </svg>
              </div>

              <!-- 代班人 -->
              <div>
                <div class="fw-bold text-success" style="font-size: var(--fs-name, 1rem);">{{ d.creditor }}</div>
                <div class="text-muted" style="font-size: var(--fs-main, 0.9rem);">{{ getMemberGroup(d.creditor) }}</div>
              </div>
            </div>

            <!-- 第二行：時段 + 日期（置中） -->
            <div class="d-flex flex-wrap justify-content-center align-items-center gap-1">
              <span class="badge bg-warning bg-opacity-25 text-dark border border-warning px-2 py-1" :style="{ fontSize: 'var(--fs-main, 0.9rem)', whiteSpace: 'nowrap' }">{{ d.period }}</span>
              <span class="badge bg-white text-secondary border px-2 py-1" :style="{ fontSize: 'var(--fs-main, 0.9rem)', whiteSpace: 'nowrap' }">{{ d.dateCreated }}</span>
            </div>

            <!-- 第三行：admin 按鈕（置中） -->
            <div v-if="isAdmin" class="d-flex justify-content-center gap-2 border-top pt-2 w-100 mt-auto">
              <button @click="state.editingPendingDebt = d" class="btn btn-sm btn-outline-primary py-1 px-2 bg-white fw-bold" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">✏️ 編輯</button>
              <button @click="deletePendingDebt(d.id)" class="btn btn-sm btn-outline-danger py-1 px-2 bg-white fw-bold" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">🗑️ 刪除</button>
            </div>

          </div>
        </div>
      </div>
    </section>

    <!-- History Substitute Edit Modal -->
    <div v-if="isSubEditModalOpen" class="position-fixed top-0 start-0 w-100 h-100 z-3 d-flex align-items-center justify-content-center" style="background-color: rgba(0,0,0,0.5); backdrop-filter: blur(2px); z-index: 1100;">
      <div class="bg-white rounded-4 shadow-lg d-flex flex-column overflow-hidden position-relative w-100 m-3" style="max-width: 420px; max-height: 90vh;">
        <div class="p-3 bg-light border-bottom d-flex justify-content-between align-items-center">
          <h3 class="h5 m-0 fw-bold text-dark" style="color:#8b4513 !important;">✏️ 安排代班明細</h3>
          <button @click="isSubEditModalOpen = false" class="btn btn-link text-decoration-none text-muted p-0 fs-4 lh-1">✕</button>
        </div>
        
        <div class="p-3 overflow-auto custom-scrollbar flex-grow-1" style="background-color: #f8f9fa;">
          <!-- List of current substitutes -->
          <div v-for="(sub, idx) in editData.substitutesList" :key="idx" class="mb-3 p-3 border border-warning border-opacity-50 rounded-4 bg-white position-relative shadow-sm">
            <button @click="removeSubEdit(idx)" class="btn btn-sm btn-outline-danger position-absolute top-0 end-0 m-2 rounded-circle py-0 px-2 fw-bold border-0 bg-white" style="font-size: 14px;" title="移除">✕</button>
            <div class="badge bg-warning text-dark mb-3">代班 #{{ idx + 1 }}</div>
            
            <div class="mb-3">
              <label class="form-label small fw-bold mb-1 text-success">🙋‍♂️ 支援者 (來代班的人)</label>
              <select class="form-select form-select-sm bg-success bg-opacity-10 border-success" v-model="sub.creditor">
                <option value="" disabled>請選擇</option>
                <optgroup v-for="g in state.groups" :key="'c'+g.id" :label="'第 ' + g.id + ' 組'">
                  <option v-for="m in g.members" :key="m" :value="m">{{ m }}</option>
                </optgroup>
              </select>
            </div>
            
            <div class="mb-3">
              <label class="form-label small fw-bold mb-1 text-dark">🙏 被代班者 (原本負責的人)</label>
              <select class="form-select form-select-sm bg-light" v-model="sub.debtor">
                <option value="" disabled>請選擇</option>
                <option v-for="m in editData.members.split(', ')" :key="'d'+m" :value="m">{{ m }}</option>
              </select>
            </div>
            
            <div>
              <label class="form-label small fw-bold mb-2">⏱ 代班時段 (可複選，自動轉換整天)</label>
              <div class="d-flex flex-wrap gap-2">
                <template v-for="p in ['早齋', '午齋', '藥石', '整天']" :key="p+idx">
                  <input type="checkbox" :id="'p'+idx+p" :value="p" v-model="sub.periodArray" @change="handlePeriodChange(sub, p)" class="btn-check">
                  <label class="btn btn-outline-warning btn-sm py-1 px-3 fw-bold rounded-pill" :for="'p'+idx+p">{{ p }}</label>
                </template>
              </div>
            </div>
          </div>
          
          <button @click="addSubEdit" class="btn btn-outline-primary w-100 fw-bold border-2 py-3 rounded-4 shadow-sm bg-white mt-1 d-flex align-items-center justify-content-center gap-2">
            <span class="fs-4 lh-1">＋</span> 新增一筆代班紀錄
          </button>
        </div>
        
        <div class="p-3 border-top bg-white mt-auto">
          <button @click="isSubEditModalOpen = false" class="btn btn-warning w-100 fw-bold shadow-sm py-2 rounded-3 fs-5">✔️ 確定並回到上一頁</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, onMounted, nextTick, ref, reactive } from 'vue';
import Chart from 'chart.js/auto';
import { state, syncToCloud, isAdmin, showConfirm } from '../store.js';
import CustomDatePicker from './CustomDatePicker.vue';

const editingHistoryId = ref(null);
const isSubEditModalOpen = ref(false);
const editData = reactive({ date: '', groupId: 1, members: '', substitutesList: [] });

const getActiveSubstitute = (member) => {
  return state.debts.find(d => !d.isSettled && d.debtor === member && currentGroup.value?.members.includes(d.debtor));
};

const getMemberGroup = (member) => {
  const g = state.groups.find(g => g.members.includes(member));
  return g ? `第 ${g.id} 組` : '無組別';
};

const getGroupMembers = (gid) => {
  const g = state.groups.find(x => x.id === gid);
  return g ? g.members.join(', ') : '';
};

const changeEditGroup = (step) => {
  if (state.groups.length === 0) return;
  let idx = state.groups.findIndex(g => g.id === editData.groupId);
  if (idx === -1) idx = 0;
  
  idx += step;
  if (idx < 0) idx = state.groups.length - 1;
  if (idx >= state.groups.length) idx = 0;
  
  editData.groupId = state.groups[idx].id;
  editData.members = state.groups[idx].members.join(', ');
  
  // 組別改變時，避免有對應不到病人的代班，過濾掉舊的 debtor
  if (editData.substitutesList && editData.substitutesList.length) {
    editData.substitutesList = editData.substitutesList.filter(s => editData.members.includes(s.debtor));
  }
};

const openSubEditModal = () => {
  isSubEditModalOpen.value = true;
};

const addSubEdit = () => {
  if (!editData.substitutesList) {
    editData.substitutesList = [];
  }
  editData.substitutesList.push({
    creditor: '',
    debtor: '',
    period: '午齋',
    periodArray: ['午齋']
  });
};

const handlePeriodChange = (sub, changedValue) => {
  if (!sub.periodArray) sub.periodArray = [];
  const newVal = [...sub.periodArray];
  
  if (changedValue === '整天' && newVal.includes('整天')) {
    sub.periodArray = ['整天'];
  } else if (changedValue !== '整天' && newVal.includes('整天')) {
    sub.periodArray = newVal.filter(p => p !== '整天');
  } else {
    const allMeals = ['早齋', '午齋', '藥石'];
    if (allMeals.every(meal => newVal.includes(meal))) {
      sub.periodArray = ['整天'];
    }
  }
  // Sync string value for immediate UI consistency
  sub.period = sub.periodArray.length > 0 ? sub.periodArray.join('、') : '';
};

const removeSubEdit = (idx) => {
  editData.substitutesList.splice(idx, 1);
};

const deletePendingDebt = async (id) => {
  showConfirm("刪除互助紀錄", "確定要刪除這筆待圓滿的互助紀錄嗎？刪除後將無法復原。", async () => {
    const idx = state.debts.findIndex(d => d.id === id);
    if (idx !== -1) {
      state.debts.splice(idx, 1);
      await syncToCloud();
    }
  });
};

// editPendingDebt 已由 PendingDebtEditModal 組件接管

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
  editData.groupId = item.groupId || 1;
  editData.members = item.members || '';
  
  let subList = [];
  if (Array.isArray(item.substitutesList) && item.substitutesList.length > 0) {
    subList = JSON.parse(JSON.stringify(item.substitutesList)).map(s => ({
      ...s,
      periodArray: s.period ? s.period.split('、') : ['午齋']
    }));
  }
  editData.substitutesList = subList;
};

const saveHistory = async (item) => {
  item.date = editData.date.trim();
  item.groupId = editData.groupId;
  item.members = editData.members;
  
  const finalSubs = editData.substitutesList.map(s => {
    const pStr = s.periodArray && s.periodArray.length > 0 ? s.periodArray.join('、') : (s.period || '午齋');
    return {
      creditor: s.creditor,
      debtor: s.debtor,
      period: pStr
    };
  });
  
  item.substitutesList = finalSubs;
  item.substitutes = finalSubs.map(s => `${s.creditor}代${s.debtor}(${s.period})`).join("、");
  
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
    .map(d => ({
      creditor: d.creditor,
      debtor: d.debtor,
      period: d.period || '午齋'
    }));
    
  const record = {
    id: Date.now(),
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    groupId: currentGroup.value.id,
    members: currentGroup.value.members.join(", "),
    substitutesList: currentSubs,
    substitutes: currentSubs.map(s => `${s.creditor}代${s.debtor}(${s.period})`).join(", "),
    shiftPeriods: []
  };
  state.history.unshift(record);
  // 不再此處限制 5 筆，讓 HistoryView 可以查看全部
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
