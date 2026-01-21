# 機械手臂元件管理 API 規格文件

## 概述

本 API 提供機械手臂配置的元件管理功能。元件是可替換的機械手臂附件，以 ZIP 壓縮檔格式提供，包含 3D 模型和相關資源（紋理、材質等）。

檔案儲存於伺服器本地檔案系統，元資料記錄於資料庫中。

---

## 基礎資訊

**Base URL**: `/api/robot-configs/components`

**用途**: 管理可替換的機械手臂元件（夾爪、感測器、工具等）

**認證方式**: Bearer Token (JWT)

**儲存策略**: 
- 檔案儲存位置：伺服器本地檔案系統 (`wwwroot/uploads/components/`)
- 檔案命名規則：`{GUID}.zip`
- 元資料儲存：資料庫中的 `RobotComponents` 資料表

**安全性考量**:
- 檔案類型白名單驗證（僅允許 `.zip`）
- 檔案大小限制（最大 50MB）
- ZIP 內容驗證（僅允許 `.gltf`, `.glb`, `.bin`, `.jpg`, `.png` 等安全檔案）
- 檔名清理（防止路徑遍歷攻擊）
- ZIP 炸彈防護（限制解壓縮後大小）

---

## API 端點規格

### 1. 上傳元件壓縮檔

**端點**: `POST /api/robot-configs/components`

**描述**: 上傳包含 3D 元件模型的 ZIP 壓縮檔。元件可以是夾爪、感測器、工具等可替換的機械手臂附件。ZIP 檔案中應包含 GLTF/GLB 檔案及相關資源（紋理、材質等）。

**請求標頭**:
- `Authorization`: Bearer {token}
- `Content-Type`: multipart/form-data

**請求本體** (表單資料):
| 欄位名稱 | 類型 | 必填 | 說明 |
|---------|------|------|------|
| `file` | File | 是 | ZIP 壓縮檔 |

**檔案限制**:
```
- 允許格式: .zip
- 最大檔案大小: 52,428,800 bytes (50 MB)
- 檔案名稱長度: 1-255 字元
- ZIP 內容限制: 
  - 允許的檔案類型: .gltf, .glb, .bin, .jpg, .jpeg, .png, .json
  - 解壓縮後大小限制: 200 MB（防止 ZIP 炸彈攻擊）
  - 不允許包含可執行檔: .exe, .dll, .so, .sh, .bat, .cmd
```

**處理流程**:
1. 驗證檔案格式和大小
2. 驗證 ZIP 檔案完整性
3. 掃描 ZIP 內容，確保只包含允許的檔案類型
4. 檢查解壓縮後大小（防止 ZIP 炸彈）
5. 生成唯一檔名（GUID.zip）
6. 儲存檔案至伺服器檔案系統
7. 記錄元資料至資料庫
8. 回傳上傳結果和元資料

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

**回應欄位說明**:
| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | GUID | 元件檔案的唯一識別碼 |
| `fileName` | 字串 | 原始檔案名稱 |
| `fileSize` | 整數 | 檔案大小（位元組） |
| `contentType` | 字串 | MIME 類型 (`application/zip`) |
| `uploadedAt` | ISO 8601 | 上傳時間（UTC） |
| `componentType` | 字串 | 元件類型（gripper, sensor, tool, other） |
| `containsFiles` | 陣列 | ZIP 內包含的檔案清單 |
| `url` | 字串 | 下載端點的相對路徑 |

**錯誤回應**:

**400 Bad Request** - 檔案驗證失敗:
```json
{
  "success": false,
  "message": "檔案驗證失敗",
  "errors": [
    {
      "field": "file",
      "message": "只允許 .zip 格式的壓縮檔"
    }
  ]
}
```

可能的驗證錯誤訊息：
- `"檔案為空或未提供"`
- `"只允許 .zip 格式的壓縮檔"`
- `"檔案名稱過長（最多 255 字元）"`
- `"ZIP 檔案損壞或無法讀取"`
- `"ZIP 內包含不允許的檔案類型"`
- `"解壓縮後大小超過 200MB 限制（疑似 ZIP 炸彈）"`
- `"ZIP 內不能包含可執行檔"`

**413 Payload Too Large** - 檔案超過大小限制:
```json
{
  "success": false,
  "message": "檔案大小超過 50MB 限制"
}
```

**500 Internal Server Error** - 伺服器錯誤:
```json
{
  "success": false,
  "message": "檔案儲存失敗，請稍後再試"
}
```

---

### 2. 列出所有元件

**端點**: `GET /api/robot-configs/components`

**描述**: 取得所有已上傳的元件壓縮檔清單，支援分頁和篩選

**請求標頭**:
- `Authorization`: Bearer {token}

**查詢參數**:
| 參數名稱 | 類型 | 必填 | 預設值 | 說明 |
|---------|------|------|--------|------|
| `page` | 整數 | 否 | 1 | 頁碼 |
| `pageSize` | 整數 | 否 | 20 | 每頁筆數 |
| `componentType` | 字串 | 否 | - | 篩選元件類型（gripper, sensor, tool, other） |
| `search` | 字串 | 否 | - | 搜尋檔案名稱 |
| `sortBy` | 字串 | 否 | uploadedAt | 排序欄位（fileName, fileSize, uploadedAt） |
| `sortOrder` | 字串 | 否 | desc | 排序方向（asc, desc） |

