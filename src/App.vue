<template>
  <div class="container py-4 min-vh-100 bg-light font-noto d-flex flex-column" :data-fs="fontScale">

    <!-- Loading Screen -->
    <div v-if="!state.isDataLoaded" class="m-auto text-center d-flex flex-column align-items-center justify-content-center flex-grow-1" style="min-height: 60vh;">
      <div class="spinner-border text-warning mb-4 shadow-sm" role="status" style="width: 3.5rem; height: 3.5rem; border-width: 0.35rem;">
        <span class="visually-hidden">載入中...</span>
      </div>
      <h2 class="h4 fw-bold text-dark mb-2">🍽️ 洗碗支援排班管理系統</h2>
      <p class="text-secondary small bg-white px-3 py-1 rounded-pill shadow-sm border mt-1">
        ⏳ 正在與雲端資料庫連線同步中...
      </p>
    </div>

    <!-- Main Content -->
    <template v-else>
      <header class="d-flex flex-column flex-md-row justify-content-between align-items-center bg-white p-4 rounded-4 shadow-sm border mb-4">
      <div class="text-center text-md-start mb-3 mb-md-0" @click="state.activeTab = 'dashboard'" style="cursor: pointer;">
        <h1 class="h3 fw-bold text-dark mb-1">🍽️ 洗碗支援排班管理系統</h1>
        <p class="text-secondary small mb-0">雲端互助版 — 紀錄即時同步，法緣長存</p>
      </div>
      <div class="d-flex flex-column align-items-center align-items-md-end">
        <div class="mb-3 d-flex flex-wrap justify-content-center justify-content-md-end align-items-center gap-2">
          
          <!-- 第一組：使用者身份 -->
          <div class="d-flex align-items-center gap-2 bg-light px-3 py-1 rounded-pill border shadow-sm">
            <!-- 管理員：頭像 or SVG icon + 名字 + ADMIN pill -->
            <template v-if="state.user && !state.user.isAnonymous">
              <img v-if="state.user.photoURL" :src="state.user.photoURL" class="rounded-circle shadow-sm border border-2" style="border-color:#fd7e14;width:28px;height:28px;object-fit:cover" alt="Avatar">
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fd7e14" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
              <span class="user-name-text">{{ state.user.displayName || state.user.email.split('@')[0] }}</span>
              <span v-if="isAdmin" class="role-pill">管理員</span>
            </template>

            <!-- 訪客：SVG icon + 訪客文字 -->
            <template v-else>
              <span class="user-badge user-badge--guest border-0 px-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                訪客
              </span>
            </template>
          </div>

          <!-- 第二組：操作按鈕（登出/登入、字體縮放） -->
          <div class="d-flex align-items-center gap-2">
            <button v-if="state.user && !state.user.isAnonymous" @click="logout" class="btn btn-sm btn-outline-danger fw-bold shadow-sm px-3 rounded-pill" style="white-space:nowrap">登出</button>
            <button v-else @click="loginWithGoogle" class="btn btn-sm btn-primary fw-bold shadow-sm px-3 rounded-pill" style="white-space:nowrap">管理員登入</button>

            <!-- 字體縮放 -->
            <div class="d-flex align-items-center gap-1 bg-white border px-2 py-1 rounded-pill shadow-sm">
              <button @click="changeFontScale(-1)" class="font-scale-btn border-0 bg-transparent text-secondary p-1" :disabled="fontScale <= 0" title="縮小字體">字-</button>
              <div class="text-secondary opacity-50 px-1">|</div>
              <button @click="changeFontScale(1)" class="font-scale-btn border-0 bg-transparent text-secondary p-1" :disabled="fontScale >= 2" title="放大字體">字+</button>
            </div>
          </div>
          
        </div>
        <nav class="nav-bar d-flex gap-3 gap-md-4 fw-bold text-nowrap w-100 justify-content-center justify-content-md-end pb-2">
          <button 
            class="btn btn-link text-decoration-none px-0 pb-1"
            :class="state.activeTab === 'dashboard' ? 'active-tab' : 'text-secondary'"
            @click="state.activeTab = 'dashboard'">主畫面</button>

          <button 
            class="btn btn-link text-decoration-none px-0 pb-1"
            :class="state.activeTab === 'history' ? 'active-tab' : 'text-secondary'"
            @click="state.activeTab = 'history'">值班紀錄</button>

          <button 
            class="btn btn-link text-decoration-none px-0 pb-1"
            :class="state.activeTab === 'roster' ? 'active-tab' : 'text-secondary'"
            @click="state.activeTab = 'roster'">組別名單</button>
            
          <button v-if="isSuperAdmin"
            class="btn btn-link text-decoration-none px-0 pb-1"
            :class="state.activeTab === 'admin' ? 'active-tab' : 'text-secondary'"
            @click="state.activeTab = 'admin'">權限管理</button>
        </nav>
      </div>
    </header>

    <Dashboard v-if="state.activeTab === 'dashboard'" @open-shift-modal="openShiftModal" />
    <AdminManager v-else-if="isSuperAdmin && state.activeTab === 'admin'" />
    <RosterEditor v-else-if="state.activeTab === 'roster'" />
    <HistoryView v-else-if="state.activeTab === 'history'" />
    
    <!-- Unified Shift Modal -->
    <ShiftModal 
      :show="shiftModalState.show"
      :is-edit-mode="shiftModalState.isEditMode"
      :target-debtor="shiftModalState.targetDebtor"
      :initial-period="shiftModalState.initialPeriod"
      :initial-creditor="shiftModalState.initialCreditor"
      :is-syncing="state.isSyncing"
      @close="closeShiftModal"
      @save="saveShiftModal"
      @cancel="cancelShiftModal"
    />
    
    <GlobalModal />
    <GlobalToast />
    </template>
  </div>
