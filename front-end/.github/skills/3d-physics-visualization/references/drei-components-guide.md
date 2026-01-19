# Drei Components Guide

Comprehensive guide to Drei (React Three Fiber Helpers) components.
Reference: https://drei.docs.pmnd.rs/

## Overview

Drei provides 100+ useful helpers and abstractions for R3F. This guide covers the most essential components for 3D physics visualization.

## Camera & Control Components

### OrbitControls

Interactive camera control - rotate, zoom, pan around a target point.

```typescript
import { OrbitControls } from '@react-three/drei';

<OrbitControls
  // Position and target
  autoRotate={false}
  autoRotateSpeed={4}
  
  // Interaction
  enablePan={true}
  enableZoom={true}
  enableRotate={true}
  
  // Constraints
  minDistance={5}
  maxDistance={20}
  minPolarAngle={0}
  maxPolarAngle={Math.PI}
  
  // Damping (smooth movement)
  enableDamping={true}
  dampingFactor={0.04}
  
  // Keys
  autoRotateSpeed={1}
/>
```

### PerspectiveCamera

Programmatic camera control.

```typescript
import { PerspectiveCamera } from '@react-three/drei';

<PerspectiveCamera
  position={[5, 5, 5]}
  fov={50}
  near={0.1}
  far={1000}
  makeDefault // Use this as default camera
/>
```

### CameraControls

Advanced camera with smooth animations and constraints.

```typescript
import { CameraControls } from '@react-three/drei';
import { useRef } from 'react';

function AdvancedCamera() {
  const cameraControlsRef = useRef();

  // Animate to specific position
  const handleViewReset = async () => {
    await cameraControlsRef.current?.setLookAt(
      10, 10, 10, // camera position
      0, 0, 0,    // look at target
      true        // animate
    );
  };

  return (
    <>
      <CameraControls ref={cameraControlsRef} />
      <button onClick={handleViewReset}>Reset View</button>
    </>
  );
}
```

## Lighting Components

### Environment

Automatic HDRI lighting from presets or custom textures.

```typescript
import { Environment } from '@react-three/drei';

// Using presets
<Environment preset="sunset" />
<Environment preset="studio" />
<Environment preset="city" />

// Using custom HDRI
<Environment files="/hdri/environment.hdr" />

// With adjustments
<Environment
  preset="sunset"
  intensity={1.5}
  background
  blur={0.5}
/>
```

### ContactShadows

Efficient shadow effect - objects cast shadows onto a plane.

```typescript
import { ContactShadows } from '@react-three/drei';

<ContactShadows
  position={[0, -1, 0]}
  scale={10}
  blur={2}
  far={10}
  opacity={0.8}
/>
```

## Geometry & Asset Loading

### useGLTF

Load and cache GLTF/GLB models.

```typescript
import { useGLTF } from '@react-three/drei';

function Model() {
  const { scene, animations, materials } = useGLTF('/model.glb');

  return (
    <primitive
      object={scene}
      scale={0.5}
      position={[0, 0, 0]}
    />
  );
}

// Preload for better UX
useGLTF.preload('/model.glb');
```

### useFBX

Load FBX files.

```typescript
import { useFBX } from '@react-three/drei';

function FBXModel() {
  const model = useFBX('/model.fbx');
  
  return <primitive object={model} />;
}
```

### useTexture

Load and cache textures.

```typescript
import { useTexture } from '@react-three/drei';

function TexturedMesh() {
  const texture = useTexture('/texture.jpg');
  // Or multiple textures
  const [colorMap, normalMap, roughnessMap] = useTexture([
    '/color.jpg',
    '/normal.jpg',
    '/roughness.jpg',
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

## HTML & UI Components

### Html

Render HTML inside 3D scene at specific positions.

```typescript
import { Html } from '@react-three/drei';

function LabeledObject() {
  return (
    <mesh position={[0, 2, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="blue" />
      
      {/* HTML positioned in 3D space */}
      <Html
        position={[0, 1, 0]}
        scale={0.1}
        occlude="blending" // Hide when behind objects
      >
        <div style={{
          background: 'white',
          padding: '10px',
          borderRadius: '8px',
          whiteSpace: 'nowrap'
        }}>
          Physics Object #001
        </div>
      </Html>
    </mesh>
  );
}
```

### Text

3D text rendering with custom fonts.

```typescript
import { Text } from '@react-three/drei';

<Text
  position={[0, 2, 0]}
  fontSize={1}
  color="white"
  anchorX="center"
  anchorY="middle"
  font="/fonts/Inter-Bold.woff"
>
  My 3D Text
</Text>
```

### Text3D

Advanced 3D text with geometry and materials.

```typescript
import { Text3D } from '@react-three/drei';

<Text3D
  font="/fonts/Inter-Bold.otf"
  size={1}
  position={[0, 2, 0]}
>
  3D Text
  <meshStandardMaterial color="orange" />
</Text3D>
```

## Optimization Components

### Detailed (Level of Detail)

Automatically switch between different geometries based on distance.

```typescript
import { Detailed } from '@react-three/drei';

function OptimizedModel() {
  return (
    <Detailed distances={[0, 20, 50, 100]}>
      {/* High detail - closest */}
      <mesh>
        <sphereGeometry args={[1, 128, 128]} />
        <meshStandardMaterial color="red" />
      </mesh>
      
      {/* Medium high detail */}
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial color="red" />
      </mesh>
      
      {/* Medium low detail */}
      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="red" />
      </mesh>
      
      {/* Low detail - farthest */}
      <mesh>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="red" />
      </mesh>
    </Detailed>
  );
}
```

### Instances

Render many instances efficiently.

```typescript
import { Instances, Instance } from '@react-three/drei';

function ManyBoxes({ count = 1000 }) {
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
          scale={0.5 + Math.random() * 0.5}
        />
      ))}
    </Instances>
  );
}
```

## Animation Components

### Float

Gentle floating animation.

```typescript
import { Float } from '@react-three/drei';

