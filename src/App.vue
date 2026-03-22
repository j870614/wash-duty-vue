<template>
  <div class="container py-4 min-vh-100 bg-light font-noto">
    <header class="d-flex flex-column flex-md-row justify-content-between align-items-center bg-white p-4 rounded-4 shadow-sm border mb-4">
      <div class="text-center text-md-start">
        <h1 class="h3 fw-bold text-dark mb-1">🍽️ 洗碗支援排班管理系統</h1>
        <p class="text-secondary small mb-0">雲端互助版 — 紀錄即時同步，法緣長存</p>
      </div>
      <nav class="d-flex gap-4 mt-3 mt-md-0 fw-bold">
        <button 
          class="btn btn-link text-decoration-none px-0 pb-1"
          :class="state.activeTab === 'dashboard' ? 'active-tab' : 'text-secondary'"
          @click="state.activeTab = 'dashboard'">即時排班</button>
        <button 
          class="btn btn-link text-decoration-none px-0 pb-1"
          :class="state.activeTab === 'roster' ? 'active-tab' : 'text-secondary'"
          @click="state.activeTab = 'roster'">組別管理</button>
      </nav>
    </header>

    <Dashboard v-if="state.activeTab === 'dashboard'" />
    <RosterEditor v-else />
    <ShiftModal />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { state, initFirebase } from './store.js';
import Dashboard from './components/Dashboard.vue';
import RosterEditor from './components/RosterEditor.vue';
import ShiftModal from './components/ShiftModal.vue';
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
