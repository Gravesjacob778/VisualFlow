# React Three Fiber Hooks Guide

Complete guide to React Three Fiber (R3F) hooks based on official documentation.
Reference: https://r3f.docs.pmnd.rs/

## Core Hooks

### useFrame

The most important hook for animations and per-frame updates. Runs every frame without triggering React re-renders.

```typescript
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

function RotatingMesh() {
  const meshRef = useRef<THREE.Mesh>(null);

  // Called every frame
  useFrame((state, delta) => {
    if (meshRef.current) {
      // state.clock.elapsedTime - total elapsed time in seconds
      // delta - time elapsed since last frame in seconds
      meshRef.current.rotation.x += delta;
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
}
```

**Important Parameters:**
- `state.scene` - Three.js Scene
- `state.camera` - Three.js Camera
- `state.clock` - Three.js Clock
- `state.viewport` - Viewport dimensions
- `delta` - Frame time delta (seconds)
- `state.performance` - Performance monitor

### useThree

Access Three.js renderer, scene, camera, and more.

```typescript
import { useThree } from '@react-three/fiber';

function CameraController() {
  const { camera, scene, gl, viewport } = useThree();

  return (
    <>
      {/* Access camera to control it */}
      <button onClick={() => {
        camera.position.set(5, 5, 5);
        camera.lookAt(0, 0, 0);
      }}>
        Reset Camera
      </button>
    </>
  );
}
```

### useLoader

Load external assets (models, textures, etc.).

```typescript
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { TextureLoader } from 'three';

function ModelViewer() {
  // Load GLTF model
  const gltf = useLoader(GLTFLoader, '/model.glb');
  
  // Load texture
  const texture = useLoader(TextureLoader, '/texture.jpg');

  return (
    <>
      <primitive object={gltf.scene} />
      <mesh>
        <planeGeometry args={[10, 10]} />
        <meshBasicMaterial map={texture} />
      </mesh>
    </>
  );
}

// Preload for better UX
useLoader.preload(GLTFLoader, '/model.glb');
```

### useInstancedMesh

Efficiently render many instances of the same geometry.

```typescript
import { useInstancedMesh } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

function InstancedBoxes() {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const count = 1000;

  useFrame(() => {
    if (!instancedMeshRef.current) return;

    // Update instance positions
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      matrix.makeTranslation(
        (i % 100) - 50,
        Math.sin(i) * 5,
        Math.floor(i / 100) - 50
      );
      instancedMeshRef.current.setMatrixAt(i, matrix);
    }
    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[undefined, undefined, count]}
      castShadow
    >
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="red" />
    </instancedMesh>
  );
}
```

## State Management Hooks

### useSnapshot (Zustand integration)

When using Zustand for state management in R3F:

```typescript
import { useSnapshot } from 'zustand';
import create from 'zustand';

const useStore = create((set) => ({
  position: [0, 0, 0],
  setPosition: (pos: [number, number, number]) => set({ position: pos }),
}));

function StateAwareMesh() {
  const { position } = useSnapshot(useStore());

  return (
    <mesh position={position}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="blue" />
    </mesh>
  );
}
```

## Advanced Patterns

### useFrame with Interpolation

For smooth motion between backend physics updates:

```typescript
function SmoothInterpolation() {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetPos = useRef(new THREE.Vector3(0, 0, 0));
  const targetRot = useRef(new THREE.Quaternion());

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Interpolate position smoothly
    meshRef.current.position.lerp(targetPos.current, 0.1);

    // Interpolate rotation smoothly
    meshRef.current.quaternion.slerp(targetRot.current, 0.1);
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="green" />
    </mesh>
  );
}
```

### useFrame with Performance Monitoring

```typescript
function PerformanceAwareAnimation() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Adjust animation quality based on FPS
    const fps = 1 / delta;
    const quality = fps > 55 ? 1 : fps > 30 ? 0.5 : 0.25;

    meshRef.current.rotation.x += delta * quality;
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="purple" />
    </mesh>
  );
}
```

### useFrame Priority

Hooks are executed in order of component depth. Use priority for specific execution order:

```typescript
// Runs every frame
useFrame(() => {
  // Update logic
});

// Runs after default priority (number = execution order)
useFrame(() => {
  // Post-update logic
}, { priority: 1 });

// Runs before default priority
useFrame(() => {
  // Pre-update logic
}, { priority: -1 });
```

## Canvas Props Related to Hooks

```typescript
<Canvas
  // Performance settings
  frameloop="always"  // "always" (default), "demand", "never"
  
  // Camera
  camera={{ position: [5, 5, 5], fov: 50 }}
  
  // Rendering
  gl={{
    antialias: true,
    outputEncoding: THREE.sRGBEncoding,
  }}
  
  // Event settings
  onCreated={(state) => {
    // Called when canvas is created
    console.log(state.scene);
  }}
>
  {/* Your components */}
</Canvas>
```

## Common Patterns with Hooks

### Animation Loop with Clock

```typescript
function AnimatedObject() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Using elapsed time from clock
      const t = state.clock.elapsedTime;
      meshRef.current.position.y = Math.sin(t) * 3;
      meshRef.current.rotation.z = t * 0.5;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial color="cyan" />
    </mesh>
  );
}
```

### Camera Following Object

```typescript
function CameraFollower() {
  const targetRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!targetRef.current) return;

    // Smooth camera follow
    state.camera.position.lerp(
      new THREE.Vector3(
        targetRef.current.position.x + 5,
        targetRef.current.position.y + 5,
        targetRef.current.position.z + 5
      ),
      0.05
    );
    state.camera.lookAt(targetRef.current.position);
  });

  return (
    <mesh ref={targetRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="red" />
    </mesh>
  );
}
```

### Conditional Frame Updates

```typescript
function ConditionalAnimation() {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isAnimating, setIsAnimating] = useState(true);

  // Only run when isAnimating is true
  useFrame(() => {
    if (!isAnimating || !meshRef.current) return;
    meshRef.current.rotation.x += 0.01;
  });

  return (
    <>
      <mesh ref={meshRef}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="orange" />
      </mesh>
      <button onClick={() => setIsAnimating(!isAnimating)}>
        Toggle Animation
      </button>
    </>
  );
}
```

## Performance Tips

1. **Always check refs before use** - Objects might not be mounted yet
2. **Use `delta` for frame-rate independent animation** - Don't assume 60 FPS
3. **Minimize state updates** - Use refs for frequently changed values
4. **Batch geometry updates** - Don't update every frame unless necessary
5. **Use `priority` for execution order** - Control hook execution sequence

## Best Practices

✅ **DO:**
- Use `useFrame` for continuous animations
- Use refs to avoid re-renders
- Check `delta` for smooth motion
- Use `performance` to optimize based on FPS

❌ **DON'T:**
- Update React state every frame (causes re-renders)
- Access refs without checking for null
- Assume constant 60 FPS
- Create new objects in `useFrame` (memory leak)

## References

- [Official R3F Documentation](https://r3f.docs.pmnd.rs/)
- [useFrame API](https://r3f.docs.pmnd.rs/api/hooks)
- [useThree API](https://r3f.docs.pmnd.rs/api/hooks)
