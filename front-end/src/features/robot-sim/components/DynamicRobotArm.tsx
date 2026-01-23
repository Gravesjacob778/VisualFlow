/**
 * 整合範例：使用模型管理系統載入機器人手臂
 * 
 * 這個範例展示如何將新的模型管理系統整合到現有的機器人手臂元件中
 */

'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
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
    scale = 2,
    rotation = [0, 0, 0],
    autoRotate = true,
}: DynamicRobotArmProps) {
    const groupRef = useRef<THREE.Group>(null);

    // 使用 useModel Hook 載入模型
    const { loading, error, model, progress } = useModel(modelId);

    // 從 store 獲取狀態
    const jointAngles = useRobotArmStore((state) => state.jointAngles);
    const isManualMode = useRobotArmStore((state) => state.isManualMode);
    const boneControls = useRobotArmStore((state) => state.boneControls);

    // 骨骼引用
    const bonesRef = useRef<Map<string, THREE.Object3D>>(new Map());

    // 使用預先解析的場景（GLTF 格式直接使用，不需要額外載入）
    const gltfScene = useMemo(() => {
        if (!model) {
            console.log('⚠️ 模型尚未載入');
            return null;
        }

        console.log('🎯 載入模型:', {
            id: model.detail.id,
            name: model.detail.name,
            format: model.format,
            cached: model.cached,
            hasScene: !!model.scene,
            hasGltf: !!model.gltf,
            scene: model.scene
        });

        // 如果是 GLTF 格式，直接使用預先解析的場景
        if (model.format === 'gltf') {
            if (model.scene) {
                console.log('✅ 使用預先解析的 GLTF 場景（無需額外 URL 載入）');
                console.log('場景詳情:', {
                    type: model.scene.type,
                    children: model.scene.children.length,
                    uuid: model.scene.uuid
                });
                return model.scene;
            } else {
                console.error('❌ GLTF 模型沒有場景數據！');
                return null;
            }
        }

        // GLB 格式仍需要使用 URL 載入（目前保持相容）
        console.warn('⚠️ GLB 格式需要使用 URL 載入，建議使用 GLTF 格式以獲得更好的效能');
        return null;
    }, [model]);

    // 克隆場景 - 使用 SkeletonUtils.clone() 來正確處理 SkinnedMesh
    const clonedScene = useMemo(() => {
        console.log('gltfScene', gltfScene);
        if (!gltfScene) {
            console.warn('⚠️ gltfScene 為 null，無法克隆');
            return null;
        }

        console.log('🔄 正在克隆場景（使用 SkeletonUtils）...');
        try {
            // 使用 SkeletonUtils.clone 來正確克隆 SkinnedMesh
            const cloned = SkeletonUtils.clone(gltfScene);

            // 先應用旋轉（Z-up 轉 Y-up 座標系統），這樣後續的邊界框計算才正確
            cloned.rotation.set(-Math.PI / 2, 0, 0);
            cloned.updateMatrixWorld(true);

            // 計算旋轉後的模型邊界框
            const box = new THREE.Box3().setFromObject(cloned);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());

            // 計算自動縮放比例 - 將模型標準化到約 2 單位高度
            const targetHeight = 2; // 目標高度為 2 單位
            const maxDimension = Math.max(size.x, size.y, size.z);
            const calculatedAutoScale = maxDimension > 0 ? targetHeight / maxDimension : 1;

            console.log(`📐 模型原始尺寸: width=${size.x.toFixed(2)}, height=${size.y.toFixed(2)}, depth=${size.z.toFixed(2)}`);
            console.log(`📐 模型中心點: (${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)})`);
            console.log(`📐 maxDimension=${maxDimension.toFixed(2)}, autoScale=${calculatedAutoScale.toFixed(8)}`);

            // 應用縮放
            cloned.scale.multiplyScalar(calculatedAutoScale);
            cloned.updateMatrixWorld(true);

            // 重新計算縮放後的邊界框
            const scaledBox = new THREE.Box3().setFromObject(cloned);
            const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
            const scaledSize = scaledBox.getSize(new THREE.Vector3());

            console.log(`📏 縮放後尺寸: width=${scaledSize.x.toFixed(2)}, height=${scaledSize.y.toFixed(2)}, depth=${scaledSize.z.toFixed(2)}`);
            console.log(`📏 縮放後中心: (${scaledCenter.x.toFixed(2)}, ${scaledCenter.y.toFixed(2)}, ${scaledCenter.z.toFixed(2)})`);

            // 將模型移動到原點，底部在 Y=0
            cloned.position.set(
                -scaledCenter.x,
                -scaledBox.min.y,  // 讓模型底部在 Y=0
                -scaledCenter.z
            );

            console.log(`🎯 模型已居中，最終位置: (${cloned.position.x.toFixed(2)}, ${cloned.position.y.toFixed(2)}, ${cloned.position.z.toFixed(2)})`);

            // 統計網格類型並設置陰影
            let meshCount = 0;
            let skinnedMeshCount = 0;

            cloned.traverse((child) => {
                if (child instanceof THREE.SkinnedMesh) {
                    skinnedMeshCount++;
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.frustumCulled = false;
                    console.log('🦴 找到 SkinnedMesh:', child.name);
                } else if (child instanceof THREE.Mesh) {
                    meshCount++;
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.frustumCulled = false;
                }
            });

            console.log('✅ 場景克隆完成:', {
                children: cloned.children.length,
                type: cloned.type,
                meshCount,
                skinnedMeshCount
            });
            return cloned;
        } catch (error) {
            console.error('❌ 場景克隆失敗:', error);
            return null;
        }
    }, [gltfScene]);

    // 找到並綁定骨骼節點（使用 API 提供的控制配置）
    useEffect(() => {
        if (!clonedScene || !model) return;

        console.log('🔧 正在綁定模型骨骼:', model.detail.name);

        const boneMap = new Map<string, THREE.Object3D>();

        // 遍歷場景找到所有骨骼
        clonedScene.traverse((child) => {
            if (child.name) {
                boneMap.set(child.name, child);
                console.log('發現節點:', child.name, 'type:', child.type);
            }
        });

        bonesRef.current = boneMap;

        // 輸出模型的控制配置（來自 API）
        if (model.detail.controls && Array.isArray(model.detail.controls)) {
            console.log('📋 模型控制配置:', model.detail.controls);
        } else {
            console.warn('⚠️ 模型沒有控制配置');
        }
        console.log('✅ 找到', boneMap.size, '個節點');

    }, [clonedScene, model]);

    // 動畫循環 - 使用 API 提供的控制配置
    useFrame((state, delta) => {
        if (!model || !clonedScene) return;

        // 檢查是否有控制配置
        if (!model.detail?.controls || !Array.isArray(model.detail.controls)) {
            // 沒有控制配置時只做基本旋轉
            if (autoRotate && groupRef.current) {
                groupRef.current.rotation.y += delta * 0.2;
            }
            return;
        }

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
            boneControls?.forEach((control, boneName) => {
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

    // 模型尚未載入或場景克隆失敗
    if (!clonedScene) {
        console.error('❌ 克隆場景失敗或場景為 null');
        return (
            <group position={position}>
                <mesh>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial color="#ff9900" wireframe />
                </mesh>
                <Html center>
                    <div style={{
                        background: '#fff3cd',
                        padding: '10px',
                        borderRadius: '5px',
                        fontSize: '12px',
                        textAlign: 'center',
                        maxWidth: '200px',
                        border: '1px solid #ffc107'
                    }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>場景載入失敗</div>
                        <div style={{ fontSize: '10px' }}>模型數據無效</div>
                    </div>
                </Html>
            </group>
        );
    }

    // 縮放、旋轉、定位都已在 useMemo 中處理完成
    // 這裡只需要應用用戶額外指定的 scale 參數
    console.log('✅ 正在渲染克隆場景');

    return (
        <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
            {/* 模型已在 useMemo 中完成縮放、旋轉和居中處理 */}
            <primitive object={clonedScene} />
        </group>
    );
}

// 注意：使用 useModel 時，不需要手動 preload
// Hook 會自動處理快取和載入
