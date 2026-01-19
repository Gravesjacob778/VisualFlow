"use client";

import { useRef } from "react";
import type { Mesh } from "three";
import { RoundedBox } from "@react-three/drei";

interface BoxProps {
    position?: [number, number, number];
    size?: [number, number, number];
    color?: string;
}

export function Box({ 
    position = [0.8, 0.15, 0], 
    size = [0.3, 0.3, 0.3],
    color = "#c9a978"
}: BoxProps) {
    const meshRef = useRef<Mesh>(null);

    return (
        <group position={position}>
            <RoundedBox
                ref={meshRef}
                args={size}
                radius={0.01}
                smoothness={4}
                castShadow
                receiveShadow
            >
                <meshStandardMaterial 
                    color={color}
                    roughness={0.8}
                    metalness={0.1}
                />
            </RoundedBox>
            
            {/* 紙箱封箱膠帶 */}
            <mesh position={[0, 0.005, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <planeGeometry args={[size[0] * 0.15, size[2] * 0.98]} />
                <meshStandardMaterial 
                    color="#b8956a"
                    roughness={0.6}
                />
            </mesh>
            
            <mesh position={[0, -0.005, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <planeGeometry args={[size[0] * 0.15, size[2] * 0.98]} />
                <meshStandardMaterial 
                    color="#b8956a"
                    roughness={0.6}
                />
            </mesh>

            {/* 紙箱紋路線條 */}
            <mesh position={[0, 0, size[2] / 2 + 0.001]} castShadow>
                <planeGeometry args={[size[0] * 0.9, 0.01]} />
                <meshStandardMaterial 
                    color="#a08560"
                    roughness={0.9}
                />
            </mesh>
            
            <mesh position={[0, 0, -size[2] / 2 - 0.001]} rotation={[0, Math.PI, 0]} castShadow>
                <planeGeometry args={[size[0] * 0.9, 0.01]} />
                <meshStandardMaterial 
                    color="#a08560"
                    roughness={0.9}
                />
            </mesh>
        </group>
    );
}