**成功回應** (200 OK):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "7c8f4b2a-9d1e-4f3a-b5c6-2e7d8f9a0b1c",
        "fileName": "custom_gripper_v2.zip",
        "fileSize": 3145728,
        "componentType": "gripper",
        "uploadedAt": "2026-01-21T12:45:00Z",
        "uploadedBy": "user@example.com",
        "url": "/api/robot-configs/components/7c8f4b2a-9d1e-4f3a-b5c6-2e7d8f9a0b1c"
      },
      {
        "id": "9e1f2a3b-4c5d-6e7f-8a9b-0c1d2e3f4a5b",
        "fileName": "pressure_sensor.zip",
        "fileSize": 1048576,
        "componentType": "sensor",
        "uploadedAt": "2026-01-21T11:30:00Z",
        "uploadedBy": "user@example.com",
        "url": "/api/robot-configs/components/9e1f2a3b-4c5d-6e7f-8a9b-0c1d2e3f4a5b"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "pageSize": 20,
      "totalItems": 45,
      "totalPages": 3
    }
  }
}
```

**回應欄位說明**:
| 欄位 | 類型 | 說明 |
|------|------|------|
| `items[].id` | GUID | 元件的唯一識別碼 |
| `items[].fileName` | 字串 | 原始檔案名稱 |
| `items[].fileSize` | 整數 | 檔案大小（位元組） |
| `items[].componentType` | 字串 | 元件類型 |
| `items[].uploadedAt` | ISO 8601 | 上傳時間 |
| `items[].uploadedBy` | 字串 | 上傳者識別 |
| `items[].url` | 字串 | 下載端點 |
| `pagination.currentPage` | 整數 | 當前頁碼 |
| `pagination.pageSize` | 整數 | 每頁筆數 |
| `pagination.totalItems` | 整數 | 總元件數 |
| `pagination.totalPages` | 整數 | 總頁數 |

**錯誤回應**:

**401 Unauthorized** - 未授權:
```json
{
  "success": false,
  "message": "缺少或無效的認證 token"
}
```

---

## 檔案驗證規則

### ZIP 檔案驗證

**允許的副檔名**:
- `.zip` - ZIP 壓縮檔

**ZIP 內容白名單**:
```
允許的檔案類型:
- 3D 模型: .gltf, .glb, .bin
- 紋理圖片: .jpg, .jpeg, .png, .webp
- 設定檔: .json
- 文件: .txt, .md

禁止的檔案類型:
- 可執行檔: .exe, .dll, .so, .dylib
- 腳本: .sh, .bat, .cmd, .ps1
- 壓縮檔: .zip, .rar, .7z (避免巢狀壓縮)
```

**ZIP 安全驗證**:
```
1. 檔案完整性檢查（CRC 驗證）
2. 解壓縮前預估大小（防止 ZIP 炸彈）
   - 壓縮率檢查: 解壓後大小 / 壓縮大小 < 20
   - 最大解壓縮大小: 200 MB
3. 檔名安全檢查:
   - 禁止路徑遍歷: ../, ..\, /etc/, C:\
   - 禁止絕對路徑
   - 檔名長度限制: 255 字元
```

**檔案大小限制**:
```
最小: 1 byte
最大壓縮大小: 52,428,800 bytes (50 MB)
最大解壓縮大小: 209,715,200 bytes (200 MB)
```

---

## 錯誤處理指南

### 上傳失敗的常見原因

| 錯誤情境 | HTTP 狀態碼 | 錯誤訊息 | 解決方案 |
|---------|-------------|---------|---------|
| 未選擇檔案 | 400 | 檔案為空或未提供 | 確認已選擇檔案 |
| 非 ZIP 格式 | 400 | 只允許 .zip 格式的壓縮檔 | 使用 ZIP 格式壓縮 |
| 檔案過大 | 413 | 檔案大小超過 50MB 限制 | 減少紋理解析度或壓縮檔案 |
| ZIP 損壞 | 400 | ZIP 檔案損壞或無法讀取 | 重新壓縮檔案 |
| 包含禁止檔案 | 400 | ZIP 內包含不允許的檔案類型 | 移除 .exe, .dll 等可執行檔 |
| ZIP 炸彈 | 400 | 解壓縮後大小超過 200MB 限制 | 減少內容或分批上傳 |
| 路徑遍歷攻擊 | 400 | ZIP 內包含不安全的檔案路徑 | 確保檔案路徑不含 ../ |
| 磁碟空間不足 | 500 | 檔案儲存失敗 | 聯絡系統管理員 |
| 未授權 | 401 | 缺少或無效的認證 token | 提供有效的 JWT token |

### 查詢失敗的常見原因

| 錯誤情景 | HTTP 狀態碼 | 錯誤訊息 | 解決方案 |
|---------|-------------|---------|---------|
| 未授權 | 401 | 缺少或無效的認證 token | 提供有效的 JWT token |
| 無效的分頁參數 | 400 | 分頁參數無效 | 確認 page 和 pageSize 為正整數 |

---



## 安全性最佳實踐

### 檔案上傳驗證

**驗證層級**:
```
第一層：副檔名檢查（.zip）
第二層：Content-Type 驗證
第三層：ZIP 完整性驗證（CRC 檢查）
第四層：ZIP 內容掃描（白名單驗證）
第五層：解壓縮大小預估（ZIP 炸彈防護）
第六層：路徑安全檢查（防止路徑遍歷）
第七層：檔案大小限制
```

### 防止的攻擊類型

- 路徑遍歷攻擊（Path Traversal）
- 檔案覆蓋攻擊
- 惡意檔案上傳
- ZIP 炸彈攻擊
- 巢狀壓縮檔攻擊
- 可執行檔注入

### ZIP 安全特別注意事項

**ZIP 炸彈防護實作**:
```csharp
// 檢查壓縮率
var compressionRatio = uncompressedSize / compressedSize;
if (compressionRatio > 20) {
    throw new SecurityException("疑似 ZIP 炸彈攻擊");
}

