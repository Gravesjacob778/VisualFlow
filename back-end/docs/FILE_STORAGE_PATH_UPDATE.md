# 檔案儲存路徑結構更新說明

## 更新內容

已將檔案儲存路徑從 `storage/` 更新為 `wwwroot/uploads/` 結構，以符合標準的 ASP.NET Core 靜態檔案服務實踐。

## 新的目錄結構

```
wwwroot/
└── uploads/
    ├── gltf-models/           ← GLTF/GLB 3D 模型檔案
    │   ├── {GUID}.gltf
    │   ├── {GUID}.glb
    │   └── ...
    └── components/            ← 機器人元件 ZIP 壓縮檔
        ├── {GUID}.zip
        └── ...
```

## 主要變更

### 1. 配置檔案更新
- `appsettings.json`: `FileStorage.RootPath` 從 `"storage"` 改為 `"wwwroot/uploads"`
- `appsettings.Development.json`: 同步更新開發環境配置

### 2. 檔案命名規則
- **GUID 格式**: 從 `{GUID-N}` (無連字符) 改為 `{GUID-D}` (標準格式，帶連字符)
  - 舊格式: `7c8f4b2a9d1e4f3ab5c62e7d8f9a0b1c.zip`
  - 新格式: `7c8f4b2a-9d1e-4f3a-b5c6-2e7d8f9a0b1c.zip`

### 3. 儲存路徑結構
- **GLTF 模型**: `gltf-models/{GUID}{extension}`
  - 範例: `gltf-models/3fa85f64-5717-4562-b3fc-2c963f66afa6.gltf`
  - 扁平化結構（不再使用 `robot-configs/{robotConfigId}/` 子目錄）

- **元件檔案**: `components/{GUID}.zip`
  - 範例: `components/7c8f4b2a-9d1e-4f3a-b5c6-2e7d8f9a0b1c.zip`

## 優勢

1. **符合 ASP.NET Core 慣例**: `wwwroot` 是標準的靜態檔案根目錄
2. **扁平化結構**: 簡化檔案管理，避免深層目錄結構
3. **標準 GUID 格式**: 更易於人類閱讀和調試
4. **清晰分類**: `gltf-models` 和 `components` 分別儲存不同類型的檔案
5. **未來擴展**: 可輕鬆添加靜態檔案服務和直接下載支援

## 遷移注意事項

如果您有現有的檔案在舊路徑 (`storage/`) 下：
1. 需要將檔案移動到新的 `wwwroot/uploads/` 結構
2. 更新資料庫中的 `StoragePath` 欄位指向新路徑
3. 或運行資料遷移腳本來批量更新

## 影響的檔案

- `src/VisualFlow.Infrastructure/Services/FileSystemStorageService.cs`
- `src/VisualFlow.WebApi/appsettings.json`
- `src/VisualFlow.WebApi/appsettings.Development.json`
- `docs/COMPONENT_UPLOAD.md`

## 測試驗證

應用程序已成功啟動並運行在 http://localhost:5253

可以使用 `component-upload-test.http` 測試檔案上傳功能，檔案將自動儲存到新的路徑結構中。
