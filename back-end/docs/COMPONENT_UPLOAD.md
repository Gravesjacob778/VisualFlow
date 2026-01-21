# 機器人元件上傳功能說明

## 功能概述

此功能允許用戶上傳包含 3D 模型的 ZIP 壓縮檔，用於機器人手臂的可替換元件（如夾爪、感測器、工具等）。

## API 端點

### 上傳元件壓縮檔

**端點**: `POST /api/robot-configs/components`

**請求標頭**:
- `Authorization`: Bearer {token}
- `Content-Type`: multipart/form-data

**請求本體** (表單資料):
| 欄位名稱 | 類型 | 必填 | 說明 |
|---------|------|------|------|
| `file` | File | 是 | ZIP 壓縮檔 |
| `componentType` | String | 否 | 元件類型 (gripper, sensor, tool, other) |

**檔案限制**:
- 允許格式: `.zip`
- 最大檔案大小: 50 MB
- 檔案名稱長度: 1-255 字元
- ZIP 內容限制:
  - 允許的檔案類型: `.gltf`, `.glb`, `.bin`, `.jpg`, `.jpeg`, `.png`, `.json`
  - 解壓縮後大小限制: 200 MB（防止 ZIP 炸彈攻擊）
  - 不允許包含可執行檔: `.exe`, `.dll`, `.so`, `.sh`, `.bat`, `.cmd`, `.ps1`, `.vbs`, `.app`, `.deb`, `.rpm`

**成功回應** (200 OK):
```json
{
  "success": true,
  "message": "元件壓縮檔上傳成功",
  "data": {
    "id": "7c8f4b2a-9d1e-4f3a-b5c6-2e7d8f9a0b1c",
    "fileName": "custom_gripper_v2.zip",
    "fileSize": 3145728,
    "contentType": "application/zip",
    "uploadedAt": "2026-01-21T12:45:00Z",
    "componentType": "gripper",
    "containsFiles": [
      "gripper.glb",
      "textures/metal_roughness.jpg",
      "textures/normal_map.png"
    ],
    "url": "/api/robot-configs/components/7c8f4b2a-9d1e-4f3a-b5c6-2e7d8f9a0b1c"
  }
}
```

**錯誤回應**:

- **400 Bad Request** - 檔案驗證失敗
- **401 Unauthorized** - 未授權
- **413 Payload Too Large** - 檔案超過大小限制
- **500 Internal Server Error** - 伺服器錯誤

## 安全功能

### 1. 檔案驗證
- 嚴格的檔案類型檢查
- 檔案大小限制
- 檔案名稱長度驗證

### 2. ZIP 炸彈防護
- 檢查解壓縮後的總大小
- 限制最大解壓縮大小為 200 MB
- 防止遞歸解壓攻擊

### 3. 可執行檔過濾
- 禁止上傳任何可執行檔案
- 保護系統免受惡意代碼攻擊

### 4. 路徑遍歷防護
- 安全的檔案路徑處理
- 防止目錄遍歷攻擊

## 架構設計

此功能遵循 Clean Architecture 原則，分為以下層次：

### Domain 層
- `ComponentFile` 實體：表示元件檔案
- 包含檔案元資料和內容清單

### Application 層
- `UploadComponentFileCommand`：上傳命令
- `UploadComponentFileCommandHandler`：命令處理器
- `UploadComponentFileCommandValidator`：FluentValidation 驗證器
- `IZipValidationService`：ZIP 驗證服務介面
- `ComponentFileConstraints`：檔案約束常數

### Infrastructure 層
- `ZipValidationService`：ZIP 驗證服務實作
- `FileSystemStorageService`：檔案儲存服務（已擴展）
- `ComponentFileConfiguration`：EF Core 實體配置
- 資料庫遷移：`AddComponentFileTable`

### WebApi 層
- `RobotConfigsController.UploadComponent`：API 端點
- 處理 multipart/form-data 請求
- 錯誤處理和響應格式化

## 資料庫結構

### ComponentFiles 表

| 欄位 | 類型 | 說明 |
|------|------|------|
| Id | GUID | 主鍵 |
| FileName | nvarchar(255) | 原始檔案名稱 |
| StorageFileName | nvarchar(255) | 伺服器儲存檔名（僅 GUID，不含副檔名） |
| FileSize | bigint | 檔案大小（位元組） |
| ContentType | nvarchar(100) | MIME 類型 |
| ComponentType | nvarchar(50) | 元件類型 |
| ContainedFiles | nvarchar(max) | ZIP 內檔案清單（以分號分隔） |
| UncompressedSize | bigint | 解壓縮後大小 |
| StoragePath | nvarchar(500) | 檔案儲存路徑 |
| CreatedAt | datetime2 | 建立時間 |
| ModifiedAt | datetime2 | 修改時間 |
| CreatedBy | nvarchar(max) | 建立者 |
| ModifiedBy | nvarchar(max) | 修改者 |

### 索引
- `IX_ComponentFiles_ComponentType`：元件類型索引
- `IX_ComponentFiles_CreatedAt`：建立時間索引

## 檔案儲存

檔案儲存在伺服器檔案系統中：
- 根目錄：`wwwroot/uploads/`
- 元件路徑：`wwwroot/uploads/components/{GUID}.zip`
- GLTF 模型路徑：`wwwroot/uploads/gltf-models/{GUID}.gltf` 或 `.glb`
- 使用標準 GUID 格式（帶連字符）確保唯一性
- 扁平化儲存結構（所有檔案在同一層級）
- 防止檔名衝突和路徑遍歷攻擊

### 目錄結構

```
wwwroot/
└── uploads/
    ├── gltf-models/
    │   ├── 3fa85f64-5717-4562-b3fc-2c963f66afa6.gltf
    │   ├── 7b2c4a91-8e3f-4c2d-9a1b-5d6e7f8a9b0c.glb
    │   └── a1b2c3d4-e5f6-7890-abcd-ef1234567890.gltf
    └── components/
        ├── 7c8f4b2a-9d1e-4f3a-b5c6-2e7d8f9a0b1c.zip
        ├── 9e1f2a3b-4c5d-6e7f-8a9b-0c1d2e3f4a5b.zip
        └── b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e.zip
```

## 測試

使用 `component-upload-test.http` 檔案進行 API 測試：

```bash
# 測試場景
1. 正常上傳 ZIP 檔案
2. 上傳時不指定元件類型
3. 上傳非 ZIP 檔案（應失敗）
4. 不上傳檔案（應失敗）
```

## 未來擴展

1. **下載端點**：實作 `GET /api/robot-configs/components/{id}` 下載元件檔案
2. **清單端點**：實作 `GET /api/robot-configs/components` 列出所有元件
3. **刪除端點**：實作 `DELETE /api/robot-configs/components/{id}` 刪除元件
4. **預覽功能**：ZIP 內容預覽和縮圖生成
5. **版本控制**：元件版本管理
6. **標籤系統**：元件分類和搜尋
7. **病毒掃描**：整合防病毒掃描服務

## 相關檔案

- Domain: `src/VisualFlow.Domain/Entities/ComponentFile.cs`
- Application: `src/VisualFlow.Application/Features/RobotConfigs/Commands/UploadComponentFile/`
- Infrastructure: `src/VisualFlow.Infrastructure/Services/ZipValidationService.cs`
- WebApi: `src/VisualFlow.WebApi/Controllers/RobotConfigsController.cs`
- Migration: `src/VisualFlow.Infrastructure/Migrations/*_AddComponentFileTable.cs`
