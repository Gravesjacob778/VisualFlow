---
name: 3d-physics-visualization
description: Expert in creating 3D physics simulations with Three.js, React Three Fiber, Drei, and react-three/rapier. Use when asked to build 3D scenes, add physics to objects, create interactive 3D visualizations, implement backend-driven physics rendering, optimize 3D performance, work with WebGL, or debug Three.js applications. Handles real-time synchronization between backend physics engines and frontend 3D visualization.
license: Complete terms in LICENSE.txt
---

# 3D Physics Visualization Skill

Expert guidance for building high-performance 3D physics simulations using Three.js, React Three Fiber, Drei, and react-three/rapier. This skill provides comprehensive workflows for both client-side physics and backend-driven physics visualization architectures.

## When to Use This Skill

Activate this skill when the user asks about:

- Creating 3D scenes, environments, or visualizations with Three.js or React Three Fiber
- Adding physics simulations (gravity, collisions, rigid bodies, joints)
- Building backend-driven physics visualization (backend computes, frontend renders)
- Working with WebGL, 3D graphics, or rendering pipelines
- Optimizing 3D performance (frame rates, memory management, LOD)
- Implementing camera controls, lighting, shadows, or materials
- Using Drei helpers (OrbitControls, Environment, Html, etc.)
- Debugging Three.js applications or physics behavior
- Setting up real-time synchronization via WebSocket for physics state
- Creating interactive 3D objects, animations, or user interactions

## Architecture Patterns

### Pattern 1: Backend-Driven Physics (Recommended for Complex Simulations)

**Use when:**
- Physics calculations are computationally intensive
- Need server-side validation or multiplayer synchronization
- Want to reduce client-side CPU/GPU load
- Building production-grade physics simulation platforms

**Architecture:**
```
Backend (C#, Node.js, Python)         Frontend (React Three Fiber)
├── Physics Engine                    ├── Three.js Scene
│   ├── Rapier/PhysX/Bullet          │   ├── Camera & Lights
│   ├── Collision Detection          │   └── Visual Objects
│   └── State Updates                 ├── WebSocket Client
└── WebSocket Server ────────────────>└── State Interpolation
```

**Key Components:**
- Backend: Runs physics simulation, sends state updates via WebSocket
- Frontend: Receives state, renders visuals, interpolates between updates
- No `@react-three/rapier` on frontend (rendering only)

See [backend-driven-workflow.md](./references/backend-driven-workflow.md) for detailed implementation.

### Pattern 2: Client-Side Physics (Simple Interactions)

**Use when:**
- Simple physics interactions (drag, drop, bounce)
- Offline/standalone applications
- Prototyping or demos
- Limited number of physics objects (<50)

**Architecture:**
```
Frontend (React Three Fiber + Rapier)
├── Three.js Scene
├── Physics World (@react-three/rapier)
├── Rigid Bodies & Colliders
└── User Interactions
```

**Key Components:**
- All physics computed in browser using WebAssembly
- Direct integration with React Three Fiber

## Prerequisites

### Required Dependencies

```json
{
  "dependencies": {
    "three": "^0.160.0",
    "@react-three/fiber": "^8.15.0",
    "@react-three/drei": "^9.92.0",
    "@react-three/rapier": "^1.2.0"
  }
}
```

### Installation

```bash
npm install three @react-three/fiber @react-three/drei @react-three/rapier
```

### Environment Setup

Ensure Next.js or React app is configured for:
- ES modules support
- WebGL context (automatic in modern browsers)
- WebSocket support (for backend-driven approach)

## Core Workflows

### Workflow 1: Create Basic 3D Scene

**Steps:**

1. **Set up Canvas** (React Three Fiber root component)
   ```tsx
   import { Canvas } from '@react-three/fiber';
   
   export function Scene() {
     return (
       <Canvas>
         {/* 3D content here */}
       </Canvas>
     );
   }
   ```

2. **Add Lighting**
   ```tsx
   <Canvas>
     <ambientLight intensity={0.5} />
     <directionalLight position={[10, 10, 5]} intensity={1} />
   </Canvas>
   ```