</template>

<script setup>
import { onMounted, ref, reactive, watch } from 'vue';
import { state, initFirebase, loginWithGoogle, logout, isAdmin, isSuperAdmin, syncToCloud, showConfirm } from './store.js';
import Dashboard from './components/Dashboard.vue';
import AdminManager from './components/AdminManager.vue';
import RosterEditor from './components/RosterEditor.vue';
import HistoryView from './components/HistoryView.vue';
import ShiftModal from './components/ShiftModal.vue';
import GlobalModal from './components/GlobalModal.vue';
import GlobalToast from './components/GlobalToast.vue';
import 'bootstrap/dist/css/bootstrap.min.css';

// Modal 狀態管理
const shiftModalState = reactive({
  show: false,
  isEditMode: false,
  targetDebtor: '',
  initialPeriod: [],
  initialCreditor: null,
  editId: null // 用於追蹤編輯中的債務 ID
});

const openShiftModal = ({ debtor, isEdit, initialData = {} }) => {
  shiftModalState.targetDebtor = debtor;
  shiftModalState.isEditMode = isEdit;
  shiftModalState.initialPeriod = initialData.period ? initialData.period.split('、') : [];
  shiftModalState.initialCreditor = initialData.creditor || null;
  shiftModalState.editId = initialData.id || null;
  shiftModalState.show = true;
};

const closeShiftModal = () => {
  shiftModalState.show = false;
};

const saveShiftModal = async (data) => {
  if (state.isSyncing) return;
  
  if (shiftModalState.isEditMode && shiftModalState.editId) {
    // 編輯模式
    const target = state.debts.find(d => d.id === shiftModalState.editId);
    if (target) {
      target.creditor = data.creditor;
      target.period = data.period;
    }
  } else {
    // 新增模式
    state.debts.push({
      id: 'debt-' + Date.now(),
      debtor: data.debtor,
      creditor: data.creditor,
      period: data.period,
      dateCreated: new Date().toLocaleDateString(),
      isSettled: false
    });
  }
  
  await syncToCloud();
  closeShiftModal();
};

