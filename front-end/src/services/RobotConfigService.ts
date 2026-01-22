import { BaseService } from "@/services/BaseService";
import type { HttpActionResponse } from "@/services/httpActionResponse";
import type {
    CreateRobotConfigRequest,
    RobotConfigListQuery,
    UpdateRobotConfigRequest,
} from "@/types/robot-config";

/**
 * Service for managing robot arm configurations
 * Handles CRUD operations and GLTF model file management
 */
export class RobotConfigService extends BaseService {
    private readonly endpoint = "/robot-configs";

    /**
     * Create a new robot configuration
     */
    async createConfiguration(
        request: CreateRobotConfigRequest
    ): Promise<HttpActionResponse> {
        return super.post(this.endpoint, request);
    }

    /**
     * Get paginated list of robot configurations with optional filters
     */
    async listConfigurations(
        query?: RobotConfigListQuery
    ): Promise<HttpActionResponse> {
        const params = new URLSearchParams();

        if (query?.page) params.append("page", query.page.toString());
        if (query?.pageSize) params.append("pageSize", query.pageSize.toString());
        if (query?.search) params.append("search", query.search);
        if (query?.tags) {
            query.tags.forEach((tag) => params.append("tags", tag));
        }
        if (query?.sortBy) params.append("sortBy", query.sortBy);
        if (query?.sortOrder) params.append("sortOrder", query.sortOrder);

        const queryString = params.toString();
        const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint;

        return super.get(url);
    }

    /**
     * Get a single robot configuration by ID
     */
    async getConfiguration(
        configId: string
    ): Promise<HttpActionResponse> {
        return super.get(`${this.endpoint}/${configId}`);
    }

    /**
     * Update entire configuration (PUT)
     */
    async updateConfiguration(
        configId: string,
        request: CreateRobotConfigRequest
    ): Promise<HttpActionResponse> {
        return super.put(`${this.endpoint}/${configId}`, request);
    }

    /**
     * Partially update configuration (PATCH)
     */
    async patchConfiguration(
        configId: string,
        request: UpdateRobotConfigRequest
    ): Promise<HttpActionResponse> {
        return super.patch(`${this.endpoint}/${configId}`, request);
    }

    /**
     * Delete a robot configuration
     */
    async deleteConfiguration(
        configId: string
    ): Promise<HttpActionResponse> {
        return super.delete(`${this.endpoint}/${configId}`);
    }

    /**
     * Upload GLTF model file for a configuration
     */
    async uploadGltfModel(
        configId: string,
        file: File
    ): Promise<HttpActionResponse> {
        const formData = new FormData();
        formData.append("file", file);

        return super.post(`${this.endpoint}/${configId}/gltf-model`, formData);
    }

    /**
     * Download GLTF model file
     */
    async downloadGltfModel(configId: string): Promise<Blob> {
        return super.downloadFile(`${this.endpoint}/${configId}/gltf-model`);
    }

    /**
     * Get GLTF model metadata without downloading the file
     */
    async getGltfModelMetadata(
        configId: string
    ): Promise<HttpActionResponse> {
        return super.get(`${this.endpoint}/${configId}/gltf-model/metadata`);
    }

    /**
     * Delete GLTF model file (keeps configuration)
     */
    async deleteGltfModel(configId: string): Promise<HttpActionResponse> {
        return super.delete(`${this.endpoint}/${configId}/gltf-model`);
    }

    /**
     * Upload component ZIP file for a configuration
     */
    async uploadComponent(file: File): Promise<HttpActionResponse> {
        const formData = new FormData();
        formData.append("file", file);

        return super.post(`${this.endpoint}/components`, formData);
    }

    /**
     * Get list of all available components from database
     */
    async getComponentsList(): Promise<HttpActionResponse> {
        return super.get(`${this.endpoint}/components`);
    }
}

// Export singleton instance
export const robotConfigService = new RobotConfigService();
