/**
 * IndexedDB Manager for 3D Models
 * 處理 3D 模型的本地快取儲存
 */

import type { CachedModel, CachedGLBModel, CachedGLTFModel } from '@/types/model';

const DB_NAME = 'VisualFlow3DModels';
const DB_VERSION = 1;
const STORE_NAME = 'models';

/**
 * 取得 IndexedDB 資料庫連線
 */
function openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            reject(new Error('無法開啟 IndexedDB 資料庫'));
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // 建立 object store
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'modelId' });

                // 建立索引
                objectStore.createIndex('format', 'format', { unique: false });
                objectStore.createIndex('version', 'version', { unique: false });
                objectStore.createIndex('cachedAt', 'metadata.cachedAt', { unique: false });
            }
        };
    });
}

/**
 * 儲存 GLB 模型到 IndexedDB
 */
export async function saveGLBModel(
    modelId: string,
    version: string,
    name: string,
    file: Blob
): Promise<void> {
    const db = await openDatabase();

    const model: CachedGLBModel = {
        modelId,
        format: 'glb',
        version,
        file,
        metadata: {
            name,
            fileSize: file.size,
            cachedAt: Date.now(),
        },
    };

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(model);

        request.onsuccess = () => {
            console.log(`✅ GLB 模型已儲存: ${modelId} (v${version})`);
            resolve();
        };

        request.onerror = () => {
            reject(new Error(`無法儲存 GLB 模型: ${modelId}`));
        };

        transaction.oncomplete = () => {
            db.close();
        };
    });
}

/**
 * 儲存 GLTF 模型到 IndexedDB
 */
export async function saveGLTFModel(
    modelId: string,
    version: string,
    name: string,
    gltf: any,
    resources: Record<string, Blob>
): Promise<void> {
    const db = await openDatabase();

    // 計算總檔案大小
    const totalSize = Object.values(resources).reduce((sum, blob) => sum + blob.size, 0);

    const model: CachedGLTFModel = {
        modelId,
        format: 'gltf',
        version,
        gltf,
        resources,
        metadata: {
            name,
            fileSize: totalSize,
            cachedAt: Date.now(),
        },
    };

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(model);

        request.onsuccess = () => {
            console.log(`✅ GLTF 模型已儲存: ${modelId} (v${version}), 資源檔案: ${Object.keys(resources).length}`);
            resolve();
        };

        request.onerror = () => {
            reject(new Error(`無法儲存 GLTF 模型: ${modelId}`));
        };

        transaction.oncomplete = () => {
            db.close();
        };
    });
}

/**
 * 從 IndexedDB 取得模型
 */
export async function getModel(modelId: string): Promise<CachedModel | null> {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(modelId);

        request.onsuccess = () => {
            const result = request.result as CachedModel | undefined;
            if (result) {
                console.log(`📦 從快取載入模型: ${modelId} (v${result.version})`);
            } else {
                console.log(`❌ 快取中沒有模型: ${modelId}`);
            }
            resolve(result || null);
        };

        request.onerror = () => {
            reject(new Error(`無法讀取模型: ${modelId}`));
        };

        transaction.oncomplete = () => {
            db.close();
        };
    });
}

/**
 * 檢查模型是否存在且版本相符
 */
export async function isModelCached(modelId: string, version: string): Promise<boolean> {
    try {
        const model = await getModel(modelId);
        return model !== null && model.version === version;
    } catch (error) {
        console.error('檢查快取時發生錯誤:', error);
        return false;
    }
}

/**
 * 刪除指定模型
 */
export async function deleteModel(modelId: string): Promise<void> {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(modelId);

        request.onsuccess = () => {
            console.log(`🗑️ 已刪除模型: ${modelId}`);
            resolve();
        };

        request.onerror = () => {
            reject(new Error(`無法刪除模型: ${modelId}`));
        };

        transaction.oncomplete = () => {
            db.close();
        };
    });
}

/**
 * 取得所有已快取的模型清單
 */
export async function getAllCachedModels(): Promise<CachedModel[]> {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            const models = request.result as CachedModel[];
            console.log(`📋 已快取的模型總數: ${models.length}`);
            resolve(models);
        };

        request.onerror = () => {
            reject(new Error('無法取得模型清單'));
        };

        transaction.oncomplete = () => {
            db.close();
        };
    });
}

/**
 * 清除所有快取
 */
export async function clearAllModels(): Promise<void> {
    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
            console.log('🧹 已清除所有模型快取');
            resolve();
        };

        request.onerror = () => {
            reject(new Error('無法清除快取'));
        };

        transaction.oncomplete = () => {
            db.close();
        };
    });
}

/**
 * 清除過期的快取（超過指定天數）
 */
export async function clearExpiredModels(daysToKeep: number = 30): Promise<number> {
    const db = await openDatabase();
    const expirationTime = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('cachedAt');
        const request = index.openCursor();

        let deletedCount = 0;

        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null;

            if (cursor) {
                const model = cursor.value as CachedModel;
                if (model.metadata.cachedAt < expirationTime) {
                    cursor.delete();
                    deletedCount++;
                }
                cursor.continue();
            } else {
                console.log(`🧹 已清除 ${deletedCount} 個過期模型`);
                resolve(deletedCount);
            }
        };

        request.onerror = () => {
            reject(new Error('無法清除過期快取'));
        };

        transaction.oncomplete = () => {
            db.close();
        };
    });
}

/**
 * 計算快取總大小（bytes）
 */
export async function getCacheSize(): Promise<number> {
    const models = await getAllCachedModels();
    const totalSize = models.reduce((sum, model) => sum + model.metadata.fileSize, 0);

    console.log(`💾 快取總大小: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    return totalSize;
}