const cancelShiftModal = async (debtor) => {
  if (!isAdmin.value || !shiftModalState.editId) return;
  
  showConfirm("取消代班安排", `確定要取消替 ${debtor} 安排的代班嗎？`, async () => {
    const idx = state.debts.findIndex(d => d.id === shiftModalState.editId);
    if (idx !== -1) {
      state.debts.splice(idx, 1);
      await syncToCloud();
      closeShiftModal();
    }
  });
};

// 字體縮放：0=標準, 1=大, 2=最大
const FONT_STEPS = [1, 1.12, 1.25];
const fontScale = ref(parseInt(localStorage.getItem('fontScale') ?? '1'));

const changeFontScale = (dir) => {
  const next = fontScale.value + dir;
  if (next < 0 || next > 2) return;
  fontScale.value = next;
  localStorage.setItem('fontScale', next);
};

onMounted(() => {
  initFirebase();
});
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=swap');
:root {
  --bs-primary: #fd7e14;
  --bs-primary-rgb: 253, 126, 20;
  /* 1.2x Minor Third 等比縮放 — Medium 為預設基準 (對齊舊版最大號 1.1rem) */
  --fs-main: 1.1rem;
  --fs-name: 1.25rem;
}

/* 漸進式字體縮放：Small / Medium(預設) / Large */
[data-fs="0"] { --fs-main: 0.935rem; --fs-name: 1.06rem; }  /* Small: Medium * 0.85 */
[data-fs="1"] { --fs-main: 1.1rem; --fs-name: 1.25rem; }    /* Medium: 舊版最大號 */
[data-fs="2"] { --fs-main: 1.32rem; --fs-name: 1.5rem; }    /* Large: Medium * 1.2 */

body {
  background-color: #f0f2f5;
  font-family: 'Noto Sans TC', sans-serif;
  transition: background-color 0.3s ease;
}

.transition-all {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid rgba(0,0,0,0.05) !important;
}

.shadow-sm {
  box-shadow: 0 4px 20px -5px rgba(0,0,0,0.08) !important;
}

.shadow-lg {
  box-shadow: 0 20px 40px -15px rgba(0,0,0,0.15) !important;
}

.hover-border:hover {
  border-color: #fd7e14 !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px -5px rgba(253, 126, 20, 0.15) !important;
}

.btn {
  transition: all 0.2s ease;
  border-radius: 8px;
}

.btn:active {
  transform: scale(0.96);
}

.font-scale-btn {
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.font-scale-btn:hover:not(:disabled) {
  color: #fd7e14 !important;
  background-color: rgba(253, 126, 20, 0.05);
}

.font-scale-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.user-name-text {
  font-weight: 700;
  color: #444;
  font-size: 0.95rem;
}

.role-pill {
  font-size: 10px;
  background: linear-gradient(135deg, #fd7e14 0%, #ff9e43 100%);
  color: white;
  padding: 2px 8px;
  border-radius: 20px;
  font-weight: 900;
  box-shadow: 0 2px 5px rgba(253, 126, 20, 0.2);
}

.user-badge--guest {
  font-size: 13px;
  font-weight: 600;
  color: #888;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* ===== 導航列 ===== */
.nav-bar {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 16px;
  padding-left: max(16px, env(safe-area-inset-left));
  padding-right: max(16px, env(safe-area-inset-right));
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

.nav-bar::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

/* 導航按鈕 */
nav button {
  position: relative;
  border: none;
  background: none;
  padding-bottom: 6px;
  color: #555;
  font-weight: 700;
  transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

nav button:hover {
  color: #333;
}

/* Active Tab: 深色文字 + 橘色底線 */
nav button.active-tab {
  color: #1a1a1a;
}

nav button::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 3px;
  background: linear-gradient(90deg, #fd7e14, #ff9e43);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateX(-50%);
  border-radius: 2px;
}

nav button.active-tab::after {
  width: 100%;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #ccc;
}
</style>
