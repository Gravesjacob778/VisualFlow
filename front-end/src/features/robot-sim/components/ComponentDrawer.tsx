"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Upload, Loader2, Box } from "lucide-react";
import { robotConfigService } from "@/services";
import { useModel } from "@/hooks/useModel";
import type { LoadedModel } from "@/lib/modelLoader";

interface Component {
    id: string;
    name: string;
    type: string;
    fileName?: string;
}

interface ComponentListResponse {
    items: Array<ComponentItem>;
}

interface ComponentItem {
    id: string;
    fileName: string;
    fileSize: number;
    contentType: string;
    uploadedAt: string;
    uploadedBy: string;
    componentType: string;
    contains: string[];
    url: string;
}

interface ComponentDrawerProps {
    onComponentSelect?: (component: Component) => void;
    selectedComponentId?: string | null;
    // 新增：當模型載入完成時的回調
    onModelLoaded?: (model: LoadedModel | null) => void;
}
export function ComponentDrawer({
    onComponentSelect,
    selectedComponentId,
    onModelLoaded
}: ComponentDrawerProps = {}) {
    const [isOpen, setIsOpen] = useState(true);
    const [components, setComponents] = useState<Component[]>([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // 內部追蹤選中的元件 ID（用於模型載入）
    const [internalSelectedId, setInternalSelectedId] = useState<string | null>(
        selectedComponentId || null
    );

    // 使用 useModel Hook 載入選中元件對應的 3D 模型
    // 這裡假設 component.id 就是 modelId，實際上可能需要映射
    const {
        loading: modelLoading,
        error: modelError,
        model,
        progress
    } = useModel(internalSelectedId);

    // 當模型載入完成時，通知父元件
    useEffect(() => {
        if (onModelLoaded) {
            onModelLoaded(model);
        }
    }, [model, onModelLoaded]);

    // 同步外部的 selectedComponentId 到內部狀態
    useEffect(() => {
        if (selectedComponentId !== undefined) {
            setInternalSelectedId(selectedComponentId);
        }
    }, [selectedComponentId]);

    // 處理元件點擊
    const handleComponentClick = (component: Component) => {
        console.log('📦 選擇元件:', component.name, '(ID:', component.id, ')');

        // 更新內部選中狀態（這會觸發 useModel 載入模型）
        setInternalSelectedId(component.id);

        // 通知父元件
        if (onComponentSelect) {
            onComponentSelect(component);
        }

        console.log('🔄 開始載入 3D 模型，modelId:', component.id);
    };

    // Fetch components list on mount
    useEffect(() => {
        const fetchComponents = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await robotConfigService.getComponentsList();
                if (response.success) {
                    const mappedComponents: Component[] = (response.data as ComponentListResponse).items.map((item: ComponentItem) => ({
                        id: item.id,
                        name: item.fileName || "Unknown Component",
                        type: item.componentType || "Component",
                        fileName: item.fileName,
                    }));
                    setComponents(mappedComponents);
                } else {
                    console.warn("Failed to fetch components:", response.message);
                }
            } catch (err) {
                console.error("Error fetching components:", err);
                setError("無法載入元件列表");
            } finally {
                setLoading(false);
            }
        };

        void fetchComponents();
    }, []);

    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleUpload = async (file: File) => {
        const sizeLimit = 52_428_800; // 50MB
        if (!file.name.toLowerCase().endsWith(".zip")) {
            setError("只支援 ZIP 壓縮檔");
            return;
        }
        if (file.size > sizeLimit) {
            setError("檔案大小不可超過 50MB");
            return;
        }

        setError(null);
        setUploading(true);

        try {
            const response = await robotConfigService.uploadComponent(file);

            if (!response.success) {
                throw new Error(response.message || "上傳失敗");
            }
            // 使用類型斷言來指定 response.data 的結構
            const uploadedData = response.data as { items: any[] };
            const newComponents: Component[] = uploadedData.items.map((item: any) => ({
                id: item.id || item._id || String(Math.random()),
                name: item.name || item.fileName || "Unknown Component",
                type: item.type || "Component",
                fileName: item.fileName,
            }));
            setComponents((prev) => [...newComponents, ...prev]);
            console.log("Componets List", components);
        } catch (err) {
            console.error("Upload component failed", err);
            setError(err instanceof Error ? err.message : "上傳發生錯誤");
        } finally {
            setUploading(false);
        }
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        void handleUpload(file);
        // reset input so same file can be reselected
        e.target.value = "";
    };

    return (
        <>
            {/* 抽屜內容 */}
            <aside
                className={`absolute left-0 top-0 z-10 h-full bg-[#0f141a] border-r border-white/10 transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
                style={{ width: "280px" }}
            >
                <div className="flex h-full flex-col">
                    {/* 標題區 */}
                    <div className="border-b border-white/10 px-4 py-3">
                        <h2 className="text-lg font-semibold">Components</h2>
                        <p className="mt-0.5 text-xs text-white/60">
                            Manage robot attachments
                        </p>

                        {/* 模型載入狀態 */}
                        {internalSelectedId && (
                            <div className="mt-3 pt-3 border-t border-white/10">
                                {modelLoading && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-white/70">載入模型中...</span>
                                            {progress?.progress && (
                                                <span className="text-blue-400">
                                                    {Math.round(progress.progress)}%
                                                </span>
                                            )}
                                        </div>
                                        {progress?.progress !== undefined && (
                                            <div className="w-full bg-white/10 rounded-full h-1">
                                                <div
                                                    className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                                                    style={{ width: `${progress.progress}%` }}
                                                />
                                            </div>
                                        )}
                                        <p className="text-xs text-white/50">
                                            {progress?.message || '處理中...'}
                                        </p>
                                    </div>
                                )}

                                {modelError && (
                                    <div className="rounded-md bg-red-500/10 border border-red-500/40 px-3 py-2">
                                        <div className="text-xs text-red-300 font-medium">載入失敗</div>
                                        <div className="text-xs text-red-200/70 mt-1">
                                            {modelError.message}
                                        </div>
                                    </div>
                                )}

                                {model && !modelLoading && (
                                    <div className="rounded-md bg-green-500/10 border border-green-500/40 px-3 py-2">
                                        <div className="text-xs text-green-300 font-medium flex items-center gap-2">
                                            <Box className="w-3 h-3" />
                                            模型已載入
                                        </div>
                                        <div className="text-xs text-green-200/70 mt-1">
                                            {model.detail.name}
                                        </div>
                                        {model.cached && (
                                            <div className="text-xs text-green-400/80 mt-1">
                                                ⚡ 使用快取版本
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 元件列表 */}
                    <div className="flex-1 overflow-y-auto p-3">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-white/40" />
                            </div>
                        ) : components.length === 0 ? (
                            <div className="text-center py-8 text-white/40 text-sm">
                                No components available
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {components.map((component) => {
                                    const isSelected = selectedComponentId === component.id;

                                    return (
                                        <div
                                            key={component.id}
                                            onClick={() => handleComponentClick(component)}
                                            className={`
                                                rounded-lg border p-3 transition-all cursor-pointer
                                                ${isSelected
                                                    ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/20'
                                                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                                                }
                                            `}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm flex items-center gap-2">
                                                        <Box className="w-4 h-4" />
                                                        {component.name}
                                                    </div>
                                                    <div className="text-xs text-white/60 mt-1">
                                                        {component.type}
                                                    </div>
                                                </div>

                                                {isSelected && (
                                                    <div className="flex-shrink-0 ml-2">
                                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* 新增 / 上傳按鈕 */}
                    <div className="border-t border-white/10 p-3 space-y-2">
                        <button
                            onClick={handleFileSelect}
                            disabled={uploading}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Upload size={16} />
                            )}
                            {uploading ? "Uploading..." : "Add Component"}
                        </button>

                        {error && (
                            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                                {error}
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".zip"
                            onChange={onFileChange}
                            className="hidden"
                        />
                    </div>
                </div>
            </aside>

            {/* 切換按鈕 */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`absolute top-1/2 z-20 -translate-y-1/2 rounded-r-lg bg-[#0f141a] border border-l-0 border-white/10 p-2 hover:bg-white/5 transition-all ${isOpen ? "left-[280px]" : "left-0"
                    }`}
                aria-label={isOpen ? "Close drawer" : "Open drawer"}
            >
                {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
        </>
    );
}
