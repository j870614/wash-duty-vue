<template>
  <div class="card shadow-sm border-0 rounded-4 overflow-hidden transition-all hover-border">
    <div class="card-header border-0 p-4" style="background: linear-gradient(135deg, #212529 0%, #424951 100%);">
      <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div>
          <h2 class="h4 fw-bold mb-0 text-white">👥 組別與成員名單</h2>
          <p class="text-white-50 small mb-0 mt-1">您可以隨時查看各組成員。管理員可進入編輯模式進行修改。</p>
        </div>
      </div>
      
      <div v-if="isAdmin" class="d-flex gap-2">
        <template v-if="!isEditMode">
          <button @click="startEdit" class="btn btn-outline-warning fw-bold d-flex align-items-center gap-2 bg-dark">
            ✏️ 解鎖編輯
          </button>
        </template>
        <template v-else>
          <button @click="cancelEdit" class="btn btn-outline-light fw-bold">取消</button>
          <button @click="saveEdit" class="btn btn-warning fw-bold">💾 確認儲存</button>
        </template>
      </div>
    </div>
    
    <!-- Action Bar for adding new groups (Only in Edit Mode) -->
    <div v-if="isEditMode" class="bg-warning bg-opacity-10 p-3 border-bottom d-flex justify-content-center">
      <button @click="addNewGroup" class="btn btn-sm btn-warning fw-bold d-flex align-items-center gap-2 shadow-sm rounded-pill px-4">
        ➕ 新增一組
      </button>
    </div>

    <div class="card-body bg-light p-4">

      <!-- 組別為空時的引導區塊 -->
      <div v-if="state.groups.length === 0" class="text-center py-5">
        <div class="fs-1 mb-3">📋</div>
        <p class="text-muted fw-bold mb-4">目前資料庫中尚無組別資料</p>
        <button v-if="isAdmin" @click="importSeedGroups" class="btn btn-warning fw-bold px-5 shadow-sm rounded-pill">
          ⬆️ 導入系統預設範本
        </button>
        <p v-else class="text-muted small">請聯絡管理員設定組別名單</p>
      </div>

      <div v-if="isEditMode && draftGroups.length === 0 && state.groups.length > 0" class="text-center text-muted py-5">
        目前沒有任何組別，點擊上方按鈕新增。
      </div>
      <div class="row g-4">
        <div v-for="(group, gIdx) in (isEditMode ? draftGroups : state.groups)" :key="group.id" class="col-12 col-md-6 col-lg-4">
          <div class="bg-white border rounded shadow-sm p-3 border-top border-3 h-100 transition-all" :class="isEditMode ? 'border-warning' : 'border-dark'">
            <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
              <span class="fw-bold text-dark" :style="{ fontSize: 'var(--fs-name, 1.15rem)' }">第 {{ group.id }} 組</span>
              <button v-if="isEditMode" @click="removeGroup(gIdx)" class="btn btn-sm btn-outline-danger fw-bold border-0 px-2" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">
                🗑️ 刪除
              </button>
            </div>
            
            <div class="d-flex flex-column gap-2 mb-3">
              <div v-for="(member, mIdx) in group.members" :key="mIdx" class="d-flex gap-2 align-items-center py-1">
                <input v-if="isEditMode" type="text" 
                       :value="member" 
                       @input="updateMemberName(gIdx, mIdx, $event.target.value)"
                       class="form-control form-control-sm border-warning shadow-none focus-ring focus-ring-warning"
                       :style="{ fontSize: 'var(--fs-name, 1rem)' }">
                <span v-else class="fw-bold text-dark px-2" :style="{ fontSize: 'var(--fs-name, 1rem)' }"><span class="badge bg-secondary bg-opacity-10 text-dark me-2">👤</span> {{ member }}</span>
                
                <button v-if="isEditMode" @click="removeMember(gIdx, mIdx)" class="btn btn-sm btn-link text-danger text-decoration-none fw-bold p-0 px-1">✕</button>
              </div>
              <div v-if="group.members.length === 0" class="text-muted small fst-italic text-center py-2" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">無成員</div>
            </div>
            
            <button v-if="isEditMode" @click="addMember(gIdx)" class="btn btn-sm btn-outline-warning w-100 fw-bold border-dashed text-dark" :style="{ fontSize: 'var(--fs-main, 0.9rem)' }">
              ➕ 增加成員
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { state, syncToCloud, isAdmin, showConfirm, SEED_GROUPS } from '../store.js';

const isEditMode = ref(false);
const draftGroups = ref([]);

const startEdit = () => {
  draftGroups.value = JSON.parse(JSON.stringify(state.groups));
  isEditMode.value = true;
};

const cancelEdit = () => {
  showConfirm("取消編輯", "確定要放棄所有未儲存的變更嗎？", () => {
    isEditMode.value = false;
  });
};

const saveEdit = async () => {
  showConfirm('儲存變更', '確定要儲存這份名單並覆寫雲端紀錄嗎？', async () => {
    state.groups = JSON.parse(JSON.stringify(draftGroups.value));

    // 檢查 currentGroupIndex 是否超出範圍
    if (state.currentGroupIndex >= state.groups.length && state.groups.length > 0) {
      state.currentGroupIndex = 0;
    }

    await syncToCloud();
    isEditMode.value = false;
  });
};

const importSeedGroups = () => {
  showConfirm('導入預設範本', '確定要將系統預設的 15 組人員名單匯入雲端資料庫嗎？此操作會覆蓋現有資料。', async () => {
    state.groups = JSON.parse(JSON.stringify(SEED_GROUPS));
    state.currentGroupIndex = 0;
    await syncToCloud();
  });
};

const addNewGroup = () => {
  const nextId = draftGroups.value.length > 0 ? Math.max(...draftGroups.value.map(g => g.id)) + 1 : 1;
  draftGroups.value.push({ id: nextId, members: ["新成員"] });
};

const removeGroup = (gIdx) => {
  showConfirm("刪除組別", `確定要刪除第 ${draftGroups.value[gIdx].id} 組嗎？這會刪除裡面所有成員！`, () => {
    draftGroups.value.splice(gIdx, 1);
  });
};

const addMember = (gIdx) => {
  draftGroups.value[gIdx].members.push('新成員');
};

const updateMemberName = (gIdx, mIdx, val) => {
  draftGroups.value[gIdx].members[mIdx] = val.trim();
};

const removeMember = (gIdx, mIdx) => {
  draftGroups.value[gIdx].members.splice(mIdx, 1);
};
</script>

<style scoped>
.border-dashed { border-style: dashed !important; border-width: 2px !important; }
</style>
