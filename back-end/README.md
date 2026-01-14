# VisualFlow - Clean Architecture Web API

A production-ready .NET 8 Web API built with Clean Architecture principles, following Domain-Driven Design (DDD) practices.

## 🏗️ Architecture

This solution follows Clean Architecture with proper separation of concerns:

```
VisualFlow/
├── src/
│   ├── VisualFlow.Domain/          # Core business logic, entities, value objects
│   ├── VisualFlow.Application/     # Use cases, CQRS handlers, validators
│   ├── VisualFlow.Infrastructure/  # Data access, external services
│   └── VisualFlow.WebApi/          # API endpoints, middleware
├── tests/
│   ├── VisualFlow.Domain.UnitTests/
│   ├── VisualFlow.Application.UnitTests/
│   └── VisualFlow.Application.IntegrationTests/
└── docker/
    ├── Dockerfile
    └── docker-compose.yml
```

### Layer Dependencies

```
WebApi → Application → Domain
           ↓
      Infrastructure
```

- **Domain**: Contains entities, value objects, domain events, exceptions, and repository interfaces. No external dependencies.
- **Application**: Contains use cases (commands/queries), validators, behaviors, and DTOs. Depends only on Domain.
- **Infrastructure**: Contains data access implementations, external service integrations. Depends on Application.
- **WebApi**: API controllers, middleware, and configuration. Depends on Application and Infrastructure (for DI setup).

## 🛠️ Technologies

- **.NET 8** - Latest LTS version
- **Entity Framework Core** - ORM for data access
- **MediatR** - CQRS and Mediator pattern implementation
- **FluentValidation** - Input validation
- **AutoMapper** - Object-to-object mapping
- **Serilog** - Structured logging
- **Swashbuckle** - Swagger/OpenAPI documentation
- **JWT Bearer** - Authentication
- **xUnit** - Testing framework
- **Moq** - Mocking library
- **FluentAssertions** - Assertion library

## 📋 Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [SQL Server](https://www.microsoft.com/sql-server) (LocalDB, Express, or full version)
- [Docker](https://www.docker.com/) (optional, for containerized deployment)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/visualflow.git
cd visualflow/back-end
```

### 2. Update Configuration

Update the connection string in `src/VisualFlow.WebApi/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=VisualFlowDb;Trusted_Connection=true"
  }
}
```

### 3. Run Migrations

```bash
dotnet ef migrations add InitialCreate --project src/VisualFlow.Infrastructure --startup-project src/VisualFlow.WebApi
dotnet ef database update --project src/VisualFlow.Infrastructure --startup-project src/VisualFlow.WebApi
```

### 4. Run the Application

```bash
dotnet run --project src/VisualFlow.WebApi
```

Navigate to `https://localhost:5001/swagger` to access the Swagger UI.

## 🐳 Docker Deployment

### Development

```bash
cd docker
docker-compose up -d
```

### Production

```bash
cd docker
cp .env.example .env
# Edit .env with production values
docker-compose -f docker-compose.prod.yml up -d
```

## 🧪 Running Tests

```bash
# Run all tests
dotnet test

# Run specific test project
dotnet test tests/VisualFlow.Application.UnitTests

# Run with coverage
dotnet test --collect:"XPlat Code Coverage"
```

## 📁 Project Structure Details

### Domain Layer

- `Entities/` - Domain entities with base classes
- `ValueObjects/` - Immutable value objects
- `Events/` - Domain events
- `Exceptions/` - Domain-specific exceptions
- `Interfaces/` - Repository and service interfaces

### Application Layer

- `Common/`
  - `Behaviours/` - MediatR pipeline behaviors (logging, validation, performance)
  - `Interfaces/` - Application service interfaces
  - `Models/` - Common models (Result, PaginatedList)
- `Features/` - Feature-based organization
  - `[Feature]/Commands/` - Write operations
  - `[Feature]/Queries/` - Read operations
- `DTOs/` - Data transfer objects

### Infrastructure Layer

- `Persistence/`
  - `ApplicationDbContext.cs` - EF Core DbContext
  - `Configurations/` - Entity configurations
  - `Migrations/` - EF Core migrations
  - `Repositories/` - Repository implementations
- `Services/` - External service implementations

### WebApi Layer

- `Controllers/` - API controllers
- `Middleware/` - Custom middleware (exception handling)
- `Services/` - Web-specific services (CurrentUserService)
- `Extensions/` - Service collection extensions

## 🔐 Authentication

The API uses JWT Bearer authentication. Configure the settings in `appsettings.json`:

```json
{
  "Jwt": {
    "Key": "your-super-secret-key-minimum-32-characters",
    "Issuer": "VisualFlow",
    "Audience": "VisualFlowClients"
  }
}
```

## 📝 Adding New Features

### 1. Create Command/Query

```csharp
// Application/Features/Products/Commands/CreateProduct/CreateProductCommand.cs
public record CreateProductCommand(string Name, decimal Price) : IRequest<Guid>;

public class CreateProductCommandHandler : IRequestHandler<CreateProductCommand, Guid>
{
    // Implementation
}

public class CreateProductCommandValidator : AbstractValidator<CreateProductCommand>
{
    // Validation rules
}
```

### 2. Create Controller Endpoint

```csharp
[HttpPost]
public async Task<ActionResult<Guid>> Create(CreateProductCommand command)
{
    var id = await Mediator.Send(command);
    return CreatedAtAction(nameof(Get), new { id }, id);
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📚 References

- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Microsoft .NET Architecture Guides](https://dotnet.microsoft.com/learn/dotnet/architecture-guides)
- [Architecting Modern Web Applications with ASP.NET Core](https://learn.microsoft.com/en-us/dotnet/architecture/modern-web-apps-azure/)
