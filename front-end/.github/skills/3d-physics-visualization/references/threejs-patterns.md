# Three.js Common Patterns

Essential patterns and best practices for Three.js development with React Three Fiber.

## Scene Setup Patterns

### Basic Scene
```typescript
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

export function BasicScene() {
  return (
    <Canvas
      camera={{ position: [5, 5, 5], fov: 50 }}
      style={{ width: '100vw', height: '100vh' }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      
      {/* 3D Content */}
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="orange" />
      </mesh>
      
      {/* Controls */}
      <OrbitControls />
    </Canvas>
  );
}
```

### Scene with Shadows
```typescript
<Canvas shadows>
  <directionalLight 
    position={[10, 10, 5]} 
    castShadow
    shadow-mapSize-width={2048}
    shadow-mapSize-height={2048}
  />
  
  <mesh castShadow>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color="red" />
  </mesh>
  
  <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
    <planeGeometry args={[10, 10]} />
    <meshStandardMaterial color="white" />
  </mesh>
</Canvas>
```

## Lighting Patterns

### Three-Point Lighting
```typescript
function ThreePointLighting() {
  return (
    <>
      {/* Key light - main light source */}
      <directionalLight position={[5, 5, 5]} intensity={1.5} />
      
      {/* Fill light - softens shadows */}
      <directionalLight position={[-5, 2, -5]} intensity={0.5} />
      
      {/* Back light - separates subject from background */}
      <directionalLight position={[0, 5, -5]} intensity={0.8} />
      
      {/* Ambient - general illumination */}
      <ambientLight intensity={0.3} />
    </>
  );
}
```

### HDRI Environment
```typescript
import { Environment } from '@react-three/drei';

function HDRIScene() {
  return (
    <>
      {/* Pre-baked environment lighting */}
      <Environment preset="sunset" background />
      
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial roughness={0.2} metalness={0.8} />
      </mesh>
    </>
  );
}
```

## Material Patterns

### PBR (Physically Based Rendering)
```typescript
<mesh>
  <sphereGeometry args={[1, 64, 64]} />
  <meshStandardMaterial
    color="#ffffff"
    metalness={0.8}
    roughness={0.2}
    envMapIntensity={1.0}
  />
</mesh>
```

### Textured Material
```typescript
import { useTexture } from '@react-three/drei';

function TexturedBox() {
  const [colorMap, normalMap, roughnessMap] = useTexture([
    '/textures/color.jpg',
    '/textures/normal.jpg',
    '/textures/roughness.jpg',
  ]);

  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        map={colorMap}
        normalMap={normalMap}
        roughnessMap={roughnessMap}
      />
    </mesh>
  );
}
```

### Custom Shader Material
```typescript
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';

const CustomMaterial = shaderMaterial(
  { time: 0, color: new THREE.Color(0.2, 0.0, 0.1) },
  // Vertex shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform float time;
    uniform vec3 color;
    varying vec2 vUv;
    
    void main() {
      gl_FragColor = vec4(color * vUv.x * sin(time), 1.0);
    }
  `
);

extend({ CustomMaterial });

function ShaderBox() {
  const materialRef = useRef();
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.time = state.clock.elapsedTime;
    }
  });

  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <customMaterial ref={materialRef} />
    </mesh>
  );
}
```

## Animation Patterns

### Continuous Rotation
```typescript
function RotatingBox() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta;
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="blue" />
    </mesh>
  );
}
```

### Spring Animation
```typescript
import { useSpring, animated } from '@react-spring/three';

function SpringBox() {
  const [active, setActive] = useState(false);
  
  const { scale } = useSpring({
    scale: active ? 1.5 : 1,
    config: { mass: 1, tension: 170, friction: 26 }
  });

  return (
    <animated.mesh
      scale={scale}
      onClick={() => setActive(!active)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="red" />
    </animated.mesh>
  );
}
```

### Follow Path
```typescript
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function PathFollower() {
  const meshRef = useRef<THREE.Mesh>(null);
  const pathRef = useRef(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-5, 0, 0),
      new THREE.Vector3(0, 5, 0),
      new THREE.Vector3(5, 0, 0),
      new THREE.Vector3(0, -5, 0),
    ], true) // true = closed loop
  );

  useFrame((state) => {
    if (meshRef.current) {
      const t = (state.clock.elapsedTime * 0.1) % 1;
      const position = pathRef.current.getPoint(t);
      meshRef.current.position.copy(position);
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial color="yellow" />
    </mesh>
  );
}
```

## Camera Patterns

### Orbit Controls
```typescript
import { OrbitControls } from '@react-three/drei';

<OrbitControls
  enablePan={true}
  enableZoom={true}
  enableRotate={true}
  minDistance={5}
  maxDistance={20}
  minPolarAngle={0}
  maxPolarAngle={Math.PI / 2}
/>
```

### First Person Controls
```typescript
import { PointerLockControls } from '@react-three/drei';

<PointerLockControls />
```

### Cinematic Camera Movement
```typescript
import { CameraControls } from '@react-three/drei';

function CinematicCamera() {
  const cameraControlsRef = useRef();

  useEffect(() => {
    // Animate camera to target
    cameraControlsRef.current?.setLookAt(
      10, 10, 10, // Camera position
      0, 0, 0,    // Look at target
      true        // Enable transition
    );
  }, []);

  return <CameraControls ref={cameraControlsRef} />;
}
```

## Interaction Patterns

### Click Detection
```typescript
function ClickableBox() {
  const [clicked, setClicked] = useState(false);

  return (
    <mesh onClick={() => setClicked(!clicked)}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={clicked ? 'red' : 'blue'} />
    </mesh>
  );
}
```

### Hover Effect
```typescript
function HoverBox() {
  const [hovered, setHovered] = useState(false);

  return (
    <mesh
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? 1.2 : 1}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? 'orange' : 'blue'} />
    </mesh>
  );
}
```

### Drag Object
```typescript
import { useDrag } from '@use-gesture/react';
import { useSpring, animated } from '@react-spring/three';

