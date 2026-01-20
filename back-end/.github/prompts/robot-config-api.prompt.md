# 機械手臂配置 API 規格文件

## 概述

本 API 提供機械手臂配置參數的完整生命週期管理，包含建立、讀取、更新、刪除配置，以及關聯的 3D 模型檔案管理功能。

---

## 基礎資訊

**Base URL**: `/api/robot-configs`

**認證方式**: Bearer Token (JWT)

**Content-Type**: `application/json` (檔案上傳時為 `multipart/form-data`)

**通用錯誤回應格式**:
```json
{
  "success": false,
  "message": "錯誤描述",
  "errors": [
    {
      "field": "欄位名稱",
      "message": "欄位錯誤訊息"
    }
  ]
}
```

---

## API 端點規格

### 1. 建立新配置

**端點**: `POST /api/robot-configs`

**描述**: 建立一筆新的機械手臂配置記錄

**請求標頭**:
- `Authorization`: Bearer {token}
- `Content-Type`: application/json

**請求本體**:
```json
{
  "name": "配置名稱 (必填, 1-100字元)",
  "description": "配置說明 (選填, 最多500字元)",
  "transform": {
    "position": [x座標數值, y座標數值, z座標數值],
    "rotation": [x軸旋轉角度, y軸旋轉角度, z軸旋轉角度],
    "scale": [x軸縮放比例, y軸縮放比例, z軸縮放比例]
  },
  "jointAngles": {
    "j1": 關節1角度數值,
    "j2": 關節2角度數值,
    "j3": 關節3角度數值,
    "j4": 關節4角度數值,
    "j5": 關節5角度數值,
    "j6": 關節6角度數值
  },
  "gripper": {
    "gripperValue": 夾爪開合數值 (0-1範圍),
    "clawValue": 爪子開合數值 (0-1範圍)
  },
  "boneControls": [
    {
      "boneName": "骨骼名稱",
      "position": [x, y, z],
      "rotation": [x, y, z],
      "scale": [x, y, z]
    }
  ],
  "materials": [
    {
      "name": "材質名稱",
      "color": "顏色十六進位碼 (格式: #RRGGBB)",
      "metalness": 金屬度數值 (0-1範圍),
      "roughness": 粗糙度數值 (0-1範圍),
      "emissive": "自發光顏色 (選填)",
      "emissiveIntensity": 自發光強度 (選填, 0-10範圍)
    }
  ],
  "tags": ["標籤1", "標籤2"]
}
```

**成功回應** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "配置唯一識別碼",
    "name": "配置名稱",
    "description": "配置說明",
    "transform": { /* 轉換資料 */ },
    "jointAngles": { /* 關節角度資料 */ },
    "gripper": { /* 夾爪資料 */ },
    "boneControls": [ /* 骨骼控制陣列 */ ],
    "materials": [ /* 材質陣列 */ ],
    "gltfModel": null,
    "createdAt": "建立時間 (ISO 8601格式)",
    "updatedAt": "更新時間 (ISO 8601格式)",
    "createdBy": "建立者識別碼",
    "tags": ["標籤陣列"]
  }
}
```

**錯誤回應**:
- `400 Bad Request`: 請求資料驗證失敗
- `401 Unauthorized`: 未提供有效憑證
- `409 Conflict`: 配置名稱已存在

---

### 2. 取得配置列表

**端點**: `GET /api/robot-configs`

**描述**: 取得配置清單，支援分頁、搜尋、排序功能

**查詢參數**:
| 參數名稱 | 類型 | 必填 | 預設值 | 說明 |
|---------|------|------|--------|------|
| `page` | 整數 | 否 | 1 | 頁碼 (最小值: 1) |
| `pageSize` | 整數 | 否 | 10 | 每頁筆數 (範圍: 1-100) |
| `search` | 字串 | 否 | - | 搜尋關鍵字 (比對名稱和說明欄位) |
| `tags` | 字串陣列 | 否 | - | 標籤篩選 (格式: `tags=標籤1&tags=標籤2`) |
| `sortBy` | 字串 | 否 | createdAt | 排序欄位 (可選值: name, createdAt, updatedAt) |
| `sortOrder` | 字串 | 否 | desc | 排序方向 (可選值: asc, desc) |

**範例請求**:
```
GET /api/robot-configs?page=1&pageSize=20&search=機械手臂&sortBy=name&sortOrder=asc
```

**成功回應** (200 OK):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "配置識別碼",
        "name": "配置名稱",
        "description": "配置說明",
        "transform": { /* 簡化資料 */ },
        "jointAngles": { /* 簡化資料 */ },
        "gripper": { /* 簡化資料 */ },
        "gltfModel": { /* 模型元資料或null */ },
        "createdAt": "建立時間",
        "updatedAt": "更新時間",
        "tags": ["標籤陣列"]
      }
    ],
    "total": 總筆數,
    "page": 當前頁碼,
    "pageSize": 每頁筆數,
    "totalPages": 總頁數
  }
}
```

