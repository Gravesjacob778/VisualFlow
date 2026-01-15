---
description: 'Guidelines for building REST APIs with ASP.NET'
applyTo: '**/*.cs, **/*.json'
---
## Instructions 

This document provides guidelines for building REST APIs in the **VisualFlow** project. The project uses **.NET 10 Clean Architecture** with MediatR for CQRS pattern. All REST API development MUST follow these conventions to maintain consistency and quality.

---

## API Design Fundamentals

### RESTful Conventions
- Use **nouns** for resource names, not verbs: `/api/orders` not `/api/getOrders`
- Use **plural** names for collections: `/api/users`, `/api/workflows`
- Use **kebab-case** for multi-word resources: `/api/workflow-executions`
- Nest resources to show relationships: `/api/workflows/{workflowId}/nodes`

### HTTP Methods
| Method | Usage | Success Code | Example |
|--------|-------|--------------|---------|
| GET | Retrieve resource(s) | 200 OK | `GET /api/orders/{id}` |
| POST | Create new resource | 201 Created | `POST /api/orders` |
| PUT | Full update of resource | 200 OK or 204 No Content | `PUT /api/orders/{id}` |
| PATCH | Partial update | 200 OK | `PATCH /api/orders/{id}` |
| DELETE | Remove resource | 204 No Content | `DELETE /api/orders/{id}` |

### Resource Naming in VisualFlow
- Controller class: `{Entity}Controller` (singular) → Route: `/api/{entities}` (plural)
- Example: `WorkflowController` → `/api/workflows`

### Query Parameters for Collections
- Pagination: `?pageNumber=1&pageSize=20`
- Sorting: `?sortBy=createdAt&sortDirection=desc`
- Filtering: `?status=active&createdAfter=2024-01-01`
- Searching: `?searchTerm=keyword`

---

## Project Setup and Structure

### Layer Dependencies (Clean Architecture)
```
Domain ← Application ← Infrastructure
              ↑
           WebApi (composition root)
```

### File Organization for New Features
When creating a new REST API endpoint, create files in this order:

1. **Domain Entity** (if new): `src/VisualFlow.Domain/Entities/{Entity}.cs`
2. **Command/Query**: `src/VisualFlow.Application/Features/{Feature}/Commands/` or `Queries/`
3. **Handler**: Same folder as Command/Query
4. **Validator**: Same folder as Command/Query
5. **DTO** (if needed): `src/VisualFlow.Application/Features/{Feature}/Dtos/`
6. **Controller Endpoint**: `src/VisualFlow.WebApi/Controllers/{Entity}Controller.cs`

### Feature Folder Structure Example
```
src/VisualFlow.Application/Features/Workflows/
├── Commands/
│   ├── CreateWorkflow/
│   │   ├── CreateWorkflowCommand.cs
│   │   ├── CreateWorkflowCommandHandler.cs
│   │   └── CreateWorkflowCommandValidator.cs
│   └── UpdateWorkflow/
│       └── ...
├── Queries/
│   ├── GetWorkflowById/
│   │   ├── GetWorkflowByIdQuery.cs
│   │   └── GetWorkflowByIdQueryHandler.cs
│   └── GetWorkflows/
│       └── ...
└── Dtos/
    ├── WorkflowDto.cs
    └── WorkflowSummaryDto.cs
```

---

## Building Controller-Based APIs

### Controller Requirements
- **MUST** inherit from `BaseApiController` (provides `Mediator` property)
- **MUST** use MediatR to dispatch commands/queries
- **MUST NOT** contain business logic - controllers are thin orchestrators
- **MUST** include XML documentation comments for Swagger

### Controller Template
```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VisualFlow.Application.Features.{Feature}.Commands.Create{Entity};
using VisualFlow.Application.Features.{Feature}.Commands.Update{Entity};
using VisualFlow.Application.Features.{Feature}.Commands.Delete{Entity};
using VisualFlow.Application.Features.{Feature}.Queries.Get{Entity}ById;
using VisualFlow.Application.Features.{Feature}.Queries.Get{Entities};

namespace VisualFlow.WebApi.Controllers;

/// <summary>
/// Manages {Entity} resources.
/// </summary>
[Authorize]
public class {Entities}Controller : BaseApiController
{
    /// <summary>
    /// Gets all {entities} with pagination.
    /// </summary>
    /// <param name="query">Pagination and filter parameters</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Paginated list of {entities}</returns>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] Get{Entities}Query query, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Gets a specific {entity} by ID.
    /// </summary>
    /// <param name="id">The {entity} ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The {entity} details</returns>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new Get{Entity}ByIdQuery(id), cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Creates a new {entity}.
    /// </summary>
    /// <param name="command">The create command</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The created {entity} ID</returns>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] Create{Entity}Command command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Value }, result);
    }

    /// <summary>
    /// Updates an existing {entity}.
    /// </summary>
    /// <param name="id">The {entity} ID</param>
    /// <param name="command">The update command</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(Guid id, [FromBody] Update{Entity}Command command, CancellationToken cancellationToken)
    {
        if (id != command.Id)
            return BadRequest("ID mismatch");
        
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Deletes a {entity}.
    /// </summary>
    /// <param name="id">The {entity} ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await Mediator.Send(new Delete{Entity}Command(id), cancellationToken);
        return NoContent();
    }
}
```

