import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface InterpolatedObjectProps {
    targetPosition: [number, number, number];
    targetRotation: [number, number, number];
    color?: string;
    onClick?: () => void;
}

export function InterpolatedObject({
    targetPosition,
    targetRotation,
    color = '#4ecdc4',
    onClick,
}: InterpolatedObjectProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const targetPosVector = useRef(new THREE.Vector3(...targetPosition));
    const targetQuaternion = useRef(new THREE.Quaternion());

    // Update target values when props change
    useEffect(() => {
        targetPosVector.current.set(...targetPosition);
        targetQuaternion.current.setFromEuler(new THREE.Euler(...targetRotation));
    }, [targetPosition, targetRotation]);

    // Smoothly interpolate every frame
    useFrame(() => {
        if (!meshRef.current) return;

        // Smooth position interpolation (lerp)
        meshRef.current.position.lerp(targetPosVector.current, 0.1);

        // Smooth rotation interpolation (slerp)
        meshRef.current.quaternion.slerp(targetQuaternion.current, 0.1);
    });

    return (
        <mesh
            ref={meshRef}
            castShadow
            receiveShadow
            onClick={onClick}
        >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={color} />
        </mesh>
    );
}
