---
applyTo: '**/*.tsx, **/*.ts'
description: "Guidelines for creating high-quality, production-ready 3D robot models with realistic materials, proper kinematics, and advanced rendering"
---

# 3D Robot Model Creation Guidelines

## Instructions

Your primary directive is to create **photorealistic, production-grade 3D robot models** that exhibit professional-level quality in geometry, materials, animation, and rendering. Every robot model must follow industrial standards for mechanical design and be optimized for real-time rendering while maintaining visual fidelity.

---

## 🎯 Core Principles

### 1. Quality Standards
- **Geometric Fidelity:** All models must have sufficient polygon density to capture mechanical details without sacrificing performance
- **Material Realism:** Use Physically Based Rendering (PBR) materials with proper metalness, roughness, and normal maps
- **Animation Accuracy:** Implement proper kinematic chains with realistic joint constraints
- **Performance:** Maintain 60 FPS with full rendering effects on target hardware

### 2. Design Philosophy
- **Industrial Authenticity:** Models should resemble real-world industrial robots
- **Mechanical Detail:** Include visible components like screws, bolts, cable conduits, and manufacturer plates
- **Functional Design:** Every joint and component should serve a clear mechanical purpose

---

## 📐 Geometric Modeling Standards

### Base Components
```typescript
// Component hierarchy structure
interface RobotComponent {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  constraints?: JointConstraints;
  detailLevel: 'high' | 'medium' | 'low';
}

// Required geometric features
const geometricRequirements = {
  edges: 'beveled',           // No sharp edges, 0.5-2mm chamfers
  surfaces: 'subdivided',     // Smooth curved surfaces
  details: {
    screws: true,             // Visible fasteners
    panels: true,             // Panel gaps (0.5-1mm)
    vents: true,              // Cooling vents where appropriate
    cables: true,             // Cable routing visible
    labels: true              // Manufacturer plates/decals
  }
};
```

### Detail Requirements by Component

#### 🔩 Base/Mounting Plate
- **Geometry:** 
  - Mounting holes with countersinks
  - Reinforcement ribs on underside
  - Cable entry ports with grommets
- **Polygon Budget:** 5,000-10,000 triangles

#### 🔗 Joint Housings
- **Geometry:**
  - Motor housing with cooling fins
  - Split-line details (manufacturing seams)
  - Bolt patterns (M6-M12 sized)
  - Bearing races visible
  - Cable management clips
- **Polygon Budget:** 3,000-6,000 triangles per joint

#### 🦾 Links (Arm Segments)
- **Geometry:**
  - Box-section or tube construction
  - Access panels with fasteners
  - Cable conduits running along length
  - Weight-reduction cutouts (lightening holes)
- **Polygon Budget:** 4,000-8,000 triangles per link

#### ✋ End Effector (Gripper)
- **Geometry:**
  - Pneumatic/servo actuator housing
  - Gripper fingers with gripper teeth/pads
  - Mounting flange
  - Sensor housings (if applicable)
- **Polygon Budget:** 6,000-12,000 triangles

---

## 🎨 Material & Texture Standards

### PBR Material Configuration

```typescript
import * as THREE from 'three';

// Industrial metal material (aluminum alloy)
const createIndustrialMetal = () => {
  return new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    metalness: 0.9,
    roughness: 0.3,
    envMapIntensity: 1.2,
    
    // Optional: Use texture maps for realism
    // map: baseColorTexture,
    // normalMap: normalTexture,
    // roughnessMap: roughnessTexture,
    // metalnessMap: metalnessTexture,
    // aoMap: ambientOcclusionTexture
  });
};

// Painted robot surface (powder-coated finish)
const createPaintedSurface = (color: number) => {
  return new THREE.MeshStandardMaterial({
    color: color,
    metalness: 0.1,
    roughness: 0.4,
    envMapIntensity: 0.5,
    
    // Subtle normal map for surface texture
    // normalMap: paintnormalTexture,
    // normalScale: new THREE.Vector2(0.3, 0.3)
  });
};

// Rubber/plastic components (grips, covers)
const createRubberMaterial = () => {
  return new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.0,
    roughness: 0.8,
    envMapIntensity: 0.2
  });
};

// Carbon fiber composite
const createCarbonFiber = () => {
  return new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    metalness: 0.3,
    roughness: 0.5,
    envMapIntensity: 0.8,
    
    // Carbon weave pattern in normal map
    // normalMap: carbonWeaveTexture,
    // normalScale: new THREE.Vector2(1.0, 1.0)
  });
};
```

### Material Best Practices

1. **Metallic Components** (joints, structural elements)
   - Metalness: 0.85-1.0
   - Roughness: 0.2-0.4 (machined metal)
   - Color: Aluminum (0xcccccc), Steel (0xaaaaaa), Brass (0xd4af37)

