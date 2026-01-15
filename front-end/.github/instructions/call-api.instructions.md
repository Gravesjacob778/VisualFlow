---
description: 'Standards and guidelines for generating API service code in TypeScript projects.'
applyTo: '**/*.ts'
---
# API Service Development Standards

This instruction file governs all code generation related to external API communication in this project. The project follows a decoupled architecture with Next.js frontend (without internal API routes) and external backend services (e.g., .NET).

## Prerequisites & Directory Structure

### Required Directory Structure
All API services MUST be placed in the `../services/` directory.

### Automated Pre-Generation Checks
Before generating any concrete API service (e.g., `UserService.ts`), verify the existence of:
- `../services/BaseService.ts`
- `../services/httpClient.ts`
- `../services/httpActionResponse.ts`

**Initialization Protocol**: 
- If the `../services/` directory does not exist, create it first.
- If `BaseService.ts` does not exist, create it according to the "BaseService Technical Specifications" below.

## BaseService Technical Specifications

When creating `BaseService`, it MUST include the following core logic:

### 1. Environment Variable Configuration
```typescript
// Use environment variable with fallback
const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5195/api';
```

### 2. Error Handling for Unauthorized Responses
- **Logic**: When API returns `401`, callers should handle the response and redirect to authentication flows as appropriate for the application.

### 3. Core HTTP Methods
All methods MUST include `credentials: "include"` to support cross-origin cookies:

- **GET, PUT, PATCH, DELETE**: Standard implementation with credentials
- **POST**: MUST automatically detect if `body` is `FormData` and dynamically set `Content-Type`
  - If `FormData`: Do NOT set `Content-Type` (browser handles it)
  - Otherwise: Set `Content-Type: application/json`
- **downloadFile**: Specialized method for file downloads, MUST return `Promise<Blob>`

### BaseService Implementation Template
```typescript
import { HttpActionResponse } from "@/services/httpActionResponse";

export class BaseService {
  protected baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5195/api';
  }

  protected async handleResponse(response: Response, endpoint: string): Promise<HttpActionResponse> {
    const data = await response.json().catch(() => null);
    return {
      isSuccess: response.ok,
      statusCode: response.status,
      message: data?.message || response.statusText,
      data: data,
    };
  }

  protected async get(endpoint: string): Promise<HttpActionResponse> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return this.handleResponse(response, endpoint);
  }

  protected async post(endpoint: string, body?: any): Promise<HttpActionResponse> {
    const isFormData = body instanceof FormData;
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      credentials: 'include',
      headers: isFormData ? {} : {
        'Content-Type': 'application/json',
      },
      body: isFormData ? body : JSON.stringify(body),
    });
    return this.handleResponse(response, endpoint);
  }

  protected async put(endpoint: string, body?: any): Promise<HttpActionResponse> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    return this.handleResponse(response, endpoint);
  }

  protected async patch(endpoint: string, body?: any): Promise<HttpActionResponse> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    return this.handleResponse(response, endpoint);
  }

  protected async delete(endpoint: string): Promise<HttpActionResponse> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return this.handleResponse(response, endpoint);
  }

  protected async downloadFile(endpoint: string): Promise<Blob> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }
    
    return await response.blob();
  }
}
```

## Environment Variables Configuration

### Required Environment Variables
Check for `.env` or `.env.local` in the project root directory.

If missing, remind the user to create it with:
```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend-api-url/api
```

**Important**: All client-side environment variables in Next.js MUST be prefixed with `NEXT_PUBLIC_`.

## API Service Implementation Rules

### 1. Naming Conventions
- Class names MUST have `Service` suffix (e.g., `OrderService`, `UserService`)
- File names MUST match class names (e.g., `OrderService.ts`)

### 2. RESTful Design Principles
Strictly follow RESTful conventions:

**✅ Correct Examples:**
```typescript
GET    /users           // Get all users
GET    /users/:id       // Get specific user
POST   /users           // Create new user
PUT    /users/:id       // Update entire user
PATCH  /users/:id       // Partial update user
DELETE /users/:id       // Delete user
```

**❌ Incorrect Examples:**
```typescript
POST   /deleteUser      // NEVER use verbs in URLs
GET    /getUserById/:id // NEVER use action verbs
POST   /createUser      // NEVER use CRUD verbs
```

### 3. Type Safety Requirements
- MUST import Request/Response types from `@/types` or custom interfaces
- NEVER use `any` type
- All API methods MUST return `Promise<HttpActionResponse>`

### 4. Single Responsibility Principle
Each Service file MUST handle only one domain:
- ✅ `ProductService` handles `/products` endpoints only
- ✅ `OrderService` handles `/orders` endpoints only
- ❌ `ApiService` handling multiple unrelated domains

## Concrete Service Implementation Examples