---

### 3. 取得單一配置

**端點**: `GET /api/robot-configs/{id}`

**描述**: 取得指定配置的完整詳細資料

**路徑參數**:
- `id`: 配置唯一識別碼

**成功回應** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "配置識別碼",
    "name": "配置名稱",
    "description": "配置說明",
    "transform": {
      "position": [數值, 數值, 數值],
      "rotation": [數值, 數值, 數值],
      "scale": [數值, 數值, 數值]
    },
    "jointAngles": {
      "j1": 數值, "j2": 數值, "j3": 數值,
      "j4": 數值, "j5": 數值, "j6": 數值
    },
    "gripper": {
      "gripperValue": 數值,
      "clawValue": 數值
    },
    "boneControls": [
      {
        "boneName": "骨骼名稱",
        "position": [數值, 數值, 數值],
        "rotation": [數值, 數值, 數值],
        "scale": [數值, 數值, 數值]
      }
    ],
    "materials": [
      {
        "name": "材質名稱",
        "color": "#十六進位色碼",
        "metalness": 數值,
        "roughness": 數值,
        "emissive": "色碼或null",
        "emissiveIntensity": 數值或null
      }
    ],
    "gltfModel": {
      "id": "模型識別碼",
      "fileName": "檔案名稱",
      "fileSize": 檔案大小(位元組),
      "contentType": "檔案類型",
      "uploadedAt": "上傳時間",
      "url": "下載網址"
    },
    "createdAt": "建立時間",
    "updatedAt": "更新時間",
    "createdBy": "建立者識別碼",
    "tags": ["標籤陣列"]
  }
}
```

**錯誤回應**:
- `404 Not Found`: 指定配置不存在

---

### 4. 更新完整配置

**端點**: `PUT /api/robot-configs/{id}`

**描述**: 完整替換指定配置的所有欄位

**路徑參數**:
- `id`: 配置唯一識別碼

**請求本體**: 與建立配置相同格式，所有必填欄位都需提供

**成功回應** (200 OK):
```json
{
  "success": true,
  "data": { /* 更新後的完整配置物件 */ }
}
```

**錯誤回應**:
- `400 Bad Request`: 請求資料驗證失敗
- `404 Not Found`: 指定配置不存在
- `409 Conflict`: 名稱與其他配置衝突

---

### 5. 部分更新配置

**端點**: `PATCH /api/robot-configs/{id}`

**描述**: 僅更新指定的欄位，未提供的欄位保持不變

**路徑參數**:
- `id`: 配置唯一識別碼

**請求本體** (所有欄位皆為選填):
```json
{
  "name": "新名稱",
  "description": "新說明",
  "transform": { /* 僅更新transform */ },
  "jointAngles": { /* 僅更新關節角度 */ },
  "gripper": { /* 僅更新夾爪 */ },
  "boneControls": [ /* 完全替換骨骼控制陣列 */ ],
  "materials": [ /* 完全替換材質陣列 */ ],
  "tags": [ /* 完全替換標籤 */ ]
}
```

**成功回應** (200 OK):
```json
{
  "success": true,
  "data": { /* 更新後的完整配置物件 */ }
}
```

---

### 6. 刪除配置

**端點**: `DELETE /api/robot-configs/{id}`

**描述**: 刪除指定配置及其關聯的 GLTF 模型檔案

**路徑參數**:
- `id`: 配置唯一識別碼

**成功回應** (200 OK):
```json
{
  "success": true,
  "message": "配置已成功刪除"
}
```

**錯誤回應**:
- `404 Not Found`: 指定配置不存在

---

### 7. 上傳 GLTF 模型檔案

**端點**: `POST /api/robot-configs/{id}/gltf-model`

**描述**: 為指定配置上傳 3D 模型檔案

**路徑參數**:
- `id`: 配置唯一識別碼

**請求標頭**:
- `Content-Type`: multipart/form-data

**請求本體** (表單資料):
| 欄位名稱 | 類型 | 必填 | 說明 |
|---------|------|------|------|
| `file` | 檔案 | 是 | GLTF/GLB 檔案 (最大 50MB) |

**檔案限制**:
- 允許格式: `.gltf`, `.glb`
- 最大檔案大小: 52,428,800 位元組 (50MB)
- 檔案名稱最多 255 字元

**成功回應** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "模型識別碼",
    "fileName": "原始檔案名稱",
    "fileSize": 檔案大小(位元組),
    "contentType": "model/gltf+json 或 model/gltf-binary",
    "uploadedAt": "上傳時間 (ISO 8601)",
    "url": "可下載的完整網址"
  }
}
```

