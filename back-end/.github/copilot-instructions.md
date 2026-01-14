# VisualFlow Backend - AI Coding Guidelines

## Architecture Overview

This is a **.NET Clean Architecture** solution with strict layer separation:

```
Domain ← Application ← Infrastructure
              ↑
           WebApi (composition root)
```

**Key Principle**: Dependencies flow inward. Domain has zero external dependencies.

## Layer Responsibilities & Patterns

### Domain Layer (`src/VisualFlow.Domain/`)
- **Entities**: Inherit from `BaseEntity` (Id, CreatedAt, ModifiedAt, audit fields) or `AuditableEntity`
- **Exceptions**: Use `NotFoundException`, `DomainException`, `ValidationException` for domain errors
- **Interfaces**: Define `IRepository<T>` and `IUnitOfWork` here, implement in Infrastructure

### Application Layer (`src/VisualFlow.Application/`)
- **CQRS Pattern**: Use MediatR - Commands for writes, Queries for reads
- **Feature Organization**: Place handlers in `Features/{FeatureName}/Commands/` or `Queries/`
- **Validation**: Create FluentValidation validators alongside handlers (auto-registered)
- **Pipeline Behaviors** (order matters in `DependencyInjection.cs`):
  1. `UnhandledExceptionBehaviour` - Global exception logging
  2. `LoggingBehaviour` - Request/response logging
  3. `ValidationBehaviour` - FluentValidation execution
  4. `PerformanceBehaviour` - Long-running request alerts

### Infrastructure Layer (`src/VisualFlow.Infrastructure/`)
- **DbContext**: `ApplicationDbContext` auto-populates audit fields on `SaveChangesAsync`
- **Repository Pattern**: Generic `Repository<T>` for basic CRUD, extend for complex queries
- **Service Registration**: Add new services in `DependencyInjection.AddInfrastructure()`

### WebApi Layer (`src/VisualFlow.WebApi/`)
- **Controllers**: Inherit from `BaseApiController` which provides `Mediator` property
- **Exception Handling**: `ExceptionHandlingMiddleware` converts domain exceptions to HTTP responses
- **Service Registration**: Compose all layers in `Program.cs`

## Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Command | `{Action}{Entity}Command` | `CreateOrderCommand`, `UpdateUserCommand` |
| Query | `Get{Entity}[By{Criteria}]Query` | `GetOrderByIdQuery`, `GetUsersQuery` |
| Handler | `{Command/Query}Handler` | `CreateOrderCommandHandler` |
| Validator | `{Command/Query}Validator` | `CreateOrderCommandValidator` |
| DTO | `{Entity}Dto` or `{Entity}{Purpose}Dto` | `OrderDto`, `OrderSummaryDto` |
| Repository | `I{Entity}Repository` | `IOrderRepository` |
| Controller | `{Entity}Controller` (plural route) | `OrdersController` → `/api/orders` |

## Code Patterns

### Creating a New Feature
```csharp
// 1. Command in Application/Features/{Feature}/Commands/
public record CreateItemCommand(string Name) : IRequest<Result<Guid>>;

// 2. Handler in same folder
public class CreateItemCommandHandler : IRequestHandler<CreateItemCommand, Result<Guid>>

// 3. Validator in same folder (auto-registered)
public class CreateItemCommandValidator : AbstractValidator<CreateItemCommand>

// 4. Controller endpoint uses Mediator
[HttpPost]
public async Task<IActionResult> Create(CreateItemCommand command)
    => Ok(await Mediator.Send(command));
```

### Return Types
- Use `Result<T>` or `Result` from `Application.Common.Models` for operation outcomes
- Throw `NotFoundException` for missing entities (auto-converted to 404)
- Throw `FluentValidation.ValidationException` for validation (auto-converted to 400)

### API Response Format
```json
// Success (200/201)
{ "isSuccess": true, "value": { ... }, "statusCode": 200 }

// Validation Error (400)
{ "statusCode": 400, "message": "Validation failed", "errors": { "Name": ["Name is required"] } }

// Not Found (404)
{ "statusCode": 404, "message": "Entity 'Order' (id) was not found." }
```

## Testing Strategy

### Unit Tests (`tests/VisualFlow.*.UnitTests/`)
- Test handlers in isolation with mocked `IRepository<T>`, `IUnitOfWork`
- Use `FluentAssertions` for assertions: `result.Should().BeEquivalentTo(expected)`
- Name pattern: `{MethodName}_Should{ExpectedBehavior}_When{Condition}`

### Integration Tests (`tests/VisualFlow.Application.IntegrationTests/`)
- Use `WebApplicationFactory<Program>` for API tests
- Use in-memory database for data layer tests
- Test the full pipeline including validation and middleware

```csharp
// Example test structure
[Fact]
public async Task CreateOrder_ShouldReturnCreated_WhenValidRequest()
{
    // Arrange
    var command = new CreateOrderCommand("Test");
    
    // Act
    var result = await _handler.Handle(command, CancellationToken.None);
    
    // Assert
    result.IsSuccess.Should().BeTrue();
    result.Value.Should().NotBeEmpty();
}
```

## Git Workflow

### Branch Naming
- `feature/{ticket-id}-{short-description}` - New features
- `bugfix/{ticket-id}-{short-description}` - Bug fixes
- `hotfix/{description}` - Production urgent fixes
- `refactor/{description}` - Code improvements

### Commit Message Format
```
{type}({scope}): {subject}

Types: feat, fix, refactor, test, docs, chore
Scope: domain, application, infrastructure, api, tests

Examples:
feat(application): add CreateOrder command handler
fix(api): handle null reference in OrdersController
test(application): add unit tests for OrderValidator
```

## Commands

```bash
# Build
dotnet build

# Run API (Swagger at /swagger)
dotnet run --project src/VisualFlow.WebApi

# Run all tests
dotnet test

# Run tests with coverage
dotnet test --collect:"XPlat Code Coverage"

# EF Migrations
dotnet ef migrations add {Name} --project src/VisualFlow.Infrastructure --startup-project src/VisualFlow.WebApi
dotnet ef database update --project src/VisualFlow.Infrastructure --startup-project src/VisualFlow.WebApi

# Docker
docker-compose -f docker/docker-compose.yml up -d
```

## Key Files Reference
- DI Setup: [src/VisualFlow.Application/DependencyInjection.cs](src/VisualFlow.Application/DependencyInjection.cs), [src/VisualFlow.Infrastructure/DependencyInjection.cs](src/VisualFlow.Infrastructure/DependencyInjection.cs)
- Base Entity: [src/VisualFlow.Domain/Entities/BaseEntity.cs](src/VisualFlow.Domain/Entities/BaseEntity.cs)
- Pipeline Behaviors: [src/VisualFlow.Application/Common/Behaviours/](src/VisualFlow.Application/Common/Behaviours/)
- Exception Middleware: [src/VisualFlow.WebApi/Middleware/ExceptionHandlingMiddleware.cs](src/VisualFlow.WebApi/Middleware/ExceptionHandlingMiddleware.cs)
