/**
 * Robot configuration types for managing 3D robot arm parameters and GLTF models
 */

/**
 * 3D Transform configuration
 */
export interface Transform3D {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
}

/**
 * Joint angle configuration (6-DOF robot arm)
 */
export interface JointAngles {
    j1: number; // Base rotation (Y-axis)
    j2: number; // Shoulder (Z-axis)
    j3: number; // Elbow (Z-axis)
    j4: number; // Wrist roll (X-axis)
    j5: number; // Wrist pitch (Z-axis)
    j6: number; // Wrist yaw (X-axis)
}

/**
 * Gripper configuration
 */
export interface GripperConfig {
    gripperValue: number; // 0-1 range
    clawValue: number; // 0-1 range
}

/**
 * Dynamic bone control for specific bone
 */
export interface BoneControl {
    boneName: string;
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
}

/**
 * Material configuration
 */
export interface MaterialConfig {
    name: string;
    color: string; // Hex color (e.g., "#ff6b35")
    metalness: number; // 0-1 range
    roughness: number; // 0-1 range
    emissive?: string; // Optional emissive color
    emissiveIntensity?: number;
}

/**
 * GLTF model metadata
 */
export interface GltfModelMetadata {
    id: string;
    fileName: string;
    fileSize: number; // Bytes
    contentType: string; // "model/gltf+json" or "model/gltf-binary"
    uploadedAt: string; // ISO 8601 timestamp
    url?: string; // CDN/Blob URL (if applicable)
}

/**
 * Robot configuration (complete)
 */
export interface RobotConfiguration {
    id: string;
    name: string;
    description?: string;

    // Transform
    transform: Transform3D;

    // Kinematics
    jointAngles: JointAngles;
    gripper: GripperConfig;

    // Advanced bone controls (for ~40+ bones discovered at runtime)
    boneControls?: BoneControl[];

    // Materials
    materials?: MaterialConfig[];

    // GLTF model reference
    gltfModel?: GltfModelMetadata;

    // Metadata
    createdAt: string;
    updatedAt: string;
    createdBy?: string; // User ID (for future permission control)
    tags?: string[]; // For categorization/search
}

/**
 * Create robot configuration request
 */
export interface CreateRobotConfigRequest {
    name: string;
    description?: string;
    transform: Transform3D;
    jointAngles: JointAngles;
    gripper: GripperConfig;
    boneControls?: BoneControl[];
    materials?: MaterialConfig[];
    tags?: string[];
}

/**
 * Update robot configuration request
 */
export interface UpdateRobotConfigRequest {
    name?: string;
    description?: string;
    transform?: Transform3D;
    jointAngles?: JointAngles;
    gripper?: GripperConfig;
    boneControls?: BoneControl[];
    materials?: MaterialConfig[];
    tags?: string[];
}

/**
 * Robot configuration list query parameters
 */
export interface RobotConfigListQuery {
    page?: number;
    pageSize?: number;
    search?: string; // Search in name/description
    tags?: string[]; // Filter by tags
    sortBy?: "name" | "createdAt" | "updatedAt";
    sortOrder?: "asc" | "desc";
}

/**
 * Paginated robot configuration list response
 */
export interface RobotConfigListResponse {
    items: RobotConfiguration[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
