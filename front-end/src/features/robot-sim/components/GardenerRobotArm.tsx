"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, Center } from "@react-three/drei";
import * as THREE from "three";

interface GardenerRobotArmProps {
    position?: [number, number, number];
    scale?: number;
    rotation?: [number, number, number];
    autoRotate?: boolean;
}

export function GardenerRobotArm({
    position = [0, 0, 0],
    scale = 0.15,
    rotation = [0, 0, 0],
    autoRotate = true,
}: GardenerRobotArmProps) {
    const groupRef = useRef<THREE.Group>(null);

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

    // 自動旋轉動畫
    useFrame((state, delta) => {
        if (autoRotate && groupRef.current) {
            groupRef.current.rotation.y += delta * 0.3;
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
