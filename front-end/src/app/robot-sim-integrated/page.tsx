/**
 * 整合範例：ComponentDrawer + 動態模型載入
 * 
 * 這個範例展示如何將 ComponentDrawer 整合到頁面中，
 * 並在點擊元件時動態載入對應的 3D 模型
 */

'use client';

import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid } from '@react-three/drei';
import { ComponentDrawer } from '@/features/robot-sim/components/ComponentDrawer';
import { ControlDrawer } from '@/features/robot-sim/components/ControlDrawer';
import { DynamicRobotArm } from '@/features/robot-sim/components/DynamicRobotArm';
import { useModel } from '@/hooks/useModel';

interface Component {
    id: string;
    name: string;
    type: string;
    fileName?: string;
}

export default function RobotSimIntegratedPage() {
    const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);

    // 當元件被選擇時，這裡會得到通知
    const handleComponentSelect = (component: Component) => {
        console.log('✅ 頁面收到選擇通知:', component);
        setSelectedComponent(component);

        // 這裡可以根據 component.id 或其他屬性來決定要載入哪個模型
        // 例如：可以從 API 查詢這個元件對應的 modelId
    };

    return (
        <main className="flex h-screen flex-col bg-[#0b0f14] text-white">
            {/* 頂部標題 */}
            <header className="border-b border-white/10 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            Six-Axis Robot Arm - 動態模型載入
                        </h1>
                        <p className="mt-1 text-sm text-white/70">
                            點擊左側元件以載入對應的 3D 模型
                        </p>
                    </div>

                    {/* 顯示當前選中的元件 */}
                    {selectedComponent && (
                        <div className="px-4 py-2 bg-blue-500/20 border border-blue-500/40 rounded-lg">
                            <div className="text-xs text-white/60">目前選擇</div>
                            <div className="text-sm font-medium">{selectedComponent.name}</div>
                        </div>
                    )}
                </div>
            </header>

            {/* 主要內容區 */}
            <section className="relative flex-1 overflow-hidden">
                {/* 左側：元件抽屜 */}
                <ComponentDrawer
                    onComponentSelect={handleComponentSelect}
                    selectedComponentId={selectedComponent?.id}
                />

                {/* 右側：控制面板 */}
                <ControlDrawer />

                {/* 中央：3D 場景 */}
                <div className="absolute inset-0 z-0">
                    <Canvas
                        shadows
                        camera={{ position: [5, 5, 5], fov: 50 }}
                        className="w-full h-full"
                    >
                        <color attach="background" args={['#0b0f14']} />

                        <ambientLight intensity={0.5} />
                        <directionalLight
                            position={[10, 10, 5]}
                            intensity={1}
                            castShadow
                            shadow-mapSize-width={2048}
                            shadow-mapSize-height={2048}
                        />

                        {/* 如果有選中元件，動態載入對應的模型 */}
                        {selectedComponent ? (
                            <DynamicModelLoader componentId={selectedComponent.id} />
                        ) : (
                            // 沒有選擇時，顯示預設的機器人手臂
                            <DefaultRobotArm />
                        )}

                        <OrbitControls
                            enablePan
                            enableZoom
                            enableRotate
                            minDistance={1}
                            maxDistance={20}
                        />

                        <Environment preset="city" />

                        {/* 地板網格 */}
                        <Grid
                            args={[20, 20]}
                            cellSize={0.5}
                            cellThickness={0.5}
                            cellColor="#ffffff"
                            sectionSize={2}
                            sectionThickness={1}
                            sectionColor="#4a5568"
                            fadeDistance={25}
                            fadeStrength={1}
                            followCamera={false}
                            infiniteGrid
                        />
                    </Canvas>
                </div>
            </section>
        </main>
    );
}

/**
 * 動態模型載入元件
 * 根據 componentId 載入對應的 3D 模型
 */
function DynamicModelLoader({ componentId }: { componentId: string }) {
    // 這裡需要一個映射關係：componentId -> modelId
    // 方案 1: 在元件資料中直接包含 modelId
    // 方案 2: 從另一個 API 查詢對應關係
    // 方案 3: 使用命名規則（例如 component-001 -> model-001）

    // 目前先使用簡單的映射（實際上應該從 API 取得）
    const modelId = `model-${componentId}`;

    const { loading, error, model, progress } = useModel(modelId);

    // 載入中
    if (loading) {
        return (
            <group>
                <mesh>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial
                        color="#3b82f6"
                        wireframe
                        opacity={0.5}
                        transparent
                    />
                </mesh>

                {/* 顯示載入進度（使用 HTML overlay 或 3D 文字） */}
                {progress && (
                    <FloatingText
                        text={`${progress.message}\n${progress.progress || 0}%`}
                        position={[0, 2, 0]}
                    />
                )}
            </group>
        );
    }

    // 錯誤
    if (error) {
        return (
            <group>
                <mesh>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial color="#ef4444" />
                </mesh>
                <FloatingText
                    text={`載入失敗\n${error.message}`}
                    position={[0, 2, 0]}
                    color="#ef4444"
                />
            </group>
        );
    }

    // 成功載入模型
    if (model) {
        return (
            <DynamicRobotArm
                modelId={modelId}
                position={[0, 0, 0]}
                scale={0.15}
                autoRotate={false}
            />
        );
    }

    return null;
}

/**
 * 預設機器人手臂（當沒有選擇元件時顯示）
 */
function DefaultRobotArm() {
    return (
        <group>
            {/* 簡單的佔位符 */}
            <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[0.5, 1, 0.5]} />
                <meshStandardMaterial color="#4a5568" />
            </mesh>

            <FloatingText
                text="請從左側選擇元件"
                position={[0, 2, 0]}
                color="#9ca3af"
            />
        </group>
    );
}

/**
 * 3D 浮動文字元件
 */
function FloatingText({
    text,
    position,
    color = "#ffffff"
}: {
    text: string;
    position: [number, number, number];
    color?: string;
}) {
    return (
        <group position={position}>
            {/* 這裡可以使用 drei 的 Text 元件 */}
            {/* 或使用 HTML overlay */}
            <mesh>
                <sphereGeometry args={[0.1, 16, 16]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
            </mesh>
        </group>
    );
}

/*
 * =====================================
 * 使用說明
 * =====================================
 * 
 * 1. 點擊左側 ComponentDrawer 中的元件
 * 2. ComponentDrawer 觸發 onComponentSelect 回調
 * 3. 頁面接收到選中的元件資訊
 * 4. DynamicModelLoader 根據 componentId 決定要載入的 modelId
 * 5. useModel Hook 自動處理快取檢查和下載
 * 6. 模型載入完成後顯示在 3D 場景中
 * 
 * 需要的後端 API：
 * - GET /api/models/:modelId - 取得模型詳情和控制配置
 * - GET /api/models/:modelId/download（GLB）或 /gltf（GLTF）
 * 
 * 可選的映射 API：
 * - GET /api/components/:componentId/model - 取得元件對應的 modelId
 */