### Command/Query Patterns

**Command (for writes):**
```csharp
// Command Definition
public record Create{Entity}Command(
    string Name,
    string Description
) : IRequest<Result<Guid>>;

// Handler
public class Create{Entity}CommandHandler : IRequestHandler<Create{Entity}Command, Result<Guid>>
{
    private readonly IRepository<{Entity}> _repository;
    private readonly IUnitOfWork _unitOfWork;

    public Create{Entity}CommandHandler(IRepository<{Entity}> repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Guid>> Handle(Create{Entity}Command request, CancellationToken cancellationToken)
    {
        var entity = new {Entity}(request.Name, request.Description);
        
        await _repository.AddAsync(entity, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        
        return Result<Guid>.Success(entity.Id, 201);
    }
}

// Validator (auto-registered via FluentValidation)
public class Create{Entity}CommandValidator : AbstractValidator<Create{Entity}Command>
{
    public Create{Entity}CommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required")
            .MaximumLength(200).WithMessage("Name must not exceed 200 characters");
            
        RuleFor(x => x.Description)
            .MaximumLength(1000).WithMessage("Description must not exceed 1000 characters");
    }
}
```

**Query (for reads):**
```csharp
// Query Definition
public record Get{Entity}ByIdQuery(Guid Id) : IRequest<{Entity}Dto>;

// Handler
public class Get{Entity}ByIdQueryHandler : IRequestHandler<Get{Entity}ByIdQuery, {Entity}Dto>
{
    private readonly IRepository<{Entity}> _repository;
    private readonly IMapper _mapper;

    public Get{Entity}ByIdQueryHandler(IRepository<{Entity}> repository, IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task<{Entity}Dto> Handle(Get{Entity}ByIdQuery request, CancellationToken cancellationToken)
    {
        var entity = await _repository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof({Entity}), request.Id);
            
        return _mapper.Map<{Entity}Dto>(entity);
    }
}
```

### Pagination Query Pattern
```csharp
public record Get{Entities}Query(
    int PageNumber = 1,
    int PageSize = 20,
    string? SearchTerm = null,
    string? SortBy = "CreatedAt",
    bool SortDescending = true
) : IRequest<PaginatedList<{Entity}Dto>>;
```

---

## Authentication and Authorization

### JWT Authentication
This project uses JWT Bearer authentication configured in `Program.cs`. JWT settings are in `appsettings.json`.

### Authorization Attributes
```csharp
// Require authenticated user (default for most endpoints)
[Authorize]

// Allow anonymous access (for public endpoints like login)
[AllowAnonymous]

// Require specific role
[Authorize(Roles = "Admin")]

// Require specific policy
[Authorize(Policy = "CanManageWorkflows")]
```

### Accessing Current User
Use `ICurrentUserService` (registered in DI) to get the current user's information:
```csharp
public class SomeCommandHandler : IRequestHandler<SomeCommand, Result>
{
    private readonly ICurrentUserService _currentUserService;
    
    public async Task<Result> Handle(SomeCommand request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        var userName = _currentUserService.UserName;
        // Use for audit, filtering by owner, etc.
    }
}
```

### Authorization Best Practices
- Apply `[Authorize]` at controller level, use `[AllowAnonymous]` for exceptions
- Create resource-based authorization handlers for complex scenarios
- Never trust client-side user IDs - always use `ICurrentUserService`

---

## Validation and Error Handling

### FluentValidation Rules
Validators are **auto-registered** via `services.AddValidatorsFromAssembly()` in `DependencyInjection.cs`.

**Common Validation Rules:**
```csharp
public class Create{Entity}CommandValidator : AbstractValidator<Create{Entity}Command>
{
    private readonly IRepository<{Entity}> _repository;
    
    public Create{Entity}CommandValidator(IRepository<{Entity}> repository)
    {
        _repository = repository;
        
        // Required field
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required");
        
        // String length
        RuleFor(x => x.Name)
            .MaximumLength(200).WithMessage("Name must not exceed 200 characters");
        
        // Email format
        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Invalid email format");
        
        // Enum validation
        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Invalid status value");
        
        // Custom async validation (e.g., uniqueness check)
        RuleFor(x => x.Name)
            .MustAsync(BeUniqueName).WithMessage("Name already exists");
        
        // Conditional validation
        When(x => x.Type == EntityType.Special, () =>
        {
            RuleFor(x => x.SpecialField)
                .NotEmpty().WithMessage("Special field is required for special type");
        });
    }
    
    private async Task<bool> BeUniqueName(string name, CancellationToken cancellationToken)
    {
        var existing = await _repository.FindAsync(x => x.Name == name, cancellationToken);
        return !existing.Any();
    }
}
```

