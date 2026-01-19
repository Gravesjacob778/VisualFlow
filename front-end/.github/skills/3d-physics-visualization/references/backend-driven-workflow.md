# Backend-Driven Physics Workflow

Complete guide for implementing backend-driven physics visualization where physics calculations happen on the server and the frontend only renders the visual state.

## Architecture Overview

```
┌─────────────────────────────────────┐
│         Backend Server              │
│  ┌──────────────────────────────┐   │
│  │   Physics Engine             │   │
│  │   - Rapier/PhysX/Bullet      │   │
│  │   - Collision Detection      │   │
│  │   - State Management         │   │
│  └───────────┬──────────────────┘   │
│              │                       │
│  ┌───────────▼──────────────────┐   │
│  │   WebSocket Server           │   │
│  │   - State Broadcasting       │   │
│  │   - Command Handling         │   │
│  └───────────┬──────────────────┘   │
└──────────────┼───────────────────────┘
               │ WebSocket
               │
┌──────────────▼───────────────────────┐
│         Frontend Client              │
│  ┌──────────────────────────────┐   │
│  │   WebSocket Client           │   │
│  │   - Receive State Updates    │   │
│  │   - Send Commands            │   │
│  └───────────┬──────────────────┘   │
│              │                       │
│  ┌───────────▼──────────────────┐   │
│  │   State Manager              │   │
│  │   - Interpolation            │   │
│  │   - Prediction               │   │
│  └───────────┬──────────────────┘   │
│              │                       │
│  ┌───────────▼──────────────────┐   │
│  │   Three.js Scene             │   │
│  │   - Visual Rendering Only    │   │
│  │   - No Physics Calculation   │   │
│  └──────────────────────────────┘   │
└──────────────────────────────────────┘
```

## Benefits

1. **Server Authority** - All physics calculations validated on server
2. **Reduced Client Load** - No physics calculations on browser
3. **Multiplayer Ready** - Easy to sync multiple clients
4. **Complex Physics** - Can use more powerful server-side physics engines
5. **Cheat Prevention** - Physics logic hidden from client

## Implementation Steps

### Step 1: Backend Physics Service (C#/.NET Example)

```csharp
public class PhysicsSimulationService
{
    private readonly PhysicsWorld _world;
    private readonly Timer _updateTimer;
    
    public PhysicsSimulationService()
    {
        _world = new PhysicsWorld(gravity: new Vector3(0, -9.81f, 0));
        _updateTimer = new Timer(FixedUpdate, null, 0, 16); // ~60 FPS
    }
    
    private void FixedUpdate(object state)
    {
        _world.Step(0.016f); // 60 FPS timestep
        
        var stateUpdate = new SimulationState
        {
            Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
            Objects = _world.GetAllObjects().Select(obj => new PhysicsObject
            {
                Id = obj.Id,
                Position = obj.Position,
                Rotation = obj.Rotation,
                Velocity = obj.Velocity
            }).ToList()
        };
        
        BroadcastStateUpdate(stateUpdate);
    }
}
```

### Step 2: WebSocket Communication