<Float
  speed={2}
  rotationIntensity={0.5}
  floatIntensity={1}
  rotationSpeed={3}
>
  <mesh>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color="cyan" />
  </mesh>
</Float>
```

### Scroll

Bind 3D objects to scroll position.

```typescript
import { Scroll, ScrollControls } from '@react-three/drei';

<ScrollControls pages={3}>
  <Scroll>
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="blue" />
    </mesh>
  </Scroll>
</ScrollControls>
```

## Helper Components

### Grid

Visual grid helper.

```typescript
import { Grid } from '@react-three/drei';

<Grid
  args={[10, 10]}          // grid size
  cellSize={1}             // cell dimensions
  cellColor="#6f6f6f"      // cell color
  sectionSize={5}          // section size
  sectionColor="#9d4b4b"   // section color
  fadeStrength={1}         // fade at edges
  fadeDistance={100}       // fade distance
/>
```

### AxesHelper

XYZ axes visualization.

```typescript
import { AxesHelper } from '@react-three/drei';

<AxesHelper args={[5]} /> {/* Size = 5 */}
```

### BakeShadows

Bake static shadows into textures for performance.

```typescript
import { BakeShadows } from '@react-three/drei';

<Canvas>
  <BakeShadows />
  {/* Your scene with static shadows */}
</Canvas>
```

## Monitoring Components

### Stats

FPS and memory monitoring.

```typescript
import { Stats } from '@react-three/drei';

<Canvas>
  <Stats
    showPanel={0}  // 0 = FPS, 1 = MS, 2 = MB
    className="stats"
  />
  {/* Your scene */}
</Canvas>
```

### PerformanceMonitor

Automatically adjust render quality based on performance.

```typescript
import { PerformanceMonitor } from '@react-three/drei';

function AdaptiveScene() {
  const [quality, setQuality] = useState(1);

  return (
    <PerformanceMonitor
      onChange={({ fps, factor }) => {
        console.log('FPS:', fps, 'Quality factor:', factor);
        setQuality(factor);
      }}
    >
      <YourScene quality={quality} />
    </PerformanceMonitor>
  );
}
```

## Complete Example: Physics Visualization Scene

```typescript
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  Environment,
  Html,
  Grid,
  Stats,
  Detailed
} from '@react-three/drei';

export function PhysicsVisualizationScene() {
  return (
    <Canvas
      shadows
      camera={{ position: [10, 10, 10], fov: 50 }}
    >
      {/* Performance monitoring */}
      <Stats />

      {/* Environment lighting */}
      <Environment preset="studio" intensity={1.5} />

      {/* Ground grid */}
      <Grid
        args={[20, 20]}
        cellSize={1}
        cellColor="#6f6f6f"
        sectionSize={5}
        sectionColor="#9d4b4b"
      />

      {/* Physics objects with LOD */}
      <Detailed distances={[0, 30, 60]}>
        <mesh>
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial color="red" />
        </mesh>
        <mesh>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="red" />
        </mesh>
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="red" />
        </mesh>
        
        {/* HTML label */}
        <Html position={[0, 1.5, 0]} scale={0.1}>
          <div style={{ color: 'white' }}>Object 001</div>
        </Html>
      </Detailed>

      {/* Camera controls */}
      <OrbitControls damping />
    </Canvas>
  );
}
```

## Performance Tips with Drei

1. **Preload assets** - Use `useGLTF.preload()` for better UX
2. **Use Instances** - For many similar objects
3. **Use Detailed** - For LOD optimization
4. **Use BakeShadows** - For static scene shadows
5. **Use ContactShadows** - Cheaper alternative to real shadows
6. **Monitor with Stats** - Catch performance issues early

## Best Practices

✅ **DO:**
- Preload models and textures
- Use Detailed for complex models
- Use Instances for many objects
- Monitor performance with Stats
- Use Html for UI labels sparingly

❌ **DON'T:**
- Load textures without caching
- Render too many unique materials
- Use Html for high-frequency updates
- Forget to dispose of resources
- Create new geometries every frame

## References

- [Official Drei Documentation](https://drei.docs.pmnd.rs/)
- [Drei Components API](https://drei.docs.pmnd.rs/introduction)
