"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Hand,
  Save,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useRobotArmStore,
  degreesToRadians,
  radiansToDegrees,
} from "@/stores/robotArmStore";
import { robotConfigService } from "@/services";
import type { CreateRobotConfigRequest, JointControl } from "@/types";

// 特殊控制項（gripper 和 claw）的配置
interface SpecialControlConfig {
  id: "gripper" | "claw";
  name: string;
  minDeg: number;
  maxDeg: number;
}

const specialControls: SpecialControlConfig[] = [
  { id: "gripper", name: "Gripper (自轉)", minDeg: -360, maxDeg: 360 },
  { id: "claw", name: "Claw (夾爪)", minDeg: 0, maxDeg: 100 },
];

export function ControlDrawer() {
  const router = useRouter();

  // Get state and actions from store
  const jointAngles = useRobotArmStore((state) => state.jointAngles);
  const gripperValue = useRobotArmStore((state) => state.gripperValue);
  const clawValue = useRobotArmStore((state) => state.clawValue);
  const isManualMode = useRobotArmStore((state) => state.isManualMode);
  const boneControls = useRobotArmStore((state) => state.boneControls);
  const setGripperValue = useRobotArmStore((state) => state.setGripperValue);
  const setClawValue = useRobotArmStore((state) => state.setClawValue);
  const setBoneControlValue = useRobotArmStore((state) => state.setBoneControlValue);
  const setManualMode = useRobotArmStore((state) => state.setManualMode);
  const resetAll = useRobotArmStore((state) => state.resetAll);

  // 動態控制項
  const modelControls = useRobotArmStore((state) => state.modelControls);
  const dynamicJointAngles = useRobotArmStore((state) => state.dynamicJointAngles);
  const setDynamicJointAngle = useRobotArmStore((state) => state.setDynamicJointAngle);

  // Local drawer state
  const [isOpen, setIsOpen] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  // 取得特殊控制項的值
  const getSpecialControlValue = (config: SpecialControlConfig): number => {
    if (config.id === "gripper") {
      return gripperValue;
    }
    return clawValue;
  };

  // 處理特殊控制項變更
  const handleSpecialControlChange = (config: SpecialControlConfig, valueDeg: number) => {
    if (config.id === "gripper") {
      setGripperValue(valueDeg);
    } else {
      setClawValue(valueDeg);
    }
  };

  // 取得動態控制項的值（度數）
  const getDynamicControlValue = (control: JointControl): number => {
    const angleRad = dynamicJointAngles[control.id] ?? 0;
    return Math.round(radiansToDegrees(angleRad));
  };

  // 處理動態控制項變更
  const handleDynamicControlChange = (control: JointControl, valueDeg: number) => {
    // 根據控制項的單位進行轉換
    const clampedDeg = Math.max(control.minAngle, Math.min(control.maxAngle, valueDeg));
    const angleRad = degreesToRadians(clampedDeg);
    setDynamicJointAngle(control.id, angleRad);
  };

  const handleRun = () => {
    setManualMode(false);
  };

  const handlePause = () => {
    setManualMode(true);
  };

  const handleAddFlow = () => {
    router.push("/editor/new");
  };

  const handleSaveConfiguration = async () => {
    setIsSaving(true);
    try {
      // 準備 bone controls 陣列
      const boneControlsArray = Array.from(boneControls.entries()).map(
        ([boneName, control]) => ({
          boneName,
          position: [0, 0, 0] as [number, number, number],
          rotation: [
            control.axis === "x" ? control.value : 0,
            control.axis === "y" ? control.value : 0,
            control.axis === "z" ? control.value : 0,
          ] as [number, number, number],
          scale: [1, 1, 1] as [number, number, number],
        })
      );

      const request: CreateRobotConfigRequest = {
        name: `Robot Config ${new Date().toLocaleString()}`,
        description: "Saved from Control Panel",
        transform: {
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },
        jointAngles: { ...jointAngles },
        gripper: {
          // Allow degrees (-360 to 360)
          gripperValue: gripperValue,
          // Normalize claw opening to 0-1
          clawValue: clawValue,
        },
        boneControls: boneControlsArray.length > 0 ? boneControlsArray : undefined,
        tags: ["manual-save"],
      };

      const response = await robotConfigService.createConfiguration(request);

      if (response.success) {
        alert("✅ Configuration saved successfully!");
      } else {
        alert(`❌ Failed to save: ${response.message}`);
      }
    } catch (error) {
      console.error("Error saving configuration:", error);
      alert("❌ Error saving configuration");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* 切換按鈕 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`absolute top-1/2 z-20 -translate-y-1/2 rounded-l-lg border border-r-0 border-white/10 bg-[#0f141a] p-2 transition-all hover:bg-white/5 ${isOpen ? "right-[320px]" : "right-0"
          }`}
        aria-label={isOpen ? "Close drawer" : "Open drawer"}
      >
        {isOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      {/* 抽屜內容 */}
      <aside
        className={`absolute top-0 right-0 z-10 h-full border-l border-white/10 bg-[#0f141a] transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        style={{ width: "320px" }}
      >
        <div className="flex h-full flex-col">
          {/* 標題區 */}
          <div className="border-b border-white/10 px-4 py-3">
            <h2 className="text-lg font-semibold">Control Panel</h2>
            <p className="mt-0.5 text-xs text-white/60">
              {isManualMode ? "Manual Control Mode" : "Auto Animation Mode"}
            </p>
          </div>

          {/* 快速操作按鈕 */}
          <div className="border-b border-white/10 px-4 py-3">
            <div className="flex gap-2">
              <button
                onClick={handleRun}
                disabled={!isManualMode}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isManualMode
                  ? "bg-green-600 hover:bg-green-700"
                  : "cursor-not-allowed bg-green-600/50"
                  }`}
              >
                <Play size={14} />
                Auto
              </button>
              <button
                onClick={handlePause}
                disabled={isManualMode}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${!isManualMode
                  ? "bg-orange-600 hover:bg-orange-700"
                  : "cursor-not-allowed bg-orange-600/50"
                  }`}
              >
                <Hand size={14} />
                Manual
              </button>
              <button
                onClick={resetAll}
                className="flex items-center justify-center rounded-lg bg-gray-600 px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-700"
                title="Reset all joints to 0°"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>

          {/* 控制項列表 */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {/* 動態模型控制項 */}
              {modelControls.length > 0 ? (
                <>
                  <div className="mb-2">
                    <h3 className="text-xs font-semibold text-white/70">
                      MODEL CONTROLS ({modelControls.length})
                    </h3>
                  </div>
                  {modelControls.map((control) => {
                    const value = getDynamicControlValue(control);
                    return (
                      <div key={control.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">
                            {control.displayName}
                          </label>
                          <span className="text-xs text-white/60 tabular-nums">
                            {value}°
                          </span>
                        </div>
                        <input
                          type="range"
                          min={control.minAngle}
                          max={control.maxAngle}
                          value={value}
                          onChange={(e) =>
                            handleDynamicControlChange(control, Number(e.target.value))
                          }
                          disabled={!isManualMode}
                          className={`w-full accent-blue-600 ${!isManualMode ? "cursor-not-allowed opacity-50" : ""
                            }`}
                        />
                        <div className="flex justify-between text-xs text-white/40">
                          <span>{control.minAngle}°</span>
                          <span>{control.maxAngle}°</span>
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="text-center py-4 text-white/40 text-sm">
                  載入模型以顯示控制項
                </div>
              )}

              {/* 特殊控制項 (Gripper & Claw) */}
              {modelControls.length > 0 && (
                <>
                  <div className="border-t border-white/20 pt-4">
                    <h3 className="text-xs font-semibold text-white/70 mb-3">
                      SPECIAL CONTROLS
                    </h3>
                  </div>
                  {specialControls.map((config) => {
                    const value = getSpecialControlValue(config);
                    return (
                      <div key={config.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">
                            {config.name}
                          </label>
                          <span className="text-xs text-white/60 tabular-nums">
                            {value}{config.id === "claw" ? "%" : "°"}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={config.minDeg}
                          max={config.maxDeg}
                          value={value}
                          onChange={(e) =>
                            handleSpecialControlChange(config, Number(e.target.value))
                          }
                          disabled={!isManualMode}
                          className={`w-full accent-green-600 ${!isManualMode ? "cursor-not-allowed opacity-50" : ""
                            }`}
                        />
                        <div className="flex justify-between text-xs text-white/40">
                          <span>{config.minDeg}{config.id === "claw" ? "%" : "°"}</span>
                          <span>{config.maxDeg}{config.id === "claw" ? "%" : "°"}</span>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* 動態骨骼控制項 */}
              {boneControls.size > 0 && (
                <>
                  <div className="border-t border-white/20 pt-4">
                    <h3 className="text-xs font-semibold text-white/70 mb-3">
                      🦴 BONE CONTROLS
                    </h3>
                  </div>
                  {Array.from(boneControls.entries()).map(([boneName, control]) => {
                    const valueDeg = radiansToDegrees(control.value);
                    return (
                      <div key={boneName} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium">
                            {boneName}
                          </label>
                          <span className="text-xs text-white/60 tabular-nums">
                            {Math.round(valueDeg)}°
                          </span>
                        </div>
                        <input
                          type="range"
                          min={control.minDeg}
                          max={control.maxDeg}
                          value={valueDeg}
                          onChange={(e) =>
                            setBoneControlValue(boneName, Number(e.target.value))
                          }
                          disabled={!isManualMode}
                          className={`w-full accent-purple-600 ${!isManualMode ? "cursor-not-allowed opacity-50" : ""
                            }`}
                        />
                        <div className="flex justify-between text-xs text-white/40">
                          <span>{control.minDeg}°</span>
                          <span>{control.maxDeg}°</span>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-white/10 p-4 space-y-2">
            <button
              onClick={handleSaveConfiguration}
              disabled={isSaving}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={16} />
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={handleAddFlow}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium transition-colors hover:bg-blue-700"
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