// 限制解壓縮大小
const long MaxUncompressedSize = 209715200; // 200 MB
if (uncompressedSize > MaxUncompressedSize) {
    throw new SecurityException("解壓縮後大小超過限制");
}
```

**路徑遍歷防護實作**:
```csharp
// 檢查 ZIP 內的檔案路徑
foreach (var entry in zipArchive.Entries) {
    var fullPath = Path.GetFullPath(Path.Combine(extractPath, entry.FullName));
    if (!fullPath.StartsWith(extractPath)) {
        throw new SecurityException("偵測到路徑遍歷攻擊");
    }
}
```

---

## HTTP 狀態碼完整列表

| 狀態碼 | 名稱 | 使用情境 |
|--------|------|---------|
| 200 OK | 成功 | 上傳、查詢成功 |
| 400 Bad Request | 錯誤請求 | 檔案驗證失敗、參數錯誤 |
| 401 Unauthorized | 未授權 | 缺少或無效的 token |
| 403 Forbidden | 禁止存取 | 沒有權限執行操作 |
| 413 Payload Too Large | 負載過大 | 檔案超過 50MB |
| 415 Unsupported Media Type | 不支援的媒體類型 | 檔案格式不正確 |
| 500 Internal Server Error | 伺服器錯誤 | 檔案系統錯誤、資料庫錯誤 |
| 503 Service Unavailable | 服務不可用 | 伺服器維護中 |


### 1. 上傳元件壓縮檔

**端點**: `POST /api/robot-configs/components`

**描述**: 上傳包含 3D 元件模型的 ZIP 壓縮檔。元件可以是夾爪、感測器、工具等可替換的機械手臂附件。ZIP 檔案中應包含 GLTF/GLB 檔案及相關資源（紋理、材質等）。

**請求標頭**:
- `Authorization`: Bearer {token}
- `Content-Type`: multipart/form-data

**請求本體** (表單資料):
| 欄位名稱 | 類型 | 必填 | 說明 |
|---------|------|------|------|
| `file` | File | 是 | ZIP 壓縮檔 |

**檔案限制**:
```
- 允許格式: .zip
- 最大檔案大小: 52,428,800 bytes (50 MB)
- 檔案名稱長度: 1-255 字元
- ZIP 內容限制: 
  - 允許的檔案類型: .gltf, .glb, .bin, .jpg, .jpeg, .png, .json
  - 解壓縮後大小限制: 200 MB（防止 ZIP 炸彈攻擊）
  - 不允許包含可執行檔: .exe, .dll, .so, .sh, .bat, .cmd
```

**處理流程**:
1. 驗證檔案格式和大小
2. 驗證 ZIP 檔案完整性
3. 掃描 ZIP 內容，確保只包含允許的檔案類型
4. 檢查解壓縮後大小（防止 ZIP 炸彈）
5. 生成唯一檔名（GUID.zip）
6. 儲存檔案至伺服器檔案系統
7. 記錄元資料至資料庫
8. 回傳上傳結果和元資料

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

**回應欄位說明**:
| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | GUID | 元件檔案的唯一識別碼 |
| `fileName` | 字串 | 原始檔案名稱 |
| `fileSize` | 整數 | 檔案大小（位元組） |
| `contentType` | 字串 | MIME 類型 (`application/zip`) |
| `uploadedAt` | ISO 8601 | 上傳時間（UTC） |
| `componentType` | 字串 | 元件類型（gripper, sensor, tool, other） |
| `containsFiles` | 陣列 | ZIP 內包含的檔案清單 |
| `url` | 字串 | 下載端點的相對路徑 |

**錯誤回應**:

**400 Bad Request** - 檔案驗證失敗:
```json
{
  "success": false,
  "message": "檔案驗證失敗",
  "errors": [
    {
      "field": "file",
      "message": "只允許 .zip 格式的壓縮檔"
    }
  ]
}
```

可能的驗證錯誤訊息：
- `"檔案為空或未提供"`
- `"只允許 .zip 格式的壓縮檔"`
- `"檔案名稱過長（最多 255 字元）"`
- `"ZIP 檔案損壞或無法讀取"`
- `"ZIP 內包含不允許的檔案類型"`
- `"解壓縮後大小超過 200MB 限制（疑似 ZIP 炸彈）"`
- `"ZIP 內不能包含可執行檔"`

**413 Payload Too Large** - 檔案超過大小限制:
```json
{
  "success": false,
  "message": "檔案大小超過 50MB 限制"
}
```

**500 Internal Server Error** - 伺服器錯誤:
```json
{
  "success": false,
  "message": "檔案儲存失敗，請稍後再試"
}
```

---

### 2. 列出所有元件

**端點**: `GET /api/robot-configs/components`

**描述**: 取得所有已上傳的元件壓縮檔清單，支援分頁和篩選

**請求標頭**:
- `Authorization`: Bearer {token}

**查詢參數**:
| 參數名稱 | 類型 | 必填 | 預設值 | 說明 |
|---------|------|------|--------|------|
| `page` | 整數 | 否 | 1 | 頁碼 |
| `pageSize` | 整數 | 否 | 20 | 每頁筆數 |
| `componentType` | 字串 | 否 | - | 篩選元件類型（gripper, sensor, tool, other） |
| `search` | 字串 | 否 | - | 搜尋檔案名稱 |
| `sortBy` | 字串 | 否 | uploadedAt | 排序欄位（fileName, fileSize, uploadedAt） |
| `sortOrder` | 字串 | 否 | desc | 排序方向（asc, desc） |

**成功回應** (200 OK):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "7c8f4b2a-9d1e-4f3a-b5c6-2e7d8f9a0b1c",
        "fileName": "custom_gripper_v2.zip",
        "fileSize": 3145728,
        "componentType": "gripper",
        "uploadedAt": "2026-01-21T12:45:00Z",
        "uploadedBy": "user@example.com",
        "url": "/api/robot-configs/components/7c8f4b2a-9d1e-4f3a-b5c6-2e7d8f9a0b1c"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "pageSize": 20,
      "totalItems": 45,
      "totalPages": 3
    }
  }
}
```

