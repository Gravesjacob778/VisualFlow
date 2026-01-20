import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface JointAngles {
  j1: number; // Base rotation (Y axis), -PI to PI
  j2: number; // Shoulder pitch (Z axis), -PI/2 to PI/2
  j3: number; // Elbow (Z axis), -PI*0.75 to PI/2
  j4: number; // Wrist roll (X axis), -PI to PI
  j5: number; // Wrist pitch (Z axis), -PI/1.5 to PI/1.5
  j6: number; // Tool roll (X axis), -PI to PI
}

export interface BoneControl {
  name: string;
  minDeg: number;
  maxDeg: number;
  axis: "x" | "y" | "z";
  value: number; // 存儲弧度值
}

export interface RobotArmState {
  // State
  jointAngles: JointAngles;
  gripperValue: number; // -360 to 360 (自轉角度)
  clawValue: number;    // 0 (閉合) to 100 (張開)
  isManualMode: boolean;
  boneControls: Map<string, BoneControl>; // 動態骨骼控制

  // Actions
  setJointAngle: (joint: keyof JointAngles, angle: number) => void;
  setAllJointAngles: (angles: JointAngles) => void;
  setGripperValue: (value: number) => void;
  setClawValue: (value: number) => void;
  setBoneControlValue: (boneName: string, valueDeg: number) => void;
  setBoneControls: (controls: Map<string, BoneControl>) => void;
  setManualMode: (isManual: boolean) => void;
  resetAll: () => void;
}

const initialJointAngles: JointAngles = {
  j1: 0,
  j2: 0,
  j3: 0,
  j4: 0,
  j5: 0,
  j6: 0,
};

export const useRobotArmStore = create<RobotArmState>()(
  devtools(
    (set) => ({
      // Initial state
      jointAngles: { ...initialJointAngles },
      gripperValue: 0,
      clawValue: 0,
      isManualMode: true, // Start in manual mode
      boneControls: new Map(),

      // Actions
      setJointAngle: (joint, angle) =>
        set((state) => ({
          jointAngles: {
            ...state.jointAngles,
            [joint]: angle,
          },
        })),

      setAllJointAngles: (angles) => set({ jointAngles: angles }),

      setGripperValue: (value) =>
        set({ gripperValue: Math.max(-360, Math.min(360, value)) }),

      setClawValue: (value) =>
        set({ clawValue: Math.max(0, Math.min(100, value)) }),

      setBoneControlValue: (boneName, valueDeg) =>
        set((state) => {
          const newControls = new Map(state.boneControls);
          const control = newControls.get(boneName);
          if (control) {
            const clampedDeg = Math.max(control.minDeg, Math.min(control.maxDeg, valueDeg));
            const valueRad = degreesToRadians(clampedDeg);
            newControls.set(boneName, {
              ...control,
              value: valueRad,
            });
          }
          return { boneControls: newControls };
        }),

      setBoneControls: (controls) => set({ boneControls: controls }),

      setManualMode: (isManual) => set({ isManualMode: isManual }),

      resetAll: () =>
        set({
          jointAngles: { ...initialJointAngles },
          gripperValue: 0,
          clawValue: 0,
          boneControls: new Map(),
        }),
    }),
    { name: "robot-arm-store" }
  )
);

// Utility functions for angle conversion
export const degreesToRadians = (degrees: number): number =>
  (degrees * Math.PI) / 180;

export const radiansToDegrees = (radians: number): number =>
  (radians * 180) / Math.PI;

// Joint constraints for reference (in radians)
export const jointConstraints = {
  j1: { min: -Math.PI, max: Math.PI, axis: "y" as const },
  j2: { min: -Math.PI / 2, max: Math.PI / 2, axis: "z" as const },
  j3: { min: -Math.PI * 0.75, max: Math.PI / 2, axis: "z" as const },
  j4: { min: -Math.PI, max: Math.PI, axis: "x" as const },
  j5: { min: -Math.PI / 1.5, max: Math.PI / 1.5, axis: "z" as const },
  j6: { min: -Math.PI, max: Math.PI, axis: "x" as const },
} as const;
