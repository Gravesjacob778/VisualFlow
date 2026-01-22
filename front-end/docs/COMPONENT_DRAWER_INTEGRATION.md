# 🔧 ComponentDrawer 整合指南

## 已完成的更新

### ComponentDrawer 新功能

已為 `ComponentDrawer` 元件新增以下功能：

✅ **選擇狀態追蹤** - 顯示當前選中的元件  
✅ **點擊事件處理** - 點擊元件時觸發回調  
✅ **視覺反饋** - 選中的元件顯示藍色高亮  
✅ **回調機制** - 通知父元件元件被選擇  

---

## 🚀 使用方式

### 方案 1：基本使用（現有方式）

如果你不需要動態載入模型，繼續使用現有方式即可：

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

點擊元件時：
- ✅ 控制台會顯示選擇日誌
- ✅ 元件會有視覺高亮效果
- ❌ 不會載入 3D 模型（需要整合）

---

### 方案 2：整合動態模型載入（推薦）

完整的整合範例：

```tsx
'use client';

import { useState } from 'react';
import { ComponentDrawer } from '@/features/robot-sim/components/ComponentDrawer';
import { useModel } from '@/hooks/useModel';

interface Component {
    id: string;
    name: string;
    type: string;
}

export default function RobotSimPage() {
    const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);

    // 步驟 1: 處理元件選擇
    const handleComponentSelect = (component: Component) => {
        console.log('選擇了元件:', component.name);
        setSelectedComponent(component);
    };

    // 步驟 2: 使用 component.id 作為 modelId（或從映射 API 取得）
    const modelId = selectedComponent?.id || null;

    return (
        <div className="flex h-screen">
            {/* 左側：元件選擇器 */}
            <ComponentDrawer
                onComponentSelect={handleComponentSelect}
                selectedComponentId={selectedComponent?.id}
            />

            {/* 右側：3D 檢視器 */}
            <div className="flex-1">
                {modelId ? (
                    <ModelViewer modelId={modelId} />
                ) : (
                    <div>請選擇一個元件</div>
                )}
            </div>
        </div>
    );
}

// 模型檢視器元件
function ModelViewer({ modelId }: { modelId: string }) {
    const { loading, error, model } = useModel(modelId);

    if (loading) return <div>載入中...</div>;
    if (error) return <div>錯誤: {error.message}</div>;
    if (!model) return null;

    // 使用 model.url 載入到 Three.js
    return <div>模型已載入: {model.detail.name}</div>;
}
```

---

### 方案 3：使用完整示範頁面

我已經建立了一個完整的整合範例頁面：

**訪問：** `http://localhost:3000/robot-sim-integrated`

這個頁面包含：
- ✅ ComponentDrawer（左側）
- ✅ ControlDrawer（右側）
- ✅ 3D Canvas（中央）
- ✅ 完整的模型載入流程
- ✅ 載入狀態顯示
- ✅ 錯誤處理

---

## 📋 ComponentDrawer API

### Props

```typescript
interface ComponentDrawerProps {
    // 當元件被選擇時觸發
    onComponentSelect?: (component: Component) => void;
    
    // 目前選中的元件 ID（用於高亮顯示）
    selectedComponentId?: string | null;
}
```

### Component 型別

```typescript
interface Component {
    id: string;         // 元件唯一 ID
    name: string;       // 元件名稱
    type: string;       // 元件類型
    fileName?: string;  // 檔案名稱（可選）
}
```

---

## 🎯 完整流程圖

```
使用者點擊元件
    ↓
ComponentDrawer.handleComponentClick()
    ↓
觸發 onComponentSelect 回調
    ↓
父元件接收到 Component 物件
    ↓
決定要載入的 modelId
    │
    ├─ 方案 A: 直接使用 component.id
    ├─ 方案 B: 從映射表取得
    └─ 方案 C: 從 API 查詢（推薦）
    ↓
呼叫 useModel(modelId)
    ↓
自動檢查快取 & 下載
    ↓
取得模型 Blob URL
    ↓
載入到 Three.js 場景
```

---

## 💡 實作建議

### 1. Component ID 與 Model ID 的映射

**選項 A：直接使用（最簡單）**
```tsx
const modelId = component.id;
```

**選項 B：映射表（中等複雜度）**
```tsx
const componentToModelMap = {
    'component-001': 'robot-arm-gardener',
    'component-002': 'gripper-v2',
    // ...
};
const modelId = componentToModelMap[component.id];
```

**選項 C：API 查詢（推薦，最靈活）**
```tsx
const { data: mapping } = await fetch(`/api/components/${component.id}/model`);
const modelId = mapping.modelId;
```

---