---

## Content-Type 對應表

| 副檔名 | Content-Type | 說明 |
|--------|--------------|------|
| `.zip` | `application/zip` | 元件壓縮檔 |

---

**允許的副檔名**:
- `.zip` - ZIP 壓縮檔

**ZIP 內容白名單**:
```
允許的檔案類型:
- 3D 模型: .gltf, .glb, .bin
- 紋理圖片: .jpg, .jpeg, .png, .webp
- 設定檔: .json
- 文件: .txt, .md

禁止的檔案類型:
- 可執行檔: .exe, .dll, .so, .dylib
- 腳本: .sh, .bat, .cmd, .ps1
- 壓縮檔: .zip, .rar, .7z (避免巢狀壓縮)
```

**ZIP 安全驗證**:
```
1. 檔案完整性檢查（CRC 驗證）
2. 解壓縮前預估大小（防止 ZIP 炸彈）
   - 壓縮率檢查: 解壓後大小 / 壓縮大小 < 20
   - 最大解壓縮大小: 200 MB
3. 檔名安全檢查:
   - 禁止路徑遍歷: ../, ..\, /etc/, C:\
   - 禁止絕對路徑
   - 檔名長度限制: 255 字元
```

**檔案大小限制**:
```
最小: 1 byte
最大壓縮大小: 52,428,800 bytes (50 MB)
最大解壓縮大小: 209,715,200 bytes (200 MB)
```

---

## Content-Type 對應表

| 副檔名 | Content-Type | 說明 |
|--------|--------------|------|
| `.gltf` | `model/gltf+json` | JSON 格式的 GLTF 檔案 |
| `.glb` | `model/gltf-binary` | 二進位格式的 GLTF 檔案 |
| `.zip` | `application/zip` | 元件壓縮檔 |

---

## 檔案儲存路徑結構

```
wwwroot/
└── uploads/
    ├── gltf-models/
    │   ├── 3fa85f64-5717-4562-b3fc-2c963f66afa6.gltf
    │   ├── 7b2c4a91-8e3f-4c2d-9a1b-5d6e7f8a9b0c.glb
    │   ├── a1b2c3d4-e5f6-7890-abcd-ef1234567890.gltf
    │   └── manifest.json  ← 元資料快取
    └── components/
        ├── 7c8f4b2a-9d1e-4f3a-b5c6-2e7d8f9a0b1c.zip
        ├── 9e1f2a3b-4c5d-6e7f-8a9b-0c1d2e3f4a5b.zip
        ├── b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e.zip
        └── manifest.json  ← 元資料快取
```

**路徑特性**:
- 所有檔案扁平化儲存（不使用子資料夾）
- GLTF 模型使用 GUID + 原始副檔名
- 元件壓縮檔統一使用 GUID.zip
- 避免路徑遍歷攻擊（不允許 `../` 等字元）
- 每個目錄包含 `manifest.json` 作為元資料快取

---

## 元資料快取（manifest.json）

### 概述

為了提升檔案查詢效能，每個檔案儲存目錄都包含一個 `manifest.json` 檔案，用於快取所有檔案的元資料。這避免了頻繁的資料庫查詢，並提供更快的檔案列表響應。

### GLTF 模型 Manifest 結構

**位置**: `wwwroot/uploads/gltf-models/manifest.json`

```json
{
  "version": "1.0",
  "lastUpdated": "2026-01-21T12:45:00Z",
  "totalFiles": 3,
  "totalSize": 15728640,
  "files": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "configId": "abc-123-def-456",
      "fileName": "robotic_arm_v1.gltf",
      "storedFileName": "3fa85f64-5717-4562-b3fc-2c963f66afa6.gltf",
      "fileSize": 2485760,
      "contentType": "model/gltf+json",
      "uploadedAt": "2026-01-21T10:30:00Z",
      "uploadedBy": "user@example.com",
      "checksum": "sha256:a3b2c1d4e5f6..."
    },
    {
      "id": "7b2c4a91-8e3f-4c2d-9a1b-5d6e7f8a9b0c",
      "configId": "xyz-789-ghi-012",
      "fileName": "robot_arm_industrial.glb",
      "storedFileName": "7b2c4a91-8e3f-4c2d-9a1b-5d6e7f8a9b0c.glb",
      "fileSize": 8388608,
      "contentType": "model/gltf-binary",
      "uploadedAt": "2026-01-21T11:15:00Z",
      "uploadedBy": "admin@example.com",
      "checksum": "sha256:b4c3d2e1f6a5..."
    }
  ]
}
```

