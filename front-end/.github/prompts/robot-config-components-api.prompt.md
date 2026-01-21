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

**400 Bad Request** - 無效的分頁參數:
```json
{
  "success": false,
  "message": "分頁參數無效"
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

## 使用範例

### React 元件 - 上傳元件壓縮檔

```tsx
import { useState } from 'react';
import { robotConfigService } from '@/services';

export function ComponentUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const response = await robotConfigService.uploadComponent(file);
      
      if (response.success) {
        console.log('上傳成功:', response.data);
        // 重新載入元件清單或導向到詳細頁面
      } else {
        setError(response.message || '上傳失敗');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知錯誤');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".zip"
        onChange={handleFileSelect}
        disabled={uploading}
      />
      {uploading && <p>正在上傳...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
```

### React 元件 - 列出所有元件

```tsx
import { useEffect, useState } from 'react';
import { robotConfigService } from '@/services';

export function ComponentList() {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const loadComponents = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/robot-configs/components?page=${page}&pageSize=20`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (response.ok) {
          const result = await response.json();
          setComponents(result.data.items);
        }
      } catch (err) {
        console.error('載入失敗:', err);
      } finally {
        setLoading(false);
      }
    };

    loadComponents();
  }, [page]);

  if (loading) return <p>載入中...</p>;

  return (
    <div>
      {components.map(comp => (
        <div key={comp.id}>
          <h3>{comp.fileName}</h3>
          <p>類型: {comp.componentType}</p>
          <p>大小: {comp.fileSize} bytes</p>
          <p>上傳者: {comp.uploadedBy}</p>
        </div>
      ))}
    </div>
  );
}
```

### 使用 JavaScript 上傳元件

```javascript
async function uploadComponent(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    '/api/robot-configs/components',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    }
  );

  const result = await response.json();
  
  if (result.success) {
    console.log('上傳成功:', result.data);
    return result.data;
  } else {
    console.error('上傳失敗:', result.errors);
    throw new Error(result.message);
  }
}

// 使用
const fileInput = document.getElementById('componentFile');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    try {
      const component = await uploadComponent(file);
      console.log('新元件 ID:', component.id);
    } catch (err) {
      alert(`上傳失敗: ${err.message}`);
    }
  }
});
```

### 使用 JavaScript 列出元件

```javascript
async function listComponents(page = 1, pageSize = 20) {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    sortBy: 'uploadedAt',
    sortOrder: 'desc'
  });

  const response = await fetch(
    `/api/robot-configs/components?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (response.ok) {
    const result = await response.json();
    console.log('元件清單:', result.data.items);
    console.log('分頁:', result.data.pagination);
    return result.data;
  } else {
    const error = await response.json();
    console.error('查詢失敗:', error.message);
    throw new Error(error.message);
  }
}

// 使用
listComponents(1, 20).then(data => {
  data.items.forEach(comp => {
    console.log(`${comp.fileName} (${comp.componentType})`);
  });
});
```

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
