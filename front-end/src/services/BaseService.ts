import { buildUrl, parseJson } from "@/services/httpClient";
import type { HttpActionResponse } from "@/services/httpActionResponse";

export class BaseService {
    protected baseURL: string;

    constructor() {
        this.baseURL =
            process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5195/api";
    }

    protected async handleResponse(
        response: Response,
        endpoint: string
    ): Promise<HttpActionResponse> {

        const data = await parseJson(response);

        return {
            isSuccess: response.ok,
            statusCode: response.status,
            message:
                (data as { message?: string } | null)?.message || response.statusText,
            data,
        };
    }

    protected async get(endpoint: string): Promise<HttpActionResponse> {
        const response = await fetch(buildUrl(this.baseURL, endpoint), {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        });

        return this.handleResponse(response, endpoint);
    }

    protected async post(
        endpoint: string,
        body?: unknown
    ): Promise<HttpActionResponse> {
        const isFormData = body instanceof FormData;

        const response = await fetch(buildUrl(this.baseURL, endpoint), {
            method: "POST",
            credentials: "include",
            headers: isFormData
                ? {}
                : {
                    "Content-Type": "application/json",
                },
            body: isFormData ? body : JSON.stringify(body),
        });

        return this.handleResponse(response, endpoint);
    }

    protected async put(
        endpoint: string,
        body?: unknown
    ): Promise<HttpActionResponse> {
        const response = await fetch(buildUrl(this.baseURL, endpoint), {
            method: "PUT",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        return this.handleResponse(response, endpoint);
    }

    protected async patch(
        endpoint: string,
        body?: unknown
    ): Promise<HttpActionResponse> {
        const response = await fetch(buildUrl(this.baseURL, endpoint), {
            method: "PATCH",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        return this.handleResponse(response, endpoint);
    }

    protected async delete(endpoint: string): Promise<HttpActionResponse> {
        const response = await fetch(buildUrl(this.baseURL, endpoint), {
            method: "DELETE",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        });

        return this.handleResponse(response, endpoint);
    }

    protected async downloadFile(endpoint: string): Promise<Blob> {
        const response = await fetch(buildUrl(this.baseURL, endpoint), {
            method: "GET",
            credentials: "include",
        });

        if (!response.ok) {
            throw new Error(`Download failed: ${response.statusText}`);
        }

        return await response.blob();
    }
}
