/**
 * ModelSelector 元件
 * 顯示模型清單供使用者選擇
 */

'use client';

import { useState } from 'react';
import { useModelsList } from '@/hooks/useModel';
import type { ModelListItem } from '@/types/model';

interface ModelSelectorProps {
    category?: string;
    onSelect: (modelId: string) => void;
    selectedModelId?: string | null;
}

/**
 * 模型卡片元件
 */
function ModelCard({
    model,
    selected,
    onSelect,
}: {
    model: ModelListItem;
    selected: boolean;
    onSelect: () => void;
}) {
    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    };

    return (
        <div
            onClick={onSelect}
            className={`
                relative cursor-pointer rounded-lg border-2 overflow-hidden transition-all
                ${selected
                    ? 'border-blue-500 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-md'}
            `}
        >
            {/* 縮圖 */}
            <div className="aspect-square bg-gray-100 relative">
                <img
                    src={model.thumbnailUrl}
                    alt={model.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.currentTarget.src = '/placeholder-model.png';
                    }}
                />
                {selected && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                )}
            </div>

            {/* 資訊 */}
            <div className="p-3">
                <h3 className="font-semibold text-sm mb-1 line-clamp-1">{model.name}</h3>
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">{model.description}</p>

                <div className="flex flex-wrap gap-1 mb-2">
                    {model.tags.slice(0, 3).map((tag) => (
                        <span
                            key={tag}
                            className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                            {tag}
                        </span>
                    ))}
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500">
                    <span className="uppercase font-medium">{model.fileFormat}</span>
                    <span>{formatFileSize(model.fileSize)}</span>
                </div>
            </div>
        </div>
    );
}

/**
 * ModelSelector - 主元件
 */
export function ModelSelector({ category, onSelect, selectedModelId }: ModelSelectorProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const { loading, error, models, hasMore, loadMore, reload } = useModelsList({
        category,
        search: searchQuery || undefined,
        limit: 12,
    });

    return (
        <div className="flex flex-col h-full bg-white">
            {/* 標題與搜尋 */}
            <div className="p-4 border-b">
                <h2 className="text-lg font-semibold mb-3">選擇 3D 模型</h2>

                {/* 搜尋框 */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="搜尋模型..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <svg
                        className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* 模型清單 */}
            <div className="flex-1 overflow-y-auto p-4">
                {loading && models.length === 0 && (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                            <p className="text-gray-600">載入中...</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="text-red-600 mb-2">載入失敗</div>
                            <p className="text-sm text-gray-600 mb-4">{error.message}</p>
                            <button
                                onClick={reload}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                重試
                            </button>
                        </div>
                    </div>
                )}

                {!loading && !error && models.length === 0 && (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center text-gray-500">
                            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                            <p>沒有找到模型</p>
                        </div>
                    </div>
                )}

                {models.length > 0 && (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {models.map((model) => (
                                <ModelCard
                                    key={model.id}
                                    model={model}
                                    selected={model.id === selectedModelId}
                                    onSelect={() => onSelect(model.id)}
                                />
                            ))}
                        </div>

                        {/* 載入更多按鈕 */}
                        {hasMore && (
                            <div className="mt-6 text-center">
                                <button
                                    onClick={loadMore}
                                    disabled={loading}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading ? '載入中...' : '載入更多'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
