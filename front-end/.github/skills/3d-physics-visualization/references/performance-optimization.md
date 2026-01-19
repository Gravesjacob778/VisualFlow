# Performance Optimization Guide

Comprehensive guide for optimizing Three.js and React Three Fiber applications for 60 FPS rendering.

## Performance Budget

Target metrics for production applications:

| Metric | Target | Critical |
|--------|--------|----------|
| Frame Rate | 60 FPS | 30 FPS minimum |
| Frame Time | 16.67ms | 33.33ms maximum |
| Memory Usage | <200MB | <500MB |
| Draw Calls | <100 | <500 |
| Triangles | <100K visible | <500K visible |
| Texture Memory | <50MB | <200MB |

## Optimization Strategies

### 1. Geometry Optimization

#### Use BufferGeometry
```typescript
// ✅ Good: BufferGeometry (efficient)
const geometry = new THREE.BoxGeometry(1, 1, 1);

// ❌ Bad: Legacy Geometry (deprecated)
const geometry = new THREE.Geometry();
```

#### Reuse Geometries
```typescript
// ✅ Good: Create once, reuse many times
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);

function MultipleBoxes() {
  return (
    <>
      <mesh geometry={boxGeometry} position={[0, 0, 0]} />
      <mesh geometry={boxGeometry} position={[2, 0, 0]} />
      <mesh geometry={boxGeometry} position={[4, 0, 0]} />
    </>
  );
}

// ❌ Bad: Creating new geometry every render
function BadBoxes() {
  return (
    <>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} /> {/* New instance every render */}
      </mesh>
    </>
  );
}
```

#### Level of Detail (LOD)
```typescript
import { Detailed } from '@react-three/drei';

function OptimizedModel() {
  return (
    <Detailed distances={[0, 20, 50]}>
      {/* High detail - close to camera */}
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial color="red" />
      </mesh>
      
      {/* Medium detail - mid distance */}
      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="red" />
      </mesh>
      
      {/* Low detail - far from camera */}
      <mesh>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color="red" />
      </mesh>
    </Detailed>
  );
}
```

### 2. Material Optimization

#### Share Materials
```typescript
// ✅ Good: Create material once at module level
const redMaterial = new THREE.MeshStandardMaterial({ color: 'red' });

function OptimizedScene() {
  return (
    <>
      <mesh material={redMaterial} />
      <mesh material={redMaterial} />
      <mesh material={redMaterial} />
    </>
  );
}
```

#### Use Simple Materials When Possible
```typescript
// ✅ Good: MeshBasicMaterial for unlit objects
<meshBasicMaterial color="white" />

// ❌ Avoid: MeshStandardMaterial when lighting not needed
<meshStandardMaterial color="white" />
```

#### Reduce Shader Complexity
```typescript
// ✅ Good: Disable unused features
<meshStandardMaterial 
  color="red"
  flatShading // Simpler than smooth shading
  roughness={1} // No reflection calculations
  metalness={0}
/>
```

### 3. Texture Optimization

#### Use Power-of-Two Textures
```typescript
// ✅ Good: 512x512, 1024x1024, 2048x2048
const texture = new THREE.TextureLoader().load('/texture-1024.jpg');

// ❌ Bad: 1000x1000 (not power of two, can't use mipmaps)
const texture = new THREE.TextureLoader().load('/texture-1000.jpg');
```

#### Compress Textures
```typescript
import { useTexture } from '@react-three/drei';

function OptimizedTexture() {
  // Use compressed formats: KTX2, Basis Universal
  const texture = useTexture('/texture.ktx2');
  
  return (
    <mesh>
      <planeGeometry args={[10, 10]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}
```

#### Dispose Textures
```typescript
useEffect(() => {
  const texture = new THREE.TextureLoader().load('/texture.jpg');
  
  return () => {
    texture.dispose(); // Free GPU memory
  };
}, []);
```

### 4. Lighting Optimization

#### Limit Real-time Shadows
```typescript
// ✅ Good: Only important objects cast shadows
<Canvas shadows>
  <directionalLight position={[10, 10, 5]} castShadow />
  
  <mesh castShadow> {/* Character */}
    <boxGeometry args={[1, 1, 1]} />
  </mesh>
  
  <mesh> {/* Background, no shadow needed */}
    <planeGeometry args={[100, 100]} />
  </mesh>
</Canvas>
```

#### Use Baked Lighting
```typescript
import { Environment } from '@react-three/drei';

// ✅ Good: Pre-baked HDRI environment map
function BakedLighting() {
  return (
    <>
      <Environment preset="sunset" />
      {/* No need for directional/point lights */}
    </>
  );
}
```

#### Reduce Shadow Map Size
```typescript
<directionalLight 
  castShadow
  shadow-mapSize-width={1024}
  shadow-mapSize-height={1024}
  // Default is 512, higher = better quality but slower
/>
```

### 5. Render Optimization

#### Frustum Culling (Automatic)
Three.js automatically culls objects outside camera view. Ensure bounding volumes are correct:

```typescript
// Update bounding sphere when geometry changes
geometry.computeBoundingSphere();
```

#### Instanced Rendering
```typescript
import { Instances, Instance } from '@react-three/drei';

// ✅ Good: Render 1000 boxes with 1 draw call
function InstancedBoxes() {
  return (
    <Instances limit={1000}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="red" />
      
      {Array.from({ length: 1000 }).map((_, i) => (
        <Instance key={i} position={[i % 100, 0, Math.floor(i / 100)]} />
      ))}
    </Instances>
  );
}

// ❌ Bad: 1000 draw calls
function IndividualBoxes() {
  return (
    <>
      {Array.from({ length: 1000 }).map((_, i) => (
        <mesh key={i} position={[i % 100, 0, Math.floor(i / 100)]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="red" />
        </mesh>
      ))}
    </>
  );
}
```

