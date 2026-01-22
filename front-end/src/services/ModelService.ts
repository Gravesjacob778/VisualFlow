/**
 * Model API Service
 * 處理 3D 模型的 API 請求
 */

import { BaseService } from './BaseService';
import type {
    ApiResponse,
    ModelListItem,
    ModelDetail,
    ModelsListResponse,
    ModelsQueryParams,
    DownloadParams,
    ResourcesListResponse,
} from '@/types/model';

export class ModelService extends BaseService {
    private readonly baseEndpoint = '/models';

    /**
     * 取得模型清單
     */
    async getModelsList(params?: ModelsQueryParams): Promise<ApiResponse<ModelsListResponse>> {
        try {
            const response = await this.get(this.baseEndpoint, params as Record<string, string | number>);
            return response as ApiResponse<ModelsListResponse>;
        } catch (error) {
            console.error('取得模型清單失敗:', error);
            throw error;
        }
    }

    /**
     * 取得單一模型詳細資訊
     */
    async getModelDetail(modelId: string): Promise<ApiResponse<ModelDetail>> {
        try {
            const response = await this.get(`${this.baseEndpoint}/${modelId}`);
            return response as ApiResponse<ModelDetail>;
        } catch (error) {
            console.error(`取得模型詳情失敗 (${modelId}):`, error);
            throw error;
        }
    }

    /**
     * 取得 GLTF JSON
     */
    async getGLTFJson(modelId: string): Promise<any> {
        try {
            const response = await super.get(`${this.baseEndpoint}/${modelId}/gltf`);
            return response;
        } catch (error) {
            console.error(`取得 GLTF JSON 失敗 (${modelId}):`, error);
            throw error;
        }
    }

    /**
     * 下載 GLB 檔案
     */
    async downloadGLB(modelId: string, params?: DownloadParams): Promise<Blob> {
        try {
            const blob = await this.downloadFile(
                `${this.baseEndpoint}/${modelId}/download`,
                params as Record<string, string | number>
            );
            console.log(`✅ GLB 檔案下載完成: ${modelId}`);
            return blob;
        } catch (error) {
            console.error(`下載 GLB 失敗 (${modelId}):`, error);
            throw error;
        }
    }

    /**
     * 下載資源檔案（.bin 或貼圖）
     */
    async downloadResource(modelId: string, filename: string): Promise<Blob> {
        try {
            const blob = await this.downloadFile(
                `${this.baseEndpoint}/${modelId}/resources/${filename}`
            );
            console.log(`✅ 資源檔案下載完成: ${filename}`);
            return blob;
        } catch (error) {
            console.error(`下載資源失敗 (${modelId}/${filename}):`, error);
            throw error;
        }
    }

    /**
     * 取得模型的資源檔案清單
     */
    async getResourcesList(modelId: string): Promise<ApiResponse<ResourcesListResponse>> {
        try {
            const response = await this.get(`${this.baseEndpoint}/${modelId}/resources`);
            return response as ApiResponse<ResourcesListResponse>;
        } catch (error) {
            console.error(`取得資源清單失敗 (${modelId}):`, error);
            throw error;
        }
    }

    /**
     * 檢查模型版本（使用 HEAD 請求）
     */
    async checkModelVersion(modelId: string): Promise<{ version: string; etag: string } | null> {
        try {
            // 使用 HEAD 請求只取得 Headers
            const response = await fetch(
                `${this.baseEndpoint}/${modelId}/download`,
                {
                    method: 'HEAD',
                    credentials: 'include',
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const etag = response.headers.get('ETag');
            const lastModified = response.headers.get('Last-Modified');

            if (etag) {
                // 從 ETag 解析版本號，假設格式為 "v1.2.0-hash"
                const versionMatch = etag.match(/v([\d.]+)/);
                const version = versionMatch ? versionMatch[1] : etag;

                return { version, etag };
            } else if (lastModified) {
                return { version: lastModified, etag: lastModified };
            }

            return null;
        } catch (error) {
            console.error(`檢查模型版本失敗 (${modelId}):`, error);
            return null;
        }
    }

    /**
     * 取得特定類別的模型
     */
    async getModelsByCategory(
        category: string,
        params?: Omit<ModelsQueryParams, 'category'>
    ): Promise<ApiResponse<ModelsListResponse>> {
        try {
            const response = await this.get(
                `${this.baseEndpoint}/categories/${category}`,
                params as Record<string, string | number>
            );
            return response as ApiResponse<ModelsListResponse>;
        } catch (error) {
            console.error(`取得類別模型失敗 (${category}):`, error);
            throw error;
        }
    }

    /**
     * 搜尋模型
     */
    async searchModels(
        query: string,
        params?: Omit<ModelsQueryParams, 'search'>
    ): Promise<ApiResponse<ModelsListResponse>> {
        try {
            const response = await this.get(
                `${this.baseEndpoint}/search`,
                { ...params, q: query } as Record<string, string | number>
            );
            return response as ApiResponse<ModelsListResponse>;
        } catch (error) {
            console.error(`搜尋模型失敗 (${query}):`, error);
            throw error;
        }
    }

    /**
     * 下載縮圖
     */
    async downloadThumbnail(modelId: string): Promise<Blob> {
        try {
            const blob = await this.downloadFile(
                `${this.baseEndpoint}/${modelId}/thumbnail`
            );
            return blob;
        } catch (error) {
            console.error(`下載縮圖失敗 (${modelId}):`, error);
            throw error;
        }
    }
}

// 建立單例
const modelService = new ModelService();
export default modelService;
