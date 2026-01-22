/**
 * 模型管理示範頁面
 * 展示如何使用 3D 模型管理系統
 */

'use client';

import { useState } from 'react';
import { ModelSelector } from '@/features/robot-sim/components/ModelSelector';
import { ModelViewer } from '@/features/robot-sim/components/ModelViewer';
import * as modelDB from '@/lib/modelIndexedDB';

export default function ModelManagementDemo() {
    const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
    const [showSelector, setShowSelector] = useState(true);
    const [cacheInfo, setCacheInfo] = useState<{ size: number; count: number } | null>(null);

    // 取得快取資訊
    const updateCacheInfo = async () => {
        const size = await modelDB.getCacheSize();
        const models = await modelDB.getAllCachedModels();
        setCacheInfo({ size, count: models.length });
    };

    // 清除所有快取
    const clearCache = async () => {
        if (confirm('確定要清除所有快取嗎？')) {
            await modelDB.clearAllModels();
            await updateCacheInfo();
            alert('快取已清除');
        }
    };

    // 清除過期快取
    const clearExpiredCache = async () => {
        const count = await modelDB.clearExpiredModels(30);
        await updateCacheInfo();
        alert(`已清除 ${count} 個過期模型`);
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* 頂部工具列 */}
            <header className="bg-white shadow-sm border-b">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">3D 模型管理系統</h1>
                            <p className="text-sm text-gray-600 mt-1">
                                支援 GLTF/GLB 格式，含 IndexedDB 快取
                            </p>
                        </div>

                        {/* 快取管理 */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={updateCacheInfo}
                                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                查看快取
                            </button>
                            <button
                                onClick={clearExpiredCache}
                                className="px-4 py-2 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                            >
                                清除過期
                            </button>
                            <button
                                onClick={clearCache}
                                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                清除所有快取
                            </button>
                        </div>
                    </div>

                    {/* 快取資訊 */}
                    {cacheInfo && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
                            <div className="flex gap-6">
                                <div>
                                    <span className="text-gray-600">快取模型數量：</span>
                                    <span className="font-semibold text-blue-900">{cacheInfo.count}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">快取總大小：</span>
                                    <span className="font-semibold text-blue-900">
                                        {(cacheInfo.size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* 主要內容 */}
            <div className="flex-1 flex overflow-hidden">
                {/* 左側：模型選擇器 */}
                {showSelector && (
                    <aside className="w-96 bg-white border-r shadow-sm overflow-hidden">
                        <ModelSelector
                            category="robot-arm"
                            onSelect={(id) => {
                                setSelectedModelId(id);
                                setShowSelector(false);
                            }}
                            selectedModelId={selectedModelId}
                        />
                    </aside>
                )}

                {/* 右側：模型檢視器 */}
                <main className="flex-1 relative">
                    {/* 控制按鈕 */}
                    <div className="absolute top-4 right-4 z-10 flex gap-2">
                        <button
                            onClick={() => setShowSelector(!showSelector)}
                            className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white transition-colors text-sm font-medium"
                        >
                            {showSelector ? '隱藏選擇器' : '顯示選擇器'}
                        </button>

                        {selectedModelId && (
                            <button
                                onClick={() => setSelectedModelId(null)}
                                className="px-4 py-2 bg-red-500/90 text-white backdrop-blur-sm rounded-lg shadow-lg hover:bg-red-600 transition-colors text-sm font-medium"
                            >
                                關閉模型
                            </button>
                        )}
                    </div>

                    {/* 模型檢視器 */}
                    {selectedModelId ? (
                        <ModelViewer modelId={selectedModelId} />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                            <svg
                                className="w-32 h-32 text-gray-300 mb-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                />
                            </svg>
                            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                                選擇一個 3D 模型
                            </h2>
                            <p className="text-gray-500 mb-6">
                                從左側選擇器中選擇模型以開始檢視
                            </p>
                            <button
                                onClick={() => setShowSelector(true)}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                開啟模型選擇器
                            </button>
                        </div>
                    )}
                </main>
            </div>

            {/* 底部狀態列 */}
            <footer className="bg-white border-t px-6 py-3">
                <div className="flex items-center justify-between text-sm text-gray-600">
                    <div>
                        {selectedModelId ? (
                            <span>目前載入: <span className="font-medium text-gray-900">{selectedModelId}</span></span>
                        ) : (
                            <span>尚未選擇模型</span>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <span>API: {process.env.NEXT_PUBLIC_API_BASE_URL || 'localhost:5195'}</span>
                        <span>IndexedDB: VisualFlow3DModels</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
