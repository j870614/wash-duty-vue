import { reactive, computed } from 'vue';
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";

const INITIAL_GROUPS = [
  { id: 1, members: ["普中師", "普本師"] }, { id: 2, members: ["普導師", "普遠師"] },
  { id: 3, members: ["圓戒師", "普聚師"] }, { id: 4, members: ["普切師", "普毫師"] },
  { id: 5, members: ["普計師", "普誨師"] }, { id: 6, members: ["普誏師", "普謹師"] },
  { id: 7, members: ["普歸師", "普初師"] }, { id: 8, members: ["普登師", "普陽師"] },
  { id: 9, members: ["普覓師", "普蓮師"] }, { id: 10, members: ["普自師", "普香師"] },
  { id: 11, members: ["普楷", "普承"] }, { id: 12, members: ["普澤", "普淨", "普懷"] },
  { id: 13, members: ["普徹", "普語"] }, { id: 14, members: ["普虔", "普邦"] },
  { id: 15, members: ["普文", "普和"] }
];

export const state = reactive({
  groups: JSON.parse(JSON.stringify(INITIAL_GROUPS)),
  currentGroupIndex: 0,
  debts: [],
  history: [],
  admins: [],
  modalTargetDebtor: null,
  editingPendingDebt: null,
  user: null,
  isSyncing: false,
  isDataLoaded: false,
  activeTab: 'dashboard',
  syncStatusText: '連線中...',
  modal: { show: false, title: '', message: '', type: 'info', onConfirm: null },
  toast: { show: false, message: '', type: 'success' }
});

export const isSuperAdmin = computed(() => {
  if (!state.user || state.user.isAnonymous || !state.user.email) return false;
  const envAdmins = import.meta.env.VITE_ADMIN_EMAILS 
    ? import.meta.env.VITE_ADMIN_EMAILS.split(',').map(e => e.trim()) 
    : [];
  if (envAdmins.includes(state.user.email)) return true;
  
  const found = state.admins.find(a => a.email === state.user.email);
  return found && found.role === 'super';
});

export const isAdmin = computed(() => {
  if (isSuperAdmin.value) return true;
  if (!state.user || state.user.isAnonymous || !state.user.email) return false;
  
  const found = state.admins.find(a => a.email === state.user.email);
  return found && (found.role === 'super' || found.role === 'normal');
});

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

// 如果 .env 沒有設定，嘗試讀取原本的全域變數做防呆
if (!firebaseConfig.apiKey && window.__firebase_config) {
  Object.assign(firebaseConfig, JSON.parse(window.__firebase_config));
}

let app, auth, db;
try {
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (e) {
  console.warn('Firebase setup warning', e);
}

// 支援透過環境變數改變文件儲存的根目錄名
const documentAppId = import.meta.env.VITE_DOCUMENT_APP_ID || window.__app_id || 'temple-dishwash-app';
const getRecordsDocRef = () => doc(db, 'artifacts', documentAppId, 'public', 'data', 'records', 'v3_dynamic');

export const syncToCloud = async () => {
  if (!state.user || !db) {
    console.warn("未登入或資料庫未初始化，跳過雲端同步");
    return;
  }
  state.isSyncing = true;
  state.syncStatusText = "⏳ 資料同步中...";
  try {
    await setDoc(getRecordsDocRef(), {
      groups: JSON.parse(JSON.stringify(state.groups)),
      list: JSON.parse(JSON.stringify(state.debts)),
      currentGroupIndex: state.currentGroupIndex,
      history: JSON.parse(JSON.stringify(state.history)),
      admins: JSON.parse(JSON.stringify(state.admins))
    });
    state.syncStatusText = "✅ 已即時同步";
    showToast("資料已同步到雲端");
  } catch (error) {
    state.syncStatusText = "⚠️ 上傳失敗";
    showToast("同步失敗", "danger");
  } finally {
    state.isSyncing = false;
  }
};

let unsubscribeData = null;
const startListening = () => {
  if (!db) return;
  if (unsubscribeData) unsubscribeData();
  unsubscribeData = onSnapshot(getRecordsDocRef(), (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      state.groups = data.groups || INITIAL_GROUPS;
      state.debts = data.list || [];
      state.currentGroupIndex = data.currentGroupIndex || 0;
      state.history = data.history || [];
      state.admins = data.admins || [];
    } else {
      syncToCloud();
    }
    state.isDataLoaded = true;
  }, () => {
    state.syncStatusText = "⚠️ 同步錯誤";
    state.isDataLoaded = true;
  });
};

export const initFirebase = async () => {
  if (!auth) {
    state.isDataLoaded = true;
    return;
  }
  onAuthStateChanged(auth, (user) => {
    state.user = user;
    if (user) {
      state.syncStatusText = "✅ 已連線雲端";
      startListening();
    } else {
      state.syncStatusText = "❌ 未連線（登入中...）";
    }
  });

  try {
    if (typeof window.__initial_auth_token !== 'undefined' && window.__initial_auth_token) {
      await signInWithCustomToken(auth, window.__initial_auth_token);
    } else {
      await signInAnonymously(auth);
    }
  } catch (error) {
    console.error("驗證失敗:", error);
  }
};

export const loginWithGoogle = async () => {
  if (!auth) return;
  state.syncStatusText = "登入中...";
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Google登入失敗:", error);
    state.syncStatusText = "登入失敗";
  }
};

export const logout = async () => {
  if (!auth) return;
  try {
    state.syncStatusText = "登出中...";
    await signOut(auth);
    // 登出後重新進行匿名登入以保持唯讀或基本連線
    await initFirebase();
  } catch (error) {
    console.error("登出失敗:", error);
    state.syncStatusText = "登出失敗";
  }
};

export const showAlert = (title, message, type = 'info') => {
  state.modal = { show: true, title, message, type, onConfirm: null };
};

export const showConfirm = (title, message, onConfirm) => {
  state.modal = { show: true, title, message, type: 'warning', onConfirm };
};

export const showToast = (message, type = 'success') => {
  state.toast = { show: true, message, type };
  setTimeout(() => { state.toast.show = false; }, 3000);
};
