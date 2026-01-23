/**
 * 3D 模型測試頁面
 * 用於測試和調試 DynamicRobotArm 組件
 */

'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid } from '@react-three/drei';
import { DynamicRobotArm } from '@/features/robot-sim/components/DynamicRobotArm';
import { useState } from 'react';

export default function ModelTestPage() {
    // 測試用的 modelId - 請替換為實際的 ID
    const [modelId, setModelId] = useState('robotic_arm_gardener');
    const [showTestCube, setShowTestCube] = useState(true);

    return (
        <main className="flex h-screen flex-col bg-[#0b0f14] text-white">
            {/* 控制面板 */}
            <header className="border-b border-white/10 px-6 py-4">
                <h1 className="text-xl font-semibold tracking-tight mb-4">
                    3D 模型測試頁面
                </h1>

                <div className="flex gap-4 items-center">
                    <div className="flex gap-2 items-center">
                        <label className="text-sm text-white/70">Model ID:</label>
                        <input
                            type="text"
                            value={modelId}
                            onChange={(e) => setModelId(e.target.value)}
                            className="px-3 py-1 bg-white/10 border border-white/20 rounded text-sm"
                            placeholder="輸入模型 ID"
                        />
                    </div>

                    <button
                        onClick={() => setShowTestCube(!showTestCube)}
                        className={`px-4 py-2 rounded text-sm transition-colors ${showTestCube
                                ? 'bg-green-500 hover:bg-green-600'
                                : 'bg-gray-500 hover:bg-gray-600'
                            }`}
                    >
                        {showTestCube ? '✓ 顯示測試方塊' : '✗ 隱藏測試方塊'}
                    </button>

                    <div className="text-xs text-white/50">
                        按 F12 打開 Console 查看調試日誌
                    </div>
                </div>

                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded text-xs">
                    <div className="font-semibold mb-1">測試說明:</div>
                    <ul className="list-disc list-inside space-y-1 text-white/70">
                        <li>如果能看到綠色測試方塊，說明 3D 渲染管線正常</li>
                        <li>如果看不到模型但能看到方塊，問題在模型數據</li>
                        <li>查看 Console 日誌尋找錯誤信息</li>
                        <li>使用滑鼠拖曳旋轉、滾輪縮放、右鍵平移視角</li>
                    </ul>
                </div>
            </header>

            {/* 3D 場景 */}
            <section className="relative flex-1 overflow-hidden">
                <Canvas
                    shadows
                    camera={{ position: [5, 5, 5], fov: 50 }}
                    className="w-full h-full"
                    gl={{
                        antialias: true,
                        alpha: false
                    }}
                    onCreated={(state) => {
                        console.log('✅ Canvas 已創建:', {
                            renderer: state.gl.info,
                            camera: state.camera.type
                        });
                    }}
                >
                    {/* 背景色 */}
                    <color attach="background" args={['#0b0f14']} />

                    {/* 光源 */}
                    <ambientLight intensity={0.5} />
                    <directionalLight
                        position={[10, 10, 5]}
                        intensity={1}
                        castShadow
                        shadow-mapSize-width={2048}
                        shadow-mapSize-height={2048}
                    />

                    {/* 測試方塊 - 用來確認渲染是否正常 */}
                    {showTestCube && (
                        <mesh position={[2, 1, 0]}>
                            <boxGeometry args={[0.5, 0.5, 0.5]} />
                            <meshStandardMaterial
                                color="#00ff00"
                                emissive="#00ff00"
                                emissiveIntensity={0.2}
                            />
                        </mesh>
                    )}

                    {/* 動態載入的機器人模型 */}
                    {modelId && (
                        <DynamicRobotArm
                            modelId={modelId}
                            position={[0, 0, 0]}
                            scale={0.15}
                            autoRotate={true}
                        />
                    )}

                    {/* 控制器 */}
                    <OrbitControls
                        enablePan
                        enableZoom
                        enableRotate
                        minDistance={1}
                        maxDistance={20}
                    />

                    {/* 環境貼圖 */}
                    <Environment preset="city" />

                    {/* 地板網格 */}
                    <Grid
                        args={[20, 20]}
                        cellSize={0.5}
                        cellThickness={0.5}
                        cellColor="#6b7280"
                        sectionSize={2}
                        sectionThickness={1}
                        sectionColor="#9ca3af"
                        fadeDistance={25}
                        fadeStrength={1}
                        followCamera={false}
                    />

                    {/* 地板陰影接收器 */}
                    <mesh
                        rotation={[-Math.PI / 2, 0, 0]}
                        position={[0, -0.01, 0]}
                        receiveShadow
                    >
                        <planeGeometry args={[20, 20]} />
                        <shadowMaterial opacity={0.3} />
                    </mesh>
                </Canvas>

                {/* 浮動信息 */}
                <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                    <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 text-xs space-y-1">
                        <div className="flex justify-between">
                            <span className="text-white/50">當前模型:</span>
                            <span className="text-white font-mono">{modelId}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/50">測試方塊:</span>
                            <span className={showTestCube ? 'text-green-400' : 'text-gray-400'}>
                                {showTestCube ? '顯示' : '隱藏'}
                            </span>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