### 元件壓縮檔 Manifest 結構

**位置**: `wwwroot/uploads/components/manifest.json`

```json
{
  "version": "1.0",
  "lastUpdated": "2026-01-21T13:00:00Z",
  "totalFiles": 5,
  "totalSize": 45678912,
  "files": [
    {
      "id": "7c8f4b2a-9d1e-4f3a-b5c6-2e7d8f9a0b1c",
      "fileName": "custom_gripper_v2.zip",
      "storedFileName": "7c8f4b2a-9d1e-4f3a-b5c6-2e7d8f9a0b1c.zip",
      "fileSize": 3145728,
      "contentType": "application/zip",
      "componentType": "gripper",
      "uploadedAt": "2026-01-21T12:45:00Z",
      "uploadedBy": "user@example.com",
      "checksum": "sha256:c5d4e3f2a1b6...",
      "containsFiles": [
        "gripper.glb",
        "textures/metal_roughness.jpg",
        "textures/normal_map.png"
      ],
      "uncompressedSize": 8912345
    }
  ]
}
```

### Manifest 欄位說明

| 欄位 | 類型 | 說明 |
|------|------|------|
| `version` | 字串 | Manifest 格式版本（目前為 "1.0"） |
| `lastUpdated` | ISO 8601 | 最後更新時間 |
| `totalFiles` | 整數 | 目錄中的檔案總數 |
| `totalSize` | 整數 | 所有檔案的總大小（位元組） |
| `files` | 陣列 | 檔案元資料陣列 |
| `files[].id` | GUID | 檔案的唯一識別碼 |
| `files[].fileName` | 字串 | 原始檔案名稱 |
| `files[].storedFileName` | 字串 | 儲存在檔案系統中的檔名 |
| `files[].fileSize` | 整數 | 檔案大小（位元組） |
| `files[].contentType` | 字串 | MIME 類型 |
| `files[].uploadedAt` | ISO 8601 | 上傳時間 |
| `files[].uploadedBy` | 字串 | 上傳者識別 |
| `files[].checksum` | 字串 | 檔案校驗和（SHA-256） |
| `files[].componentType` | 字串 | 元件類型（僅限元件檔案） |
| `files[].containsFiles` | 陣列 | ZIP 內包含的檔案清單（僅限元件檔案） |
| `files[].uncompressedSize` | 整數 | 解壓縮後大小（僅限元件檔案） |
| `files[].configId` | GUID | 關聯的配置 ID（僅限 GLTF 檔案） |

### Manifest 更新時機

**自動更新情境**:
1. **檔案上傳成功後**: 立即將新檔案的元資料附加到 manifest
2. **檔案刪除後**: 從 manifest 中移除對應的條目
3. **檔案系統掃描**: 定期掃描檔案系統與 manifest 同步（建議每小時執行）

**實作建議**:
```csharp
public async Task UpdateManifestAsync(string directory, FileMetadata newFile) 
{
    var manifestPath = Path.Combine(directory, "manifest.json");
    
    // 讀取現有 manifest（或建立新的）
    var manifest = await ReadManifestAsync(manifestPath) ?? new Manifest();
    
    // 更新檔案列表
    manifest.Files.Add(newFile);
    manifest.TotalFiles = manifest.Files.Count;
    manifest.TotalSize = manifest.Files.Sum(f => f.FileSize);
    manifest.LastUpdated = DateTime.UtcNow;
    
    // 原子性寫入（先寫到臨時檔，再重新命名）
    var tempPath = $"{manifestPath}.tmp";
    await File.WriteAllTextAsync(tempPath, JsonSerializer.Serialize(manifest, options));
    File.Move(tempPath, manifestPath, overwrite: true);
}
```

### 使用 Manifest 的優勢

**效能提升**:
- 快速列出檔案清單，無需資料庫查詢
- 減少磁碟 I/O（不需要逐一讀取檔案屬性）
- 支援快速全文搜尋（JSON 檔案可被索引）

**資料完整性**:
- 包含 SHA-256 校驗和，驗證檔案完整性
- 記錄上傳者和時間，便於審計
- 快速識別孤兒檔案（manifest 有但檔案系統沒有）

**運維便利性**:
- 單一檔案即可瞭解目錄內容
- 便於備份和還原時驗證
- 支援離線查詢（不需要連接資料庫）

### 安全性考量

**存取控制**:
- Manifest 檔案應與資料檔案有相同的權限
- 僅允許應用程式寫入，管理員唯讀

