/**
 * 3D 模型相關的型別定義
 */

// ============ 基本型別 ============

export type FileFormat = 'gltf' | 'glb';
export type Axis = 'x' | 'y' | 'z';

// ============ API 回應型別 ============

/**
 * 3D 向量
 */
export interface Vector3D {
    x: number;
    y: number;
    z: number;
}

/**
 * 模型變換資訊
 */
export interface ModelTransform {
    position: Vector3D;
    rotation: Vector3D;
    scale: Vector3D;
}

/**
 * 骨骼結構資訊
 */
export interface BoneInfo {
    name: string;
    displayName: string;
    parent: string | null;
}

/**
 * 模型結構資訊
 */
export interface ModelStructure {
    bones: BoneInfo[];
    meshes: string[];
}

/**
 * 關節控制配置
 */
export interface JointControl {
    id: string;
    displayName: string;
    boneName: string;
    axis: Axis;
    minAngle: number;
    maxAngle: number;
    defaultAngle: number;
    unit: 'degree' | 'radian';
}

/**
 * 模型元數據
 */
export interface ModelMetadata {
    author?: string;
    license?: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
}

/**
 * 模型清單項目
 */
export interface ModelListItem {
    id: string;
    name: string;
    description: string;
    category: string;
    thumbnailUrl: string;
    fileFormat: FileFormat;
    fileSize: number;
    version: string;
    createdAt: string;
    updatedAt: string;
    tags: string[];
}

/**
 * 完整模型詳細資訊
 */
export interface ModelDetail {
    id: string;
    name: string;
    description: string;
    category: string;
    fileFormat: FileFormat;
    fileSize: number;
    version: string;
    downloadUrl: string;
    thumbnailUrl: string;
    structure: ModelStructure;
    controls: JointControl[];
    defaultTransform: ModelTransform;
    metadata: ModelMetadata;
}

/**
 * 資源檔案資訊
 */
export interface ResourceFile {
    filename: string;
    size: number;
    type: 'buffer' | 'image';
    url: string;
}

/**
 * 分頁資訊
 */
export interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/**
 * API 標準回應格式
 */
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: ApiError;
}

/**
 * API 錯誤資訊
 */
export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, any>;
}

/**
 * 模型清單 API 回應
 */
export interface ModelsListResponse {
    models: ModelListItem[];
    pagination: Pagination;
}

/**
 * 資源清單 API 回應
 */
export interface ResourcesListResponse {
    files: ResourceFile[];
}

// ============ IndexedDB 儲存型別 ============

/**
 * IndexedDB 中儲存的 GLB 模型
 */
export interface CachedGLBModel {
    modelId: string;
    format: 'glb';
    version: string;
    file: Blob;
    metadata: {
        name: string;
        fileSize: number;
        cachedAt: number;
    };
}

/**
 * IndexedDB 中儲存的 GLTF 模型
 */
export interface CachedGLTFModel {
    modelId: string;
    format: 'gltf';
    version: string;
    gltf: any; // GLTF JSON object
    resources: Record<string, Blob>; // filename -> Blob
    metadata: {
        name: string;
        fileSize: number;
        cachedAt: number;
    };
}

/**
 * 聯合型別：快取的模型
 */
export type CachedModel = CachedGLBModel | CachedGLTFModel;

// ============ 查詢參數型別 ============

/**
 * 模型清單查詢參數
 */
export interface ModelsQueryParams {
    category?: string;
    page?: number;
    limit?: number;
    search?: string;
}

/**
 * 下載參數
 */
export interface DownloadParams {
    version?: string;
}