### 2. 更新現有的 robot-sim 頁面

如果你想更新現有的 `src/app/robot-sim/page.tsx`：

```tsx
'use client';

import { useState } from 'react';
import { RobotArmScene } from "@/features/robot-sim/components/RobotArmScene";
import { ComponentDrawer } from "@/features/robot-sim/components/ComponentDrawer";
import { ControlDrawer } from "@/features/robot-sim/components/ControlDrawer";

interface Component {
    id: string;
    name: string;
    type: string;
}

export default function RobotSimPage() {
    const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);

    const handleComponentSelect = (component: Component) => {
        console.log('✅ 選擇元件:', component);
        setSelectedComponent(component);
        
        // TODO: 根據 component.id 載入對應的 3D 模型
        // 方案 1: 使用 useModel Hook
        // 方案 2: 傳遞給 RobotArmScene 讓它處理
    };

    return (
        <main className="flex h-screen flex-col bg-[#0b0f14] text-white">
            <header className="border-b border-white/10 px-6 py-4">
                <h1 className="text-xl font-semibold tracking-tight">
                    Six-Axis Robot Arm
                </h1>
                <p className="mt-1 text-sm text-white/70">
                    {selectedComponent 
                        ? `目前選擇: ${selectedComponent.name}` 
                        : 'High-fidelity industrial manipulator preview'
                    }
                </p>
            </header>
            
            <section className="relative flex-1 overflow-hidden">
                <ComponentDrawer 
                    onComponentSelect={handleComponentSelect}
                    selectedComponentId={selectedComponent?.id}
                />
                <ControlDrawer />
                <RobotArmScene 
                    // 可以傳遞 selectedComponent 給場景
                    selectedModelId={selectedComponent?.id}
                />
            </section>
        </main>
    );
}
```

---

## 🧪 測試步驟

### 1. 測試基本功能
```bash
# 啟動開發伺服器
npm run dev

# 訪問頁面
http://localhost:3000/robot-sim
```

**預期行為：**
- 點擊元件會在控制台顯示日誌
- 選中的元件會有藍色高亮
- 右上角會顯示脈衝動畫點

### 2. 測試整合範例
```bash
# 訪問整合示範頁面
http://localhost:3000/robot-sim-integrated
```

**預期行為：**
- 點擊元件後，中央會嘗試載入對應的 3D 模型
- 如果 API 未實作，會顯示錯誤訊息
- 可以看到完整的載入流程

---

## ⚠️ 注意事項

### 1. 後端 API 需求

要完整使用動態模型載入，需要後端提供：

```
GET /api/models/:modelId          # 模型詳情
GET /api/models/:modelId/download # GLB 檔案
或
GET /api/models/:modelId/gltf     # GLTF JSON
```

參考：[3D_MODEL_SYSTEM.md](./3D_MODEL_SYSTEM.md)

### 2. Component 與 Model 的關聯

目前 `Component` 資料來自：
```
GET /api/RobotConfig/components
```

需要決定如何將 Component 對應到 Model：
- 在 Component 資料中新增 `modelId` 欄位（推薦）
- 使用檔案名稱映射
- 建立專門的映射 API

### 3. Mock 資料測試

如果後端 API 尚未就緒，可以使用 Mock 資料：

```tsx
// 模擬 useModel Hook
function useMockModel(modelId: string) {
    return {
        loading: false,
        error: null,
        model: {
            url: '/models/robot.glb', // 使用本地模型
            detail: { name: 'Mock Robot' },
            cached: false
        }
    };
}
```

---

## 📚 相關文件

- [完整文件](./3D_MODEL_SYSTEM.md)
- [快速開始](./QUICK_START.md)
- [架構說明](./ARCHITECTURE.md)
- [整合範例](../src/app/robot-sim-integrated/page.tsx)

---

## ✅ 總結

你現在有兩種使用方式：

### 立即可用（不需要 API）
```tsx
<ComponentDrawer 
    onComponentSelect={(c) => console.log('選擇:', c)}
    selectedComponentId={selectedId}
/>
```
✅ 點擊功能正常  
✅ 視覺反饋完整  
✅ 控制台日誌輸出  
❌ 不會載入 3D 模型  

### 完整整合（需要 API）
```tsx
const { model } = useModel(component.id);
// 使用 model.url 載入到 Three.js
```
✅ 完整的模型載入流程  
✅ 自動快取管理  
✅ 動態切換模型  
⚠️ 需要後端 API 支援  

---

**下一步建議：**
1. 先測試基本的點擊功能
2. 實作 Component 與 Model 的映射邏輯
3. 整合到 RobotArmScene 中
4. 等待後端 API 完成後進行完整測試
