<template>
  <div class="card shadow-sm border-0">
    <div class="card-header bg-dark text-white p-4">
      <h2 class="h4 fw-bold mb-0">🔒 系統權限與管理員設定</h2>
      <p class="text-secondary small mb-0 mt-1">您可以新增或移除一般管理員。系統總管擁有一切權限，一般管理員僅負責排班與名單。</p>
    </div>
    
    <div class="card-body bg-light p-4">
      <!-- Add New Admin Form -->
      <div class="bg-white p-4 rounded shadow-sm border mb-4">
        <h3 class="h6 fw-bold mb-3">➕ 授權新管理員</h3>
        <form @submit.prevent="addAdmin" class="row g-3 align-items-end">
          <div class="col-12 col-md-5">
            <label class="form-label small fw-bold text-muted">Google 帳號 (Email)</label>
            <input v-model="newAdmin.email" type="email" class="form-control focus-ring" required placeholder="example@gmail.com">
          </div>
          <div class="col-12 col-md-4">
            <label class="form-label small fw-bold text-muted">權限層級</label>
            <select v-model="newAdmin.role" class="form-select focus-ring">
              <option value="normal">一般管理員 (排班、名單與歷史刪修)</option>
              <option value="super">系統總管 (具備所有權限包含此頁面)</option>
            </select>
          </div>
          <div class="col-12 col-md-3">
            <button type="submit" class="btn btn-primary w-100 fw-bold" :disabled="state.isSyncing">授權加入</button>
          </div>
        </form>
      </div>
      
      <!-- List of Admins -->
      <div class="bg-white p-4 rounded shadow-sm border">
        <h3 class="h6 fw-bold mb-3">📋 目前授權名單</h3>
        <p v-if="state.admins.length === 0" class="text-muted small fst-italic text-center py-4">目前沒有額外授權的其他管理員（.env 中設定的主總管不會顯示在此）</p>
        
        <div v-else class="d-flex flex-column gap-2">
          <div v-for="(admin, idx) in state.admins" :key="idx" class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 p-3 border rounded">
            <div class="text-break w-100 pe-2">
              <div class="fw-bold fs-6">{{ admin.email }}</div>
              <div class="small mt-1" :class="admin.role === 'super' ? 'text-primary fw-bold' : 'text-success fw-bold'">
                {{ admin.role === 'super' ? '👑 系統總管' : '⭐ 一般管理員' }}
              </div>
            </div>
            <button @click="removeAdmin(idx)" class="btn btn-sm btn-outline-danger fw-bold px-3 text-nowrap align-self-end align-self-sm-center">收回權限</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
import { state, syncToCloud } from '../store.js';

const newAdmin = reactive({ email: '', role: 'normal' });

const addAdmin = async () => {
  const email = newAdmin.email.trim();
  if (!email) return;
  if (state.admins.find(a => a.email === email)) {
    alert("此 Email 已在授權名單中！");
    return;
  }
  state.admins.push({ email, role: newAdmin.role });
  await syncToCloud();
  newAdmin.email = '';
  newAdmin.role = 'normal';
};

const removeAdmin = async (idx) => {
  if (confirm(`確定要收回 ${state.admins[idx].email} 的管理員權限嗎？`)) {
    state.admins.splice(idx, 1);
    await syncToCloud();
  }
};
</script>
