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
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useRobotArmStore,
  degreesToRadians,
  radiansToDegrees,
  jointConstraints,
  type JointAngles,
  type BoneControl,
} from "@/stores/robotArmStore";

interface ControlConfig {
  id: keyof JointAngles | "gripper" | "claw";
  name: string;
  minDeg: number;
  maxDeg: number;
}

const controlConfigs: ControlConfig[] = [
  { id: "j2", name: "Shoulder", minDeg: -90, maxDeg: 90 },
  { id: "j3", name: "Elbow", minDeg: -97, maxDeg: 90 },
  { id: "j4", name: "Wrist Roll", minDeg: -122, maxDeg: 125 },
  { id: "j5", name: "Wrist Pitch", minDeg: -98, maxDeg: 108 },
  { id: "gripper", name: "Gripper (自轉)", minDeg: -360, maxDeg: 360 },
  { id: "claw", name: "Claw (開合)", minDeg: 0, maxDeg: 100 },
];

export function ControlDrawer() {
  const router = useRouter();

  // Get state and actions from store
  const jointAngles = useRobotArmStore((state) => state.jointAngles);
  const gripperValue = useRobotArmStore((state) => state.gripperValue);
  const clawValue = useRobotArmStore((state) => state.clawValue);
  const isManualMode = useRobotArmStore((state) => state.isManualMode);
  const boneControls = useRobotArmStore((state) => state.boneControls);
  const setJointAngle = useRobotArmStore((state) => state.setJointAngle);
  const setGripperValue = useRobotArmStore((state) => state.setGripperValue);
  const setClawValue = useRobotArmStore((state) => state.setClawValue);
  const setBoneControlValue = useRobotArmStore((state) => state.setBoneControlValue);
  const setManualMode = useRobotArmStore((state) => state.setManualMode);
  const resetAll = useRobotArmStore((state) => state.resetAll);

  // Local drawer state
  const [isOpen, setIsOpen] = React.useState(true);

  const getControlValue = (config: ControlConfig): number => {
    if (config.id === "gripper") {
      return gripperValue;
    }
    if (config.id === "claw") {
      return clawValue;
    }
    return Math.round(radiansToDegrees(jointAngles[config.id as keyof JointAngles]));
  };

  const handleControlChange = (config: ControlConfig, valueDeg: number) => {
    if (config.id === "gripper") {
      setGripperValue(valueDeg);
    } else if (config.id === "claw") {
      setClawValue(valueDeg);
    } else {
      // Clamp to valid range based on constraints
      const constraint = jointConstraints[config.id as keyof typeof jointConstraints];
      const angleRad = degreesToRadians(valueDeg);
      const clampedRad = Math.max(
        constraint.min,
        Math.min(constraint.max, angleRad)
      );
      setJointAngle(config.id as keyof JointAngles, clampedRad);
    }
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
              {/* 預設控制項 */}
              {controlConfigs.map((config) => {
                const value = getControlValue(config);
                const isGripper = config.id === "gripper";
                const isClaw = config.id === "claw";
                return (
                  <div key={config.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">
                        {config.name}
                      </label>
                      <span className="text-xs text-white/60 tabular-nums">
                        {value}
                        {isGripper || isClaw ? "%" : "°"}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={config.minDeg}
                      max={config.maxDeg}
                      value={value}
                      onChange={(e) =>
                        handleControlChange(config, Number(e.target.value))
                      }
                      disabled={!isManualMode}
                      className={`w-full accent-blue-600 ${!isManualMode ? "cursor-not-allowed opacity-50" : ""
                        }`}
                    />
                    <div className="flex justify-between text-xs text-white/40">
                      <span>
                        {config.minDeg}
                        {isGripper || isClaw ? "%" : "°"}
                      </span>
                      <span>
                        {config.maxDeg}
                        {isGripper || isClaw ? "%" : "°"}
                      </span>
                    </div>
                  </div>
                );
              })}

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

          {/* Add Flow 按鈕 */}
          <div className="border-t border-white/10 p-4">
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
