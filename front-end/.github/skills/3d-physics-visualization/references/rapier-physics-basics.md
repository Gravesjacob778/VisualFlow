# Rapier Physics Engine Basics

Guide to Rapier physics engine for client-side physics implementation.
Reference: https://pmndrs.github.io/react-three-rapier/

## Important Note

For **backend-driven physics** (recommended architecture), physics calculations happen on the server and only visual state is rendered on the frontend. This guide covers **client-side physics** for reference and simple prototypes.

## Core Concepts

### Physics World

The physics simulation container where all physics objects exist.

```typescript
import { Physics } from '@react-three/rapier';

<Canvas>
  <Physics
    gravity={[0, -9.81, 0]}      // Gravity (m/s²)
    timeStep="vary"              // "vary" or fixed number
    substeps={4}                 // Physics sub-steps per frame
    colliders="cuboid"           // Default collider type
    defaultContactMaterial={{
      friction: 0.5,
      restitution: 0.7,          // Bounciness
      frictionCombineRule: 'Average',
    }}
  >
    {/* Physics objects */}
  </Physics>
</Canvas>
```

### Rigid Body

A physics object that responds to forces and collisions.

```typescript
import { RigidBody } from '@react-three/rapier';

<RigidBody
  position={[0, 5, 0]}
  rotation={[0, 0, 0]}
  linearVelocity={[0, 0, 0]}
  angularVelocity={[0, 0, 0]}
  
  // Physics type
  type="dynamic"                // "dynamic" | "fixed" | "kinematic"
  
  // Physics properties
  mass={1}
  restitution={0.8}
  friction={0.5}
  linearDamping={0}
  angularDamping={0}
  
  // Collisions
  colliders="cuboid"            // Auto-create collider
  canSleep={true}
  ccd={false}                   // Continuous collision detection
>
  <mesh castShadow receiveShadow>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color="red" />
  </mesh>
</RigidBody>
```

## Rigid Body Types

### Dynamic Bodies
Move and respond to forces, perfect for falling objects and interactive elements.

```typescript
<RigidBody type="dynamic" mass={1}>
  <mesh>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color="red" />
  </mesh>
</RigidBody>
```

### Fixed Bodies
Immovable, used for ground, walls, static geometry.

```typescript
<RigidBody type="fixed" position={[0, -1, 0]}>
  <mesh rotation={[-Math.PI / 2, 0, 0]}>
    <planeGeometry args={[100, 100]} />
    <meshStandardMaterial color="green" />
  </mesh>
</RigidBody>
```

### Kinematic Bodies
Move according to animation, don't respond to forces. Great for moving platforms.

```typescript
<RigidBody
  type="kinematicPositionBased"
  position={[0, 5, 0]}
  // Update position in animation loop
>
  <mesh>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color="blue" />
  </mesh>
</RigidBody>
```

## Colliders

Define collision shapes separate from visual geometry.

```typescript
import { RigidBody, CapsuleCollider, BallCollider, CuboidCollider } from '@react-three/rapier';

// Cuboid collider
<RigidBody position={[0, 5, 0]}>
  <CuboidCollider args={[0.5, 0.5, 0.5]} />
  <mesh>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color="red" />
  </mesh>
</RigidBody>

// Ball collider
<RigidBody position={[2, 5, 0]}>
  <BallCollider args={[0.5]} />
  <mesh>
    <sphereGeometry args={[0.5, 32, 32]} />
    <meshStandardMaterial color="blue" />
  </mesh>
</RigidBody>

// Capsule collider (cylinder with rounded ends)
<RigidBody position={[4, 5, 0]}>
  <CapsuleCollider args={[0.5, 0.5]} />
  <mesh>
    <capsuleGeometry args={[0.5, 1, 4, 8]} />
    <meshStandardMaterial color="green" />
  </mesh>
</RigidBody>
```

## Applying Forces

Interact with physics objects programmatically.

```typescript
import { RigidBody, useRapier } from '@react-three/rapier';
import { useRef } from 'react';

function InteractiveBox() {
  const rigidBodyRef = useRef();
  const { world } = useRapier();

  const handleApplyForce = () => {
    if (rigidBodyRef.current) {
      rigidBodyRef.current.applyForce(
        { x: 10, y: 0, z: 0 },     // Force vector
        true                         // Wake body after apply
      );
    }
  };

  const handleApplyImpulse = () => {
    if (rigidBodyRef.current) {
      rigidBodyRef.current.applyImpulse(
        { x: 10, y: 0, z: 0 },     // Impulse
        true                         // Wake body
      );
    }
  };

  const handleApplyTorque = () => {
    if (rigidBodyRef.current) {
      rigidBodyRef.current.applyTorque(
        { x: 0, y: 10, z: 0 },     // Torque
        true
      );
    }
  };

  return (
    <>
      <RigidBody ref={rigidBodyRef} position={[0, 5, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="red" />
        </mesh>
      </RigidBody>

      <button onClick={handleApplyForce}>Apply Force</button>
      <button onClick={handleApplyImpulse}>Apply Impulse</button>
      <button onClick={handleApplyTorque}>Apply Torque</button>
    </>
  );
}
```