**資料驗證**:
```csharp
// 驗證 manifest 與實際檔案是否一致
public async Task<bool> ValidateManifestAsync(string directory) 
{
    var manifest = await ReadManifestAsync(Path.Combine(directory, "manifest.json"));
    if (manifest == null) return false;
    
    foreach (var file in manifest.Files) 
    {
        var filePath = Path.Combine(directory, file.StoredFileName);
        
        // 檢查檔案是否存在
        if (!File.Exists(filePath)) 
        {
            logger.LogWarning($"Manifest 中的檔案不存在: {file.StoredFileName}");
            return false;
        }
        
        // 驗證檔案大小
        var actualSize = new FileInfo(filePath).Length;
        if (actualSize != file.FileSize) 
        {
            logger.LogWarning($"檔案大小不符: {file.StoredFileName}");
            return false;
        }
        
        // 驗證校驗和（可選，較耗時）
        var actualChecksum = await ComputeChecksumAsync(filePath);
        if (actualChecksum != file.Checksum) 
        {
            logger.LogError($"檔案校驗和不符: {file.StoredFileName}");
            return false;
        }
    }
    
    return true;
}
```

**併發控制**:
- 使用檔案鎖定機制避免同時寫入
- 或使用訊息佇列序列化更新操作

### 災難恢復

**從 Manifest 重建資料庫**:
```csharp
public async Task RebuildDatabaseFromManifestAsync(string directory) 
{
    var manifest = await ReadManifestAsync(Path.Combine(directory, "manifest.json"));
    if (manifest == null) 
    {
        throw new InvalidOperationException("找不到 manifest.json");
    }
    
    foreach (var file in manifest.Files) 
    {
        // 檢查資料庫中是否存在
        var exists = await db.Files.AnyAsync(f => f.Id == file.Id);
        if (!exists) 
        {
            // 重建資料庫記錄
            await db.Files.AddAsync(new FileEntity 
            {
                Id = file.Id,
                FileName = file.FileName,
                FileSize = file.FileSize,
                ContentType = file.ContentType,
                UploadedAt = file.UploadedAt,
                UploadedBy = file.UploadedBy,
                Checksum = file.Checksum
            });
            
            logger.LogInformation($"從 manifest 恢復檔案記錄: {file.FileName}");
        }
    }
    
    await db.SaveChangesAsync();
}
```

**從資料庫重建 Manifest**:
```csharp
public async Task RebuildManifestFromDatabaseAsync(string directory) 
{
    var files = await db.Files
        .Where(f => f.StoragePath.StartsWith(directory))
        .ToListAsync();
    
    var manifest = new Manifest 
    {
        Version = "1.0",
        LastUpdated = DateTime.UtcNow,
        TotalFiles = files.Count,
        TotalSize = files.Sum(f => f.FileSize),
        Files = files.Select(f => new FileMetadata 
        {
            Id = f.Id,
            FileName = f.FileName,
            StoredFileName = Path.GetFileName(f.StoragePath),
            FileSize = f.FileSize,
            ContentType = f.ContentType,
            UploadedAt = f.UploadedAt,
            UploadedBy = f.UploadedBy,
            Checksum = f.Checksum
        }).ToList()
    };
    
    var manifestPath = Path.Combine(directory, "manifest.json");
    await File.WriteAllTextAsync(manifestPath, JsonSerializer.Serialize(manifest));
    
    logger.LogInformation($"已重建 manifest.json，共 {files.Count} 個檔案");
}
```

---

## 錯誤處理指南

### GLTF 模型上傳失敗的常見原因

| 錯誤情境 | HTTP 狀態碼 | 錯誤訊息 | 解決方案 |
|---------|-------------|---------|---------|
| 未選擇檔案 | 400 | 檔案為空或未提供 | 確認已選擇檔案 |
| 副檔名不符 | 400 | 只允許 .gltf 或 .glb 格式 | 使用正確格式的檔案 |
| 檔案過大 | 413 | 檔案大小超過 50MB 限制 | 壓縮模型或減少多邊形數量 |
| GLB 格式錯誤 | 400 | GLB 檔案格式驗證失敗 | 使用 GLTF 驗證工具檢查檔案 |
| 配置不存在 | 404 | 找不到指定的機械手臂配置 | 確認 configId 正確 |
| 磁碟空間不足 | 500 | 檔案儲存失敗 | 聯絡系統管理員 |
| 權限不足 | 403 | 沒有上傳權限 | 確認已登入且有權限 |

### 元件壓縮檔上傳失敗的常見原因

| 錯誤情境 | HTTP 狀態碼 | 錯誤訊息 | 解決方案 |
|---------|-------------|---------|---------|
| 未選擇檔案 | 400 | 檔案為空或未提供 | 確認已選擇檔案 |
| 非 ZIP 格式 | 400 | 只允許 .zip 格式的壓縮檔 | 使用 ZIP 格式壓縮 |
| 檔案過大 | 413 | 檔案大小超過 50MB 限制 | 減少紋理解析度或壓縮檔案 |
| ZIP 損壞 | 400 | ZIP 檔案損壞或無法讀取 | 重新壓縮檔案 |
| 包含禁止檔案 | 400 | ZIP 內包含不允許的檔案類型 | 移除 .exe, .dll 等可執行檔 |
| ZIP 炸彈 | 400 | 解壓縮後大小超過 200MB 限制 | 減少內容或分批上傳 |
| 路徑遍歷攻擊 | 400 | ZIP 內包含不安全的檔案路徑 | 確保檔案路徑不含 ../ |
| 磁碟空間不足 | 500 | 檔案儲存失敗 | 聯絡系統管理員 |

