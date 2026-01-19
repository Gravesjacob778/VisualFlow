"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, type ThreeElements } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

interface JointConstraints {
    axis: "x" | "y" | "z";
    minAngle: number;
    maxAngle: number;
    maxSpeed: number;
}

interface ScrewRingProps {
    radius: number;
    count: number;
    height?: number;
    offsetY?: number;
    geometry: THREE.BufferGeometry;
    material: THREE.Material;
}

function ScrewRing({
    radius,
    count,
    height = 0.018,
    offsetY = 0,
    geometry,
    material,
}: ScrewRingProps) {
    return (
        <group position={[0, offsetY, 0]}>
            {Array.from({ length: count }).map((_, index) => {
                const angle = (index / count) * Math.PI * 2;
                const x = Math.cos(angle) * radius;
                const z = Math.sin(angle) * radius;
                return (
                    <mesh
                        key={`screw-${index}`}
                        geometry={geometry}
                        material={material}
                        position={[x, height * 0.5, z]}
                        rotation={[Math.PI / 2, 0, angle]}
                        castShadow
                    />
                );
            })}
        </group>
    );
}

interface CableProps {
    points: THREE.Vector3[];
    radius: number;
    material: THREE.Material;
}

function Cable({ points, radius, material }: CableProps) {
    const geometry = useMemo(
        () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 96, radius, 12, false),
        [points, radius]
    );

    useEffect(() => {
        return () => geometry.dispose();
    }, [geometry]);

    return <mesh geometry={geometry} material={material} castShadow />;
}

const applyJointRotation = (
    joint: THREE.Object3D | null,
    targetAngle: number,
    constraints: JointConstraints,
    delta: number
) => {
    if (!joint) return;
    const current = joint.rotation[constraints.axis];
    const clampedTarget = THREE.MathUtils.clamp(
        targetAngle,
        constraints.minAngle,
        constraints.maxAngle
    );
    const maxDelta = constraints.maxSpeed * delta;
    const deltaAngle = THREE.MathUtils.clamp(
        clampedTarget - current,
        -maxDelta,
        maxDelta
    );
    joint.rotation[constraints.axis] += deltaAngle;
};