### Exception Handling
The `ExceptionHandlingMiddleware` automatically converts exceptions to proper HTTP responses:

| Exception Type | HTTP Status | Usage |
|----------------|-------------|-------|
| `ValidationException` (FluentValidation) | 400 Bad Request | Validation failures |
| `DomainValidationException` | 400 Bad Request | Domain rule violations with details |
| `DomainException` | 400 Bad Request | General domain errors |
| `NotFoundException` | 404 Not Found | Entity not found |
| `UnauthorizedAccessException` | 401 Unauthorized | Access denied |
| Other exceptions | 500 Internal Server Error | Unexpected errors |

### Throwing Exceptions in Handlers
```csharp
// Entity not found
var entity = await _repository.GetByIdAsync(id, cancellationToken)
    ?? throw new NotFoundException(nameof(Workflow), id);

// Domain validation error
if (entity.Status == Status.Completed)
    throw new DomainException("Cannot modify a completed workflow");

// Domain validation with multiple errors
var errors = new Dictionary<string, string[]>
{
    { "Status", new[] { "Invalid status transition" } },
    { "Amount", new[] { "Amount exceeds limit" } }
};
throw new DomainValidationException("Validation failed", errors);
```

### Standard API Response Format
**Success Response (200/201):**
```json
{
  "isSuccess": true,
  "value": { /* response data */ },
  "statusCode": 200
}
```

**Validation Error Response (400):**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": {
    "Name": ["Name is required", "Name must not exceed 200 characters"],
    "Email": ["Invalid email format"]
  }
}
```

**Not Found Response (404):**
```json
{
  "statusCode": 404,
  "message": "Entity \"Workflow\" (550e8400-e29b-41d4-a716-446655440000) was not found."
}
```

---

## Logging and Monitoring

### Serilog Configuration
This project uses **Serilog** for structured logging. Configuration is in `appsettings.json`.

### Logging in Handlers
```csharp
public class Create{Entity}CommandHandler : IRequestHandler<Create{Entity}Command, Result<Guid>>
{
    private readonly ILogger<Create{Entity}CommandHandler> _logger;
    
    public async Task<Result<Guid>> Handle(Create{Entity}Command request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Creating {Entity} with name: {Name}", nameof({Entity}), request.Name);
        
        try
        {
            // ... operation
            _logger.LogInformation("{Entity} created successfully with ID: {Id}", nameof({Entity}), entity.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create {Entity} with name: {Name}", nameof({Entity}), request.Name);
            throw;
        }
    }
}
```

### Pipeline Behaviors for Cross-Cutting Concerns
The following behaviors are registered in order (defined in `Application/DependencyInjection.cs`):

1. **`UnhandledExceptionBehaviour`** - Logs unhandled exceptions with request details
2. **`LoggingBehaviour`** - Logs request/response information
3. **`ValidationBehaviour`** - Executes FluentValidation validators
4. **`PerformanceBehaviour`** - Logs warnings for slow requests (>500ms)

### Health Checks
Use the existing `HealthController` pattern for health endpoints:
- `GET /api/health` - Basic health check
- `GET /api/health/details` - Detailed health with environment info

---

## Testing REST APIs

### Unit Test Structure
Location: `tests/VisualFlow.Application.UnitTests/`

**Handler Unit Test Pattern:**
```csharp
public class Create{Entity}CommandHandlerTests
{
    private readonly Mock<IRepository<{Entity}>> _repositoryMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Create{Entity}CommandHandler _handler;

    public Create{Entity}CommandHandlerTests()
    {
        _repositoryMock = new Mock<IRepository<{Entity}>>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _handler = new Create{Entity}CommandHandler(_repositoryMock.Object, _unitOfWorkMock.Object);
    }