3. **Create 3D Objects**
   ```tsx
   function Box() {
     return (
       <mesh>
         <boxGeometry args={[1, 1, 1]} />
         <meshStandardMaterial color="orange" />
       </mesh>
     );
   }
   ```

4. **Add Camera Controls**
   ```tsx
   import { OrbitControls } from '@react-three/drei';
   
   <Canvas>
     <OrbitControls />
     {/* objects */}
   </Canvas>
   ```

### Workflow 2: Add Client-Side Physics

**Steps:**

1. **Wrap scene with Physics provider**
   ```tsx
   import { Physics } from '@react-three/rapier';
   
   <Canvas>
     <Physics gravity={[0, -9.81, 0]}>
       {/* physics objects */}
     </Physics>
   </Canvas>
   ```

2. **Create Rigid Bodies**
   ```tsx
   import { RigidBody } from '@react-three/rapier';
   
   <RigidBody position={[0, 5, 0]} colliders="cuboid">
     <mesh>
       <boxGeometry args={[1, 1, 1]} />
       <meshStandardMaterial color="blue" />
     </mesh>
   </RigidBody>
   ```

3. **Add Ground Plane**
   ```tsx
   <RigidBody type="fixed" position={[0, 0, 0]}>
     <mesh rotation={[-Math.PI / 2, 0, 0]}>
       <planeGeometry args={[100, 100]} />
       <meshStandardMaterial color="green" />
     </mesh>
   </RigidBody>
   ```

4. **Enable Debug Visualization**
   ```tsx
   <Physics debug>
     {/* See collision shapes */}
   </Physics>
   ```

### Workflow 3: Backend-Driven Physics Visualization

**Steps:**

1. **Create Backend Communication Service**
   ```tsx
   // services/SimulationService.ts
   export class SimulationService {
     private ws: WebSocket;
     
     connect() {
       this.ws = new WebSocket('ws://localhost:5195/physics');
       this.ws.onmessage = this.handleStateUpdate;
     }
     
     private handleStateUpdate = (event: MessageEvent) => {
       const state = JSON.parse(event.data);
       this.onUpdate?.(state);
     };
   }
   ```

2. **Create State Synchronization Hook**
   ```tsx
   function usePhysicsSync(simulationId: string) {
     const [objects, setObjects] = useState([]);
     
     useEffect(() => {
       const service = new SimulationService();
       service.connect();
       service.onUpdate((state) => setObjects(state.objects));
       return () => service.disconnect();
     }, [simulationId]);
     
     return { objects };
   }
   ```

3. **Render Visual Objects (No Physics)**
   ```tsx
   function VisualObject({ position, rotation }) {
     return (
       <mesh position={position} rotation={rotation}>
         <boxGeometry args={[1, 1, 1]} />
         <meshStandardMaterial color="red" />
       </mesh>
     );
   }
   ```

4. **Add Smooth Interpolation**
   ```tsx
   function InterpolatedObject({ targetPosition, targetRotation }) {
     const meshRef = useRef();
     
     useFrame(() => {
       meshRef.current.position.lerp(targetPosition, 0.1);
       meshRef.current.quaternion.slerp(targetQuaternion, 0.1);
     });
     
     return <mesh ref={meshRef}>{/* geometry */}</mesh>;
   }
   ```

See [complete examples in templates](./templates/README.md).

### Workflow 4: Optimize Performance

**Steps:**

1. **Enable Shadows Selectively**
   ```tsx
   <Canvas shadows>
     <mesh castShadow>
       {/* Only important objects */}
     </mesh>
   </Canvas>
   ```

2. **Use Level of Detail (LOD)**
   ```tsx
   import { Detailed } from '@react-three/drei';
   
   <Detailed distances={[0, 20, 50]}>
     <HighPolyModel />
     <MediumPolyModel />
     <LowPolyModel />
   </Detailed>
   ```

