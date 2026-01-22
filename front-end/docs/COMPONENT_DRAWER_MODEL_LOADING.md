# ComponentDrawer 3D 模型載入功能 - 使用指南

## ✅ 已實作功能

ComponentDrawer 現在已經內建完整的 3D 模型載入功能！

### 核心功能
1. **自動載入模型** - 點擊元件時自動觸發模型載入
2. **即時進度顯示** - 載入進度條和百分比
3. **狀態反饋** - 載入中、成功、失敗的視覺提示
4. **快取指示** - 顯示是否使用快取版本
5. **錯誤處理** - 顯示錯誤訊息
6. **回調機制** - 通知父元件模型載入完成

---

## 🚀 使用方式

### 方式 1：基本使用（自動載入模型）

```tsx
import { ComponentDrawer } from '@/features/robot-sim/components/ComponentDrawer';

export default function Page() {
    return (
        <div>
            <ComponentDrawer />
        </div>
    );
}
```

**效果**：
- ✅ 點擊元件後自動載入 3D 模型
- ✅ 顯示載入進度和狀態
- ✅ 控制台輸出詳細日誌
- ✅ 自動使用 IndexedDB 快取

---

### 方式 2：接收載入的模型

```tsx
'use client';

import { useState } from 'react';
import { ComponentDrawer } from '@/features/robot-sim/components/ComponentDrawer';
import type { LoadedModel } from '@/lib/modelLoader';

export default function Page() {
    const [loadedModel, setLoadedModel] = useState<LoadedModel | null>(null);

    return (
        <div className="flex h-screen">
            {/* 左側：元件抽屜（自動載入模型） */}
            <ComponentDrawer 
                onModelLoaded={(model) => {
                    console.log('✅ 模型載入完成:', model?.detail.name);
                    setLoadedModel(model);
                }}
            />

            {/* 右側：使用載入的模型 */}
            <div className="flex-1 p-4">
                {loadedModel ? (
                    <div>
                        <h2>已載入模型</h2>
                        <p>名稱: {loadedModel.detail.name}</p>
                        <p>格式: {loadedModel.format}</p>
                        <p>URL: {loadedModel.url}</p>
                        <p>快取: {loadedModel.cached ? '是' : '否'}</p>
                        
                        {/* 在 Three.js 中使用 */}
                        <ThreeJSViewer url={loadedModel.url} />
                    </div>
                ) : (
                    <p>請從左側選擇一個元件</p>
                )}
            </div>
        </div>
    );
}
```

---

### 方式 3：完整整合（元件選擇 + 模型載入）

```tsx
'use client';

import { useState } from 'react';
import { ComponentDrawer } from '@/features/robot-sim/components/ComponentDrawer';
import type { LoadedModel } from '@/lib/modelLoader';

interface Component {
    id: string;
    name: string;
    type: string;
}

export default function RobotSimPage() {
    const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
    const [model, setModel] = useState<LoadedModel | null>(null);

    return (
        <div className="flex h-screen">
            <ComponentDrawer 
                // 元件選擇回調
                onComponentSelect={(component) => {
                    console.log('選擇元件:', component.name);
                    setSelectedComponent(component);
                }}
                
                // 模型載入回調
                onModelLoaded={(loadedModel) => {
                    console.log('模型載入完成:', loadedModel?.detail.name);
                    setModel(loadedModel);
                }}
                
                // 當前選中的元件 ID
                selectedComponentId={selectedComponent?.id}
            />

            <div className="flex-1">
                {model && <ModelViewer model={model} />}
            </div>
        </div>
    );
}
```

---

## 📊 UI 狀態顯示

### 載入中
```
┌─────────────────────────────┐
│ Components                   │
│ Manage robot attachments     │
├─────────────────────────────┤
│ 載入模型中...          45%   │
│ ▓▓▓▓▓▓▓▓░░░░░░░░░░░         │
│ 正在下載資源...              │
└─────────────────────────────┘
```

### 載入成功
```
┌─────────────────────────────┐
│ Components                   │
│ Manage robot attachments     │
├─────────────────────────────┤
│ ✓ 模型已載入                 │
│   Gardener Robot Arm        │
│   ⚡ 使用快取版本            │
└─────────────────────────────┘
```

### 載入失敗
```
┌─────────────────────────────┐
│ Components                   │
│ Manage robot attachments     │
├─────────────────────────────┤
│ ✗ 載入失敗                  │
│   無法連接到伺服器           │
└─────────────────────────────┘
```

---

## 🎯 資料流程

