"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface ControlItem {
    id: string;
    name: string;
    value: number;
    min: number;
    max: number;
}

export function ControlDrawer() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(true);
    const [controls, setControls] = useState<ControlItem[]>([
        { id: "1", name: "Base Rotation", value: 0, min: -180, max: 180 },
        { id: "2", name: "Shoulder", value: 0, min: -90, max: 90 },
        { id: "3", name: "Elbow", value: 0, min: -120, max: 120 },
        { id: "4", name: "Wrist Pitch", value: 0, min: -90, max: 90 },
        { id: "5", name: "Wrist Roll", value: 0, min: -180, max: 180 },
        { id: "6", name: "Gripper", value: 0, min: 0, max: 100 },
    ]);

    const updateControl = (id: string, value: number) => {
        setControls(
            controls.map((ctrl) =>
                ctrl.id === id ? { ...ctrl, value } : ctrl
            )
        );
    };

    const resetAll = () => {
        setControls(controls.map((ctrl) => ({ ...ctrl, value: 0 })));
    };

    const handleAddFlow = () => {
        router.push("/editor/new");
    };

    return (
        <>
            {/* 切換按鈕 */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`absolute top-1/2 z-20 -translate-y-1/2 rounded-l-lg bg-[#0f141a] border border-r-0 border-white/10 p-2 hover:bg-white/5 transition-all ${
                    isOpen ? "right-[320px]" : "right-0"
                }`}
                aria-label={isOpen ? "Close drawer" : "Open drawer"}
            >
                {isOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>

            {/* 抽屜內容 */}
            <aside
                className={`absolute right-0 top-0 z-10 h-full bg-[#0f141a] border-l border-white/10 transition-transform duration-300 ${
                    isOpen ? "translate-x-0" : "translate-x-full"
                }`}
                style={{ width: "320px" }}
            >
                <div className="flex h-full flex-col">
                    {/* 標題區 */}
                    <div className="border-b border-white/10 px-4 py-3">
                        <h2 className="text-lg font-semibold">Control Panel</h2>
                        <p className="mt-0.5 text-xs text-white/60">
                            Adjust robot movements
                        </p>
                    </div>

                    {/* 快速操作按鈕 */}
                    <div className="border-b border-white/10 px-4 py-3">
                        <div className="flex gap-2">
                            <button className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5">
                                <Play size={14} />
                                Run
                            </button>
                            <button className="flex-1 rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium hover:bg-orange-700 transition-colors flex items-center justify-center gap-1.5">
                                <Pause size={14} />
                                Pause
                            </button>
                            <button
                                onClick={resetAll}
                                className="rounded-lg bg-gray-600 px-3 py-2 text-sm font-medium hover:bg-gray-700 transition-colors flex items-center justify-center"
                            >
                                <RotateCcw size={14} />
                            </button>
                        </div>
                    </div>

                    {/* 控制項列表 */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="space-y-4">
                            {controls.map((control) => (
                                <div key={control.id} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium">
                                            {control.name}
                                        </label>
                                        <span className="text-xs text-white/60">
                                            {control.value}°
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min={control.min}
                                        max={control.max}
                                        value={control.value}
                                        onChange={(e) =>
                                            updateControl(
                                                control.id,
                                                Number(e.target.value)
                                            )
                                        }
                                        className="w-full accent-blue-600"
                                    />
                                    <div className="flex justify-between text-xs text-white/40">
                                        <span>{control.min}°</span>
                                        <span>{control.max}°</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Add Flow 按鈕 */}
                    <div className="border-t border-white/10 p-4">
                        <button
                            onClick={handleAddFlow}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                            <Plus size={16} />
                            Add Flow
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
