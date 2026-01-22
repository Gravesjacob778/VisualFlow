/**
 * Model Loader
 * 整合 API 和 IndexedDB，提供統一的模型載入介面
 */

import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import modelService from '@/services/ModelService';
import * as modelDB from '@/lib/modelIndexedDB';
import type { CachedGLBModel, CachedGLTFModel, ModelDetail } from '@/types/model';

/**
 * 載入結果
 */
export interface LoadedModel {
    format: 'glb' | 'gltf';
    url: string; // Blob URL，可直接用於 Three.js（GLB 格式使用）
    detail: ModelDetail;
    cached: boolean; // 是否來自快取
    gltf?: GLTF; // 直接解析的 GLTF 物件（GLTF 格式使用，避免額外的 URL 載入）
    scene?: THREE.Group; // 直接可用的場景（GLTF 格式使用）
}

/**
 * 載入進度回調
 */
export interface LoadProgress {
    phase: 'checking' | 'downloading' | 'processing' | 'complete';
    message: string;
    progress?: number; // 0-100
}

export type ProgressCallback = (progress: LoadProgress) => void;

/**
 * 載入 GLB 模型（含快取策略）
 */
export async function loadGLBModel(
    modelId: string,
    onProgress?: ProgressCallback
): Promise<LoadedModel> {
    try {
        // 1. 取得模型詳情
        onProgress?.({ phase: 'checking', message: '正在取得模型資訊...' });
        const detailResponse = await modelService.getModelDetail(modelId);

        if (!detailResponse.success || !detailResponse.data) {
            throw new Error('無法取得模型資訊');
        }

        const detail = detailResponse.data;

        // 2. 檢查 IndexedDB 快取
        onProgress?.({ phase: 'checking', message: '檢查本地快取...' });
        const cached = await modelDB.getModel(modelId);

        // 3. 驗證快取版本
        if (cached && cached.format === 'glb' && cached.version === detail.version) {
            onProgress?.({ phase: 'processing', message: '從快取載入模型...' });
            const url = URL.createObjectURL(cached.file);

            onProgress?.({ phase: 'complete', message: '模型載入完成（來自快取）', progress: 100 });
            return {
                format: 'glb',
                url,
                detail,
                cached: true,
            };
        }

        // 4. 從 API 下載
        onProgress?.({ phase: 'downloading', message: '正在下載模型...', progress: 0 });
        const blob = await modelService.downloadGLB(modelId, { version: detail.version });

        // 5. 儲存到 IndexedDB
        onProgress?.({ phase: 'processing', message: '正在儲存到快取...' });
        await modelDB.saveGLBModel(modelId, detail.version, detail.name, blob);

        // 6. 建立 Blob URL
        const url = URL.createObjectURL(blob);

        onProgress?.({ phase: 'complete', message: '模型載入完成', progress: 100 });
        return {
            format: 'glb',
            url,
            detail,
            cached: false,
        };
    } catch (error) {
        console.error(`載入 GLB 模型失敗 (${modelId}):`, error);
        throw error;
    }
}

/**
 * 載入 GLTF 模型（含快取策略）
 */
