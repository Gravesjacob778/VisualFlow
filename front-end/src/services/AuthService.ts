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

    async login(
        email: string,
        password: string
    ): Promise<HttpActionResponse> {
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
