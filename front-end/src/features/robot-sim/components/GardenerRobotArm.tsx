"use client";
import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, Center } from "@react-three/drei";
import * as THREE from "three";
import { useRobotArmStore, degreesToRadians, BoneControl } from "@/stores/robotArmStore";

interface GardenerRobotArmProps {
    position?: [number, number, number];
    scale?: number;
    rotation?: [number, number, number];
    autoRotate?: boolean;
}

// 骨骼節點名稱對應
const BONE_NAMES = {
    base: "Bone_5",      // 底座 (不控制)
    j1: "Bone001_16",    // 關節1 - 底座旋轉 (不讓用戶調整)
    j2: "Bone002_14",    // 關節2 - Shoulder (上下移動)
    j3: "Bone003_12",    // 關節3 - Elbow (上下移動)
    j4: "Bone004_10",    // 關節4 - Wrist Roll (左右移動)
    j5: "Bone005_8",     // 關節5 - Wrist Pitch (上下移動)
    gripper: "Cylinder052_6",  // 末端執行器 (自轉)
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
        gripper: THREE.Object3D | null;
    }>({
        base: null,
        j1: null,
        j2: null,
        j3: null,
        j4: null,
        j5: null,
        gripper: null,
    });

    // 從 store 獲取狀態
    const jointAngles = useRobotArmStore((state) => state.jointAngles);
    const gripperValue = useRobotArmStore((state) => state.gripperValue);
    const clawValue = useRobotArmStore((state) => state.clawValue);
    const isManualMode = useRobotArmStore((state) => state.isManualMode);
    const boneControls = useRobotArmStore((state) => state.boneControls);
    const setBoneControls = useRobotArmStore((state) => state.setBoneControls);

    // 動態骨骼引用映射表 - 避免每幀 traverse
    const dynamicBonesMapRef = useRef<Map<string, THREE.Object3D>>(new Map());

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

        // 先列出所有骨骼名稱供調試使用，附帶詳細信息
        const allBonesDetailed: Array<{
            name: string;
            type: string;
            hasChildren: number;
            isMesh: boolean;
        }> = [];

        const boneMap = new Map<string, THREE.Object3D>();

        clonedScene.traverse((child) => {
            allBonesDetailed.push({
                name: child.name || '(unnamed)',
                type: child.type,
                hasChildren: child.children.length,
                isMesh: child instanceof THREE.Mesh,
            });

            // 儲存所有 Object3D (非 Mesh) 供動態控制
            if (!child.name.startsWith('Object_') && child.name && child.type === 'Object3D') {
                boneMap.set(child.name, child);
            }
        });

        console.log('📋 ========== 所有機械手臂骨骼列表 ==========');
        console.table(allBonesDetailed);
        console.log('📝 骨骼總數:', allBonesDetailed.length);
        console.log('==========================================\n');

        // 建立動態骨骼控制配置
        const dynamicBoneControls = new Map<string, BoneControl>();

        // 已經有專門控制的骨骼，不加入動態控制
        const excludedBones = new Set([
            BONE_NAMES.base,
            BONE_NAMES.j1,
            BONE_NAMES.j2,
            BONE_NAMES.j3,
            BONE_NAMES.j4,
            BONE_NAMES.j5,
            BONE_NAMES.gripper,
        ]);

        // 為每個骨骼建立默認控制（Z軸旋轉，±180度），排除已控制的骨骼
        boneMap.forEach((bone, boneName) => {
            if (!excludedBones.has(boneName)) {
                dynamicBoneControls.set(boneName, {
                    name: boneName,
                    minDeg: -180,
                    maxDeg: 180,
                    axis: 'z' as const,
                    value: 0, // 初始值為 0 弧度
                });
            }
        });

        // 儲存骨骼引用到 ref，避免每幀 traverse
        dynamicBonesMapRef.current = boneMap;

        // 傳送動態骨骼控制到 store
        setBoneControls(dynamicBoneControls);

        console.log('✅ 已建立', dynamicBoneControls.size, '個動態骨骼控制');

        clonedScene.traverse((child) => {
            if (child.name === BONE_NAMES.base) {
                bonesRef.current.base = child;
                console.log('✅ 找到底座骨骼:', child.name);
            }
            if (child.name === BONE_NAMES.j1) {
                bonesRef.current.j1 = child;
                console.log('✅ 找到 J1 骨骼 (Base - 已鎖定):', child.name);
            }
            if (child.name === BONE_NAMES.j2) {
                bonesRef.current.j2 = child;
                console.log('✅ 找到 J2 骨骼 (Shoulder - 上下):', child.name);
            }
            if (child.name === BONE_NAMES.j3) {
                bonesRef.current.j3 = child;
                console.log('✅ 找到 J3 骨骼 (Elbow - 上下):', child.name);
            }
            if (child.name === BONE_NAMES.j4) {
                bonesRef.current.j4 = child;
                console.log('✅ 找到 J4 骨骼 (Wrist Roll - 左右):', child.name);
            }
            if (child.name === BONE_NAMES.j5) {
                bonesRef.current.j5 = child;
                console.log('✅ 找到 J5 骨骼 (Wrist Pitch - 上下):', child.name);
            }
            if (child.name === BONE_NAMES.gripper) {
                bonesRef.current.gripper = child;
                console.log('✅ 找到 Gripper 末端執行器 (自轉):', child.name);
            }
        });
        console.log('\n📋 骨骼綁定結果:', bonesRef.current);
    }, [clonedScene, setBoneControls]);

    // 動畫循環 - 控制骨骼旋轉
    useFrame((state, delta) => {
        const bones = bonesRef.current;
        const lerpSpeed = delta * 15; // 增加速度以獲得更即時的響應

        if (isManualMode) {
            // 手動模式：根據控制面板調整骨骼旋轉

            // J1: Base Rotation - 不讓用戶調整，保持固定
            // (不做任何操作)

            // J2: Shoulder - 上下移動 (繞 Z 軸)
            if (bones.j2) {
                bones.j2.rotation.z = THREE.MathUtils.lerp(
                    bones.j2.rotation.z,
                    jointAngles.j2,
                    lerpSpeed
                );
            }

            // J3: Elbow - 上下移動 (繞 Z 軸)
            if (bones.j3) {
                bones.j3.rotation.z = THREE.MathUtils.lerp(
                    bones.j3.rotation.z,
                    jointAngles.j3,
                    lerpSpeed
                );
            }

            // J4: Wrist Roll - 左右移動 (繞 X 軸)
            if (bones.j4) {
                bones.j4.rotation.x = THREE.MathUtils.lerp(
                    bones.j4.rotation.x,
                    jointAngles.j4,
                    lerpSpeed
                );
            }

            // J5: Wrist Pitch - 上下移動 (繞 Z 軸)
            if (bones.j5) {
                bones.j5.rotation.z = THREE.MathUtils.lerp(
                    bones.j5.rotation.z,
                    jointAngles.j5,
                    lerpSpeed
                );
            }

            // Gripper (Cylinder039_7) - 手的部分自轉 (繞 Y 軸)
            if (bones.gripper) {
                const gripperAngle = degreesToRadians(gripperValue);
                bones.gripper.rotation.y = THREE.MathUtils.lerp(
                    bones.gripper.rotation.y,
                    gripperAngle,
                    lerpSpeed
                );
            }

            // 動態骨骼控制 - 應用 store 中的所有骨骼控制值
            // 使用預先建立的引用，避免每幀 traverse
            boneControls.forEach((control, boneName) => {
                const bone = dynamicBonesMapRef.current.get(boneName);
                if (bone) {
                    const axis = control.axis;
                    const targetValue = control.value;

                    if (axis === 'x') {
                        bone.rotation.x = THREE.MathUtils.lerp(
                            bone.rotation.x,
                            targetValue,
                            lerpSpeed
                        );
                    } else if (axis === 'y') {
                        bone.rotation.y = THREE.MathUtils.lerp(
                            bone.rotation.y,
                            targetValue,
                            lerpSpeed
                        );
                    } else if (axis === 'z') {
                        bone.rotation.z = THREE.MathUtils.lerp(
                            bone.rotation.z,
                            targetValue,
                            lerpSpeed
                        );
                    }
                }
            });

        } else if (autoRotate) {
            // 自動模式：展示動畫
            const t = state.clock.getElapsedTime();

            // J1 保持固定

            // J2: Shoulder 上下擺動
            if (bones.j2) {
                bones.j2.rotation.z = Math.sin(t * 0.5) * 0.4;
            }

            // J3: Elbow 上下擺動
            if (bones.j3) {
                bones.j3.rotation.z = Math.sin(t * 0.7) * 0.5;
            }

            // J4: Wrist Roll 左右擺動
            if (bones.j4) {
                bones.j4.rotation.x = Math.sin(t * 0.9) * 0.6;
            }

            // J5: Wrist Pitch 上下擺動
            if (bones.j5) {
                bones.j5.rotation.z = Math.sin(t * 1.1) * 0.3;
            }

            // Gripper 自轉展示
            if (bones.gripper) {
                bones.gripper.rotation.y = Math.sin(t * 1.3) * 0.8;
            }
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
