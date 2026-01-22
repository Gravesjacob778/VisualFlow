/**
 * 整合範例：使用模型管理系統載入機器人手臂
 * 
 * 這個範例展示如何將新的模型管理系統整合到現有的機器人手臂元件中
 */

'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Center, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useRobotArmStore, degreesToRadians } from '@/stores/robotArmStore';
import { useModel } from '@/hooks/useModel';

interface DynamicRobotArmProps {
    modelId: string; // 從 API 動態載入模型
    position?: [number, number, number];
    scale?: number;
    rotation?: [number, number, number];
    autoRotate?: boolean;
}

/**
 * 動態載入的機器人手臂元件
 * 
 * 與 GardenerRobotArm 的差異：
 * 1. 使用 useModel Hook 從 API 載入模型（支援快取）
 * 2. 從 API 取得的控制配置來設定骨骼控制
 * 3. 支援多種不同的機器人手臂模型
 */
export function DynamicRobotArm({
    modelId,
    position = [0, 0, 0],
    scale = 0.15,
    rotation = [0, 0, 0],
    autoRotate = true,
}: DynamicRobotArmProps) {
    const groupRef = useRef<THREE.Group>(null);

    // 使用 useModel Hook 載入模型
    const { loading, error, model, progress } = useModel(modelId);

    // 從 store 獲取狀態
    const jointAngles = useRobotArmStore((state) => state.jointAngles);
    const gripperValue = useRobotArmStore((state) => state.gripperValue);
    const isManualMode = useRobotArmStore((state) => state.isManualMode);
    const boneControls = useRobotArmStore((state) => state.boneControls);

    // 骨骼引用
    const bonesRef = useRef<Map<string, THREE.Object3D>>(new Map());

    // 使用預先解析的場景（GLTF 格式直接使用，不需要額外載入）
    const gltfScene = useMemo(() => {
        if (!model) return null;
        console.log('🎯 載入模型:', {
            id: model.detail.id,
            name: model.detail.name,
            format: model.format,
            cached: model.cached,
            hasScene: !!model.scene
        });

        // 如果是 GLTF 格式，直接使用預先解析的場景
        if (model.format === 'gltf' && model.scene) {
            console.log('✅ 使用預先解析的 GLTF 場景（無需額外 URL 載入）');
            return model.scene;
        }

        // GLB 格式仍需要使用 URL 載入（目前保持相容）
        console.warn('⚠️ GLB 格式需要使用 URL 載入，建議使用 GLTF 格式以獲得更好的效能');
        return null;
    }, [model]);

    // 克隆場景
    const clonedScene = useMemo(() => {
        if (!gltfScene) return null;

        const cloned = gltfScene.clone();
        cloned.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        return cloned;
    }, [gltfScene]);

    // 找到並綁定骨骼節點（使用 API 提供的控制配置）
    useEffect(() => {
        if (!clonedScene || !model) return;

        console.log('🔧 正在綁定模型骨骼:', model.detail.name);

        const boneMap = new Map<string, THREE.Object3D>();

        // 遍歷場景找到所有骨骼
        clonedScene.traverse((child) => {
            if (child.type === 'Object3D' && child.name) {
                boneMap.set(child.name, child);
            }
        });

        bonesRef.current = boneMap;

        // 輸出模型的控制配置（來自 API）
        console.log('📋 模型控制配置:', model.detail.controls);
        console.log('✅ 找到', boneMap.size, '個骨骼節點');

    }, [clonedScene, model]);

    // 動畫循環 - 使用 API 提供的控制配置
    useFrame((state, delta) => {
        if (!model || !clonedScene) return;

        const lerpSpeed = delta * 15;

        if (isManualMode) {
            // 使用 API 提供的控制配置來控制骨骼
            model.detail.controls.forEach((control) => {
                const bone = bonesRef.current.get(control.boneName);
                if (!bone) return;

                // 從 jointAngles 取得對應的角度值
                const angleKey = control.id as keyof typeof jointAngles;
                const targetAngle = jointAngles[angleKey];

                if (targetAngle !== undefined) {
                    const axis = control.axis;
                    const currentRotation = bone.rotation[axis];

                    bone.rotation[axis] = THREE.MathUtils.lerp(
                        currentRotation,
                        targetAngle,
                        lerpSpeed
                    );
                }
            });

            // 動態骨骼控制
            boneControls.forEach((control, boneName) => {
                const bone = bonesRef.current.get(boneName);
                if (bone) {
                    const axis = control.axis;
                    bone.rotation[axis] = THREE.MathUtils.lerp(
                        bone.rotation[axis],
                        control.value,
                        lerpSpeed
                    );
                }
            });

        } else if (autoRotate) {
            // 自動展示動畫
            const t = state.clock.getElapsedTime();

            // 使用 API 提供的控制配置來產生展示動畫
            model.detail.controls.forEach((control, index) => {
                const bone = bonesRef.current.get(control.boneName);
                if (!bone) return;

                const axis = control.axis;
                const speed = 0.5 + index * 0.2;
                const amplitude = (control.maxAngle - control.minAngle) / 2;
                const center = (control.maxAngle + control.minAngle) / 2;

                const angleInDegrees = center + Math.sin(t * speed) * amplitude;
                const angleInRadians = degreesToRadians(angleInDegrees);

                bone.rotation[axis] = angleInRadians;
            });
        }
    });

    // 載入中狀態
    if (loading) {
        return (
            <group position={position}>
                <mesh>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial color="#cccccc" wireframe />
                </mesh>
                {progress && (
                    <Html center>
                        <div style={{
                            background: 'white',
                            padding: '10px',
                            borderRadius: '5px',
                            fontSize: '12px',
                            textAlign: 'center'
                        }}>
                            <div>{progress.message}</div>
                            {progress.progress !== undefined && (
                                <div>{progress.progress}%</div>
                            )}
                        </div>
                    </Html>
                )}
            </group>
        );
    }

    // 錯誤狀態
    if (error) {
        console.error('DynamicRobotArm 載入錯誤:', error);
        return (
            <group position={position}>
                <mesh>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial color="#ff0000" />
                </mesh>
                <Html center>
                    <div style={{
                        background: '#ffcccc',
                        padding: '10px',
                        borderRadius: '5px',
                        fontSize: '12px',
                        textAlign: 'center',
                        maxWidth: '200px',
                        border: '1px solid #ff0000'
                    }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>載入失敗</div>
                        <div style={{ fontSize: '10px' }}>{error.message}</div>
                    </div>
                </Html>
            </group>
        );
    }

    // 模型尚未載入
    if (!clonedScene) {
        return null;
    }

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

// 注意：使用 useModel 時，不需要手動 preload
// Hook 會自動處理快取和載入
