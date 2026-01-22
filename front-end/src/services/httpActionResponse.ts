export interface HttpActionResponse {
    success: boolean;
    statusCode: number;
    message: string;
    data?: any;
}