**錯誤回應**:
- `400 Bad Request`: 檔案格式不符或超過大小限制
- `404 Not Found`: 指定配置不存在
- `413 Payload Too Large`: 檔案超過 50MB

---

### 8. 下載 GLTF 模型檔案

**端點**: `GET /api/robot-configs/{id}/gltf-model`

**描述**: 下載指定配置的 3D 模型檔案

**路徑參數**:
- `id`: 配置唯一識別碼

**成功回應** (200 OK):
- Content-Type: `model/gltf+json` 或 `model/gltf-binary`
- Content-Disposition: `attachment; filename="原始檔案名稱"`
- Body: 檔案二進位內容

**錯誤回應**:
- `404 Not Found`: 配置或模型檔案不存在

---

### 9. 取得模型元資料

**端點**: `GET /api/robot-configs/{id}/gltf-model/metadata`

**描述**: 取得模型檔案的詳細資訊，不下載實際檔案

**路徑參數**:
- `id`: 配置唯一識別碼

**成功回應** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "模型識別碼",
    "fileName": "檔案名稱",
    "fileSize": 檔案大小(位元組),
    "contentType": "檔案MIME類型",
    "uploadedAt": "上傳時間",
    "url": "下載網址"
  }
}
```

**錯誤回應**:
- `404 Not Found`: 配置或模型不存在

---

### 10. 刪除 GLTF 模型檔案

**端點**: `DELETE /api/robot-configs/{id}/gltf-model`

**描述**: 刪除指定配置的 3D 模型檔案，但保留配置本身

**路徑參數**:
- `id`: 配置唯一識別碼

**成功回應** (200 OK):
```json
{
  "success": true,
  "message": "模型檔案已成功刪除"
}
```

**錯誤回應**:
- `404 Not Found`: 配置或模型不存在

---

## 資料驗證規則

### 配置名稱 (name)
- 必填
- 長度: 1-100 字元
- 不可與現有配置名稱重複

### 配置說明 (description)
- 選填
- 最大長度: 500 字元

### 三維座標陣列 (position, rotation, scale)
- 必須包含恰好 3 個數值元素
- 每個元素為浮點數

### 關節角度 (j1-j6)
- 所有關節角度必填
- 數值為浮點數

### 夾爪數值 (gripperValue, clawValue)
- 必填
- 範圍: 0 至 1（含）
- 數值為浮點數

### 骨骼控制陣列 (boneControls)
- 選填
- 每個骨骼控制物件必須包含 boneName 字串
- position, rotation, scale 陣列各包含 3 個數值

### 材質陣列 (materials)
- 選填
- color 必須為有效十六進位色碼 (格式: #RRGGBB)
- metalness 和 roughness 範圍: 0 至 1
- emissiveIntensity 範圍: 0 至 10

### 標籤陣列 (tags)
- 選填
- 每個標籤為字串

---

## HTTP 狀態碼說明

| 狀態碼 | 說明 |
|--------|------|
| 200 OK | 請求成功 |
| 201 Created | 資源建立成功 |
| 400 Bad Request | 請求資料格式錯誤或驗證失敗 |
| 401 Unauthorized | 未提供認證憑證或憑證無效 |
| 403 Forbidden | 沒有存取權限 |
| 404 Not Found | 請求的資源不存在 |
| 409 Conflict | 資源衝突（如名稱重複） |
| 413 Payload Too Large | 上傳檔案超過大小限制 |
| 422 Unprocessable Entity | 請求格式正確但邏輯驗證失敗 |
| 500 Internal Server Error | 伺服器內部錯誤 |

---

## 分頁機制說明

列表查詢使用基於頁碼的分頁機制:

**計算方式**:
- 總頁數 = 向上取整(總筆數 / 每頁筆數)
- 回應包含當前頁碼、每頁筆數、總筆數、總頁數

**範例**:
- 總共 95 筆資料
- 每頁 20 筆
- 總頁數 = 5
- 第 1 頁: 項目 1-20
- 第 5 頁: 項目 81-95

---

## 搜尋與篩選說明

### 搜尋 (search 參數)
- 對配置名稱和說明欄位進行模糊比對
- 不區分大小寫
- 支援部分關鍵字匹配

### 標籤篩選 (tags 參數)
- 可提供多個標籤進行 AND 邏輯篩選
- 只回傳同時包含所有指定標籤的配置
- 標籤比對區分大小寫

---

## 排序說明

### 可排序欄位
- `name`: 按配置名稱字母順序排序
- `createdAt`: 按建立時間排序
- `updatedAt`: 按最後更新時間排序

### 排序方向
- `asc`: 升序（小到大、舊到新、A-Z）
- `desc`: 降序（大到小、新到舊、Z-A）

**預設行為**: 若未指定排序參數，預設按建立時間降序排列（最新的在前）