    [Fact]
    public async Task Handle_ValidCommand_ReturnsSuccessResultWithId()
    {
        // Arrange
        var command = new Create{Entity}Command("Test Name", "Test Description");
        
        // Act
        var result = await _handler.Handle(command, CancellationToken.None);
        
        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeEmpty();
        result.StatusCode.Should().Be(201);
        
        _repositoryMock.Verify(r => r.AddAsync(It.IsAny<{Entity}>(), It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_EntityNotFound_ThrowsNotFoundException()
    {
        // Arrange
        var query = new Get{Entity}ByIdQuery(Guid.NewGuid());
        _repositoryMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((({Entity}?)null));
        
        // Act & Assert
        await FluentActions.Invoking(() => _handler.Handle(query, CancellationToken.None))
            .Should().ThrowAsync<NotFoundException>();
    }
}
```

### Integration Test Structure
Location: `tests/VisualFlow.Application.IntegrationTests/`

**API Integration Test Pattern:**
```csharp
public class {Entities}ControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    private readonly WebApplicationFactory<Program> _factory;

    public {Entities}ControllerTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Replace real DbContext with in-memory
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
                if (descriptor != null) services.Remove(descriptor);
                
                services.AddDbContext<ApplicationDbContext>(options =>
                    options.UseInMemoryDatabase("TestDb"));
            });
        });
        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task GetAll_ReturnsOkWithPaginatedList()
    {
        // Arrange & Act
        var response = await _client.GetAsync("/api/{entities}");
        
        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var content = await response.Content.ReadFromJsonAsync<PaginatedList<{Entity}Dto>>();
        content.Should().NotBeNull();
    }

    [Fact]
    public async Task Create_ValidRequest_ReturnsCreated()
    {
        // Arrange
        var command = new { Name = "Test", Description = "Test Description" };
        
        // Act
        var response = await _client.PostAsJsonAsync("/api/{entities}", command);
        
        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task Create_InvalidRequest_ReturnsBadRequest()
    {
        // Arrange
        var command = new { Name = "", Description = "Test" }; // Empty name
        
        // Act
        var response = await _client.PostAsJsonAsync("/api/{entities}", command);
        
        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
```

### Test Naming Convention
`{MethodName}_Should{ExpectedBehavior}_When{Condition}`

Examples:
- `Handle_ShouldReturnSuccessResult_WhenCommandIsValid`
- `Handle_ShouldThrowNotFoundException_WhenEntityDoesNotExist`
- `GetById_ShouldReturn404_WhenIdDoesNotExist`

---

## Performance Optimization

### Query Optimization
- Use `AsNoTracking()` for read-only queries
- Use projection with `Select()` instead of loading full entities
- Implement pagination for all list endpoints using `PaginatedList<T>`
- Use `Include()` strategically to avoid N+1 queries

```csharp
// Efficient query with projection
public async Task<PaginatedList<{Entity}Dto>> Handle(Get{Entities}Query request, CancellationToken cancellationToken)
{
    var query = _context.{Entities}
        .AsNoTracking()
        .Where(e => string.IsNullOrEmpty(request.SearchTerm) || e.Name.Contains(request.SearchTerm))
        .OrderByDescending(e => e.CreatedAt)
        .Select(e => new {Entity}Dto
        {
            Id = e.Id,
            Name = e.Name,
            CreatedAt = e.CreatedAt
        });
    
    return await PaginatedList<{Entity}Dto>.CreateAsync(query, request.PageNumber, request.PageSize);
}
```

### Caching Strategies
- Use `IMemoryCache` for frequently accessed, rarely changed data
- Consider `IDistributedCache` for multi-instance deployments
- Cache lookups (e.g., enum-like reference data), not business entities

### Async/Await Best Practices
- **ALWAYS** use `async/await` for I/O operations
- **ALWAYS** pass `CancellationToken` through the entire call chain
- **NEVER** use `.Result` or `.Wait()` - causes deadlocks

---

## Deployment and DevOps

### Docker Support
Docker configuration files are in the `docker/` folder:
- `Dockerfile` - Multi-stage build for production
- `docker-compose.yml` - Development environment
- `docker-compose.prod.yml` - Production environment

### Environment Configuration
- Use `appsettings.json` for default/shared settings
- Use `appsettings.{Environment}.json` for environment-specific settings
- Use environment variables for secrets in production (never commit secrets)

### Configuration Priorities
1. Environment variables (highest priority)
2. `appsettings.{Environment}.json`
3. `appsettings.json` (lowest priority)

### Health Check Endpoints for Orchestrators
Ensure these endpoints are available for container orchestration:
- `/api/health` - Liveness probe
- `/api/health/details` - Readiness probe (includes dependency checks)

### Database Migrations
```bash
# Create migration
dotnet ef migrations add {MigrationName} -p src/VisualFlow.Infrastructure -s src/VisualFlow.WebApi

# Apply migration
dotnet ef database update -p src/VisualFlow.Infrastructure -s src/VisualFlow.WebApi
```

---

## API Versioning (Future Consideration)

When API versioning becomes necessary, implement using URL path versioning:
- `/api/v1/workflows`
- `/api/v2/workflows`

Use `Microsoft.AspNetCore.Mvc.Versioning` package for implementation.