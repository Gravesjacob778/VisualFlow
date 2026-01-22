# 🎯 快速使用指南

本指南將幫助您快速上手 3D 模型管理系統。

## 📖 目錄
1. [基本使用](#基本使用)
2. [進階功能](#進階功能)
3. [實際範例](#實際範例)
4. [常見問題](#常見問題)

---

## 基本使用

### 1️⃣ 最簡單的方式：使用完整示範頁面

直接訪問示範頁面，無需撰寫任何程式碼：

```
http://localhost:3000/model-demo
```

功能包含：
- ✅ 模型清單瀏覽
- ✅ 搜尋功能
- ✅ 模型預覽
- ✅ 快取管理

---

### 2️⃣ 在元件中使用：載入單一模型

```tsx
import { useModel } from '@/hooks/useModel';
import { useGLTF } from '@react-three/drei';

function MyRobotViewer() {
    // 只需一行！載入模型（自動處理快取）
    const { loading, error, model } = useModel('robot-arm-001');

    if (loading) return <div>載入中...</div>;
    if (error) return <div>錯誤: {error.message}</div>;
    if (!model) return null;

    // 使用模型的 Blob URL
    const { scene } = useGLTF(model.url);

    return <primitive object={scene} />;
}
```

**就這麼簡單！** Hook 會自動：
- 🔄 檢查 IndexedDB 快取
- 📥 如需要則從 API 下載
- 💾 自動儲存到快取
- 🧹 元件卸載時清理資源

---

### 3️⃣ 顯示模型清單

```tsx
import { useModelsList } from '@/hooks/useModel';

function ModelList() {
    const { loading, models, hasMore, loadMore } = useModelsList({
        category: 'robot-arm',
        limit: 12
    });

    return (
        <div>
            <h2>機器人手臂清單</h2>
            
            {loading && <div>載入中...</div>}
            
            <div className="grid grid-cols-3 gap-4">
                {models.map(model => (
                    <div key={model.id} className="border p-4">
                        <img src={model.thumbnailUrl} alt={model.name} />
                        <h3>{model.name}</h3>
                        <p>{model.description}</p>
                    </div>
                ))}
            </div>
            
            {hasMore && (
                <button onClick={loadMore}>載入更多</button>
            )}
        </div>
    );
}
```

---

## 進階功能

### 🎨 顯示載入進度

```tsx
function ProgressViewer() {
    const { loading, progress, model } = useModel('robot-arm-001');

    return (
        <div>
            {loading && progress && (
                <div>
                    <p>{progress.message}</p>
                    {progress.progress && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${progress.progress}%` }}
                            />
                        </div>
                    )}
                </div>
            )}
            
            {model && (
                <div>
                    <p>✅ 模型載入完成</p>
                    {model.cached && <p>📦 使用快取版本</p>}
                </div>
            )}
        </div>
    );
}
```

### 🔍 搜尋功能

```tsx
function SearchableModelList() {
    const [search, setSearch] = useState('');
    
    const { models } = useModelsList({ 
        search,
        limit: 20 
    });

    return (
        <div>
            <input
                type="text"
                placeholder="搜尋模型..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
            
            <div>找到 {models.length} 個模型</div>
            {/* 顯示結果 */}
        </div>
    );
}
```

### 🗂️ 類別篩選

```tsx
import { useModelsByCategory } from '@/hooks/useModel';

function CategoryView({ category }: { category: string }) {
    const { loading, models } = useModelsByCategory(category);

    return (
        <div>
            <h2>{category}</h2>
            {/* 顯示該類別的模型 */}
        </div>
    );
}
```

### 📦 預載模型

```tsx
import { useModelPreload } from '@/hooks/useModel';

function App() {
    // 在背景預載這些模型到快取
    useModelPreload([
        'robot-arm-001',
        'robot-arm-002',
        'gripper-001'
    ]);

    return <div>應用程式內容...</div>;
}
```

---

## 實際範例

### 📱 完整的模型選擇與檢視系統

```tsx
'use client';

import { useState } from 'react';
import { useModelsList, useModel } from '@/hooks/useModel';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useGLTF } from '@react-three/drei';

