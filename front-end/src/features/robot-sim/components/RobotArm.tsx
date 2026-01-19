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
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points),
        96,
        radius,
        12,
        false
      ),
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

  // === 底座幾何體 ===
  const baseGeometry = useMemo(
    () => new THREE.CylinderGeometry(0.42, 0.48, 0.28, 64, 1, false),
    []
  );
  const baseRimGeometry = useMemo(
    () => new THREE.TorusGeometry(0.46, 0.018, 18, 64),
    []
  );

  // === Industrial-Grade Joint Housing Geometries ===
  // These profiles create robust cylindrical casings that resemble real harmonic drive/RV reducer housings
  // with generous fillets, smooth surface blending, and gradual transitions for stress distribution

  // J1 Joint (Base Rotation) - Large industrial housing with mounting flange and smooth fillets
  const j1HousingGeometry = useMemo(() => {
    const points: THREE.Vector2[] = [];
    // Bottom mounting flange with fillet
    points.push(new THREE.Vector2(0.0, 0));
    points.push(new THREE.Vector2(0.28, 0));
    points.push(new THREE.Vector2(0.28, 0.015));
    // Fillet transition to main body
    for (let i = 0; i <= 8; i++) {
      const angle = (i / 8) * (Math.PI / 2);
      points.push(
        new THREE.Vector2(
          0.28 - 0.03 * (1 - Math.cos(angle)),
          0.015 + 0.03 * Math.sin(angle)
        )
      );
    }
    // Main cylindrical body with slight barrel profile
    points.push(new THREE.Vector2(0.26, 0.06));
    points.push(new THREE.Vector2(0.265, 0.1));
    points.push(new THREE.Vector2(0.27, 0.14)); // Peak of barrel
    points.push(new THREE.Vector2(0.265, 0.18));
    points.push(new THREE.Vector2(0.26, 0.22));
    // Top fillet transition
    for (let i = 0; i <= 8; i++) {
      const angle = (i / 8) * (Math.PI / 2);
      points.push(
        new THREE.Vector2(
          0.26 - 0.04 * Math.sin(angle),
          0.22 + 0.03 * (1 - Math.cos(angle))
        )
      );
    }
    points.push(new THREE.Vector2(0.22, 0.25));
    points.push(new THREE.Vector2(0.0, 0.25));
    return new THREE.LatheGeometry(points, 64);
  }, []);

  // J1 Reducer cap ring
  const j1CapGeometry = useMemo(
    () => new THREE.CylinderGeometry(0.23, 0.25, 0.02, 64),
    []
  );

  // J2 Joint (Shoulder Pitch) - Robust horizontal housing with dual-flange design
  const j2HousingGeometry = useMemo(() => {
    const points: THREE.Vector2[] = [];
    // Left end flange
    points.push(new THREE.Vector2(0.0, 0));
    points.push(new THREE.Vector2(0.24, 0));
    points.push(new THREE.Vector2(0.24, 0.012));
    // Fillet to main body
    for (let i = 0; i <= 6; i++) {
      const angle = (i / 6) * (Math.PI / 2);
      points.push(
        new THREE.Vector2(
          0.24 - 0.025 * (1 - Math.cos(angle)),
          0.012 + 0.025 * Math.sin(angle)
        )
      );
    }
    // Barrel body section
    points.push(new THREE.Vector2(0.22, 0.05));
    points.push(new THREE.Vector2(0.225, 0.08));
    points.push(new THREE.Vector2(0.23, 0.1)); // Max diameter
    points.push(new THREE.Vector2(0.225, 0.12));
    points.push(new THREE.Vector2(0.22, 0.15));
    // Fillet to right flange
    for (let i = 0; i <= 6; i++) {
      const angle = (i / 6) * (Math.PI / 2);
      points.push(
        new THREE.Vector2(
          0.22 + 0.02 * (1 - Math.cos(angle)),
          0.15 + 0.025 * Math.sin(angle)
        )
      );
    }
    points.push(new THREE.Vector2(0.24, 0.188));
    points.push(new THREE.Vector2(0.24, 0.2));
    points.push(new THREE.Vector2(0.0, 0.2));
    return new THREE.LatheGeometry(points, 64);
  }, []);

  // J2 center accent ring
  const j2RingGeometry = useMemo(
    () => new THREE.TorusGeometry(0.235, 0.012, 16, 64),
    []
  );

  // J3 Joint (Elbow) - Medium housing with integrated transition zones
  const j3HousingGeometry = useMemo(() => {
    const points: THREE.Vector2[] = [];
    // Input side flange
    points.push(new THREE.Vector2(0.0, 0));
    points.push(new THREE.Vector2(0.21, 0));
    points.push(new THREE.Vector2(0.21, 0.01));
    // Smooth fillet
    for (let i = 0; i <= 6; i++) {
      const angle = (i / 6) * (Math.PI / 2);
      points.push(
        new THREE.Vector2(
          0.21 - 0.02 * (1 - Math.cos(angle)),
          0.01 + 0.02 * Math.sin(angle)
        )
      );
    }
    // Barrel profile
    points.push(new THREE.Vector2(0.195, 0.04));
    points.push(new THREE.Vector2(0.2, 0.07));
    points.push(new THREE.Vector2(0.205, 0.09)); // Peak
    points.push(new THREE.Vector2(0.2, 0.11));
    points.push(new THREE.Vector2(0.195, 0.14));
    // Output fillet
    for (let i = 0; i <= 6; i++) {
      const angle = (i / 6) * (Math.PI / 2);
      points.push(
        new THREE.Vector2(
          0.195 + 0.015 * (1 - Math.cos(angle)),
          0.14 + 0.02 * Math.sin(angle)
        )
      );
    }
    points.push(new THREE.Vector2(0.21, 0.17));
    points.push(new THREE.Vector2(0.21, 0.18));
    points.push(new THREE.Vector2(0.0, 0.18));
    return new THREE.LatheGeometry(points, 64);
  }, []);

  // J3 accent rings
  const j3RingGeometry = useMemo(
    () => new THREE.TorusGeometry(0.21, 0.01, 16, 64),
    []
  );

  // J4 Joint (Wrist Roll) - Compact axial housing
  const j4HousingGeometry = useMemo(() => {
    const points: THREE.Vector2[] = [];
    // Bottom flange
    points.push(new THREE.Vector2(0.0, 0));
    points.push(new THREE.Vector2(0.16, 0));
    points.push(new THREE.Vector2(0.16, 0.008));
    // Fillet
    for (let i = 0; i <= 5; i++) {
      const angle = (i / 5) * (Math.PI / 2);
      points.push(
        new THREE.Vector2(
          0.16 - 0.015 * (1 - Math.cos(angle)),
          0.008 + 0.015 * Math.sin(angle)
        )
      );
    }
    // Barrel body
    points.push(new THREE.Vector2(0.15, 0.03));
    points.push(new THREE.Vector2(0.155, 0.055));
    points.push(new THREE.Vector2(0.16, 0.07)); // Peak
    points.push(new THREE.Vector2(0.155, 0.085));
    points.push(new THREE.Vector2(0.15, 0.11));
    // Top fillet
    for (let i = 0; i <= 5; i++) {
      const angle = (i / 5) * (Math.PI / 2);
      points.push(
        new THREE.Vector2(
          0.15 - 0.02 * Math.sin(angle),
          0.11 + 0.015 * (1 - Math.cos(angle))
        )
      );
    }
    points.push(new THREE.Vector2(0.13, 0.125));
    points.push(new THREE.Vector2(0.0, 0.125));
    return new THREE.LatheGeometry(points, 48);
  }, []);

  // J4 accent ring
  const j4RingGeometry = useMemo(
    () => new THREE.TorusGeometry(0.16, 0.008, 16, 48),
    []
  );

  // J5 Joint (Wrist Pitch) - Small precision housing
  const j5HousingGeometry = useMemo(() => {
    const points: THREE.Vector2[] = [];
    // Left flange
    points.push(new THREE.Vector2(0.0, 0));
    points.push(new THREE.Vector2(0.14, 0));
    points.push(new THREE.Vector2(0.14, 0.006));
    // Fillet
    for (let i = 0; i <= 4; i++) {
      const angle = (i / 4) * (Math.PI / 2);
      points.push(
        new THREE.Vector2(
          0.14 - 0.012 * (1 - Math.cos(angle)),
          0.006 + 0.012 * Math.sin(angle)
        )
      );
    }
    // Body
    points.push(new THREE.Vector2(0.13, 0.025));
    points.push(new THREE.Vector2(0.135, 0.045));
    points.push(new THREE.Vector2(0.14, 0.055)); // Peak
    points.push(new THREE.Vector2(0.135, 0.065));
    points.push(new THREE.Vector2(0.13, 0.085));
    // Right fillet
    for (let i = 0; i <= 4; i++) {
      const angle = (i / 4) * (Math.PI / 2);
      points.push(
        new THREE.Vector2(
          0.13 + 0.01 * (1 - Math.cos(angle)),
          0.085 + 0.012 * Math.sin(angle)
        )
      );
    }
    points.push(new THREE.Vector2(0.14, 0.104));
    points.push(new THREE.Vector2(0.14, 0.11));
    points.push(new THREE.Vector2(0.0, 0.11));
    return new THREE.LatheGeometry(points, 48);
  }, []);

  // J5 accent ring
  const j5RingGeometry = useMemo(
    () => new THREE.TorusGeometry(0.14, 0.006, 16, 48),
    []
  );

  // J6 Joint (Tool Roll) - Compact end effector housing
  const j6HousingGeometry = useMemo(() => {
    const points: THREE.Vector2[] = [];
    // Bottom flange
    points.push(new THREE.Vector2(0.0, 0));
    points.push(new THREE.Vector2(0.11, 0));
    points.push(new THREE.Vector2(0.11, 0.005));
    // Fillet
    for (let i = 0; i <= 4; i++) {
      const angle = (i / 4) * (Math.PI / 2);
      points.push(
        new THREE.Vector2(
          0.11 - 0.01 * (1 - Math.cos(angle)),
          0.005 + 0.01 * Math.sin(angle)
        )
      );
    }
    // Body with slight barrel
    points.push(new THREE.Vector2(0.1, 0.02));
    points.push(new THREE.Vector2(0.105, 0.035));
    points.push(new THREE.Vector2(0.11, 0.045)); // Peak
    points.push(new THREE.Vector2(0.105, 0.055));
    points.push(new THREE.Vector2(0.1, 0.07));
    // Top fillet
    for (let i = 0; i <= 4; i++) {
      const angle = (i / 4) * (Math.PI / 2);
      points.push(
        new THREE.Vector2(
          0.1 - 0.015 * Math.sin(angle),
          0.07 + 0.01 * (1 - Math.cos(angle))
        )
      );
    }
    points.push(new THREE.Vector2(0.085, 0.08));
    points.push(new THREE.Vector2(0.0, 0.08));
    return new THREE.LatheGeometry(points, 48);
  }, []);

  // J6 accent ring
  const j6RingGeometry = useMemo(
    () => new THREE.TorusGeometry(0.11, 0.005, 16, 48),
    []
  );

  // === 連桿幾何體（使用 Lathe 創建大圓角過渡）===
  // Link1 連桿（J1 到 J2）
  const link1Geometry = useMemo(() => {
    const points = [
      new THREE.Vector2(0.0, 0),
      new THREE.Vector2(0.12, 0),
      new THREE.Vector2(0.16, 0.04),
      new THREE.Vector2(0.16, 0.36),
      new THREE.Vector2(0.12, 0.4),
      new THREE.Vector2(0.0, 0.4),
    ];
    return new THREE.LatheGeometry(points, 48);
  }, []);

  // Link2 連桿（J2 到 J3）
  const link2Geometry = useMemo(() => {
    const points = [
      new THREE.Vector2(0.0, 0),
      new THREE.Vector2(0.1, 0),
      new THREE.Vector2(0.14, 0.04),
      new THREE.Vector2(0.14, 0.52),
      new THREE.Vector2(0.1, 0.56),
      new THREE.Vector2(0.0, 0.56),
    ];
    return new THREE.LatheGeometry(points, 48);
  }, []);

  // Link3 連桿（J3 到 J4）- 較細
  const link3Geometry = useMemo(() => {
    const points = [
      new THREE.Vector2(0.0, 0),
      new THREE.Vector2(0.07, 0),
      new THREE.Vector2(0.1, 0.03),
      new THREE.Vector2(0.1, 0.17),
      new THREE.Vector2(0.07, 0.2),
      new THREE.Vector2(0.0, 0.2),
    ];
    return new THREE.LatheGeometry(points, 48);
  }, []);

  // === 共用零件幾何體 ===
  const screwGeometry = useMemo(
    () => new THREE.CylinderGeometry(0.012, 0.014, 0.02, 18),
    []
  );
  const sensorGeometry = useMemo(
    () => new THREE.SphereGeometry(0.03, 24, 24),
    []
  );
  const flangeGeometry = useMemo(
    () => new THREE.CylinderGeometry(0.1, 0.1, 0.015, 48),
    []
  );

  useEffect(() => {
    return () => {
      baseGeometry.dispose();
      baseRimGeometry.dispose();
      j1HousingGeometry.dispose();
      j1CapGeometry.dispose();
      j2HousingGeometry.dispose();
      j2RingGeometry.dispose();
      j3HousingGeometry.dispose();
      j3RingGeometry.dispose();
      j4HousingGeometry.dispose();
      j4RingGeometry.dispose();
      j5HousingGeometry.dispose();
      j5RingGeometry.dispose();
      j6HousingGeometry.dispose();
      j6RingGeometry.dispose();
      link1Geometry.dispose();
      link2Geometry.dispose();
      link3Geometry.dispose();
      screwGeometry.dispose();
      sensorGeometry.dispose();
      flangeGeometry.dispose();
    };
  }, [
    baseGeometry,
    baseRimGeometry,
    j1HousingGeometry,
    j1CapGeometry,
    j2HousingGeometry,
    j2RingGeometry,
    j3HousingGeometry,
    j3RingGeometry,
    j4HousingGeometry,
    j4RingGeometry,
    j5HousingGeometry,
    j5RingGeometry,
    j6HousingGeometry,
    j6RingGeometry,
    link1Geometry,
    link2Geometry,
    link3Geometry,
    screwGeometry,
    sensorGeometry,
    flangeGeometry,
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
      joint1: {
        axis: "y",
        minAngle: -Math.PI,
        maxAngle: Math.PI,
        maxSpeed: 1.1,
      },
      joint2: {
        axis: "z",
        minAngle: -Math.PI / 2,
        maxAngle: Math.PI / 2,
        maxSpeed: 1.2,
      },
      joint3: {
        axis: "z",
        minAngle: -Math.PI * 0.75,
        maxAngle: Math.PI / 2,
        maxSpeed: 1.4,
      },
      joint4: {
        axis: "x",
        minAngle: -Math.PI,
        maxAngle: Math.PI,
        maxSpeed: 2.1,
      },
      joint5: {
        axis: "z",
        minAngle: -Math.PI / 1.5,
        maxAngle: Math.PI / 1.5,
        maxSpeed: 2.2,
      },
      joint6: {
        axis: "x",
        minAngle: -Math.PI,
        maxAngle: Math.PI,
        maxSpeed: 2.3,
      },
    }),
    []
  );

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    applyJointRotation(
      joint1Ref.current,
      Math.sin(t * 0.3) * 0.9,
      constraints.joint1,
      delta
    );
    applyJointRotation(
      joint2Ref.current,
      Math.sin(t * 0.5) * 0.6,
      constraints.joint2,
      delta
    );
    applyJointRotation(
      joint3Ref.current,
      Math.sin(t * 0.65) * 0.8,
      constraints.joint3,
      delta
    );
    applyJointRotation(
      joint4Ref.current,
      Math.sin(t * 1.2) * 1.1,
      constraints.joint4,
      delta
    );
    applyJointRotation(
      joint5Ref.current,
      Math.sin(t * 0.9) * 0.7,
      constraints.joint5,
      delta
    );
    applyJointRotation(
      joint6Ref.current,
      Math.sin(t * 1.4) * 1.2,
      constraints.joint6,
      delta
    );
  });

  return (
    <group {...props}>
      <mesh
        geometry={baseGeometry}
        material={materials.metal}
        castShadow
        receiveShadow
      >
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

      {/* J1 Joint - Industrial Base Rotation Joint */}
      <group ref={joint1Ref} position={[0, 0.14, 0]}>
        {/* J1 Industrial Housing - Integrated barrel profile with fillets */}
        <mesh
          geometry={j1HousingGeometry}
          material={materials.paint}
          castShadow
          receiveShadow
        />
        {/* J1 Reducer Cap Ring - Dark accent at center */}
        <mesh
          geometry={j1CapGeometry}
          material={materials.darkMetal}
          position={[0, 0.125, 0]}
          castShadow
        />
        {/* J1 Mounting Screws */}
        <ScrewRing
          radius={0.24}
          count={12}
          height={0.02}
          offsetY={0.24}
          geometry={screwGeometry}
          material={materials.darkMetal}
        />

        {/* Link1 - Transition to J2 */}
        <mesh
          geometry={link1Geometry}
          material={materials.paint}
          position={[0, 0.25, 0]}
          castShadow
          receiveShadow
        />

        {/* J2 Joint - Industrial Shoulder Pitch Joint (Horizontal) */}
        <group ref={joint2Ref} position={[0, 0.65, 0]}>
          {/* J2 Industrial Housing - Horizontal orientation */}
          <mesh
            geometry={j2HousingGeometry}
            material={materials.metal}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
            receiveShadow
          />
          {/* J2 Center Accent Ring */}
          <mesh
            geometry={j2RingGeometry}
            material={materials.paint}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          />
          {/* J2 Mounting Screws */}
          <ScrewRing
            radius={0.2}
            count={10}
            height={0.02}
            offsetY={0}
            geometry={screwGeometry}
            material={materials.darkMetal}
          />

          {/* Link2 - Transition to J3 */}
          <mesh
            geometry={link2Geometry}
            material={materials.paint}
            position={[0, 0, 0]}
            castShadow
            receiveShadow
          />

          {/* J3 Joint - Industrial Elbow Joint (Horizontal) */}
          <group ref={joint3Ref} position={[0, 0.56, 0]}>
            {/* J3 Industrial Housing */}
            <mesh
              geometry={j3HousingGeometry}
              material={materials.metal}
              rotation={[0, 0, Math.PI / 2]}
              castShadow
              receiveShadow
            />
            {/* J3 Center Accent Ring */}
            <mesh
              geometry={j3RingGeometry}
              material={materials.paint}
              rotation={[0, 0, Math.PI / 2]}
              castShadow
            />
            {/* J3 Mounting Screws */}
            <ScrewRing
              radius={0.18}
              count={8}
              height={0.02}
              offsetY={0}
              geometry={screwGeometry}
              material={materials.darkMetal}
            />

            {/* Link3 - Transition to J4 */}
            <mesh
              geometry={link3Geometry}
              material={materials.paint}
              position={[0, 0.09, 0]}
              castShadow
              receiveShadow
            />

            {/* J4 Joint - Industrial Wrist Roll Joint */}
            <group ref={joint4Ref} position={[0, 0.29, 0]}>
              {/* J4 Industrial Housing */}
              <mesh
                geometry={j4HousingGeometry}
                material={materials.metal}
                castShadow
                receiveShadow
              />
              {/* J4 Center Accent Ring */}
              <mesh
                geometry={j4RingGeometry}
                material={materials.paint}
                position={[0, 0.0625, 0]}
                rotation={[Math.PI / 2, 0, 0]}
                castShadow
              />
              {/* J4 Mounting Screws */}
              <ScrewRing
                radius={0.14}
                count={6}
                height={0.018}
                offsetY={0.12}
                geometry={screwGeometry}
                material={materials.darkMetal}
              />

              {/* J5 Joint - Industrial Wrist Pitch Joint */}
              <group ref={joint5Ref} position={[0, 0.125, 0]}>
                {/* J5 Industrial Housing */}
                <mesh
                  geometry={j5HousingGeometry}
                  material={materials.metal}
                  rotation={[0, 0, Math.PI / 2]}
                  castShadow
                  receiveShadow
                />
                {/* J5 Center Accent Ring */}
                <mesh
                  geometry={j5RingGeometry}
                  material={materials.paint}
                  rotation={[0, 0, Math.PI / 2]}
                  castShadow
                />
                {/* J5 Mounting Screws */}
                <ScrewRing
                  radius={0.12}
                  count={6}
                  height={0.015}
                  offsetY={0}
                  geometry={screwGeometry}
                  material={materials.darkMetal}
                />

                {/* J6 Joint - Industrial Tool Rotation Joint */}
                <group ref={joint6Ref} position={[0, 0.11, 0]}>
                  {/* J6 Industrial Housing */}
                  <mesh
                    geometry={j6HousingGeometry}
                    material={materials.metal}
                    castShadow
                    receiveShadow
                  />
                  {/* J6 Center Accent Ring */}
                  <mesh
                    geometry={j6RingGeometry}
                    material={materials.paint}
                    position={[0, 0.04, 0]}
                    rotation={[Math.PI / 2, 0, 0]}
                    castShadow
                  />

                  {/* 末端工具法蘭 */}
                  <mesh
                    geometry={flangeGeometry}
                    material={materials.darkMetal}
                    position={[0, 0.05, 0]}
                    castShadow
                  />

                  {/* 夾爪組件 */}
                  <group position={[0, 0.065, 0]}>
                    <RoundedBox
                      args={[0.16, 0.04, 0.16]}
                      radius={0.015}
                      smoothness={6}
                      material={materials.darkMetal}
                      castShadow
                    />
                    <RoundedBox
                      args={[0.05, 0.14, 0.05]}
                      radius={0.01}
                      smoothness={6}
                      position={[-0.06, 0.09, 0.05]}
                      material={materials.metal}
                      castShadow
                    />
                    <RoundedBox
                      args={[0.05, 0.14, 0.05]}
                      radius={0.01}
                      smoothness={6}
                      position={[0.06, 0.09, 0.05]}
                      material={materials.metal}
                      castShadow
                    />
                    <RoundedBox
                      args={[0.03, 0.1, 0.06]}
                      radius={0.008}
                      smoothness={4}
                      position={[-0.06, 0.2, 0.06]}
                      material={materials.rubber}
                      castShadow
                    />
                    <RoundedBox
                      args={[0.03, 0.1, 0.06]}
                      radius={0.008}
                      smoothness={4}
                      position={[0.06, 0.2, 0.06]}
                      material={materials.rubber}
                      castShadow
                    />
                    <mesh
                      geometry={sensorGeometry}
                      material={materials.glass}
                      position={[0, 0.06, -0.05]}
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
