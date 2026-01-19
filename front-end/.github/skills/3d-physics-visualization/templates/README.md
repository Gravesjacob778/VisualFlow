# Templates

This directory contains starter code templates that AI agents can use as scaffolds when building 3D physics visualizations.

## Available Templates

### 1. Basic 3D Scene
- **Path**: `basic-scene/`
- **Description**: Minimal Three.js + React Three Fiber setup
- **Use when**: Starting a new 3D project from scratch
- **Includes**: Canvas, lighting, camera controls, sample objects

### 2. Client-Side Physics Demo
- **Path**: `client-physics/`
- **Description**: Simple physics playground with @react-three/rapier
- **Use when**: Building offline physics simulations or prototypes
- **Includes**: Physics world, rigid bodies, colliders, ground plane

### 3. Backend-Driven Viewer
- **Path**: `backend-viewer/`
- **Description**: WebSocket-based physics visualization (backend calculates, frontend renders)
- **Use when**: Building production physics visualization connected to backend
- **Includes**: WebSocket service, state synchronization, interpolation

### 4. Performance Optimized Scene
- **Path**: `optimized/`
- **Description**: Performance-first scene with LOD, instancing, and resource management
- **Use when**: Handling many objects or targeting mobile devices
- **Includes**: Instanced rendering, LOD, proper disposal patterns

## Usage

AI agents should:
1. **Copy** the template directory to the user's project
2. **Modify** the template code based on specific requirements
3. **Extend** with additional features as needed

These templates are meant to be **customized**, not used as-is.
