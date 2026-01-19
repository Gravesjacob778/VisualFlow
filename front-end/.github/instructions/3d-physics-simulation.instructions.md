---
description: 'Guidelines for 3D physics simulation using Three.js, React Three Fiber, Drei, and react-three/rapier'
applyTo: '**/*.tsx, **/*.ts'
---

# 3D Physics Simulation Development

Guidelines for creating high-performance 3D physics simulation visualization using Three.js, React Three Fiber, and Drei. The physics calculations are performed on the backend; the frontend is responsible only for real-time rendering and visualization of simulation data. This instruction ensures consistent, optimized, and maintainable 3D graphics and data synchronization code.

## Core Dependencies

- **Three.js**: 3D graphics library (core rendering engine)
- **React Three Fiber**: React renderer for Three.js
- **Drei**: Useful helpers and abstractions for R3F
- **WebSocket/HTTP Client**: Real-time communication with backend physics engine

## General Principles

- **Frontend Rendering Only**: All physics calculations happen on the backend; frontend only updates visual state
- **Real-time Synchronization**: Maintain synchronized state with backend using WebSocket or polling
- **Performance First**: Optimize for 60 FPS rendering; use object pooling and LOD (Level of Detail) when needed
- **Separation of Concerns**: Keep physics state management separate from rendering logic
- **Reusability**: Extract common 3D components (meshes, visual objects) into separate components
- **Type Safety**: Always define proper types for 3D objects, simulation state, and backend data
- **Cleanup**: Properly dispose of geometries, materials, textures, and event listeners to prevent memory leaks

## Project Organization

### Directory Structure
```
src/
├── features/3d-simulation/
│   ├── components/
│   │   ├── Scene.tsx              # Main 3D scene component
│   │   ├── SimulationViewer.tsx   # Manages physics state updates and rendering
│   │   ├── PhysicsObject.tsx      # Individual visual objects (kinematic/fixed)
│   │   └── [CustomObjects]/
│   ├── hooks/
│   │   ├── useSimulationSync.ts   # Synchronizes with backend physics state
│   │   ├── usePhysicsStateUpdate.ts # Updates visual state from backend data
│   │   └── useRenderLoop.ts       # Custom render loop logic
│   ├── services/
│   │   ├── SimulationService.ts   # Backend API/WebSocket communication
│   │   └── PhysicsStateManager.ts # Manages frontend physics state from backend
│   ├── types/
│   │   ├── physics.ts             # Physics state type definitions
│   │   ├── geometry.ts            # Geometry-related types
│   │   └── simulation.ts          # Simulation data types (from backend)
│   ├── utils/
│   │   ├── transforms.ts          # Transform and interpolation utilities
│   │   └── materials.ts           # Material creation and reuse
│   └── constants/
│       └── simulation.ts           # Simulation constants and defaults
```

## Naming Conventions

- **Components**: PascalCase (e.g., `PhysicsObject`, `DynamicRigidBody`, `SceneEnvironment`)
- **Hooks**: camelCase with `use` prefix (e.g., `usePhysicsWorld`, `usePhysicsBody`)
- **Types**: PascalCase (e.g., `PhysicsObjectProps`, `RigidBodyConfig`)
- **Physics Objects**: Descriptive names (e.g., `bounceBox`, `rigidCapsule`, `jointHinge`)

## Core Patterns

### 1. Simulation Synchronization

Establish real-time synchronization with the backend physics engine:

```typescript
import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { SimulationService } from '@/features/3d-simulation/services/SimulationService';

export function Scene() {
  const [simulationState, setSimulationState] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const service = new SimulationService();
    
    // Connect to backend physics engine
    service.connect();
    
    // Subscribe to physics state updates
    service.onStateUpdate((state) => {
      setSimulationState(state);
    });

    service.onConnectionChange((connected) => {
      setIsConnected(connected);
    });

    return () => service.disconnect();
  }, []);

  return (
    <Canvas>
      {isConnected && simulationState ? (
        <SimulationViewer state={simulationState} />
      ) : (
        <div>Connecting to physics engine...</div>
      )}
    </Canvas>
  );
}
```

