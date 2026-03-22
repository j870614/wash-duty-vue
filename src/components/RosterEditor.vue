<template>
  <div class="card shadow-sm border-0">
    <div class="card-header bg-dark text-white d-flex justify-content-between align-items-center p-4">
      <div>
        <h2 class="h4 fw-bold mb-0">🛠️ 組別與成員管理</h2>
        <p class="text-secondary small mb-0 mt-1">您可以隨時調整每組成員、新增或刪除組別</p>
      </div>
      <button @click="addNewGroup" class="btn btn-warning fw-bold d-flex align-items-center gap-2">
        ➕ 新增組別
      </button>
    </div>
    <div class="card-body bg-light p-4">
      <div class="row g-4">
        <div v-for="(group, gIdx) in state.groups" :key="group.id" class="col-12 col-md-6 col-lg-4">
          <div class="bg-white border rounded shadow-sm p-3 border-top border-3 border-dark h-100">
            <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
              <span class="fw-bold text-muted">第 {{ group.id }} 組</span>
              <button @click="removeGroup(gIdx)" class="btn btn-sm btn-link text-danger text-decoration-none fw-bold px-0 p-0">
                ❌ 刪除組
              </button>
            </div>
            <div class="d-flex flex-column gap-2 mb-3">
              <div v-for="(member, mIdx) in group.members" :key="mIdx" class="d-flex gap-2">
                <input type="text" 
                       :value="member" 
                       @change="updateMemberName(gIdx, mIdx, $event.target.value)"
                       class="form-control form-control-sm border-secondary shadow-none">
                <button @click="removeMember(gIdx, mIdx)" class="btn btn-sm btn-outline-danger fw-bold border-0">✕</button>
              </div>
            </div>
            <button @click="addMember(gIdx)" class="btn btn-sm btn-outline-secondary w-100 fw-bold border-dashed">
              ➕ 新增成員
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { state, syncToCloud } from '../store.js';

const addNewGroup = async () => {
  const nextId = state.groups.length > 0 ? Math.max(...state.groups.map(g => g.id)) + 1 : 1;
  state.groups.push({ id: nextId, members: ["新成員"] });
  await syncToCloud();
};

const removeGroup = async (gIdx) => {
  if (state.groups.length <= 1) return;
  if (confirm(`確定要刪除第 ${state.groups[gIdx].id} 組嗎？`)) {
    state.groups.splice(gIdx, 1);
    if (state.currentGroupIndex >= state.groups.length) {
      state.currentGroupIndex = 0;
    }
    await syncToCloud();
  }
};

const addMember = async (gIdx) => {
  state.groups[gIdx].members.push('新成員');
  await syncToCloud();
};

const updateMemberName = async (gIdx, mIdx, val) => {
  state.groups[gIdx].members[mIdx] = val.trim() || '未命名';
  await syncToCloud();
};

const removeMember = async (gIdx, mIdx) => {
  state.groups[gIdx].members.splice(mIdx, 1);
  await syncToCloud();
};
</script>

<style scoped>
.border-dashed { border-style: dashed !important; }
</style>
