<template>
  <div class="container py-4 min-vh-100 bg-light font-noto d-flex flex-column">

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
        <div class="mb-3 d-flex align-items-center gap-2">
          <img v-if="state.user && state.user.photoURL" :src="state.user.photoURL" class="rounded-circle shadow-sm border border-2 border-white" width="36" height="36" alt="Avatar">
          <span v-if="state.user && !state.user.isAnonymous" class="badge bg-success fw-bold px-3 py-2 fs-6 shadow-sm">
            {{ state.user.displayName || state.user.email.split('@')[0] }}
          </span>
          <span v-else class="badge bg-secondary px-3 py-2 fs-6 shadow-sm">👤 訪客 (匿名)</span>
          
          <button v-if="state.user && !state.user.isAnonymous" @click="logout" class="btn btn-sm btn-danger fw-bold shadow-sm px-3">登出</button>
          <button v-else @click="loginWithGoogle" class="btn btn-sm btn-primary fw-bold shadow-sm px-3">管理員登入</button>
        </div>
        <nav class="d-flex gap-3 gap-md-4 fw-bold overflow-auto text-nowrap w-100 justify-content-start justify-content-md-end pb-2 pe-3 me-n3" style="-webkit-overflow-scrolling: touch;">
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

    <Dashboard v-if="state.activeTab === 'dashboard'" />
    <AdminManager v-else-if="isSuperAdmin && state.activeTab === 'admin'" />
    <RosterEditor v-else-if="state.activeTab === 'roster'" />
    <HistoryView v-else-if="state.activeTab === 'history'" />
    <ShiftModal />
    <GlobalModal />
    <GlobalToast />
    </template>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { state, initFirebase, loginWithGoogle, logout, isAdmin, isSuperAdmin } from './store.js';
import Dashboard from './components/Dashboard.vue';
import AdminManager from './components/AdminManager.vue';
import RosterEditor from './components/RosterEditor.vue';
import HistoryView from './components/HistoryView.vue';
import ShiftModal from './components/ShiftModal.vue';
import GlobalModal from './components/GlobalModal.vue';
import GlobalToast from './components/GlobalToast.vue';
import 'bootstrap/dist/css/bootstrap.min.css';

onMounted(() => {
  initFirebase();
});
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=swap');
.font-noto { font-family: 'Noto Sans TC', sans-serif; }
.active-tab { border-bottom: 3px solid #fd7e14; color: #fd7e14 !important; }
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #f8f9fa; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #adb5bd; border-radius: 10px; }
</style>