## Joints & Constraints

Connect physics bodies together.

```typescript
import { RigidBody, Joint } from '@react-three/rapier';
import { useRef } from 'react';

function ConnectedBodies() {
  const ref1 = useRef();
  const ref2 = useRef();

  return (
    <>
      <RigidBody ref={ref1} position={[-2, 5, 0]} mass={1}>
        <mesh castShadow>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color="red" />
        </mesh>
      </RigidBody>

      <RigidBody ref={ref2} position={[2, 5, 0]} mass={1}>
        <mesh castShadow>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color="blue" />
        </mesh>
      </RigidBody>

      {/* Fixed joint - bodies stay same distance apart */}
      <Joint
        body1={ref1}
        body2={ref2}
        type="fixed"
        anchor1={[0.5, 0, 0]}
        anchor2={[-0.5, 0, 0]}
      />

      {/* Hinge joint - rotate around axis */}
      {/* <Joint body1={ref1} body2={ref2} type="hinge" /> */}

      {/* Distance joint - maintain distance */}
      {/* <Joint body1={ref1} body2={ref2} type="distance" /> */}
    </>
  );
}
```

## Collision Events

Detect and respond to collisions.

```typescript
import { RigidBody } from '@react-three/rapier';

function CollisionAwareBox() {
  return (
    <RigidBody
      onCollisionEnter={({ manifold, target }) => {
        console.log('Collision entered!');
        console.log('Impact strength:', manifold.impulse);
      }}
      onCollisionExit={() => {
        console.log('Collision ended');
      }}
      onIntersectionEnter={() => {
        console.log('Intersection started');
      }}
      onIntersectionExit={() => {
        console.log('Intersection ended');
      }}
    >
      <mesh castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="green" />
      </mesh>
    </RigidBody>
  );
}
```

## useRapier Hook

Access the physics world.

```typescript
import { useRapier } from '@react-three/rapier';

function PhysicsWorldAccess() {
  const { world, rapier } = useRapier();

  // Access world properties
  const gravity = world.gravity();
  
  // Change physics parameters at runtime
  const handleSetGravity = () => {
    world.setGravity({ x: 0, y: -20, z: 0 });
  };

  return (
    <button onClick={handleSetGravity}>Increase Gravity</button>
  );
}
```

## Complete Client-Side Physics Example

```typescript
import { Canvas } from '@react-three/fiber';
import { Physics, RigidBody, BallCollider, CuboidCollider } from '@react-three/rapier';
import { OrbitControls, Environment } from '@react-three/drei';

function PhysicsScene() {
  return (
    <Canvas shadows camera={{ position: [10, 10, 10] }}>
      <Environment preset="studio" />

      <Physics gravity={[0, -9.81, 0]} timeStep="vary" substeps={4}>
        {/* Ground */}
        <RigidBody type="fixed" position={[0, -1, 0]}>
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[100, 100]} />
            <meshStandardMaterial color="green" />
          </mesh>
        </RigidBody>

        {/* Falling boxes */}
        {Array.from({ length: 5 }).map((_, i) => (
          <RigidBody
            key={i}
            position={[i - 2, 10 + i * 2, 0]}
            colliders="cuboid"
            mass={1}
          >
            <mesh castShadow>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="red" />
            </mesh>
          </RigidBody>
        ))}

        {/* Interactive sphere */}
        <RigidBody position={[0, 5, 0]} colliders="ball" mass={2}>
          <mesh castShadow>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshStandardMaterial color="blue" />
          </mesh>
        </RigidBody>
      </Physics>

      <OrbitControls />
    </Canvas>
  );
}
```

## Physics Parameters Reference

| Property | Type | Description |
|----------|------|-------------|
| `mass` | number | Object mass (kg) |
| `restitution` | number | Bounciness (0-1) |
| `friction` | number | Friction coefficient |
| `linearDamping` | number | Linear velocity damping |
| `angularDamping` | number | Rotational velocity damping |
| `ccd` | boolean | Continuous collision detection |
| `canSleep` | boolean | Allow sleeping when stationary |

## For Backend-Driven Physics

Remember: In backend-driven architecture:

1. ❌ **Don't** use `@react-three/rapier` on frontend
2. ✅ **Do** receive physics state via WebSocket
3. ✅ **Do** interpolate visual positions
4. ✅ **Do** apply forces/commands to backend only

See `backend-driven-workflow.md` for complete implementation.

## References

- [Official Rapier Documentation](https://pmndrs.github.io/react-three-rapier/)
- [Rapier Physics Engine](https://rapier.rs/)
- [Client-Side vs Server-Side Physics](./backend-driven-workflow.md)