3. **Dispose Resources Properly**
   ```tsx
   useEffect(() => {
     return () => {
       geometry.dispose();
       material.dispose();
       texture.dispose();
     };
   }, []);
   ```

4. **Profile Performance**
   - Use React DevTools Profiler
   - Monitor FPS with `<Stats />` from drei
   - Check Three.js memory usage

## Common Drei Helpers

| Helper | Use Case |
|--------|----------|
| `<OrbitControls />` | Camera rotation around target |
| `<Environment preset="sunset" />` | Quick HDRI lighting |
| `<Html />` | Embed HTML in 3D space |
| `<Text3D />` | 3D text rendering |
| `<Float />` | Floating animation effect |
| `<ContactShadows />` | Cheap ground shadows |
| `<Stats />` | FPS/memory monitoring |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Objects not visible | Check camera position, add lighting, verify mesh inside Canvas |
| Physics not working | Ensure `<Physics>` wraps objects, check RigidBody configuration |
| Poor performance | Reduce shadow-casting objects, implement LOD, dispose resources |
| WebSocket disconnects | Add reconnection logic, validate backend is running |
| Jerky animations | Implement interpolation with `useFrame`, check update frequency |
| Memory leaks | Dispose geometries/materials in cleanup, check for event listeners |
| Black screen | Check WebGL support, verify shaders compile, inspect console errors |

## Type Definitions

Essential TypeScript interfaces for physics state:

```typescript
interface PhysicsObject {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  velocity: [number, number, number];
  type: 'dynamic' | 'fixed' | 'kinematic';
}

interface SimulationState {
  timestamp: number;
  objects: PhysicsObject[];
  isPaused: boolean;
}
```

## References

### Comprehensive Guides
- [React Three Fiber Hooks Guide](./references/react-three-fiber-hooks.md) - Deep dive into useFrame, useThree, useLoader, and custom hooks
- [Drei Components Comprehensive Guide](./references/drei-components-guide.md) - 30+ components with usage examples and best practices
- [Rapier Physics Basics](./references/rapier-physics-basics.md) - Physics concepts, body types, colliders, joints, and client-side implementation
- [Backend-Driven Workflow Guide](./references/backend-driven-workflow.md) - Complete architecture, WebSocket protocol, synchronization strategies
- [Performance Optimization Guide](./references/performance-optimization.md) - Geometry, materials, rendering, and memory optimization
- [Three.js Common Patterns](./references/threejs-patterns.md) - Lighting, materials, animations, and interactions

### Official Documentation
- [Three.js Documentation](https://threejs.org/docs/)
- [React Three Fiber Docs](https://r3f.docs.pmnd.rs/)
- [Drei Documentation](https://drei.docs.pmnd.rs/)
- [Rapier Physics Engine](https://pmndrs.github.io/react-three-rapier/)

## Quick Start Templates

- [Basic 3D Scene](./templates/basic-scene/) - Minimal Three.js + R3F setup
- [Client-Side Physics Demo](./templates/client-physics/) - Simple physics playground
- [Backend-Driven Viewer](./templates/backend-viewer/) - WebSocket-based physics visualization
- [Performance Optimized](./templates/optimized/) - LOD, shadows, memory management

## Best Practices

1. **Always dispose Three.js resources** - Prevent memory leaks
2. **Use `useFrame` for animations** - Avoid state updates per frame
3. **Batch backend updates** - Send multiple object states in one message
4. **Interpolate between states** - Smooth 60 FPS even with 20 FPS backend updates
5. **Enable debug mode during development** - `<Physics debug>` visualizes colliders
6. **Profile early and often** - Use `<Stats />` to catch performance issues
7. **Prefer declarative patterns** - Use React Three Fiber patterns, not imperative Three.js code

## Security Considerations

- **Backend Validation**: Validate all physics parameters on backend
- **WebSocket Security**: Use WSS (secure WebSocket) in production
- **Rate Limiting**: Prevent command spam from frontend
- **State Validation**: Validate all incoming state from backend before rendering

## License

This skill is provided under the Apache License 2.0. See LICENSE.txt for complete terms.