### 2. Visual Object Creation from Backend State

Create reusable visual components that render backend physics data (no client-side physics):

```typescript
import { useRef } from 'react';
import * as THREE from 'three';

interface PhysicsObjectProps {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  color?: string;
  geometry: 'box' | 'sphere' | 'cylinder';
}

export function VisualPhysicsObject({
  id,
  position,
  rotation,
  color = '#ff6b6b',
  geometry = 'box',
}: PhysicsObjectProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Update mesh position and rotation from backend state
  // No physics simulation on frontend
  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      castShadow
      receiveShadow
    >
      {geometry === 'box' && <boxGeometry args={[1, 1, 1]} />}
      {geometry === 'sphere' && <sphereGeometry args={[0.5, 32, 32]} />}
      {geometry === 'cylinder' && <cylinderGeometry args={[0.5, 0.5, 1, 32]} />}
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
```

### 3. Backend State Synchronization Hook

Use hooks to synchronize with backend physics state:

```typescript
import { useEffect, useState, useRef } from 'react';
import { SimulationService } from '@/features/3d-simulation/services/SimulationService';

interface PhysicsObject {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  velocity: [number, number, number];
}

export function useSimulationSync(simulationId: string) {
  const [objects, setObjects] = useState<PhysicsObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const serviceRef = useRef<SimulationService | null>(null);

  useEffect(() => {
    if (!simulationId) return;

    const service = new SimulationService();
    serviceRef.current = service;

    // Connect to backend
    service.connect();

    // Handle state updates from backend
    service.onStateUpdate((state) => {
      setObjects(state.objects);
      setIsLoading(false);
    });

    return () => service.disconnect();
  }, [simulationId]);

  // Send commands to backend (e.g., apply force)
  const sendCommand = (command: string, payload: any) => {
    if (serviceRef.current) {
      serviceRef.current.sendCommand(command, payload);
    }
  };

  return { objects, isLoading, sendCommand };
}
```

### 4. Real-time State Update Management

Manage and interpolate physics state from backend:

```typescript
import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ObjectState {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
}

export function usePhysicsStateUpdate(objectState: ObjectState) {
  const meshRef = useRef<THREE.Mesh>(null);
  const previousState = useRef(objectState);

  useFrame(() => {
    if (!meshRef.current) return;

    // Smoothly interpolate to new position from backend
    meshRef.current.position.lerp(
      new THREE.Vector3(...objectState.position),
      0.1 // Interpolation factor
    );

    // Update rotation
    const targetQuaternion = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(...objectState.rotation)
    );
    meshRef.current.quaternion.slerp(targetQuaternion, 0.1);

    previousState.current = objectState;
  });

  return meshRef;
}
```

### 5. Backend Communication Service

Create a service to communicate with the backend physics engine:

```typescript
// services/SimulationService.ts
export class SimulationService {
  private ws: WebSocket | null = null;
  private stateUpdateCallback: ((state: any) => void) | null = null;
  private connectionChangeCallback: ((connected: boolean) => void) | null = null;

  connect() {
    const wsUrl = process.env.NEXT_PUBLIC_PHYSICS_WS_URL || 'ws://localhost:5195/physics';
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.connectionChangeCallback?.(true);
    };

    this.ws.onmessage = (event) => {
      const state = JSON.parse(event.data);
      this.stateUpdateCallback?.(state);
    };

    this.ws.onclose = () => {
      this.connectionChangeCallback?.(false);
    };
  }

  sendCommand(command: string, payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ command, payload }));
    }
  }

  onStateUpdate(callback: (state: any) => void) {
    this.stateUpdateCallback = callback;
  }

  onConnectionChange(callback: (connected: boolean) => void) {
    this.connectionChangeCallback = callback;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}
```

## Optimization Guidelines

### Memory Management

- **Dispose Resources**: Always dispose of geometries, materials, and textures
  ```typescript
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
      texture.dispose();
    };
  }, [geometry, material, texture]);
  ```

