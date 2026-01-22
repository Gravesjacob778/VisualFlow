/**
 * ModelViewer 元件
 * 示範如何使用 useModel Hook 載入 3D 模型
 */

'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { useGLTF } from '@react-three/drei';
import { useModel } from '@/hooks/useModel';
import * as THREE from 'three';

interface ModelViewerProps {
    modelId: string;
}

/**
 * 3D 模型場景元件
 */
function ModelScene({ url }: { url: string }) {
    const { scene } = useGLTF(url);

    // 設定陰影
    scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    return <primitive object={scene} />;
}

/**
 * 載入進度顯示
 */
function LoadingProgress({ progress }: { progress: number }) {
    return (
        <div className="flex flex-col items-center justify-center h-full">
            <div className="w-64 bg-gray-200 rounded-full h-2.5 mb-4">
                <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <p className="text-sm text-gray-600">{progress}%</p>
        </div>
    );
}

/**
 * ModelViewer - 主元件
 */
export function ModelViewer({ modelId }: ModelViewerProps) {
    const { loading, error, model, progress, reload } = useModel(modelId);

    if (loading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
                <p className="text-gray-600 mb-2">{progress?.message || '載入中...'}</p>
                {progress?.progress !== undefined && (
                    <LoadingProgress progress={progress.progress} />
                )}
                {model?.cached && (
                    <p className="text-xs text-green-600 mt-2">✓ 使用快取版本</p>
                )}
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-red-50">
                <div className="text-red-600 mb-4">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <p className="text-red-800 font-medium mb-2">載入失敗</p>
                <p className="text-red-600 text-sm mb-4">{error.message}</p>
                <button
                    onClick={reload}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                    重試
                </button>
            </div>
        );
    }

    if (!model) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
                <p className="text-gray-500">沒有選擇模型</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full relative">
            {/* 模型資訊 */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg z-10">
                <h3 className="font-semibold text-sm mb-1">{model.detail.name}</h3>
                <p className="text-xs text-gray-600 mb-1">{model.detail.description}</p>
                <div className="flex gap-2 text-xs">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                        {model.format.toUpperCase()}
                    </span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded">
                        v{model.detail.version}
                    </span>
                    {model.cached && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded">
                            快取
                        </span>
                    )}
                </div>
            </div>

            {/* 3D Canvas */}
            <Canvas
                shadows
                camera={{ position: [5, 5, 5], fov: 50 }}
                className="w-full h-full"
            >
                <Suspense fallback={null}>
                    <ambientLight intensity={0.5} />
                    <directionalLight
                        position={[10, 10, 5]}
                        intensity={1}
                        castShadow
                        shadow-mapSize-width={2048}
                        shadow-mapSize-height={2048}
                    />

                    <ModelScene url={model.url} />

                    <OrbitControls
                        enablePan
                        enableZoom
                        enableRotate
                        minDistance={1}
                        maxDistance={20}
                    />

                    <Environment preset="city" />

                    {/* 地板 */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
                        <planeGeometry args={[20, 20]} />
                        <shadowMaterial opacity={0.3} />
                    </mesh>
                </Suspense>
            </Canvas>
        </div>
    );
}
