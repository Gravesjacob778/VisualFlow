export interface HttpActionResponse {
    isSuccess: boolean;
    statusCode: number;
    message: string;
    data?: unknown;
}
