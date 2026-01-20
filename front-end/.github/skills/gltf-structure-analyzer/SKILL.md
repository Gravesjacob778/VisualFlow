---
name: gltf-structure-analyzer
description: Expert in analyzing and validating GLTF/GLB file structure for 3D robot models, identifying mesh hierarchies, joint configurations, and preparing models for Three.js integration
---

# GLTF Structure Analyzer Skill

This skill specializes in analyzing GLTF/GLB file structures to validate model hierarchies, identify mesh organization, and diagnose issues before importing into Three.js/React Three Fiber applications.

## Quick Diagnosis: Structure Inspector

Use this utility to analyze any GLTF file and understand its internal hierarchy:

```typescript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

loader.load('source/scene.gltf', (gltf) => {
  const model = gltf.scene;
  
  console.log('=== 🔍 GLTF Structure Analysis ===');
  console.log(`File: scene.gltf`);
  console.log(`Total Objects: ${countObjects(model)}`);
  console.log(`Total Meshes: ${countMeshes(model)}`);
  console.log('\n=== 📊 Object Hierarchy ===\n');
  
  let indent = '';
  model.traverse((child) => {
    const depth = getDepth(child);
    indent = '  '.repeat(depth);
    
    let info = `${indent}├─ ${child.name || '(unnamed)'}`;
    info += ` [${child.type}]`;
    
    if (child.isMesh) {
      info += ` 📦 Geometry: ${child.geometry.attributes.position.count} vertices`;
      if (child.material) {
        info += ` | Material: ${child.material.name || child.material.type}`;
      }
    }
    
    if (child.children.length > 0) {
      info += ` (${child.children.length} children)`;
    }
    
    console.log(info);
  });
  
  console.log('\n=== 🔗 Joint Candidates ===');
  analyzeJoints(model);
});

function getDepth(object) {
  let depth = 0;
  let current = object;
  while (current.parent) {
    depth++;
    current = current.parent;
  }
  return depth;
}

function countObjects(object) {
  let count = 0;
  object.traverse(() => count++);
  return count;
}

function countMeshes(object) {
  let count = 0;
  object.traverse((child) => {
    if (child.isMesh) count++;
  });
  return count;
}

function analyzeJoints(model) {
  const jointPatterns = ['joint', 'bone', 'armature', 'link', 'axis'];
  const candidates = [];
  
  model.traverse((child) => {
    const name = child.name.toLowerCase();
    if (jointPatterns.some(pattern => name.includes(pattern))) {
      candidates.push({
        name: child.name,
        type: child.type,
        children: child.children.length,
        depth: getDepth(child)
      });
    }
  });
  
  if (candidates.length === 0) {
    console.log('⚠️ No obvious joint names detected (e.g., no "joint", "bone", etc.)');
    console.log('📋 Recommendation: Model may need renaming in Blender');
  } else {
    candidates.forEach((joint) => {
      console.log(`  ✓ ${joint.name} [${joint.type}] - ${joint.children} children`);
    });
  }
}
```

## 3 Common Structure Scenarios

### 🔴 Scenario A: Single Monolithic Mesh (❌ Problem!)

**Output Example:**
```
Scene
 └─ RobotArm_Mesh [Mesh] 📦 (50000 vertices)
```

**Problem:** Entire robot is one mesh → **Cannot control individual joints**

**Severity:** 🔴 Critical - Must rebuild in Blender

**Solution:** Separate mesh into components by loose parts or manual selection

---

### 🟡 Scenario B: Hierarchical but Unclear Names (⚠️ Difficult)

**Output Example:**
```
Scene
 └─ Object_0 [Group]
     ├─ Object_1 [Group] (2 children)
     │   ├─ Mesh_0 📦 (8000 vertices)
     │   └─ Mesh_1 📦 (6000 vertices)
     └─ Object_2 [Group] (1 child)
         └─ Mesh_2 📦 (5000 vertices)
```

**Problem:** Cannot identify which mesh belongs to which joint

**Severity:** 🟡 Medium - Requires detective work or re-export

**Solution:** Use Blender to rename objects and rebuild hierarchy

---

### 🟢 Scenario C: Perfect Structure (✅ Lucky!)

**Output Example:**
```
Scene
 └─ Base [Group]
     ├─ Joint1 [Group]
     │   ├─ Link1 [Mesh] 📦 (4000 vertices)
     │   └─ Joint2 [Group]
     │       ├─ Link2 [Mesh] 📦 (3500 vertices)
     │       └─ Joint3 [Group]
```

**Problem:** None! ✅

**Severity:** 🟢 Ready to use

**Solution:** Load directly and map to joint controllers

---

## Solution 1: Rebuild in Blender (Recommended!)

### Step 1: Import GLTF File

```
1. Open Blender
2. File → Import → glTF 2.0 (.glTf/.glb)
3. Select your scene.gltf file
4. Click Import
```

### Step 2: Inspect Model Structure

```
1. Select the model (click on it in viewport)
2. Press Z → Wireframe (see skeleton)
3. Right side panel → Outliner (see hierarchy)
4. Expand all objects to understand structure
```