### Example 1: Basic CRUD Service
```typescript
import { BaseService } from "../services/BaseService";
import { HttpActionResponse } from "../services/httpActionResponse";
import { User, CreateUserRequest, UpdateUserRequest } from "@/types/user";

export class UserService extends BaseService {
  /**
   * Get all users
   */
  async getUsers(): Promise<HttpActionResponse> {
    return await this.get('/users');
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<HttpActionResponse> {
    return await this.get(`/users/${id}`);
  }

  /**
   * Create new user
   */
  async createUser(data: CreateUserRequest): Promise<HttpActionResponse> {
    return await this.post('/users', data);
  }

  /**
   * Update user
   */
  async updateUser(id: string, data: UpdateUserRequest): Promise<HttpActionResponse> {
    return await this.put(`/users/${id}`, data);
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<HttpActionResponse> {
    return await this.delete(`/users/${id}`);
  }
}
```

### Example 2: Service with File Upload
```typescript
import { BaseService } from "../services/BaseService";
import { HttpActionResponse } from "../services/httpActionResponse";

export class ProductService extends BaseService {
  /**
   * Upload product image (handles FormData)
   */
  async uploadProductImage(productId: string, file: File): Promise<HttpActionResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('productId', productId);
    
    // POST method will automatically detect FormData
    return await this.post('/products/upload', formData);
  }

  /**
   * Export product list as Excel
   */
  async exportProducts(): Promise<Blob> {
    return await this.downloadFile('/products/export');
  }
}
```

### Example 3: Service with Query Parameters
```typescript
import { BaseService } from "../services/BaseService";
import { HttpActionResponse } from "../services/httpActionResponse";
import { OrderFilter, OrderResponse } from "@/types/order";

export class OrderService extends BaseService {
  /**
   * Get filtered orders with pagination
   */
  async getOrders(filter: OrderFilter): Promise<HttpActionResponse> {
    const params = new URLSearchParams({
      page: filter.page?.toString() || '1',
      pageSize: filter.pageSize?.toString() || '10',
      status: filter.status || '',
      startDate: filter.startDate || '',
      endDate: filter.endDate || '',
    });
    
    return await this.get(`/orders?${params.toString()}`);
  }
}
```

## Error Handling Requirements

### HttpActionResponse Structure
All API responses MUST conform to this structure:

```typescript
interface HttpActionResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  data?: any;
}
```

### Client-Side Usage Pattern
```typescript
const userService = new UserService();
const response = await userService.getUserById('123');

if (response.isSuccess) {
  // Handle success
  console.log(response.data);
} else {
  // Handle error
  console.error(response.message);
}
```

## Security Considerations

1. **Credentials**: Always include `credentials: "include"` for cookie-based authentication
2. **CORS**: Backend must be configured to accept credentials from frontend origin
4. **Sensitive Data**: Never log sensitive information in production

## Code Generation Workflow

When a developer requests API service generation, follow these steps:

1. **Verify Prerequisites**: Check for BaseService, httpClient, and httpActionResponse
2. **Create Missing Files**: Generate any missing infrastructure files first
3. **Determine Domain**: Identify the domain/resource (e.g., users, products, orders)
4. **Design Endpoints**: Apply RESTful principles to endpoint design
5. **Define Types**: Create or import TypeScript interfaces for request/response
6. **Implement Service**: Extend BaseService with domain-specific methods
7. **Add JSDoc**: Document each method with clear descriptions
8. **Export Service**: Ensure proper exports in index files

## Quality Checklist

Before finalizing any generated API service, verify:

- ✅ Extends BaseService
- ✅ Uses TypeScript with proper types (no `any`)
- ✅ Follows RESTful conventions
- ✅ Returns `Promise<HttpActionResponse>`
- ✅ Includes JSDoc comments
- ✅ Single responsibility (one domain per service)
- ✅ Proper error handling through BaseService
- ✅ Credentials included in all requests

## Examples of Common Mistakes to Avoid

❌ **Using `any` type:**
```typescript
async getUser(id: any): Promise<any> { // WRONG
```

❌ **Verbs in URLs:**
```typescript
async deleteUser(id: string) {
  return await this.post('/deleteUser', { id }); // WRONG
}
```

❌ **Missing credentials:**
```typescript
fetch(url, { method: 'GET' }); // WRONG - missing credentials
```

❌ **Multiple domains in one service:**
```typescript
class ApiService {
  async getUsers() { ... }
  async getProducts() { ... } // WRONG - mixed domains
}
```

✅ **Correct approach:**
```typescript
class UserService {
  async getUsers(): Promise<HttpActionResponse> {
    return await this.get('/users');
  }
}

class ProductService {
  async getProducts(): Promise<HttpActionResponse> {
    return await this.get('/products');
  }
}
```

## Summary

This instruction file ensures consistent, type-safe, and secure API communication across the entire project. All generated code must follow these standards to maintain code quality and architectural integrity.