```
使用者點擊元件
    ↓
handleComponentClick 觸發
    ↓
setInternalSelectedId(component.id)
    ↓
useModel Hook 自動觸發
    │
    ├─> 檢查 IndexedDB 快取
    │   ├─ 有快取且版本相符 → 立即載入 ⚡
    │   └─ 無快取或版本不符 → 從 API 下載
    │
    ├─> 顯示載入進度（實時更新 UI）
    │
    ├─> 儲存到 IndexedDB
    │
    └─> 建立 Blob URL
        │
        ├─> 更新 model 狀態（觸發 UI 更新）
        │
        └─> 呼叫 onModelLoaded 回調
            │
            └─> 父元件接收 LoadedModel 物件
```

---

## 🔧 API Props

```typescript
interface ComponentDrawerProps {
    // 當元件被選擇時觸發
    onComponentSelect?: (component: Component) => void;
    
    // 當模型載入完成時觸發（包含 null，代表清除選擇）
    onModelLoaded?: (model: LoadedModel | null) => void;
    
    // 外部控制選中的元件 ID
    selectedComponentId?: string | null;
}
```

### LoadedModel 型別

```typescript
interface LoadedModel {
    format: 'glb' | 'gltf';           // 模型格式
    url: string;                      // Blob URL，可直接用於 Three.js
    detail: ModelDetail;              // 模型詳細資訊（名稱、控制配置等）
    cached: boolean;                  // 是否來自快取
}
```

---

## 💡 Model ID 映射說明

**目前實作：** Component ID = Model ID

```tsx
// ComponentDrawer 內部
const modelId = component.id;  // 直接使用 component.id 作為 modelId
```

**如果需要自訂映射**，有以下選項：

### 選項 1：映射表
```tsx
const componentToModelMap = {
    'component-001': 'robot-arm-gardener-v2',
    'component-002': 'gripper-premium',
};
```

### 選項 2：API 查詢
```tsx
// 在點擊時查詢對應的 modelId
const response = await fetch(`/api/components/${component.id}/model`);
const { modelId } = await response.json();
```

### 選項 3：Component 資料中包含 modelId
```tsx
// 修改 Component 介面
interface Component {
    id: string;
    name: string;
    type: string;
    modelId?: string;  // 新增此欄位
}

// 然後使用
const modelId = component.modelId || component.id;
```

---

## ⚙️ 進階配置

### 控制台日誌

ComponentDrawer 會輸出以下日誌：

```
📦 選擇元件: Robot Arm Base (ID: component-001)
🔄 開始載入 3D 模型，modelId: component-001
✅ 模型已載入: Gardener Robot Arm v2
⚡ 使用快取版本
```

### 自訂錯誤處理

```tsx
<ComponentDrawer 
    onModelLoaded={(model) => {
        if (!model) {
            console.log('模型已清除');
            return;
        }
        
        // 檢查模型是否符合要求
        if (model.detail.fileSize > 10_000_000) {
            alert('模型檔案過大！');
            return;
        }
        
        // 使用模型
        loadIntoScene(model.url);
    }}
/>
```

---

## 🧪 測試步驟

### 1. 啟動開發伺服器
```bash
npm run dev
```

### 2. 訪問頁面
```
http://localhost:3000/robot-sim
```

### 3. 測試流程
1. **點擊任一元件** → 觀察「Components」標題下方出現模型載入狀態
2. **觀察載入進度** → 應顯示百分比和進度條
3. **檢查控制台** → 應有詳細的載入日誌
4. **點擊不同元件** → 應自動切換並載入新模型
5. **第二次點擊同一元件** → 應秒開（使用快取）⚡

---

## ⚠️ 注意事項

### 1. API 要求

需要後端提供以下 API：

```
GET /api/models/:modelId           # 模型詳情
GET /api/models/:modelId/download  # GLB 檔案
或
GET /api/models/:modelId/gltf      # GLTF JSON
```

### 2. 目前狀態

如果 API 尚未實作：
- ❌ 會顯示錯誤訊息（紅色區塊）
- ✅ 所有 UI 功能正常
- ✅ 錯誤處理完整
- ✅ 可以看到完整的載入流程

### 3. Mock 測試

如果想在 API 就緒前測試，可以：
- 將本地的 .glb 檔案放在 `public/models/` 
- 修改 API 端點指向本地檔案
- 或使用 Mock Service Worker

---

## 🎉 優勢

### 自動化
- ✅ 點擊即載入，無需手動呼叫
- ✅ 自動快取管理
- ✅ 自動錯誤處理

### 使用者體驗
- ✅ 即時進度反饋
- ✅ 清晰的狀態顯示
- ✅ 快取命中提示

### 開發體驗
- ✅ 簡單的 API
- ✅ 完整的 TypeScript 支援
- ✅ 詳細的控制台日誌

---

## 📚 相關文件

- [整合範例](./COMPONENT_DRAWER_INTEGRATION.md)
- [3D 模型系統](./3D_MODEL_SYSTEM.md)
- [快速開始](./QUICK_START.md)

---

**立即試用！** 🚀

打開開發伺服器，訪問 `http://localhost:3000/robot-sim`，點擊任一元件，觀察自動化的模型載入流程！