### 下載失敗的常見原因

| 錯誤情境 | HTTP 狀態碼 | 錯誤訊息 | 解決方案 |
|---------|-------------|---------|---------|
| 模型不存在 | 404 | 找不到 GLTF 模型檔案 | 確認已上傳模型 |
| 元件不存在 | 404 | 找不到指定的元件檔案 | 確認 componentId 正確 |
| 檔案遺失 | 500 | 無法讀取模型檔案 | 聯絡系統管理員 |
| 權限不足 | 403 | 沒有下載權限 | 確認已登入且有權限 |

---

## 安全性最佳實踐

### 1. 檔案上傳安全

**GLTF 模型驗證層級**:
```
第一層：副檔名檢查（.gltf, .glb）
第二層：Content-Type 驗證
第三層：Magic Bytes 檢查（GLB 檔案）
第四層：檔案大小限制
第五層：檔名清理
```

**元件壓縮檔驗證層級**:
```
第一層：副檔名檢查（.zip）
第二層：Content-Type 驗證
第三層：ZIP 完整性驗證（CRC 檢查）
第四層：ZIP 內容掃描（白名單驗證）
第五層：解壓縮大小預估（ZIP 炸彈防護）
第六層：路徑安全檢查（防止路徑遍歷）
第七層：檔案大小限制
```

**防止的攻擊類型**:
- 路徑遍歷攻擊（Path Traversal）
- 檔案覆蓋攻擊
- 惡意檔案上傳
- 磁碟空間耗盡（DoS）
- ZIP 炸彈攻擊
- 巢狀壓縮檔攻擊
- 可執行檔注入

### 2. ZIP 安全特別注意事項

**ZIP 炸彈防護**:
```csharp
// 檢查壓縮率
var compressionRatio = uncompressedSize / compressedSize;
if (compressionRatio > 20) {
    throw new SecurityException("疑似 ZIP 炸彈攻擊");
}

// 限制解壓縮大小
const long MaxUncompressedSize = 209715200; // 200 MB
if (uncompressedSize > MaxUncompressedSize) {
    throw new SecurityException("解壓縮後大小超過限制");
}
```

**路徑遍歷防護**:
```csharp
// 檢查 ZIP 內的檔案路徑
foreach (var entry in zipArchive.Entries) {
    var fullPath = Path.GetFullPath(Path.Combine(extractPath, entry.FullName));
    if (!fullPath.StartsWith(extractPath)) {
        throw new SecurityException("偵測到路徑遍歷攻擊");
    }
}
```

### 3. 檔案存取控制

**建議實作**:
- 驗證使用者是否有權限存取特定配置的模型
- 記錄檔案存取日誌（誰、何時、存取了哪個檔案）
- 限制下載頻率（防止濫用）

### 4. 檔案命名安全

**不安全的做法**:
```csharp
// ❌ 直接使用使用者提供的檔名
var filePath = Path.Combine(uploadFolder, file.FileName);
```

**安全的做法**:
```csharp
// ✅ 使用 GUID 重新命名
var uniqueFileName = $"{Guid.NewGuid()}{extension}";
var filePath = Path.Combine(uploadFolder, uniqueFileName);
```

---

## 使用範例

### 範例 1: 使用 JavaScript 上傳元件壓縮檔

```javascript
async function uploadComponentZip(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/robot-configs/components', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (response.ok) {
    const result = await response.json();
    console.log('元件上傳成功:', result.data);
    return result.data;
  } else {
    const error = await response.json();
    console.error('上傳失敗:', error.message);
    throw new Error(error.message);
  }
}

// 使用檔案選擇器
document.getElementById('zipInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file && file.name.endsWith('.zip')) {
    try {
      const component = await uploadComponentZip(file);
      alert(`元件上傳成功！ID: ${component.id}`);
    } catch (error) {
      alert(`上傳失敗: ${error.message}`);
    }
  } else {
    alert('請選擇 ZIP 檔案');
  }
});
```

### 範例 2: 使用 JavaScript 上傳 GLTF 檔案

```javascript
async function uploadGltfModel(configId, file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    `/api/robot-configs/${configId}/gltf-model`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    }
  );

  if (response.ok) {
    const result = await response.json();
    console.log('上傳成功:', result.data);
    return result.data;
  } else {
    const error = await response.json();
    console.error('上傳失敗:', error.message);
    throw new Error(error.message);
  }
}

// 使用檔案選擇器
document.getElementById('fileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    try {
      await uploadGltfModel('abc-123-def', file);
      alert('模型上傳成功！');
    } catch (error) {
      alert(`上傳失敗: ${error.message}`);
    }
  }
});
```

### 範例 3: 載入並顯示 GLTF 模型

```javascript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

async function loadRobotModel(configId) {
  // 1. 取得元資料
  const metadataResponse = await fetch(
    `/api/robot-configs/${configId}/gltf-model/metadata`
  );
  const metadata = await metadataResponse.json();

  // 2. 載入模型
  const loader = new GLTFLoader();
  loader.load(
    metadata.data.url,
    (gltf) => {
      scene.add(gltf.scene);
      console.log('模型載入完成');
    },
    (progress) => {
      const percent = (progress.loaded / progress.total) * 100;
      console.log(`載入進度: ${percent.toFixed(2)}%`);
    },
    (error) => {
      console.error('載入失敗:', error);
    }
  );
}
```