**Backend (C# with SignalR):**

```csharp
public class PhysicsHub : Hub
{
    public async Task SendCommand(string command, object payload)
    {
        // Process command (e.g., apply force, spawn object)
        await ProcessCommand(command, payload);
    }
    
    public async Task BroadcastState(SimulationState state)
    {
        await Clients.All.SendAsync("StateUpdate", state);
    }
}
```

**Frontend (TypeScript):**

```typescript
export class SimulationService {
  private ws: WebSocket | null = null;
  private stateCallback: ((state: SimulationState) => void) | null = null;

  connect(url: string) {
    this.ws = new WebSocket(url);
    
    this.ws.onopen = () => {
      console.log('Connected to physics server');
    };
    
    this.ws.onmessage = (event) => {
      const state: SimulationState = JSON.parse(event.data);
      this.stateCallback?.(state);
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    this.ws.onclose = () => {
      console.log('Disconnected from physics server');
      // Implement reconnection logic
      setTimeout(() => this.connect(url), 1000);
    };
  }
  
  sendCommand(command: string, payload: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ command, payload }));
    }
  }
  
  onStateUpdate(callback: (state: SimulationState) => void) {
    this.stateCallback = callback;
  }
  
  disconnect() {
    this.ws?.close();
  }
}
```

### Step 3: State Synchronization Hook

```typescript
import { useEffect, useState, useRef } from 'react';
import { SimulationService } from '@/services/SimulationService';

interface PhysicsObject {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  velocity: [number, number, number];
}

interface SimulationState {
  timestamp: number;
  objects: PhysicsObject[];
  isPaused: boolean;
}

export function usePhysicsSync(simulationId: string) {
  const [objects, setObjects] = useState<PhysicsObject[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const serviceRef = useRef<SimulationService | null>(null);

  useEffect(() => {
    if (!simulationId) return;

    const service = new SimulationService();
    serviceRef.current = service;

    const wsUrl = process.env.NEXT_PUBLIC_PHYSICS_WS_URL || 'ws://localhost:5195/physics';
    service.connect(wsUrl);

    service.onStateUpdate((state) => {
      setObjects(state.objects);
      setIsConnected(true);
    });

    return () => {
      service.disconnect();
      setIsConnected(false);
    };
  }, [simulationId]);

  const sendCommand = (command: string, payload: any) => {
    serviceRef.current?.sendCommand(command, payload);
  };

  return { objects, isConnected, sendCommand };
}
```

### Step 4: Interpolated Rendering

```typescript
import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface InterpolatedObjectProps {
  targetPosition: [number, number, number];
  targetRotation: [number, number, number];
  color?: string;
}

export function InterpolatedObject({
  targetPosition,
  targetRotation,
  color = '#ff6b6b',
}: InterpolatedObjectProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetPosVector = useRef(new THREE.Vector3(...targetPosition));
  const targetQuaternion = useRef(new THREE.Quaternion());

  // Update target values when props change
  useEffect(() => {
    targetPosVector.current.set(...targetPosition);
    targetQuaternion.current.setFromEuler(new THREE.Euler(...targetRotation));
  }, [targetPosition, targetRotation]);

  // Interpolate smoothly every frame
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Smooth position interpolation
    meshRef.current.position.lerp(targetPosVector.current, 0.1);

    // Smooth rotation interpolation
    meshRef.current.quaternion.slerp(targetQuaternion.current, 0.1);
  });

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
```

### Step 5: Complete Scene Component

```typescript
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { usePhysicsSync } from '@/hooks/usePhysicsSync';
import { InterpolatedObject } from './InterpolatedObject';

interface SimulationViewerProps {
  simulationId: string;
}

export function SimulationViewer({ simulationId }: SimulationViewerProps) {
  const { objects, isConnected, sendCommand } = usePhysicsSync(simulationId);

  return (
    <Canvas shadows camera={{ position: [10, 10, 10], fov: 50 }}>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} castShadow intensity={1} />

      {/* Connection Status */}
      {!isConnected && (
        <Html center>
          <div style={{ color: 'white', background: 'rgba(0,0,0,0.7)', padding: '10px' }}>
            Connecting to physics server...
          </div>
        </Html>
      )}

      {/* Render all physics objects */}
      {objects.map((obj) => (
        <InterpolatedObject
          key={obj.id}
          targetPosition={obj.position}
          targetRotation={obj.rotation}
        />
      ))}

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#2f2f2f" />
      </mesh>

      {/* Camera controls */}
      <OrbitControls />
    </Canvas>
  );
}
```

## Data Synchronization Protocol

### State Update Message Format

```json
{
  "timestamp": 1234567890,
  "objects": [
    {
      "id": "obj-001",
      "position": [0.0, 5.2, 0.0],
      "rotation": [0.0, 0.1, 0.0],
      "velocity": [0.0, -2.4, 0.0],
      "angularVelocity": [0.0, 0.0, 0.0]
    }
  ],
  "isPaused": false
}
```

### Command Message Format

```json
{
  "command": "applyForce",
  "objectId": "obj-001",
  "payload": {
    "force": [10.0, 0.0, 0.0],
    "point": [0.0, 0.0, 0.0]
  }
}
```

## Optimization Strategies

### 1. Batch Updates

Send all object updates in a single message to reduce WebSocket overhead:

```csharp
// Backend: Batch all objects
var stateUpdate = new SimulationState
{
    Timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
    Objects = _world.GetAllObjects().ToList()
};
await Clients.All.SendAsync("StateUpdate", stateUpdate);
```

### 2. Delta Compression

Only send changed objects:

```typescript
function computeDelta(previous: SimulationState, current: SimulationState) {
  return current.objects.filter((obj) => {
    const prev = previous.objects.find((p) => p.id === obj.id);
    return !prev || hasChanged(prev, obj);
  });
}
```

### 3. Interpolation Buffer

Store multiple states for smoother interpolation:

```typescript
const stateBuffer = useRef<SimulationState[]>([]);

service.onStateUpdate((state) => {
  stateBuffer.current.push(state);
  if (stateBuffer.current.length > 5) {
    stateBuffer.current.shift(); // Keep only last 5 states
  }
});
```

### 4. Predictive Rendering

Extrapolate position based on velocity:

```typescript
function predictPosition(
  position: Vector3,
  velocity: Vector3,
  deltaTime: number
): Vector3 {
  return [
    position[0] + velocity[0] * deltaTime,
    position[1] + velocity[1] * deltaTime,
    position[2] + velocity[2] * deltaTime,
  ];
}
```

## Common Issues and Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Jerky motion | Low update rate from backend | Implement interpolation with `lerp`/`slerp` |
| Delayed response | Network latency | Add client-side prediction for user actions |
| Desync | Clock drift | Use server timestamp, not client time |
| High bandwidth | Sending full state | Implement delta compression |
| Connection drops | Network instability | Add reconnection logic with exponential backoff |

## Testing Recommendations

1. **Test with simulated latency** - Add artificial delay to WebSocket
2. **Test disconnection handling** - Kill server mid-simulation
3. **Monitor bandwidth usage** - Ensure state updates are efficient
4. **Profile rendering** - Ensure 60 FPS even with 20 FPS backend
5. **Test with many objects** - Validate scalability

## Performance Benchmarks

Target metrics for production:
- **Frontend FPS**: 60 (constant)
- **Backend Update Rate**: 20-60 Hz
- **WebSocket Latency**: <50ms
- **State Update Size**: <10KB per message
- **Memory Usage**: <100MB for 1000 objects

## Security Considerations

- **Validate all backend commands** - Never trust client input
- **Rate limit commands** - Prevent spam/DoS
- **Use WSS in production** - Encrypted WebSocket connection
- **Authenticate WebSocket connections** - Require valid session tokens
- **Sanitize state data** - Validate all incoming state before rendering

## Next Steps

- Implement user interactions (click to apply force)
- Add object creation/deletion commands
- Optimize for mobile devices
- Add recording/playback functionality