- **Reuse Materials**: Create material instances at module level, not per-render
  ```typescript
  const standardMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff' });
  
  export function ReusableObject() {
    return (
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <primitive object={standardMaterial} />
      </mesh>
    );
  }
  ```

- **Object Pooling**: For large numbers of similar objects, pre-allocate and reuse instances

### Performance Optimization

- **Level of Detail (LOD)**: Use Drei's `Detailed` component for complex geometries
  ```typescript
  import { Detailed, useGLTF } from '@react-three/drei';

  export function OptimizedModel() {
    const high = useGLTF('/model-high.glb');
    const low = useGLTF('/model-low.glb');

    return (
      <Detailed distances={[0, 25, 100]}>
        <primitive object={high.scene} />
        <primitive object={low.scene} />
        <Box />
      </Detailed>
    );
  }
  ```

- **Shadows**: Enable shadows selectively; avoid shadow-mapping for every object
  ```typescript
  <Canvas shadows shadowMap={{ type: THREE.PCFShadowShadowMap }}>
    {/* Only objects that need shadows */}
  </Canvas>
  ```

- **Batch Updates**: Receive all object updates in a single message from backend to minimize WebSocket overhead
  ```typescript
  // Backend sends batched state updates
  {
    "timestamp": 1234567890,
    "objects": [
      { "id": "obj1", "position": [0, 1, 0], "rotation": [0, 0, 0] },
      { "id": "obj2", "position": [1, 2, 0], "rotation": [0, 0, 0] }
    ]
  }
  ```

- **Interpolation**: Smoothly interpolate between backend state updates to ensure smooth 60 FPS rendering
  ```typescript
  // Use Lerp or Slerp for position and rotation
  meshRef.current.position.lerp(targetPosition, deltaTime);
  meshRef.current.quaternion.slerp(targetQuaternion, deltaTime);
  ```

- **Avoid Frequent Re-renders**: Use `useFrame` hook instead of state updates when possible
  ```typescript
  import { useFrame } from '@react-three/fiber';

  export function AnimatedObject() {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame(() => {
      if (meshRef.current) {
        // Update per frame without triggering re-renders
        meshRef.current.rotation.x += 0.01;
      }
    });

    return <mesh ref={meshRef}>{/* ... */}</mesh>;
  }
  ```

## Error Handling & Debugging

### Validation

- Validate physics parameters (mass, friction, restitution) are within realistic ranges
  ```typescript
  const validateMass = (mass: number): boolean => mass > 0 && mass < 10000;
  const validateRestitution = (val: number): boolean => val >= 0 && val <= 1;
  ```

- Check for NaN values in position/rotation updates

### Debugging

- Use Drei's `OrbitControls` for interactive camera control during development
  ```typescript
  import { OrbitControls } from '@react-three/drei';

  <OrbitControls />
  ```

- Enable physics debug visualization using the debug prop
  ```typescript
  <Physics debug>
    {/* Physics objects */}
  </Physics>
  ```

## Type Definitions

Define types for physics state from backend:

```typescript
// types/physics.ts
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface PhysicsObject {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  velocity: [number, number, number];
  angularVelocity: [number, number, number];
  type: 'dynamic' | 'fixed' | 'kinematic';
}

export interface SimulationState {
  timestamp: number;
  objects: PhysicsObject[];
  time: number;
  isPaused: boolean;
}

export interface SimulationCommand {
  command: string;
  objectId?: string;
  payload?: any;
}
```

## Common Patterns

### Good Example: Complete Simulation Viewer Component

```typescript
interface SimulationViewerProps {
  simulationId: string;
}

export function SimulationViewer({ simulationId }: SimulationViewerProps) {
  const { objects, isLoading, sendCommand } = useSimulationSync(simulationId);

  return (
    <>
      {isLoading ? (
        <Html>
          <div>Loading simulation...</div>
        </Html>
      ) : (
        objects.map((obj) => (
          <VisualPhysicsObject
            key={obj.id}
            id={obj.id}
            position={obj.position}
            rotation={obj.rotation}
            geometry={obj.type as 'box' | 'sphere' | 'cylinder'}
          />
        ))
      )}
      <OrbitControls />
    </>
  );
}

// Usage in parent component
export function SimulationApp() {
  return (
    <Canvas shadows>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 10]} castShadow />
      <SimulationViewer simulationId="sim-123" />
    </Canvas>
  );
}
```

