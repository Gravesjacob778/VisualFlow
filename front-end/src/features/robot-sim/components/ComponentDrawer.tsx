"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Upload, Loader2 } from "lucide-react";
import { robotConfigService } from "@/services";

interface Component {
    id: string;
    name: string;
    type: string;
}

export function ComponentDrawer() {
    const [isOpen, setIsOpen] = useState(true);
    const [components, setComponents] = useState<Component[]>([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

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

            if (!response.isSuccess) {
                throw new Error(response.message || "上傳失敗");
            }

            const newComponent: Component = {
                id: response.data?.id || Date.now().toString(),
                name: response.data?.fileName || file.name,
                type: "Uploaded ZIP",
            };

            setComponents((prev) => [newComponent, ...prev]);
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
                    </div>

                    {/* 元件列表 */}
                    <div className="flex-1 overflow-y-auto p-3">
                        <div className="space-y-2">
                            {components.map((component) => (
                                <div
                                    key={component.id}
                                    className="rounded-lg border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition-colors cursor-pointer"
                                >
                                    <div className="font-medium text-sm">
                                        {component.name}
                                    </div>
                                    <div className="text-xs text-white/60 mt-1">
                                        {component.type}
                                    </div>
                                </div>
                            ))}
                        </div>
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