### 範例 4: React 元件 - 上傳元件壓縮檔

```tsx
import { robotConfigService } from '@/services';

function ComponentUploader() {
  const [uploading, setUploading] = useState(false);
  const [components, setComponents] = useState<Component[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    // 檔案驗證
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setError('只支援 ZIP 壓縮檔');
      return;
    }
    
    if (file.size > 52428800) {
      setError('檔案大小不可超過 50MB');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const response = await robotConfigService.uploadComponent(file);
      
      if (response.isSuccess) {
        setComponents(prev => [response.data, ...prev]);
        alert('✅ 元件上傳成功！');
      } else {
        setError(response.message || '上傳失敗');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '上傳發生錯誤');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".zip"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
        disabled={uploading}
      />
      
      {uploading && <p>上傳中...</p>}
      {error && <p className="error">{error}</p>}
      
      <div className="components-list">
        {components.map((comp) => (
          <div key={comp.id}>
            <p>{comp.fileName}</p>
            <p>{(comp.fileSize / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 範例 5: React 元件 - 上傳 GLTF 模型

```tsx
import { robotConfigService } from '@/services';

function GltfModelUploader({ configId }: { configId: string }) {
  const [uploading, setUploading] = useState(false);
  const [metadata, setMetadata] = useState<GltfModelMetadata | null>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const response = await robotConfigService.uploadGltfModel(configId, file);
      if (response.isSuccess) {
        setMetadata(response.data as GltfModelMetadata);
        alert('✅ 模型上傳成功！');
      } else {
        alert(`❌ 上傳失敗: ${response.message}`);
      }
    } catch (error) {
      alert('❌ 上傳時發生錯誤');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('確定要刪除此模型嗎？')) return;
    
    const response = await robotConfigService.deleteGltfModel(configId);
    if (response.isSuccess) {
      setMetadata(null);
      alert('✅ 模型已刪除');
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".gltf,.glb"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
        disabled={uploading}
      />
      {uploading && <p>上傳中...</p>}
      {metadata && (
        <div>
          <p>檔案名稱: {metadata.fileName}</p>
          <p>檔案大小: {(metadata.fileSize / 1024 / 1024).toFixed(2)} MB</p>
          <p>上傳時間: {new Date(metadata.uploadedAt).toLocaleString()}</p>
          <button onClick={handleDelete}>刪除模型</button>
        </div>
      )}
    </div>
  );
}
```

---

## 效能優化建議

### 1. 大檔案處理

**分段上傳（未來擴充）**:
- 對於超過 10MB 的檔案，建議實作分段上傳
- 支援斷點續傳功能
- 提供上傳進度回報

### 2. 下載優化

**串流傳輸**:
```csharp
// 使用 FileStreamResult 進行串流傳輸
return new FileStreamResult(fileStream, contentType)
{
    FileDownloadName = fileName,
    EnableRangeProcessing = true // 支援斷點續傳
};
```

### 3. 快取策略

**HTTP 快取標頭**:
```
Cache-Control: public, max-age=31536000
ETag: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
Last-Modified: Tue, 21 Jan 2026 10:30:00 GMT
```

---

## 監控與日誌

### 建議記錄的事件

| 事件類型 | 記錄內容 | 重要性 |
|---------|---------|--------|
| GLTF 上傳 | 使用者 ID、配置 ID、檔案大小、檔案名稱、上傳時間 | 高 |
| 元件上傳 | 使用者 ID、檔案大小、檔案名稱、元件類型、上傳時間 | 高 |
| 檔案下載 | 使用者 ID、檔案 ID、檔案類型、下載時間 | 中 |
| 檔案刪除 | 使用者 ID、檔案 ID、檔案類型、刪除時間 | 高 |
| 上傳失敗 | 使用者 ID、錯誤原因、檔案大小、檔案類型 | 高 |
| 驗證失敗 | IP 位址、失敗原因、嘗試次數、檔案類型 | 高 |
| ZIP 安全警告 | 使用者 ID、警告類型（炸彈/路徑遍歷/禁止檔案）、檔案資訊 | 極高 |

### 監控指標

- 平均上傳時間（GLTF 與元件分開統計）
- 上傳成功率（分檔案類型）
- 磁碟空間使用量（分目錄統計）
- 單日上傳檔案數量和總大小
- 異常錯誤率
- ZIP 安全警告次數
- 檔案下載次數和流量
- Manifest 同步狀態（資料庫與檔案系統的一致性）
- Manifest 校驗失敗次數

---

## 附錄：HTTP 狀態碼完整列表

| 狀態碼 | 名稱 | 使用情境 |
|--------|------|---------|
| 200 OK | 成功 | 上傳、刪除、查詢成功 |
| 400 Bad Request | 錯誤請求 | 檔案驗證失敗、參數錯誤 |
| 401 Unauthorized | 未授權 | 缺少或無效的 token |
| 403 Forbidden | 禁止存取 | 沒有權限執行操作 |
| 404 Not Found | 未找到 | 配置或模型不存在 |
| 413 Payload Too Large | 負載過大 | 檔案超過 50MB |
| 415 Unsupported Media Type | 不支援的媒體類型 | 檔案格式不正確 |
| 500 Internal Server Error | 伺服器錯誤 | 檔案系統錯誤、資料庫錯誤 |
| 503 Service Unavailable | 服務不可用 | 伺服器維護中 |