### Bad Example: Avoid This Pattern

```typescript
// ❌ Computing physics on frontend (defeats purpose)
export function BadSimulation() {
  const [rigidBody, setRigidBody] = useState(null);
  
  // Wrong: Physics calculation on frontend
  useFrame(() => {
    rigidBody?.applyForce(...);
  });
  
  return <RigidBody ref={rigidBody} />;  // Don't use rapier on frontend
}

// ❌ Creating materials inside render loop (memory leak)
export function BadObject({ position }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[1, 1, 1]} />
      {/* New material instance on every render */}
      <meshStandardMaterial color={new THREE.Color('#ff6b6b')} />
    </mesh>
  );
}

// ❌ Not disposing resources (memory leak)
export function LeakyComponent() {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  // Missing disposal in useEffect cleanup
  return <mesh geometry={geometry} />;
}

// ❌ Ignoring connection state
export function BadConnectionHandling() {
  const [objects, setObjects] = useState([]);
  // Not checking if connection is established before rendering
  return objects.map(obj => <VisualPhysicsObject key={obj.id} {...obj} />);
}
```

## Security Considerations

- **Backend Validation**: All physics parameters validation happens on backend
- **Command Validation**: Validate command responses from backend before applying state changes
  ```typescript
  interface ValidatedState {
    isValid: boolean;
    errors: string[];
  }

  const validateStateUpdate = (state: any): ValidatedState => {
    const errors: string[] = [];
    
    if (!Array.isArray(state.objects)) {
      errors.push('Objects must be an array');
    }
    
    state.objects?.forEach((obj: any) => {
      if (!obj.id || !Array.isArray(obj.position) || obj.position.length !== 3) {
        errors.push(`Invalid object state for ${obj.id}`);
      }
    });
    
    return { isValid: errors.length === 0, errors };
  };
  ```

- **WebSocket Security**: Use secure WebSocket (WSS) in production
  ```typescript
  const wsUrl = process.env.NODE_ENV === 'production'
    ? 'wss://api.example.com/physics'
    : 'ws://localhost:5195/physics';
  ```

- **Rate Limiting**: Implement client-side rate limiting for commands sent to backend
  ```typescript
  const sendCommandWithThrottle = useCallback(
    throttle((command: string, payload: any) => {
      service.sendCommand(command, payload);
    }, 100), // Limit to 10 commands per second
    [service]
  );
  ```

## Testing

- Test frontend rendering with mock backend state updates
- Validate synchronization between backend and frontend state
- Test WebSocket connection/disconnection scenarios
- Verify smooth interpolation between state updates
- Ensure no memory leaks with repeated component mounting/unmounting
- Profile rendering performance using browser DevTools (React DevTools Profiler)
- Test edge cases: rapid updates, out-of-order messages, connection loss

### Example Test Setup
```typescript
import { render, screen, waitFor } from '@testing-library/react';

test('SimulationViewer renders objects from backend state', async () => {
  const mockService = {
    connect: jest.fn(),
    onStateUpdate: jest.fn((callback) => {
      // Simulate backend state update
      setTimeout(() => callback(mockState), 100);
    }),
    disconnect: jest.fn(),
  };

  render(<SimulationViewer simulationId="test-sim" />);
  
  await waitFor(() => {
    expect(screen.queryByText('Loading simulation...')).not.toBeInTheDocument();
  });
});
```

## Resources & References

- [React Three Fiber Documentation](https://docs.pmnd.rs/react-three-fiber/)
- [Rapier Physics Documentation](https://www.rapier.rs/user_guides/javascript/introduction.html)
- [Drei Components](https://github.com/pmndrs/drei)
- [Three.js Documentation](https://threejs.org/docs/)