#### Reduce React Re-renders
```typescript
import { useMemo } from 'react';

// ✅ Good: Memoize expensive objects
function OptimizedComponent() {
  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: 'red' }), []);
  
  return <mesh geometry={geometry} material={material} />;
}

// ❌ Bad: Creating new instances every render
function BadComponent() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} /> {/* New instance every render */}
      <meshStandardMaterial color="red" />
    </mesh>
  );
}
```

### 6. Animation Optimization

#### Use useFrame for Animations
```typescript
import { useFrame } from '@react-three/fiber';

// ✅ Good: useFrame (60 FPS, no React re-renders)
function AnimatedBox() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta;
    }
  });
  
  return <mesh ref={meshRef}>{/* ... */}</mesh>;
}

// ❌ Bad: useState triggers React re-renders
function BadAnimatedBox() {
  const [rotation, setRotation] = useState(0);
  
  useFrame(() => {
    setRotation(r => r + 0.01); // React re-render every frame!
  });
  
  return <mesh rotation={[rotation, 0, 0]}>{/* ... */}</mesh>;
}
```

### 7. Memory Management

#### Dispose Resources
```typescript
function CleanComponent() {
  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const material = useMemo(() => new THREE.MeshStandardMaterial(), []);
  
  useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);
  
  return <mesh geometry={geometry} material={material} />;
}
```

#### Monitor Memory Usage
```typescript
import { Stats } from '@react-three/drei';

function App() {
  return (
    <Canvas>
      <Stats showPanel={2} /> {/* Panel 2 = Memory */}
      {/* Rest of scene */}
    </Canvas>
  );
}
```

## Profiling Tools

### 1. React DevTools Profiler
```bash
# Enable profiling in development
npm start
# Open React DevTools > Profiler tab
```

### 2. Three.js Stats
```typescript
import { Stats } from '@react-three/drei';

<Canvas>
  <Stats />
  {/* Shows FPS, MS, MB */}
</Canvas>
```

### 3. Chrome Performance Tab
1. Open Chrome DevTools
2. Navigate to Performance tab
3. Record interaction
4. Analyze flame graph

### 4. Three.js Inspector
```typescript
import { extend } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';

<PerformanceMonitor onChange={({ fps, factor }) => {
  console.log('FPS:', fps, 'Factor:', factor);
}}>
  {/* Automatically adjusts quality based on FPS */}
</PerformanceMonitor>
```

## Performance Checklist

### Before Deployment

- [ ] Run React DevTools Profiler - No long render times
- [ ] Check draw calls - <100 for simple scenes, <500 for complex
- [ ] Monitor memory usage - Stable, no leaks
- [ ] Test on mobile devices - 30+ FPS minimum
- [ ] Verify texture sizes - Power of two, compressed when possible
- [ ] Check shadow map sizes - Not unnecessarily large
- [ ] Dispose all resources - No memory leaks
- [ ] Profile with Chrome DevTools - Identify bottlenecks

### During Development

- [ ] Use `<Stats />` component - Monitor FPS/memory continuously
- [ ] Enable frustum culling debug - Verify objects culled correctly
- [ ] Test with many objects - Ensure scalability
- [ ] Profile loading times - Lazy load large assets
- [ ] Test different devices - Mobile, tablet, desktop

## Common Performance Issues

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| Low FPS (<30) | Too many draw calls | Use instancing, merge geometries |
| Stuttering | React re-renders | Use `useFrame`, avoid state updates |
| High memory usage | Memory leaks | Dispose geometries/materials/textures |
| Slow loading | Large assets | Compress textures, lazy load models |
| Poor mobile performance | Too complex shaders | Use simpler materials, reduce shadows |
| Flickering shadows | Shadow map too small | Increase `shadow-mapSize` |

## Advanced Techniques

### Object Pooling
```typescript
class ObjectPool<T> {
  private pool: T[] = [];
  
  constructor(private factory: () => T, initialSize: number) {
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }
  
  acquire(): T {
    return this.pool.pop() || this.factory();
  }
  
  release(obj: T): void {
    this.pool.push(obj);
  }
}

// Usage
const meshPool = new ObjectPool(
  () => new THREE.Mesh(geometry, material),
  100
);
```

### Batch Matrix Updates
```typescript
// Update many objects efficiently
const matrix = new THREE.Matrix4();
objects.forEach((obj, i) => {
  matrix.makeTranslation(i, 0, 0);
  instancedMesh.setMatrixAt(i, matrix);
});
instancedMesh.instanceMatrix.needsUpdate = true;
```

## Recommended Settings

### For High Performance
```typescript
<Canvas
  shadows={false} // Disable shadows
  gl={{
    antialias: false, // Disable anti-aliasing
    alpha: false, // Opaque canvas
    powerPreference: 'high-performance',
  }}
  camera={{ fov: 50 }} // Narrower FOV = less to render
>
```

### For High Quality
```typescript
<Canvas
  shadows
  gl={{
    antialias: true,
    alpha: true,
    toneMapping: THREE.ACESFilmicToneMapping,
    outputEncoding: THREE.sRGBEncoding,
  }}
  camera={{ fov: 75 }}
>
```
