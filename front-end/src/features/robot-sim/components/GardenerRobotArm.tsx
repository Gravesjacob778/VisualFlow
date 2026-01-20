"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, Center } from "@react-three/drei";
import * as THREE from "three";
import { useRobotArmStore } from "@/stores/robotArmStore";

interface GardenerRobotArmProps {
    position?: [number, number, number];
    scale?: number;
    rotation?: [number, number, number];
    autoRotate?: boolean;
}

// 骨骼節點名稱對應
const BONE_NAMES = {
    base: "Bone_5",      // 底座
    j1: "Bone001_16",    // 關節1 - 底座旋轉
    j2: "Bone002_14",    // 關節2 - 肩膀
    j3: "Bone003_12",    // 關節3 - 肘部
    j4: "Bone004_10",    // 關節4 - 手腕滾轉
    j5: "Bone005_8",     // 關節5 - 手腕俯仰/末端執行器
};

export function GardenerRobotArm({
    position = [0, 0, 0],
    scale = 0.15,
    rotation = [0, 0, 0],
    autoRotate = true,
}: GardenerRobotArmProps) {
    const groupRef = useRef<THREE.Group>(null);

    // 骨骼節點引用
    const bonesRef = useRef<{
        base: THREE.Object3D | null;
        j1: THREE.Object3D | null;
        j2: THREE.Object3D | null;
        j3: THREE.Object3D | null;
        j4: THREE.Object3D | null;
        j5: THREE.Object3D | null;
    }>({
        base: null,
        j1: null,
        j2: null,
        j3: null,
        j4: null,
        j5: null,
    });

    // 從 store 獲取狀態
    const jointAngles = useRobotArmStore((state) => state.jointAngles);
    const isManualMode = useRobotArmStore((state) => state.isManualMode);

    // 載入 GLTF 模型
    const { scene } = useGLTF("/models/robotic_arm_gardener/scene.gltf");

    // 克隆場景以避免共享問題，並設定材質和陰影
    const clonedScene = useMemo(() => {
        const cloned = scene.clone();
        cloned.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        return cloned;
    }, [scene]);

    // 找到並綁定骨骼節點
    useEffect(() => {
        console.log('\n🦴 正在查找骨骼節點...\n');

        clonedScene.traverse((child) => {
            if (child.name === BONE_NAMES.base) {
                bonesRef.current.base = child;
                console.log('✅ 找到底座骨骼:', child.name);
            }
            if (child.name === BONE_NAMES.j1) {
                bonesRef.current.j1 = child;
                console.log('✅ 找到 J1 骨骼:', child.name);
            }
            if (child.name === BONE_NAMES.j2) {
                bonesRef.current.j2 = child;
                console.log('✅ 找到 J2 骨骼:', child.name);
            }
            if (child.name === BONE_NAMES.j3) {
                bonesRef.current.j3 = child;
                console.log('✅ 找到 J3 骨骼:', child.name);
            }
            if (child.name === BONE_NAMES.j4) {
                bonesRef.current.j4 = child;
                console.log('✅ 找到 J4 骨骼:', child.name);
            }
            if (child.name === BONE_NAMES.j5) {
                bonesRef.current.j5 = child;
                console.log('✅ 找到 J5 骨骼:', child.name);
            }
        });

        console.log('\n📋 骨骼綁定結果:', bonesRef.current);
    }, [clonedScene]);

    // 動畫循環 - 控制骨骼旋轉
    useFrame((state, delta) => {
        const bones = bonesRef.current;

        if (isManualMode) {
            // 手動模式：根據控制面板調整骨骼旋轉
            // J1: 底座旋轉 (繞 Y 軸或 Z 軸，取決於模型的初始方向)
            if (bones.j1) {
                bones.j1.rotation.z = THREE.MathUtils.lerp(
                    bones.j1.rotation.z,
                    jointAngles.j1,
                    delta * 5
                );
            }

            // J2: 肩膀 (繞 X 軸)
            if (bones.j2) {
                bones.j2.rotation.x = THREE.MathUtils.lerp(
                    bones.j2.rotation.x,
                    jointAngles.j2,
                    delta * 5
                );
            }

            // J3: 肘部 (繞 X 軸)
            if (bones.j3) {
                bones.j3.rotation.x = THREE.MathUtils.lerp(
                    bones.j3.rotation.x,
                    jointAngles.j3,
                    delta * 5
                );
            }

            // J4: 手腕滾轉 (繞 Y 軸或 Z 軸)
            if (bones.j4) {
                bones.j4.rotation.y = THREE.MathUtils.lerp(
                    bones.j4.rotation.y,
                    jointAngles.j4,
                    delta * 5
                );
            }

            // J5: 手腕俯仰 (繞 X 軸)
            if (bones.j5) {
                bones.j5.rotation.x = THREE.MathUtils.lerp(
                    bones.j5.rotation.x,
                    jointAngles.j5,
                    delta * 5
                );
            }
        } else if (autoRotate) {
            // 自動模式：展示動畫
            const t = state.clock.getElapsedTime();

            if (bones.j1) {
                bones.j1.rotation.z = Math.sin(t * 0.3) * 0.5;
            }
            if (bones.j2) {
                bones.j2.rotation.x = Math.sin(t * 0.5) * 0.4;
            }
            if (bones.j3) {
                bones.j3.rotation.x = Math.sin(t * 0.7) * 0.5;
            }
            if (bones.j4) {
                bones.j4.rotation.y = Math.sin(t * 0.9) * 0.6;
            }
            if (bones.j5) {
                bones.j5.rotation.x = Math.sin(t * 1.1) * 0.3;
            }
        }

        // 整體模型緩慢旋轉（可選）
        if (groupRef.current && !isManualMode && autoRotate) {
            // groupRef.current.rotation.y += delta * 0.1;
        }
    });

    return (
        <group ref={groupRef} position={position} rotation={rotation}>
            <Center>
                <primitive
                    object={clonedScene}
                    scale={scale}
                    rotation={[-Math.PI / 2, 0, 0]}
                />
            </Center>
        </group>
    );
}

// 預載入模型以提升效能
useGLTF.preload("/models/robotic_arm_gardener/scene.gltf");