### Step 3: Separate Mesh into Components

**Method A: By Loose Parts (Best if components are already separated)**

```blender
1. Select the main mesh object
2. Press Tab → Enter Edit Mode
3. Press A → Select All
4. Mesh → Separate → By Loose Parts
5. Press Tab → Return to Object Mode
Result: One mesh becomes multiple objects
```

**Method B: Manual Selection (For connected meshes)**

```blender
1. Select main mesh → Press Tab (Edit Mode)
2. Press Alt+A to deselect all
3. Move mouse to the first component (e.g., base)
4. Press L → Select this component
5. Press P → Separate → Selection
6. Repeat for each component
```

### Step 4: Rename Objects Clearly

```
In Outliner on the right:
1. Double-click object name
2. Rename to meaningful names:
   - Base (mount)
   - Joint1 (base rotation axis)
   - Link1 (arm segment 1)
   - Joint2 (shoulder)
   - Link2 (arm segment 2)
   - Joint3 (elbow)
   - Link3 (forearm)
   - Joint4 (wrist roll)
   - Joint5 (wrist pitch)
   - Joint6 (wrist yaw)
   - EndEffector (gripper)
```

### Step 5: Build Proper Hierarchy

```
In Outliner (drag to create parent-child relationships):

Base (will be root)
 └─ Joint1
     └─ Link1
         └─ Joint2
             └─ Link2
                 └─ Joint3
                     └─ Link3
                         └─ Joint4
                             └─ Joint5
                                 └─ Joint6
                                     └─ EndEffector

Drag order:
1. Drag Link1 → onto Joint1 (makes Link1 child of Joint1)
2. Drag Joint2 → onto Link1
3. Drag Link2 → onto Joint2
... continue for all joints
```

**Critical:** Each joint's origin must be at its rotation axis!

**Fix Joint Origins:**

```blender
1. Select Joint1
2. Object Mode (Tab)
3. Set 3D Cursor to rotation center:
   - Shift+S → Cursor to Selection (temporary)
   - Manually position cursor with Shift+RMB
4. Right-click → Set Origin → Origin to 3D Cursor
5. Repeat for all joints
```

### Step 6: Export to GLB

```blender
File → Export → glTF 2.0 (.glTF Binary)

Settings:
✅ Format: glTF Binary (.glb)     ← Recommended (smaller file)
✅ Include → Animations           ← If robot has animations
✅ Include → All Bone Influences
✅ Transform → Y Up
✅ Geometry → Apply Modifiers
✅ Geometry → Apply Mesh
❌ Uncheck: Include → All Influences (unneeded for static)

Save as: robot_arm_rigged.glb
```

---

## Solution 2: Verify Structure with Debugging Utility

Create a React component to inspect loaded models:

```typescript
// components/GLTFDebugger.tsx
import { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';

export function GLTFDebugger({ modelPath }: { modelPath: string }) {
  const gltf = useGLTF(modelPath);
  
  useEffect(() => {
    console.log('=== GLTF Model Debug Info ===');
    console.log('Path:', modelPath);
    console.log('Scene:', gltf.scene);
    console.log('Animations:', gltf.animations);
    
    // Build hierarchy string
    let hierarchyStr = '';
    gltf.scene.traverse((obj) => {
      const depth = getDepth(obj);
      const indent = '  '.repeat(depth);
      hierarchyStr += `\n${indent}${obj.name || '(unnamed)'} [${obj.type}]`;
    });
    
    console.log('\n=== Hierarchy ===', hierarchyStr);
    
    // Find all meshes
    const meshes: any[] = [];
    gltf.scene.traverse((obj) => {
      if (obj.isMesh) meshes.push(obj.name);
    });
    console.log('Meshes found:', meshes);
    
  }, [gltf, modelPath]);
  
  return null; // Invisible debug component
}

function getDepth(object: any) {
  let depth = 0;
  let current = object;
  while (current.parent) {
    depth++;
    current = current.parent;
  }
  return depth;
}
```

**Usage:**

```typescript
<Canvas>
  <GLTFDebugger modelPath="/models/robot.glb" />
  <RobotModel />
</Canvas>
```

---

## Diagnostic Checklist

Use this checklist to validate your GLTF structure:

- [ ] Model loads without errors
- [ ] Scene has meaningful hierarchy (not flat)
- [ ] Objects are named clearly (not "Object_0", "Mesh_1", etc.)
- [ ] Mesh count matches expected components
- [ ] No single mesh contains all geometry
- [ ] Parent-child relationships make sense
- [ ] Joint names indicate rotation axes
- [ ] Origins are positioned correctly for rotation
- [ ] Animations are preserved (if applicable)
- [ ] File size is reasonable for target platform

---

## When to Use This Skill

✅ Loading a new GLTF robot model  
✅ Debugging why joints don't rotate correctly  
✅ Identifying mesh organization issues  
✅ Preparing models for kinematic chains  
✅ Validating Blender exports  

---

## Related Skills

- **3d-robot-model**: Creating high-fidelity robot models with proper materials
- **3d-physics-visualization**: Rendering GLTF models in Three.js/R3F
