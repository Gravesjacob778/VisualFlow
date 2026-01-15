import { BaseService } from "@/services/BaseService";
import type { HttpActionResponse } from "@/services/httpActionResponse";
import type {
    StartWorkflowExecutionRequest,
    WorkflowExecutionQuery,
} from "@/types/execution";

export class WorkflowExecutionService extends BaseService {
    /**
     * Start a workflow execution
     */
    async startExecution(
        request: StartWorkflowExecutionRequest
    ): Promise<HttpActionResponse> {
        return this.post(`/workflows/${request.workflowId}/executions`, {
            variables: request.variables ?? {},
            trigger: request.trigger,
        });
    }

    /**
     * Get a single execution by ID
     */
    async getExecution(
        workflowId: string,
        executionId: string
    ): Promise<HttpActionResponse> {
        return this.get(`/workflows/${workflowId}/executions/${executionId}`);
    }

    /**
     * List executions for a workflow
     */
    async listExecutions(
        workflowId: string,
        query?: WorkflowExecutionQuery
    ): Promise<HttpActionResponse> {
        if (!query) {
            return this.get(`/workflows/${workflowId}/executions`);
        }

        const params = new URLSearchParams();

        if (query.status) {
            params.set("status", query.status);
        }

        if (query.from) {
            params.set("from", query.from);
        }

        if (query.to) {
            params.set("to", query.to);
        }

        if (query.page) {
            params.set("page", query.page.toString());
        }

        if (query.pageSize) {
            params.set("pageSize", query.pageSize.toString());
        }

        const queryString = params.toString();
        return this.get(
            `/workflows/${workflowId}/executions${queryString ? `?${queryString}` : ""
            }`
        );
    }

    /**
     * Cancel a running workflow execution
     */
    async cancelExecution(
        workflowId: string,
        executionId: string
    ): Promise<HttpActionResponse> {
        return this.delete(`/workflows/${workflowId}/executions/${executionId}`);
    }
}