export default function ModelApp() {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    
    // 左側：模型清單
    const { models, loading: listLoading } = useModelsList({ limit: 10 });
    
    // 右側：選中的模型
    const { model, loading: modelLoading } = useModel(selectedId);

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            {/* 左側選擇器 */}
            <aside style={{ width: '300px', padding: '20px', overflowY: 'auto' }}>
                <h2>選擇模型</h2>
                
                {listLoading ? (
                    <p>載入清單...</p>
                ) : (
                    <div>
                        {models.map(m => (
                            <button
                                key={m.id}
                                onClick={() => setSelectedId(m.id)}
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    padding: '10px',
                                    marginBottom: '10px',
                                    background: selectedId === m.id ? '#3b82f6' : '#e5e7eb',
                                    color: selectedId === m.id ? 'white' : 'black',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer'
                                }}
                            >
                                {m.name}
                            </button>
                        ))}
                    </div>
                )}
            </aside>

            {/* 右側 3D 檢視器 */}
            <main style={{ flex: 1 }}>
                {modelLoading && <div>載入模型中...</div>}
                
                {model && (
                    <Canvas camera={{ position: [5, 5, 5] }}>
                        <ambientLight intensity={0.5} />
                        <directionalLight position={[10, 10, 5]} />
                        
                        <ModelScene url={model.url} />
                        
                        <OrbitControls />
                    </Canvas>
                )}
                
                {!selectedId && !modelLoading && (
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        height: '100%' 
                    }}>
                        <p>請從左側選擇一個模型</p>
                    </div>
                )}
            </main>
        </div>
    );
}

function ModelScene({ url }: { url: string }) {
    const { scene } = useGLTF(url);
    return <primitive object={scene} />;
}
```

---

### 🤖 整合到現有的機器人元件

如果你已經有一個機器人元件，想要改用動態載入：

**之前（靜態載入）：**
```tsx
import { useGLTF } from '@react-three/drei';

function RobotArm() {
    const { scene } = useGLTF('/models/robot.glb'); // 靜態路徑
    return <primitive object={scene} />;
}
```

**之後（動態載入 + 快取）：**
```tsx
import { useModel } from '@/hooks/useModel';
import { useGLTF } from '@react-three/drei';

function RobotArm({ modelId }: { modelId: string }) {
    const { model } = useModel(modelId); // 從 API 載入，自動快取
    
    if (!model) return null;
    
    const { scene } = useGLTF(model.url);
    return <primitive object={scene} />;
}

// 使用
<RobotArm modelId="robot-arm-001" />
```

**優勢：**
- ✅ 支援多種機器人模型（只需改 modelId）
- ✅ 自動快取（第二次秒開）
- ✅ 可從伺服器更新模型
- ✅ 取得模型的控制配置（`model.detail.controls`）

---

## 常見問題

### ❓ 如何清除快取？

```tsx
import * as modelDB from '@/lib/modelIndexedDB';

// 清除所有快取
await modelDB.clearAllModels();

// 清除特定模型
await modelDB.deleteModel('robot-arm-001');

// 清除過期快取（保留 30 天內的）
await modelDB.clearExpiredModels(30);

// 查看快取大小
const size = await modelDB.getCacheSize();
console.log(`快取大小: ${(size / 1024 / 1024).toFixed(2)} MB`);
```

### ❓ 載入失敗怎麼辦？

Hook 提供了 `reload` 函數：

```tsx
const { error, reload } = useModel('robot-arm-001');

if (error) {
    return (
        <div>
            <p>載入失敗: {error.message}</p>
            <button onClick={reload}>重試</button>
        </div>
    );
}
```

### ❓ 如何知道是否使用了快取？

```tsx
const { model } = useModel('robot-arm-001');

if (model) {
    console.log(model.cached ? '使用快取' : '剛下載的');
}
```

### ❓ 如何取得模型的控制配置？

```tsx
const { model } = useModel('robot-arm-001');

if (model) {
    // 取得所有關節控制配置
    model.detail.controls.forEach(control => {
        console.log(`關節: ${control.displayName}`);
        console.log(`骨骼: ${control.boneName}`);
        console.log(`軸: ${control.axis}`);
        console.log(`範圍: ${control.minAngle}° ~ ${control.maxAngle}°`);
    });
}
```

### ❓ 支援哪些模型格式？

目前支援：
- ✅ **GLB** - 單一二進制檔案（推薦）
- ✅ **GLTF** - JSON + 外部資源

系統會自動偵測格式並處理。

### ❓ 可以離線使用嗎？

可以！只要模型已經載入過一次並儲存到 IndexedDB，就可以離線使用：

```tsx
// 第一次需要網路下載
const { model } = useModel('robot-arm-001');

// 之後即使離線也能載入（從 IndexedDB）
```

---

## 🎓 下一步

- 📖 閱讀 [完整文件](./3D_MODEL_SYSTEM.md)
- 🔍 查看 [實作總結](./IMPLEMENTATION_SUMMARY.md)
- 💻 探索 [示範元件程式碼](../src/features/robot-sim/components/)
- 🚀 開啟 [示範頁面](http://localhost:3000/model-demo)

---

**祝您使用愉快！** 🎉

如有問題，請參考完整文件或查看範例程式碼。
