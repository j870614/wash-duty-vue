# Wash Duty Vue

這是一個使用 Vue 3 + Vite 開發的洗碗值星管理工具。

## 部署說明 (GitHub Pages)

本專案已設定 GitHub Actions 自動部署。每當程式碼推送到 `main` 分支時，系統會自動編譯並部署。

### 步驟 1：設定 GitHub Secrets

由於專案使用了 Firebase 敏感資訊，你需要在 GitHub Repository 中設定以下 **Secrets**：

1. 前往你的 GitHub Repository 頁面。
2. 點擊 **Settings** -> **Secrets and variables** -> **Actions**。
3. 點擊 **New repository secret**，並對照 `.env.example` 加入以下變數：
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_DOCUMENT_APP_ID` (選填)

### 步驟 2：啟用 GitHub Pages

1. 前往 **Settings** -> **Pages**。
2. 在 **Build and deployment** -> **Branch** 下：
   - 選擇 `gh-pages` 分支。
   - 選擇 `/ (root)` 資料夾。
3. 點擊 **Save**。

### 步驟 3：自動部署

只需將你的程式碼 `push` 到 `main` 分支，GitHub Actions 就會自動開始執行。你可以在 **Actions** 頁籤查看進度。

---

## 本地開發

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 編譯專案
npm run build
```

---

### 常見問題：403 Permission Denied

如果 Actions 執行失敗並出現 `Permission... denied to github-actions[bot]`，代表 Token 權限不足。

我已在 `deploy.yml` 中加入了 `permissions: contents: write`。如果仍然失敗，請手動確認：
1. 前往 **Settings** -> **Actions** -> **General**。
2. 捲動到最下方的 **Workflow permissions**。
3. 確保選擇了 **Read and write permissions** 並點擊 **Save**。