2. **Painted Surfaces** (body panels)
   - Metalness: 0.0-0.2
   - Roughness: 0.3-0.5 (matte to semi-gloss)
   - Use realistic industrial colors (RAL color codes)

3. **Plastic/Rubber** (grips, protective covers)
   - Metalness: 0.0
   - Roughness: 0.6-0.9
   - Darker colors for contrast

4. **Detail Elements**
   - Screws/Bolts: High metalness (0.95), low roughness (0.15)
   - Rubber seals: Zero metalness, high roughness (0.85)
   - Glass/Sensors: Zero metalness, very low roughness (0.05)

---

## 🤖 Kinematic Chain & Animation System

### Hierarchical Structure

```typescript
// Six-axis robot arm hierarchy
interface RobotArmHierarchy {
  base: THREE.Object3D;           // Fixed to ground
  joint1: THREE.Object3D;         // Rotation around Y-axis (base rotation)
  link1: THREE.Object3D;          // Visual geometry
  joint2: THREE.Object3D;         // Rotation around Z-axis (shoulder)
  link2: THREE.Object3D;          // Upper arm
  joint3: THREE.Object3D;         // Rotation around Z-axis (elbow)
  link3: THREE.Object3D;          // Forearm
  joint4: THREE.Object3D;         // Rotation around X-axis (wrist roll)
  joint5: THREE.Object3D;         // Rotation around Z-axis (wrist pitch)
  joint6: THREE.Object3D;         // Rotation around X-axis (wrist yaw)
  endEffector: THREE.Object3D;    // Tool/gripper
}

// Implementation with proper pivot points
const createRobotArm = (): RobotArmHierarchy => {
  const base = new THREE.Group();
  base.position.set(0, 0, 0);
  
  const joint1 = new THREE.Group();
  joint1.position.set(0, 0.15, 0);  // Height of base
  base.add(joint1);
  
  const link1 = createLink1Geometry();
  joint1.add(link1);
  
  const joint2 = new THREE.Group();
  joint2.position.set(0, 0.1, 0.05);  // Offset from joint1
  joint1.add(joint2);
  
  const link2 = createLink2Geometry();
  link2.position.set(0, 0.05, 0);     // Visual offset
  joint2.add(link2);
  
  const joint3 = new THREE.Group();
  joint3.position.set(0, 0.4, 0);     // Length of link2
  joint2.add(joint3);
  
  // Continue for remaining joints...
  
  return { base, joint1, link1, joint2, link2, joint3, /* ... */ };
};
```

### Joint Constraints

```typescript
interface JointConstraints {
  axis: 'x' | 'y' | 'z';
  minAngle: number;   // radians
  maxAngle: number;   // radians
  maxSpeed: number;   // radians per second
  maxAccel: number;   // radians per second²
}

// Example: Shoulder joint (joint2)
const shoulderConstraints: JointConstraints = {
  axis: 'z',
  minAngle: -Math.PI / 2,    // -90 degrees
  maxAngle: Math.PI / 2,     // +90 degrees
  maxSpeed: Math.PI,         // 180 deg/s
  maxAccel: Math.PI * 2      // 360 deg/s²
};

// Apply constraints during animation
const rotateJoint = (
  joint: THREE.Object3D,
  targetAngle: number,
  constraints: JointConstraints,
  deltaTime: number
) => {
  const currentRotation = joint.rotation[constraints.axis];
  const clampedTarget = THREE.MathUtils.clamp(
    targetAngle,
    constraints.minAngle,
    constraints.maxAngle
  );
  
  const maxDelta = constraints.maxSpeed * deltaTime;
  const delta = THREE.MathUtils.clamp(
    clampedTarget - currentRotation,
    -maxDelta,
    maxDelta
  );
  
  joint.rotation[constraints.axis] += delta;
};
```

### Inverse Kinematics (IK)

```typescript
// Simplified 2-joint IK solver for demonstration
const solveIK = (
  targetPos: THREE.Vector3,
  link1Length: number,
  link2Length: number
): { joint1Angle: number; joint2Angle: number } => {
  const distance = Math.sqrt(
    targetPos.x ** 2 + targetPos.y ** 2
  );
  
  // Law of cosines
  const cosAngle2 = (
    distance ** 2 - link1Length ** 2 - link2Length ** 2
  ) / (2 * link1Length * link2Length);
  
  const joint2Angle = Math.acos(
    THREE.MathUtils.clamp(cosAngle2, -1, 1)
  );
  
  const k1 = link1Length + link2Length * Math.cos(joint2Angle);
  const k2 = link2Length * Math.sin(joint2Angle);
  const joint1Angle = Math.atan2(targetPos.y, targetPos.x) - 
                      Math.atan2(k2, k1);
  
  return { joint1Angle, joint2Angle };
};
```

---

## 💡 Advanced Lighting & Rendering

