"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

interface Component {
    id: string;
    name: string;
    type: string;
}

export function ComponentDrawer() {
    const [isOpen, setIsOpen] = useState(true);
    const [components, setComponents] = useState<Component[]>([
        { id: "1", name: "Gripper", type: "End Effector" },
        { id: "2", name: "Sensor", type: "Tool" },
    ]);

    const addComponent = () => {
        const newComponent: Component = {
            id: Date.now().toString(),
            name: `Component ${components.length + 1}`,
            type: "Custom",
        };
        setComponents([...components, newComponent]);
    };

    return (
        <>
            {/* 抽屜內容 */}
            <aside
                className={`absolute left-0 top-0 z-10 h-full bg-[#0f141a] border-r border-white/10 transition-transform duration-300 ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
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

                    {/* 新增按鈕 */}
                    <div className="border-t border-white/10 p-3">
                        <button
                            onClick={addComponent}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                            <Plus size={16} />
                            Add Component
                        </button>
                    </div>
                </div>
            </aside>

            {/* 切換按鈕 */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`absolute top-1/2 z-20 -translate-y-1/2 rounded-r-lg bg-[#0f141a] border border-l-0 border-white/10 p-2 hover:bg-white/5 transition-all ${
                    isOpen ? "left-[280px]" : "left-0"
                }`}
                aria-label={isOpen ? "Close drawer" : "Open drawer"}
            >
                {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
        </>
    );
}
