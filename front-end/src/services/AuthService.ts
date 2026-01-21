import { BaseService } from "./BaseService";
import type { HttpActionResponse } from "./httpActionResponse";

interface LoginRequest {
    email: string;
    password: string;
}

interface LoginResponse {
    message: string;
    expiresIn: number;
}

export class AuthService extends BaseService {
    constructor() {
        super();
        // Override base URL for auth API
        this.baseURL = "http://localhost:5000/api";
    }

    async login(
        email: string,
        password: string
    ): Promise<HttpActionResponse<LoginResponse>> {
        const body: LoginRequest = {
            email,
            password,
        };

        return this.post("/auth/login", body);
    }

    async logout(): Promise<HttpActionResponse> {
        return this.post("/auth/logout");
    }
}