### Scene Lighting Setup

```typescript
import * as THREE from 'three';

const setupIndustrialLighting = (scene: THREE.Scene) => {
  // 1. HDRI Environment Map (primary lighting)
  const rgbeLoader = new THREE.RGBELoader();
  rgbeLoader.load('/hdri/industrial_warehouse_4k.hdr', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    // scene.background = texture;  // Optional: show HDRI as background
  });
  
  // 2. Key Light (main directional light)
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
  keyLight.position.set(5, 10, 7);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 50;
  keyLight.shadow.camera.left = -10;
  keyLight.shadow.camera.right = 10;
  keyLight.shadow.camera.top = 10;
  keyLight.shadow.camera.bottom = -10;
  keyLight.shadow.bias = -0.0001;
  scene.add(keyLight);
  
  // 3. Fill Light (softer, opposite side)
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
  fillLight.position.set(-5, 5, -5);
  scene.add(fillLight);
  
  // 4. Rim Light (edge definition)
  const rimLight = new THREE.DirectionalLight(0xffffff, 0.6);
  rimLight.position.set(0, 5, -10);
  scene.add(rimLight);
  
  // 5. Ambient Light (very subtle)
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
  scene.add(ambientLight);
  
  return { keyLight, fillLight, rimLight, ambientLight };
};
```

### Post-Processing Pipeline

```typescript
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass';

const setupPostProcessing = (
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera
) => {
  const composer = new EffectComposer(renderer);
  
  // 1. Base render pass
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  
  // 2. SSAO (Screen Space Ambient Occlusion) - adds depth perception
  const ssaoPass = new SSAOPass(scene, camera, window.innerWidth, window.innerHeight);
  ssaoPass.kernelRadius = 16;
  ssaoPass.minDistance = 0.001;
  ssaoPass.maxDistance = 0.1;
  ssaoPass.output = SSAOPass.OUTPUT.Default;
  composer.addPass(ssaoPass);
  
  // 3. Subtle bloom for metallic highlights
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.15,    // strength (subtle)
    0.4,     // radius
    0.85     // threshold (only bright areas)
  );
  composer.addPass(bloomPass);
  
  // 4. Anti-aliasing (SMAA is better than FXAA)
  const smaaPass = new SMAAPass(
    window.innerWidth * renderer.getPixelRatio(),
    window.innerHeight * renderer.getPixelRatio()
  );
  composer.addPass(smaaPass);
  
  // 5. Output pass (tone mapping)
  const outputPass = new OutputPass();
  composer.addPass(outputPass);
  
  return composer;
};
```

### Renderer Configuration

```typescript
const createOptimizedRenderer = (canvas: HTMLCanvasElement) => {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,  // Handled by post-processing SMAA
    alpha: false,
    powerPreference: 'high-performance',
    stencil: false
  });
  
  // Physical lighting
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  
  // Shadows
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  // Performance
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  
  return renderer;
};
```

---

## 🎬 Animation & Motion Planning

### Smooth Joint Movement

```typescript
// Easing function for natural motion
const easeInOutCubic = (t: number): number => {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

// Animate joint to target angle
class JointAnimator {
  private currentAngle: number = 0;
  private targetAngle: number = 0;
  private startAngle: number = 0;
  private progress: number = 1;
  private duration: number = 1.0; // seconds
  
  setTarget(angle: number, duration: number = 1.0) {
    this.startAngle = this.currentAngle;
    this.targetAngle = angle;
    this.duration = duration;
    this.progress = 0;
  }
  
  update(deltaTime: number): number {
    if (this.progress < 1) {
      this.progress = Math.min(1, this.progress + deltaTime / this.duration);
      const easedProgress = easeInOutCubic(this.progress);
      this.currentAngle = THREE.MathUtils.lerp(
        this.startAngle,
        this.targetAngle,
        easedProgress
      );
    }
    return this.currentAngle;
  }
}
```

### Trajectory Planning

```typescript
// Cartesian path planning (straight line in 3D space)
const planCartesianPath = (
  start: THREE.Vector3,
  end: THREE.Vector3,
  steps: number
): THREE.Vector3[] => {
  const path: THREE.Vector3[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    path.push(new THREE.Vector3().lerpVectors(start, end, t));
  }
  return path;
};
```

---

## ✨ Visual Polish Checklist

Before finalizing a robot model, ensure:

### Geometry
- ✅ All edges are beveled (no perfectly sharp corners)
- ✅ Panel gaps are visible (0.5-1mm)
- ✅ Screws/bolts are modeled at key locations
- ✅ Cable routing is visible and logical
- ✅ Manufacturer plates/decals are included
- ✅ Polygon count is optimized (LOD if needed)