export async function loadGLTFModel(
    modelId: string,
    onProgress?: ProgressCallback
): Promise<LoadedModel> {
    try {
        // 1. 檢查快取
        onProgress?.({ phase: 'checking', message: '檢查本地快取...' });
        const cached = await modelDB.getModel(modelId);

        // 2. 如果快取有效，使用快取
        if (cached && cached.format === 'gltf') {
            onProgress?.({ phase: 'processing', message: '從快取載入模型...' });

            // 驗證快取的 GLTF
            try {
                validateGLTFJson(cached.gltf);
            } catch (validationError) {
                console.warn('快取的 GLTF 驗證失敗，將重新下載:', validationError);
                // 繼續執行下載流程
            }

            if (cached.gltf && cached.gltf.asset && cached.gltf.asset.version) {
                // 直接解析 GLTF JSON（不需要透過 URL 載入）
                onProgress?.({ phase: 'processing', message: '正在解析模型...', progress: 50 });
                const parsedGltf = await parseGLTFFromJson(cached.gltf, cached.resources);
                console.log('GLTF JSON Converted:', parsedGltf);
                onProgress?.({ phase: 'complete', message: '模型載入完成（來自快取）', progress: 100 });
                return {
                    format: 'gltf',
                    url: '', // GLTF 格式不再需要 URL，直接使用 scene
                    detail: {
                        id: modelId,
                        name: cached.metadata.name,
                        version: cached.version,
                    } as ModelDetail,
                    cached: true,
                    gltf: parsedGltf,
                    scene: parsedGltf.scene,
                };
            }
        }

        // 3. 從 API 下載 GLTF JSON
        onProgress?.({ phase: 'downloading', message: '正在下載 GLTF 結構...', progress: 10 });
        const gltfJson = await modelService.getGLTFJson(modelId);

        // 驗證 GLTF JSON 結構
        if (!gltfJson || typeof gltfJson !== 'object') {
            throw new Error('無效的 GLTF JSON 結構');
        }

        // 確保有正確的 asset 資訊
        if (!gltfJson.asset) {
            console.warn('GLTF JSON 缺少 asset 資訊，將自動補充');
            gltfJson.asset = {
                version: '2.0',
                generator: 'VisualFlow Model Loader'
            };
        } else if (!gltfJson.asset.version || parseFloat(gltfJson.asset.version) < 2.0) {
            console.warn(`GLTF 版本過舊 (${gltfJson.asset.version})，將更新為 2.0`);
            gltfJson.asset.version = '2.0';
        }

        // 4. 解析需要的資源
        const bufferUrls = gltfJson.buffers?.map((b: any) => b.uri) || [];
        const imageUrls = gltfJson.images?.map((i: any) => i.uri) || [];
        const allResourceUrls = [...bufferUrls, ...imageUrls];

        // 5. 並行下載所有資源
        onProgress?.({ phase: 'downloading', message: `正在下載資源 (0/${allResourceUrls.length})...`, progress: 20 });

        const resources: Record<string, Blob> = {};
        let downloadedCount = 0;

        await Promise.all(
            allResourceUrls.map(async (fileUrl: string) => {
                const filename = fileUrl.split('/').pop()!;
                const blob = await modelService.downloadResource(modelId, fileUrl);
                resources[filename] = blob;

                downloadedCount++;
                const progress = 20 + (downloadedCount / allResourceUrls.length) * 60;
                onProgress?.({
                    phase: 'downloading',
                    message: `正在下載資源 (${downloadedCount}/${allResourceUrls.length})...`,
                    progress
                });
            })
        );

        // 6. 從 GLTF JSON 獲取模型名稱（如果有）
        const modelName = gltfJson.asset?.generator || `Model_${modelId}`;
        const modelVersion = gltfJson.asset?.version || '1.0';

        // 7. 儲存到 IndexedDB
        onProgress?.({ phase: 'processing', message: '正在儲存到快取...', progress: 85 });
        await modelDB.saveGLTFModel(modelId, modelVersion, modelName, gltfJson, resources);

        // 8. 直接解析 GLTF JSON（不需要透過 URL 載入）
        onProgress?.({ phase: 'processing', message: '正在解析模型...', progress: 95 });
        const parsedGltf = await parseGLTFFromJson(gltfJson, resources);

        onProgress?.({ phase: 'complete', message: '模型載入完成', progress: 100 });
        return {
            format: 'gltf',
            url: '', // GLTF 格式不再需要 URL，直接使用 scene
            detail: {
                id: modelId,
                name: modelName,
                version: modelVersion,
            } as ModelDetail,
            cached: false,
            gltf: parsedGltf,
            scene: parsedGltf.scene,
        };
    } catch (error) {
        console.error(`載入 GLTF 模型失敗 (${modelId}):`, error);
        throw error;
    }
}

/**
 * 自動偵測格式並載入模型
 */
export async function loadModel(
    modelId: string,
    onProgress?: ProgressCallback
): Promise<LoadedModel> {
    try {
        // 先嘗試取得模型詳情以確定格式
        onProgress?.({ phase: 'checking', message: '正在檢查模型格式...' });
        // const detailResponse = await modelService.getModelDetail(modelId);


        // if (format === 'glb') {
        //     return loadGLBModel(modelId, onProgress);
        // } else if (format === 'gltf') {
        //     return loadGLTFModel(modelId, onProgress);
        // }

        // 目前 API 尚未提供格式資訊，預設嘗試 GLTF 格式
        return loadGLTFModel(modelId, onProgress);
        // // 如果無法取得格式，預設嘗試 GLB（較常見且較簡單）
        // console.warn(`無法確定模型格式 (${modelId})，嘗試使用 GLB 格式`);
        // return loadGLBModel(modelId, onProgress);
    } catch (error) {
        // 如果 GLB 載入失敗，嘗試 GLTF
        console.warn(`GLB 格式載入失敗，嘗試使用 GLTF 格式`);
        return loadGLTFModel(modelId, onProgress);
    }
}

/**
 * 驗證 GLTF JSON 結構
 */
function validateGLTFJson(gltfJson: any): void {
    if (!gltfJson || typeof gltfJson !== 'object') {
        throw new Error('無效的 GLTF JSON: 不是有效的物件');
    }

    // 檢查必要的 asset 屬性
    if (!gltfJson.asset) {
        throw new Error('無效的 GLTF JSON: 缺少 asset 屬性');
    }

    if (!gltfJson.asset.version) {
        throw new Error('無效的 GLTF JSON: 缺少 asset.version');
    }

    const version = parseFloat(gltfJson.asset.version);
    if (version < 2.0) {
        throw new Error(`不支援的 GLTF 版本: ${gltfJson.asset.version}. 需要 >= 2.0`);
    }

    console.log('✅ GLTF JSON 驗證通過:', {
        version: gltfJson.asset.version,
        generator: gltfJson.asset.generator,
        scenes: gltfJson.scenes?.length || 0,
        nodes: gltfJson.nodes?.length || 0,
        meshes: gltfJson.meshes?.length || 0
    });
}

