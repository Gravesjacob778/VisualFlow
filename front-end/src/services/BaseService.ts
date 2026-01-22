import { HttpActionResponse } from "../services/httpActionResponse";
import { HttpClient } from "../lib/httpClient";
const getBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_API_BASE_URL) {
        // Use NEXT_PUBLIC_ prefix for client-side environment variables in Next.js
        return process.env.NEXT_PUBLIC_API_BASE_URL;
    }
    return 'http://localhost:5195';
};
export class BaseService {
    private http: HttpClient = new HttpClient();

    constructor() {
        // 響應攔截器：處理 401 未授權錯誤
        this.http.useResponse(async (response, request) => {
            if (response.status === 401) {
                // 檢查是否為登入 API，登入 API 的 401 不需要重導向
                const url = typeof request === 'string' ? request : request.url
                const isLoginRequest = url.includes('/Auth/Login')

                if (!isLoginRequest) {

                    if (typeof window !== 'undefined') {
                        window.location.href = '/login'
                    }
                }
            }
            return response;
        });
    }
    async get(
        url: string,
        params?: Record<string, string | number | unknown>,
        init: RequestInit = {}
    ): Promise<HttpActionResponse> {
        let query = "";
        if (params) {
            // 將參數轉換為字串格式
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    searchParams.append(key, String(value));
                }
            });
            const queryString = searchParams.toString();
            query = queryString ? `?${queryString}` : "";
        }
        const response = await this.http.request(getBaseUrl() + url + query, {
            ...init,
            credentials: "include", // ✅ 允許帶 Cookie
            method: "GET",
        });
        return await response.json();
    }

    async post(
        url: string,
        body?: unknown,
        init: RequestInit = {}
    ): Promise<HttpActionResponse> {
        const isFormData = body instanceof FormData;

        const headers = isFormData
            ? { ...(init.headers || {}) }
            : { "Content-Type": "application/json", ...(init.headers || {}) };

        const processedBody = isFormData
            ? body // 直接使用 FormData
            : (body !== undefined ? JSON.stringify(body) : undefined);

        const response = await this.http.request(getBaseUrl() + url, {
            ...init,
            method: "POST",
            credentials: "include",
            headers,
            body: processedBody,
        });
        console.log(response);
        return await response.json();
    }

    async put(
        url: string,
        body?: any,
        init: RequestInit = {}
    ): Promise<HttpActionResponse> {
        const response = await this.http.request(getBaseUrl() + url, {
            ...init,
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json", ...(init.headers || {}) },
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
        return await response.json();
    }

    async patch(
        url: string,
        body?: any,
        init: RequestInit = {}
    ): Promise<HttpActionResponse> {
        const response = await this.http.request(getBaseUrl() + url, {
            ...init,
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json", ...(init.headers || {}) },
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
        return await response.json();
    }

    async delete(url: string, init: RequestInit = {}): Promise<HttpActionResponse> {
        const response = await this.http.request(getBaseUrl() + url, {
            ...init,
            method: "DELETE",
            credentials: "include",
        });
        return await response.json();
    }

    /**
     * 下載文件（返回 Blob 和文件名）
     */
    async downloadFile(
        url: string,
        params?: Record<string, string | number | unknown>,
        init: RequestInit = {}
    ): Promise<Blob> {
        let query = "";
        if (params) {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    searchParams.append(key, String(value));
                }
            });
            const queryString = searchParams.toString();
            query = queryString ? `?${queryString}` : "";
        }

        const response = await this.http.request(getBaseUrl() + url + query, {
            ...init,
            credentials: "include",
            method: "GET",
        });

        if (!response.ok) {
            throw new Error(`文件下載失敗: ${response.status} ${response.statusText}`);
        }


        const blob = await response.blob();
        return blob;
    }
}
