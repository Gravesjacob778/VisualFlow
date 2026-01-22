import { BaseService } from "./BaseService";
import type { HttpActionResponse } from "./httpActionResponse";

interface LoginRequest {
    email: string;
    password: string;
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

        return super.post("/auth/login", body);
    }

    async logout(): Promise<HttpActionResponse> {
        return super.post("/auth/logout");
    }
}
