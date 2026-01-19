"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
    ContactShadows,
    Environment,
    OrbitControls,
    PerspectiveCamera,
} from "@react-three/drei";
import { RobotArm } from "@/features/robot-sim/components/RobotArm";

export function RobotArmScene() {
    return (
        <div className="h-full w-full">
            <Canvas
                shadows
                dpr={[1, 2]}
                gl={{ antialias: true }}
            >
                <PerspectiveCamera makeDefault position={[2.8, 2.2, 3.6]} fov={42} />
                <color attach="background" args={["#0b0f14"]} />
                <fog attach="fog" args={["#0b0f14", 8, 18]} />

                <ambientLight intensity={0.15} />
                <directionalLight
                    castShadow
                    position={[6, 8, 5]}
                    intensity={1.35}
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                    shadow-camera-near={0.5}
                    shadow-camera-far={25}
                    shadow-camera-left={-6}
                    shadow-camera-right={6}
                    shadow-camera-top={6}
                    shadow-camera-bottom={-6}
                    shadow-bias={-0.00015}
                />
                <directionalLight position={[-5, 4, -4]} intensity={0.35} />

                <Suspense fallback={null}>
                    <Environment preset="warehouse" />
                </Suspense>

                <RobotArm position={[0, 0, 0]} />

                <mesh
                    receiveShadow
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[0, 0, 0]}
                >
                    <planeGeometry args={[20, 20]} />
                    <meshStandardMaterial color="#0f141a" roughness={0.9} />
                </mesh>

                <ContactShadows
                    position={[0, 0.02, 0]}
                    opacity={0.5}
                    scale={8}
                    blur={2.8}
                    far={6}
                />

                <OrbitControls
                    enablePan
                    enableDamping
                    minDistance={2.2}
                    maxDistance={7.5}
                    maxPolarAngle={Math.PI * 0.5}
                />
            </Canvas>
        </div>
    );
}
