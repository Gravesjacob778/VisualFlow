# 3D 模型管理系統

這是一個完整的 3D 模型管理系統，支援從伺服器載入 GLTF/GLB 模型並使用 IndexedDB 進行本地快取。

## 📁 檔案結構

```
src/
├── types/
│   └── model.ts                    # 模型相關的 TypeScript 型別定義
├── lib/
│   ├── modelIndexedDB.ts           # IndexedDB 管理器
│   └── modelLoader.ts              # 模型載入器（整合 API 和快取）
├── services/
│   └── ModelService.ts             # Model API Service
├── hooks/
│   └── useModel.ts                 # React Hooks
└── features/robot-sim/components/
    ├── ModelViewer.tsx             # 模型檢視器（示範元件）
    └── ModelSelector.tsx           # 模型選擇器（示範元件）
```

## 🚀 快速開始

### 1. 使用 Hook 載入模型

最簡單的方式是使用 `useModel` Hook：

```tsx
import { useModel } from '@/hooks/useModel';
import { useGLTF } from '@react-three/drei';

function MyComponent() {
    const { loading, error, model, progress } = useModel('robot-arm-001');

    if (loading) {
        return <div>載入中... {progress?.message}</div>;
    }

    if (error) {
        return <div>錯誤: {error.message}</div>;
    }

    if (!model) {
        return null;
    }

    const { scene } = useGLTF(model.url);
    return <primitive object={scene} />;
}
```

### 2. 顯示模型清單

使用 `useModelsList` Hook：

```tsx
import { useModelsList } from '@/hooks/useModel';

function ModelList() {
    const { loading, models, loadMore, hasMore } = useModelsList({
        category: 'robot-arm',
        limit: 12,
    });

    return (
        <div>
            {models.map(model => (
                <ModelCard key={model.id} model={model} />
            ))}
            {hasMore && <button onClick={loadMore}>載入更多</button>}
        </div>
    );
}
```

### 3. 直接使用 Model Loader

如果需要更細緻的控制：

```tsx
import { loadModel, revokeBlobURL } from '@/lib/modelLoader';

async function loadMyModel() {
    const loaded = await loadModel('robot-arm-001', (progress) => {
        console.log(progress.message, progress.progress);
    });

    // 使用模型
    const gltf = await loader.loadAsync(loaded.url);
    
    // 使用完畢後釋放
    revokeBlobURL(loaded.url);
}
```

## 📚 API 設計

### API 端點

系統預期以下 API 端點：

#### 1. 取得模型清單
```
GET /api/models
Query: category, page, limit, search
```

#### 2. 取得模型詳情
```
GET /api/models/:modelId
```

#### 3. 下載 GLB 模型
```
GET /api/models/:modelId/download
```

#### 4. 取得 GLTF JSON
```
GET /api/models/:modelId/gltf
```

#### 5. 下載資源檔案
```
GET /api/models/:modelId/resources/:filename
```

### API 回應格式

#### 模型清單
```json
{
  "success": true,
  "data": {
    "models": [
      {
        "id": "robot-arm-001",
        "name": "Gardener Robot Arm",
        "description": "6-DOF robot arm",
        "category": "robot-arm",
        "fileFormat": "glb",
        "fileSize": 2048576,
        "version": "1.2.0",
        "thumbnailUrl": "/api/models/robot-arm-001/thumbnail",
        "tags": ["robot", "arm"]
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 12,
      "totalPages": 4
    }
  }
}
```

#### 模型詳情
```json
{
  "success": true,
  "data": {
    "id": "robot-arm-001",
    "name": "Gardener Robot Arm",
    "fileFormat": "glb",
    "version": "1.2.0",
    "downloadUrl": "/api/models/robot-arm-001/download",
    "structure": {
      "bones": [...],
      "meshes": [...]
    },
    "controls": [
      {
        "id": "shoulder",
        "displayName": "Shoulder",
        "boneName": "Bone003_6",
        "axis": "z",
        "minAngle": -90,
        "maxAngle": 90,
        "defaultAngle": 0,
        "unit": "degree"
      }
    ],
    "defaultTransform": {
      "position": { "x": 0, "y": 0, "z": 0 },
      "rotation": { "x": 0, "y": 0, "z": 0 },
      "scale": { "x": 1, "y": 1, "z": 1 }
    }
  }
}
```