### Materials
- ✅ PBR materials with proper metalness/roughness
- ✅ Environment map is applied and visible in reflections
- ✅ Different material types for variety (metal, plastic, rubber)
- ✅ Surface imperfections (scratches, wear) if appropriate
- ✅ Normal maps add micro-detail

### Lighting
- ✅ Three-point lighting setup (key, fill, rim)
- ✅ HDRI environment map for realistic reflections
- ✅ Shadows are enabled and properly configured
- ✅ No harsh contrast or completely black areas

### Animation
- ✅ Proper hierarchical structure (parent-child relationships)
- ✅ Pivot points are correctly positioned
- ✅ Joint constraints are implemented
- ✅ Smooth motion with easing functions
- ✅ No unrealistic/impossible movements

### Rendering
- ✅ Post-processing pipeline is active
- ✅ SSAO adds depth perception
- ✅ Bloom is subtle (not overdone)
- ✅ Anti-aliasing eliminates jagged edges
- ✅ Tone mapping is configured
- ✅ Maintains 60 FPS on target hardware

---

## 📋 Example: Complete Robot Arm Creation

```typescript
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';

// Complete implementation
export const createIndustrialRobotArm = (scene: THREE.Scene) => {
  // === GEOMETRY ===
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.18, 0.15, 32),
    createIndustrialMetal()
  );
  base.castShadow = true;
  base.receiveShadow = true;
  
  // Add base details (screws)
  const screwGeometry = new THREE.CylinderGeometry(0.005, 0.005, 0.01, 8);
  const screwMaterial = new THREE.MeshStandardMaterial({
    color: 0x888888,
    metalness: 0.95,
    roughness: 0.15
  });
  
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const screw = new THREE.Mesh(screwGeometry, screwMaterial);
    screw.position.set(
      Math.cos(angle) * 0.14,
      0.08,
      Math.sin(angle) * 0.14
    );
    base.add(screw);
  }
  
  // === JOINTS & LINKS ===
  const joint1 = new THREE.Group();
  joint1.position.y = 0.15;
  base.add(joint1);
  
  const link1Housing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 0.12, 32),
    createPaintedSurface(0xff6b35)  // Orange RAL 2004
  );
  link1Housing.castShadow = true;
  joint1.add(link1Housing);
  
  // ... Continue building hierarchy ...
  
  scene.add(base);
  
  return { base, joint1 /*, ... */ };
};
```

---

## 🚀 Performance Optimization

### Level of Detail (LOD)

```typescript
import { LOD } from 'three';

const createLODRobotComponent = () => {
  const lod = new LOD();
  
  // High detail (< 5 meters)
  const highDetail = createHighDetailMesh();
  lod.addLevel(highDetail, 0);
  
  // Medium detail (5-15 meters)
  const mediumDetail = createMediumDetailMesh();
  lod.addLevel(mediumDetail, 5);
  
  // Low detail (> 15 meters)
  const lowDetail = createLowDetailMesh();
  lod.addLevel(lowDetail, 15);
  
  return lod;
};
```

### Instancing for Repeated Elements

```typescript
// For screws, bolts, and other repeated elements
const createInstancedScrews = (positions: THREE.Vector3[]) => {
  const geometry = new THREE.CylinderGeometry(0.005, 0.005, 0.01, 8);
  const material = createIndustrialMetal();
  
  const instancedMesh = new THREE.InstancedMesh(
    geometry,
    material,
    positions.length
  );
  
  const matrix = new THREE.Matrix4();
  positions.forEach((pos, i) => {
    matrix.setPosition(pos);
    instancedMesh.setMatrixAt(i, matrix);
  });
  
  instancedMesh.castShadow = true;
  return instancedMesh;
};
```

---

## 📚 Reference Materials

### Recommended HDRI Environments
- Industrial warehouse
- Modern factory floor
- Studio lighting setup
- Outdoor daylight

### Color Palettes (RAL Industrial Colors)
- **Primary:** RAL 7035 (Light Grey), RAL 9006 (White Aluminum)
- **Accent:** RAL 2004 (Pure Orange), RAL 5017 (Traffic Blue)
- **Details:** RAL 9005 (Jet Black), RAL 1021 (Colza Yellow)

### Technical References
- ISO 8373: Robotics vocabulary
- ISO 9283: Manipulating industrial robots - Performance criteria
- DIN EN ISO 10218: Robots for industrial environments

---

## 🎯 Expected Result

When following these guidelines, the final robot model should:

✨ **Look photorealistic** - indistinguishable from a photograph at medium distance
⚙️ **Move realistically** - follow proper kinematic constraints and smooth trajectories  
🎨 **Render beautifully** - proper lighting, materials, and post-processing effects
🚀 **Perform efficiently** - maintain 60 FPS with all effects enabled
🔧 **Be maintainable** - clear hierarchy, well-named components, commented code

**Visual Quality Target:** The model should look like a high-end product render from a robotics manufacturer's marketing materials.
