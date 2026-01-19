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

  // === 圓筒關節殼體幾何體（包覆減速機與交叉滾子軸承）===
  // J1 關節（底座旋轉關節）- 大型圓筒，略鼓起
  const j1HousingGeometry = useMemo(
    () => new THREE.CylinderGeometry(0.22, 0.24, 0.2, 64),
    []
  );
  const j1BulgeGeometry = useMemo(
    () => new THREE.TorusGeometry(0.245, 0.028, 20, 64),
    []
  );

  // J2 關節（肩部俯仰關節）- 中大型圓筒，橫向安裝
  const j2HousingGeometry = useMemo(
    () => new THREE.CylinderGeometry(0.18, 0.2, 0.16, 64),
    []
  );
  const j2BulgeGeometry = useMemo(
    () => new THREE.TorusGeometry(0.2, 0.024, 18, 64),
    []
  );

  // J3 關節（肘部關節）- 中型圓筒
  const j3HousingGeometry = useMemo(
    () => new THREE.CylinderGeometry(0.16, 0.18, 0.14, 64),
    []
  );
  const j3BulgeGeometry = useMemo(
    () => new THREE.TorusGeometry(0.18, 0.022, 18, 64),
    []
  );

  // J4 關節（腕部旋轉關節）- 較小圓筒
  const j4HousingGeometry = useMemo(
    () => new THREE.CylinderGeometry(0.11, 0.13, 0.1, 48),
    []
  );
  const j4BulgeGeometry = useMemo(
    () => new THREE.TorusGeometry(0.13, 0.018, 16, 48),
    []
  );

  // J5 關節（腕部俯仰關節）- 小型圓筒
  const j5HousingGeometry = useMemo(
    () => new THREE.CylinderGeometry(0.09, 0.11, 0.08, 48),
    []
  );
  const j5BulgeGeometry = useMemo(
    () => new THREE.TorusGeometry(0.11, 0.015, 16, 48),
    []
  );

  // J6 關節（末端旋轉關節）- 最小圓筒
  const j6HousingGeometry = useMemo(
    () => new THREE.CylinderGeometry(0.07, 0.08, 0.06, 48),
    []
  );
  const j6BulgeGeometry = useMemo(
    () => new THREE.TorusGeometry(0.085, 0.012, 16, 48),
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
      j1BulgeGeometry.dispose();
      j2HousingGeometry.dispose();
      j2BulgeGeometry.dispose();
      j3HousingGeometry.dispose();
      j3BulgeGeometry.dispose();
      j4HousingGeometry.dispose();
      j4BulgeGeometry.dispose();
      j5HousingGeometry.dispose();
      j5BulgeGeometry.dispose();
      j6HousingGeometry.dispose();
      j6BulgeGeometry.dispose();
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
    j1BulgeGeometry,
    j2HousingGeometry,
    j2BulgeGeometry,
    j3HousingGeometry,
    j3BulgeGeometry,
    j4HousingGeometry,
    j4BulgeGeometry,
    j5HousingGeometry,
    j5BulgeGeometry,
    j6HousingGeometry,
    j6BulgeGeometry,
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

      {/* J1 關節組件 - 底座旋轉關節（同軸圓筒設計）*/}
      <group ref={joint1Ref} position={[0, 0.14, 0]}>
        {/* J1 圓筒殼體 - 包覆減速機與交叉滾子軸承 */}
        <mesh
          geometry={j1HousingGeometry}
          material={materials.paint}
          position={[0, 0.1, 0]}
          castShadow
          receiveShadow
        />
        {/* J1 鼓起環 - 下方邊緣 */}
        <mesh
          geometry={j1BulgeGeometry}
          material={materials.paint}
          position={[0, 0.02, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
        />
        {/* J1 鼓起環 - 中央最粗處（減速機位置）*/}
        <mesh
          geometry={j1BulgeGeometry}
          material={materials.darkMetal}
          position={[0, 0.1, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
        />
        {/* J1 鼓起環 - 上方邊緣 */}
        <mesh
          geometry={j1BulgeGeometry}
          material={materials.paint}
          position={[0, 0.18, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
        />
        {/* J1 螺絲環 */}
        <ScrewRing
          radius={0.2}
          count={12}
          height={0.02}
          offsetY={0.18}
          geometry={screwGeometry}
          material={materials.darkMetal}
        />

        {/* Link1 連桿 - 大圓角過渡至 J2 */}
        <mesh
          geometry={link1Geometry}
          material={materials.paint}
          position={[0, 0.2, 0]}
          castShadow
          receiveShadow
        />

        {/* J2 關節組件 - 肩部俯仰關節（橫向同軸圓筒）*/}
        <group ref={joint2Ref} position={[0, 0.6, 0]}>
          {/* J2 圓筒殼體 - 橫向安裝 */}
          <mesh
            geometry={j2HousingGeometry}
            material={materials.metal}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
            receiveShadow
          />
          {/* J2 鼓起環 - 左側邊緣 */}
          <mesh
            geometry={j2BulgeGeometry}
            material={materials.darkMetal}
            position={[-0.08, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          />
          {/* J2 鼓起環 - 中央（減速機位置）*/}
          <mesh
            geometry={j2BulgeGeometry}
            material={materials.paint}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          />
          {/* J2 鼓起環 - 右側邊緣 */}
          <mesh
            geometry={j2BulgeGeometry}
            material={materials.darkMetal}
            position={[0.08, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          />
          {/* J2 螺絲環 */}
          <ScrewRing
            radius={0.16}
            count={10}
            height={0.02}
            offsetY={0}
            geometry={screwGeometry}
            material={materials.darkMetal}
          />

          {/* Link2 連桿 - 大圓角過渡至 J3 */}
          <mesh
            geometry={link2Geometry}
            material={materials.paint}
            position={[0, 0, 0]}
            castShadow
            receiveShadow
          />

          {/* J3 關節組件 - 肘部關節（橫向同軸圓筒）*/}
          <group ref={joint3Ref} position={[0, 0.56, 0]}>
            {/* J3 圓筒殼體 */}
            <mesh
              geometry={j3HousingGeometry}
              material={materials.metal}
              rotation={[0, 0, Math.PI / 2]}
              castShadow
              receiveShadow
            />
            {/* J3 鼓起環 - 左側 */}
            <mesh
              geometry={j3BulgeGeometry}
              material={materials.darkMetal}
              position={[-0.07, 0, 0]}
              rotation={[0, 0, Math.PI / 2]}
              castShadow
            />
            {/* J3 鼓起環 - 中央 */}
            <mesh
              geometry={j3BulgeGeometry}
              material={materials.paint}
              rotation={[0, 0, Math.PI / 2]}
              castShadow
            />
            {/* J3 鼓起環 - 右側 */}
            <mesh
              geometry={j3BulgeGeometry}
              material={materials.darkMetal}
              position={[0.07, 0, 0]}
              rotation={[0, 0, Math.PI / 2]}
              castShadow
            />
            {/* J3 螺絲環 */}
            <ScrewRing
              radius={0.14}
              count={8}
              height={0.02}
              offsetY={0}
              geometry={screwGeometry}
              material={materials.darkMetal}
            />

            {/* Link3 連桿 - 大圓角過渡至 J4 */}
            <mesh
              geometry={link3Geometry}
              material={materials.paint}
              position={[0, 0, 0]}
              castShadow
              receiveShadow
            />

            {/* J4 關節組件 - 腕部旋轉關節（同軸圓筒）*/}
            <group ref={joint4Ref} position={[0, 0.2, 0]}>
              {/* J4 圓筒殼體 */}
              <mesh
                geometry={j4HousingGeometry}
                material={materials.metal}
                castShadow
                receiveShadow
              />
              {/* J4 鼓起環 - 下方 */}
              <mesh
                geometry={j4BulgeGeometry}
                material={materials.darkMetal}
                position={[0, -0.04, 0]}
                rotation={[Math.PI / 2, 0, 0]}
                castShadow
              />
              {/* J4 鼓起環 - 中央 */}
              <mesh
                geometry={j4BulgeGeometry}
                material={materials.paint}
                rotation={[Math.PI / 2, 0, 0]}
                castShadow
              />
              {/* J4 鼓起環 - 上方 */}
              <mesh
                geometry={j4BulgeGeometry}
                material={materials.darkMetal}
                position={[0, 0.04, 0]}
                rotation={[Math.PI / 2, 0, 0]}
                castShadow
              />
              {/* J4 螺絲環 */}
              <ScrewRing
                radius={0.1}
                count={6}
                height={0.018}
                offsetY={0.04}
                geometry={screwGeometry}
                material={materials.darkMetal}
              />

              {/* J5 關節組件 - 腕部俯仰關節 */}
              <group ref={joint5Ref} position={[0, 0.1, 0]}>
                {/* J5 圓筒殼體 */}
                <mesh
                  geometry={j5HousingGeometry}
                  material={materials.metal}
                  rotation={[0, 0, Math.PI / 2]}
                  castShadow
                  receiveShadow
                />
                {/* J5 鼓起環 - 左側 */}
                <mesh
                  geometry={j5BulgeGeometry}
                  material={materials.darkMetal}
                  position={[-0.04, 0, 0]}
                  rotation={[0, 0, Math.PI / 2]}
                  castShadow
                />
                {/* J5 鼓起環 - 中央 */}
                <mesh
                  geometry={j5BulgeGeometry}
                  material={materials.paint}
                  rotation={[0, 0, Math.PI / 2]}
                  castShadow
                />
                {/* J5 鼓起環 - 右側 */}
                <mesh
                  geometry={j5BulgeGeometry}
                  material={materials.darkMetal}
                  position={[0.04, 0, 0]}
                  rotation={[0, 0, Math.PI / 2]}
                  castShadow
                />
                {/* J5 螺絲環 */}
                <ScrewRing
                  radius={0.088}
                  count={6}
                  height={0.015}
                  offsetY={0}
                  geometry={screwGeometry}
                  material={materials.darkMetal}
                />

                {/* J6 關節組件 - 末端旋轉關節 */}
                <group ref={joint6Ref} position={[0, 0.08, 0]}>
                  {/* J6 圓筒殼體 */}
                  <mesh
                    geometry={j6HousingGeometry}
                    material={materials.metal}
                    castShadow
                    receiveShadow
                  />
                  {/* J6 鼓起環 - 下方 */}
                  <mesh
                    geometry={j6BulgeGeometry}
                    material={materials.darkMetal}
                    position={[0, -0.025, 0]}
                    rotation={[Math.PI / 2, 0, 0]}
                    castShadow
                  />
                  {/* J6 鼓起環 - 中央 */}
                  <mesh
                    geometry={j6BulgeGeometry}
                    material={materials.paint}
                    rotation={[Math.PI / 2, 0, 0]}
                    castShadow
                  />
                  {/* J6 鼓起環 - 上方 */}
                  <mesh
                    geometry={j6BulgeGeometry}
                    material={materials.darkMetal}
                    position={[0, 0.025, 0]}
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