/**
 * 直接從 GLTF JSON 和資源解析 GLTF 物件
 * 使用 GLTFLoader.parse() 方法，避免額外的 URL 載入
 */
export async function parseGLTFFromJson(
    gltfJson: any,
    resources: Record<string, Blob>
): Promise<GLTF> {
    // 驗證 GLTF JSON
    validateGLTFJson(gltfJson);

    // 確保 GLTF 有正確的 asset 資訊
    const processedGltf = { ...gltfJson };
    if (!processedGltf.asset) {
        processedGltf.asset = {
            version: '2.0',
            generator: 'VisualFlow Model Loader'
        };
    } else if (!processedGltf.asset.version) {
        processedGltf.asset.version = '2.0';
    }

    // 建立資源映射（filename -> ArrayBuffer）
    const resourceBuffers: Record<string, ArrayBuffer> = {};
    await Promise.all(
        Object.entries(resources).map(async ([filename, blob]) => {
            resourceBuffers[filename] = await blob.arrayBuffer();
        })
    );

    // 建立自定義的資源載入管理器
    const manager = new THREE.LoadingManager();
    const loader = new GLTFLoader(manager);

    // 設置 URL 修改器，將資源 URI 轉換為 data URL
    manager.setURLModifier((url: string) => {
        const filename = url.split('/').pop() || url;

        // 檢查是否是 buffer 資源
        if (resourceBuffers[filename]) {
            const blob = resources[filename];
            return URL.createObjectURL(blob);
        }

        return url;
    });

    // 將 GLTF JSON 轉換為 ArrayBuffer
    const gltfString = JSON.stringify(processedGltf);
    const encoder = new TextEncoder();
    const gltfArrayBuffer = encoder.encode(gltfString).buffer;

    return new Promise<GLTF>((resolve, reject) => {
        loader.parse(
            gltfArrayBuffer,
            '', // 基礎路徑（用於解析相對路徑的資源）
            (gltf) => {
                console.log('✅ GLTF JSON 直接解析成功:', {
                    scenes: gltf.scenes.length,
                    animations: gltf.animations.length,
                    cameras: gltf.cameras.length,
                });
                resolve(gltf);
            },
            (error) => {
                console.error('❌ GLTF JSON 解析失敗:', error);
                reject(error);
            }
        );
    });
}

/**
 * 從快取的 GLTF 模型建立 Blob URL（保留向後相容）
 */
async function createGLTFBlobURL(cachedModel: CachedGLTFModel): Promise<string> {
    const gltfJson = { ...cachedModel.gltf };

    // 驗證 GLTF 結構
    validateGLTFJson(gltfJson);

    // 確保 GLTF 有正確的 asset 資訊（THREE.js 需要 version >= 2.0）
    if (!gltfJson.asset) {
        gltfJson.asset = {
            version: '2.0',
            generator: 'VisualFlow Model Loader'
        };
    } else if (!gltfJson.asset.version) {
        gltfJson.asset.version = '2.0';
    }

    // 建立 Blob URLs 映射
    const blobUrls: Record<string, string> = {};
    Object.entries(cachedModel.resources).forEach(([filename, blob]) => {
        blobUrls[filename] = URL.createObjectURL(blob);
    });

    // 重寫 GLTF JSON 中的 URI（指向 Blob URL）
    if (gltfJson.buffers) {
        gltfJson.buffers.forEach((buffer: any) => {
            if (buffer.uri) {
                const filename = buffer.uri.split('/').pop();
                if (blobUrls[filename]) {
                    buffer.uri = blobUrls[filename];
                }
            }
        });
    }

    if (gltfJson.images) {
        gltfJson.images.forEach((image: any) => {
            if (image.uri) {
                const filename = image.uri.split('/').pop();
                if (blobUrls[filename]) {
                    image.uri = blobUrls[filename];
                }
            }
        });
    }

    // 建立 GLTF JSON 的 Blob URL
    const gltfBlob = new Blob([JSON.stringify(gltfJson)], { type: 'model/gltf+json' });
    return URL.createObjectURL(gltfBlob);
}

/**
 * 清理 Blob URL（使用完後應該呼叫以釋放記憶體）
 */
export function revokeBlobURL(url: string): void {
    URL.revokeObjectURL(url);
}

/**
 * 預載模型（下載並快取，但不建立 Blob URL）
 */
export async function preloadModel(
    modelId: string,
    onProgress?: ProgressCallback
): Promise<void> {
    const loaded = await loadModel(modelId, onProgress);
    // 立即釋放 Blob URL，因為只是預載
    revokeBlobURL(loaded.url);
}