function DraggableBox() {
  const [{ position }, api] = useSpring(() => ({ position: [0, 0, 0] }));
  
  const bind = useDrag(({ offset: [x, y] }) => {
    api.start({ position: [x / 100, -y / 100, 0] });
  });

  return (
    <animated.mesh {...bind()} position={position}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="green" />
    </animated.mesh>
  );
}
```

## Loading Patterns

### GLTF Model Loading
```typescript
import { useGLTF } from '@react-three/drei';

function Model() {
  const { scene } = useGLTF('/model.glb');
  
  return <primitive object={scene} />;
}

// Preload for better performance
useGLTF.preload('/model.glb');
```

### Suspense Loading
```typescript
import { Suspense } from 'react';
import { Html, useProgress } from '@react-three/drei';

function Loader() {
  const { progress } = useProgress();
  return <Html center>{progress.toFixed(0)}% loaded</Html>;
}

function App() {
  return (
    <Canvas>
      <Suspense fallback={<Loader />}>
        <Model />
      </Suspense>
    </Canvas>
  );
}
```

## Post-Processing Patterns

### Bloom Effect
```typescript
import { EffectComposer, Bloom } from '@react-three/postprocessing';

<Canvas>
  <Scene />
  <EffectComposer>
    <Bloom luminanceThreshold={0.9} luminanceSmoothing={0.9} height={300} />
  </EffectComposer>
</Canvas>
```

### Depth of Field
```typescript
import { EffectComposer, DepthOfField } from '@react-three/postprocessing';

<EffectComposer>
  <DepthOfField
    focusDistance={0.01}
    focalLength={0.2}
    bokehScale={3}
  />
</EffectComposer>
```

## Performance Patterns

### Instancing
```typescript
import { Instances, Instance } from '@react-three/drei';

function InstancedBoxes({ count = 1000 }) {
  return (
    <Instances limit={count}>
      <boxGeometry args={[0.1, 0.1, 0.1]} />
      <meshStandardMaterial color="red" />
      
      {Array.from({ length: count }).map((_, i) => (
        <Instance 
          key={i}
          position={[
            (i % 100) - 50,
            0,
            Math.floor(i / 100) - 50
          ]}
        />
      ))}
    </Instances>
  );
}
```

### LOD (Level of Detail)
```typescript
import { Detailed } from '@react-three/drei';

<Detailed distances={[0, 10, 20]}>
  <HighDetailModel />
  <MediumDetailModel />
  <LowDetailModel />
</Detailed>
```

## Utility Patterns

### FPS Counter
```typescript
import { Stats } from '@react-three/drei';

<Canvas>
  <Stats />
  {/* Shows FPS in top-left corner */}
</Canvas>
```

### Grid Helper
```typescript
import { Grid } from '@react-three/drei';

<Grid
  args={[10, 10]}
  cellSize={1}
  cellColor="#6f6f6f"
  sectionSize={5}
  sectionColor="#9d4b4b"
/>
```

### Axes Helper
```typescript
<axesHelper args={[5]} />
```

## Common Gotchas

### 1. Ref Types
```typescript
// ✅ Correct
const meshRef = useRef<THREE.Mesh>(null);

// ❌ Wrong
const meshRef = useRef<any>(null);
```

### 2. Rotation Order
```typescript
// Euler angles default to XYZ order
mesh.rotation.set(Math.PI / 4, Math.PI / 4, 0);

// Change rotation order if needed
mesh.rotation.order = 'YXZ';
```

### 3. Material Side
```typescript
// Default: FrontSide (single-sided)
<meshStandardMaterial side={THREE.FrontSide} />

// BackSide - visible from inside
<meshStandardMaterial side={THREE.BackSide} />

// DoubleSide - visible from both sides (slower)
<meshStandardMaterial side={THREE.DoubleSide} />
```

### 4. Clone Objects
```typescript
// ✅ Good: Clone geometry/material when reusing
const clonedGeometry = originalGeometry.clone();
const clonedMaterial = originalMaterial.clone();

// ❌ Bad: Reusing without cloning (shared state)
<mesh geometry={sharedGeometry} />
```