export function RobotArm(props: ThreeElements["group"]) {
    const joint1Ref = useRef<THREE.Group>(null);
    const joint2Ref = useRef<THREE.Group>(null);
    const joint3Ref = useRef<THREE.Group>(null);
    const joint4Ref = useRef<THREE.Group>(null);
    const joint5Ref = useRef<THREE.Group>(null);
    const joint6Ref = useRef<THREE.Group>(null);

    const materials = useMemo(() => {
        return {
            metal: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#c9ced6"),
                metalness: 0.95,
                roughness: 0.28,
                envMapIntensity: 1.2,
            }),
            darkMetal: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#4a4f57"),
                metalness: 0.9,
                roughness: 0.2,
                envMapIntensity: 1.0,
            }),
            paint: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#d14b35"),
                metalness: 0.12,
                roughness: 0.42,
                envMapIntensity: 0.6,
            }),
            rubber: new THREE.MeshStandardMaterial({
                color: new THREE.Color("#1b1f24"),
                metalness: 0.0,
                roughness: 0.85,
                envMapIntensity: 0.2,
            }),
            glass: new THREE.MeshPhysicalMaterial({
                color: new THREE.Color("#8fb6ff"),
                metalness: 0.0,
                roughness: 0.05,
                transmission: 0.6,
                thickness: 0.02,
                envMapIntensity: 1.1,
                clearcoat: 0.7,
            }),
        };
    }, []);

    useEffect(() => {
        return () => {
            Object.values(materials).forEach((material) => material.dispose());
        };
    }, [materials]);

    const baseGeometry = useMemo(
        () => new THREE.CylinderGeometry(0.42, 0.48, 0.28, 64, 1, false),
        []
    );
    const baseRimGeometry = useMemo(
        () => new THREE.TorusGeometry(0.46, 0.018, 18, 64),
        []
    );
    const jointHousingGeometry = useMemo(
        () => new THREE.CylinderGeometry(0.16, 0.18, 0.18, 48),
        []
    );
    const wristHousingGeometry = useMemo(
        () => new THREE.CylinderGeometry(0.1, 0.12, 0.12, 40),
        []
    );
    const screwGeometry = useMemo(
        () => new THREE.CylinderGeometry(0.012, 0.014, 0.02, 18),
        []
    );
    const sensorGeometry = useMemo(
        () => new THREE.SphereGeometry(0.03, 24, 24),
        []
    );

    useEffect(() => {
        return () => {
            baseGeometry.dispose();
            baseRimGeometry.dispose();
            jointHousingGeometry.dispose();
            wristHousingGeometry.dispose();
            screwGeometry.dispose();
            sensorGeometry.dispose();
        };
    }, [
        baseGeometry,
        baseRimGeometry,
        jointHousingGeometry,
        wristHousingGeometry,
        screwGeometry,
        sensorGeometry,
    ]);

    const cablePoints = useMemo(
        () => [
            new THREE.Vector3(0.2, 0.2, 0.15),
            new THREE.Vector3(0.22, 0.6, 0.08),
            new THREE.Vector3(0.18, 1.0, 0.12),
            new THREE.Vector3(0.12, 1.35, 0.05),
        ],
        []
    );

    const constraints = useMemo<Record<string, JointConstraints>>(
        () => ({
            joint1: { axis: "y", minAngle: -Math.PI, maxAngle: Math.PI, maxSpeed: 1.1 },
            joint2: { axis: "z", minAngle: -Math.PI / 2, maxAngle: Math.PI / 2, maxSpeed: 1.2 },
            joint3: { axis: "z", minAngle: -Math.PI * 0.75, maxAngle: Math.PI / 2, maxSpeed: 1.4 },
            joint4: { axis: "x", minAngle: -Math.PI, maxAngle: Math.PI, maxSpeed: 2.1 },
            joint5: { axis: "z", minAngle: -Math.PI / 1.5, maxAngle: Math.PI / 1.5, maxSpeed: 2.2 },
            joint6: { axis: "x", minAngle: -Math.PI, maxAngle: Math.PI, maxSpeed: 2.3 },
        }),
        []
    );

    useFrame((state, delta) => {
        const t = state.clock.getElapsedTime();
        applyJointRotation(joint1Ref.current, Math.sin(t * 0.3) * 0.9, constraints.joint1, delta);
        applyJointRotation(joint2Ref.current, Math.sin(t * 0.5) * 0.6, constraints.joint2, delta);
        applyJointRotation(joint3Ref.current, Math.sin(t * 0.65) * 0.8, constraints.joint3, delta);
        applyJointRotation(joint4Ref.current, Math.sin(t * 1.2) * 1.1, constraints.joint4, delta);
        applyJointRotation(joint5Ref.current, Math.sin(t * 0.9) * 0.7, constraints.joint5, delta);
        applyJointRotation(joint6Ref.current, Math.sin(t * 1.4) * 1.2, constraints.joint6, delta);
    });

    return (
        <group {...props}>
            <mesh geometry={baseGeometry} material={materials.metal} castShadow receiveShadow>
                <ScrewRing
                    radius={0.36}
                    count={12}
                    height={0.02}
                    offsetY={-0.14}
                    geometry={screwGeometry}
                    material={materials.darkMetal}
                />
            </mesh>
            <mesh
                geometry={baseRimGeometry}
                material={materials.darkMetal}
                position={[0, 0.14, 0]}
                rotation={[Math.PI / 2, 0, 0]}
                castShadow
            />
            <mesh
                geometry={baseRimGeometry}
                material={materials.darkMetal}
                position={[0, -0.14, 0]}
                rotation={[Math.PI / 2, 0, 0]}
                castShadow
            />

            <group ref={joint1Ref} position={[0, 0.14, 0]}>
                <RoundedBox
                    args={[0.5, 0.22, 0.42]}
                    radius={0.04}
                    smoothness={6}
                    position={[0, 0.12, 0]}
                    material={materials.paint}
                    castShadow
                    receiveShadow
                />
                <mesh
                    geometry={jointHousingGeometry}
                    material={materials.metal}
                    position={[0, 0.24, 0]}
                    castShadow
                    receiveShadow
                />
                <ScrewRing
                    radius={0.14}
                    count={10}
                    height={0.02}
                    offsetY={0.24}
                    geometry={screwGeometry}
                    material={materials.darkMetal}
                />

                <group ref={joint2Ref} position={[0, 0.3, 0.08]}>
                    <RoundedBox
                        args={[0.32, 0.6, 0.28]}
                        radius={0.05}
                        smoothness={6}
                        position={[0, 0.32, 0]}
                        material={materials.paint}
                        castShadow
                        receiveShadow
                    />
                    <RoundedBox
                        args={[0.18, 0.52, 0.18]}
                        radius={0.04}
                        smoothness={5}
                        position={[0.18, 0.3, 0.12]}
                        material={materials.darkMetal}
                        castShadow
                    />

                    <group ref={joint3Ref} position={[0, 0.62, 0]}>
                        <RoundedBox
                            args={[0.26, 0.7, 0.24]}
                            radius={0.05}
                            smoothness={6}
                            position={[0, 0.36, 0]}
                            material={materials.paint}
                            castShadow
                            receiveShadow
                        />
                        <mesh
                            geometry={jointHousingGeometry}
                            material={materials.metal}
                            position={[0, 0.72, 0]}
                            rotation={[Math.PI / 2, 0, 0]}
                            castShadow
                            receiveShadow
                        />
                        <ScrewRing
                            radius={0.13}
                            count={8}
                            height={0.02}
                            offsetY={0.72}
                            geometry={screwGeometry}
                            material={materials.darkMetal}
                        />

                        <group ref={joint4Ref} position={[0, 0.76, 0]}>
                            <mesh
                                geometry={wristHousingGeometry}
                                material={materials.metal}
                                rotation={[Math.PI / 2, 0, 0]}
                                castShadow
                                receiveShadow
                            />
                            <RoundedBox
                                args={[0.18, 0.2, 0.18]}
                                radius={0.03}
                                smoothness={6}
                                position={[0, 0.12, 0]}
                                material={materials.paint}
                                castShadow
                            />

                            <group ref={joint5Ref} position={[0, 0.2, 0]}>
                                <RoundedBox
                                    args={[0.18, 0.24, 0.16]}
                                    radius={0.03}
                                    smoothness={6}
                                    position={[0, 0.12, 0]}
                                    material={materials.paint}
                                    castShadow
                                />
                                <mesh
                                    geometry={wristHousingGeometry}
                                    material={materials.metal}
                                    position={[0, 0.24, 0]}
                                    rotation={[Math.PI / 2, 0, 0]}
                                    castShadow
                                />

                                <group ref={joint6Ref} position={[0, 0.32, 0]}>
                                    <RoundedBox
                                        args={[0.16, 0.18, 0.16]}
                                        radius={0.03}
                                        smoothness={6}
                                        position={[0, 0.08, 0]}
                                        material={materials.paint}
                                        castShadow
                                    />

                                    <group position={[0, 0.18, 0]}>
                                        <RoundedBox
                                            args={[0.2, 0.06, 0.2]}
                                            radius={0.02}
                                            smoothness={6}
                                            material={materials.darkMetal}
                                            castShadow
                                        />
                                        <RoundedBox
                                            args={[0.06, 0.18, 0.06]}
                                            radius={0.01}
                                            smoothness={6}
                                            position={[-0.08, 0.12, 0.06]}
                                            material={materials.metal}
                                            castShadow
                                        />
                                        <RoundedBox
                                            args={[0.06, 0.18, 0.06]}
                                            radius={0.01}
                                            smoothness={6}
                                            position={[0.08, 0.12, 0.06]}
                                            material={materials.metal}
                                            castShadow
                                        />
                                        <RoundedBox
                                            args={[0.035, 0.12, 0.08]}
                                            radius={0.01}
                                            smoothness={4}
                                            position={[-0.08, 0.24, 0.08]}
                                            material={materials.rubber}
                                            castShadow
                                        />
                                        <RoundedBox
                                            args={[0.035, 0.12, 0.08]}
                                            radius={0.01}
                                            smoothness={4}
                                            position={[0.08, 0.24, 0.08]}
                                            material={materials.rubber}
                                            castShadow
                                        />
                                        <mesh
                                            geometry={sensorGeometry}
                                            material={materials.glass}
                                            position={[0, 0.08, -0.06]}
                                            castShadow
                                        />
                                    </group>
                                </group>
                            </group>
                        </group>
                    </group>
                </group>
            </group>

            <Cable points={cablePoints} radius={0.015} material={materials.rubber} />
        </group>
    );
}