## 💾 IndexedDB 結構

### 資料庫資訊
- **資料庫名稱**: `VisualFlow3DModels`
- **版本**: 1
- **Object Store**: `models`
- **主鍵**: `modelId`

### 索引
- `format` - 模型格式 (glb/gltf)
- `version` - 版本號
- `cachedAt` - 快取時間

### 儲存結構

#### GLB 模型
```typescript
{
    modelId: "robot-arm-001",
    format: "glb",
    version: "1.2.0",
    file: Blob,
    metadata: {
        name: "Gardener Robot Arm",
        fileSize: 2048576,
        cachedAt: 1737519585000
    }
}
```

#### GLTF 模型
```typescript
{
    modelId: "robot-arm-001",
    format: "gltf",
    version: "1.2.0",
    gltf: { /* GLTF JSON */ },
    resources: {
        "geometry.bin": Blob,
        "texture.png": Blob
    },
    metadata: {
        name: "Gardener Robot Arm",
        fileSize: 2048576,
        cachedAt: 1737519585000
    }
}
```

## 🔧 工具函式

### IndexedDB 管理

```tsx
import * as modelDB from '@/lib/modelIndexedDB';

// 儲存模型
await modelDB.saveGLBModel(modelId, version, name, blob);
await modelDB.saveGLTFModel(modelId, version, name, gltfJson, resources);

// 取得模型
const model = await modelDB.getModel(modelId);

// 檢查快取
const isCached = await modelDB.isModelCached(modelId, version);

// 刪除模型
await modelDB.deleteModel(modelId);

// 取得所有快取
const all = await modelDB.getAllCachedModels();

// 清除所有快取
await modelDB.clearAllModels();

// 清除過期快取（30 天）
await modelDB.clearExpiredModels(30);

// 計算快取大小
const size = await modelDB.getCacheSize();
```

## 📊 快取策略

系統使用以下快取策略：

1. **版本比對**: 每次載入時比對版本號，版本相符則使用快取
2. **自動快取**: 下載後自動儲存到 IndexedDB
3. **過期清理**: 可設定自動清理超過指定天數的快取
4. **容量管理**: 可查詢快取總大小並手動清理

## 🎯 使用範例

### 完整的模型檢視器

參考 `ModelViewer.tsx` 示範元件：

```tsx
import { ModelViewer } from '@/features/robot-sim/components/ModelViewer';

function App() {
    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <ModelViewer modelId="robot-arm-001" />
        </div>
    );
}
```

### 模型選擇器

參考 `ModelSelector.tsx` 示範元件：

```tsx
import { ModelSelector } from '@/features/robot-sim/components/ModelSelector';

function App() {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    return (
        <div style={{ display: 'flex' }}>
            <ModelSelector
                category="robot-arm"
                onSelect={setSelectedId}
                selectedModelId={selectedId}
            />
            {selectedId && <ModelViewer modelId={selectedId} />}
        </div>
    );
}
```

## 🔐 注意事項

### 1. 環境變數
確保設定 API Base URL：
```env
NEXT_PUBLIC_API_BASE_URL=http://your-api-server.com
```

### 2. CORS 設定
伺服器需要正確設定 CORS headers：
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, HEAD
Access-Control-Allow-Headers: Content-Type
```

### 3. 快取 Headers
建議伺服器設定以下 headers：
```
Cache-Control: public, max-age=31536000, immutable
ETag: "v1.2.0-hash"
```

### 4. 記憶體管理
使用完 Blob URL 後記得呼叫 `revokeBlobURL()` 釋放記憶體：
```tsx
useEffect(() => {
    return () => {
        if (modelUrl) {
            revokeBlobURL(modelUrl);
        }
    };
}, [modelUrl]);
```

## 🛠️ 開發建議

### 1. Mock API（開發階段）
可以建立 Mock API 用於開發：
```tsx
// src/mocks/modelApi.ts
export const mockModels = [
    {
        id: 'mock-001',
        name: 'Mock Robot',
        // ...
    }
];
```

### 2. 錯誤處理
所有 API 呼叫都有錯誤處理，記得在 UI 顯示錯誤訊息。

### 3. 載入狀態
使用 `progress` 回調提供更好的使用者體驗。

## 📝 授權

MIT License
