---
description: 'Guidelines for building C# applications'
applyTo: '**/*.cs'
---

# C# Development Guidelines: Enterprise-Grade Standards

> **Author Profile**: Principal Software Engineer at Microsoft with 15+ years of experience in .NET ecosystem, CLR internals, and high-performance architecture. Multiple international C# competition champion. This document represents production-grade standards for modern C# development.

## Table of Contents

1. [Engineering Core Principles](#engineering-core-principles)
2. [Modern C# Syntax (C# 12+)](#modern-c-syntax-c-12)
3. [Asynchronous Programming](#asynchronous-programming)
4. [Performance & Memory Optimization](#performance--memory-optimization)
5. [Design Patterns & Architecture](#design-patterns--architecture)
6. [Error Handling & Resilience](#error-handling--resilience)
7. [Naming Conventions & Clean Code](#naming-conventions--clean-code)
8. [LINQ & Collections](#linq--collections)
9. [Testing & Code Quality](#testing--code-quality)
10. [Security Best Practices](#security-best-practices)

---

## Engineering Core Principles

### 1.1 SOLID Principles - Non-Negotiable Foundation

**Core Requirements:**
- **S**ingle Responsibility: One class, one reason to change
- **O**pen/Closed: Open for extension, closed for modification
- **L**iskov Substitution: Subtypes must be substitutable for base types
- **I**nterface Segregation: Many specific interfaces over one general
- **D**ependency Inversion: Depend on abstractions, not concretions

**Bad Example:**
```csharp
// ❌ Violates SRP - UserService does too many things
public class UserService
{
    public void CreateUser(User user)
    {
        // Validation logic
        if (string.IsNullOrEmpty(user.Email)) throw new Exception("Invalid email");
        
        // Database logic
        using var connection = new SqlConnection(_connectionString);
        connection.Execute("INSERT INTO Users...");
        
        // Email logic
        var smtp = new SmtpClient();
        smtp.Send(new MailMessage("welcome@app.com", user.Email, "Welcome", "..."));
        
        // Logging logic
        File.AppendAllText("log.txt", $"User created: {user.Id}");
    }
}
```

**Good Example:**
```csharp
// ✅ Follows SOLID principles with proper separation
public interface IUserRepository
{
    Task<User> CreateAsync(User user, CancellationToken cancellationToken = default);
}

public interface IEmailService
{
    Task SendWelcomeEmailAsync(string email, CancellationToken cancellationToken = default);
}

public interface IUserValidator
{
    ValidationResult Validate(User user);
}

public sealed class UserService(
    IUserRepository userRepository,
    IEmailService emailService,
    IUserValidator validator,
    ILogger<UserService> logger)
{
    public async Task<Result<User>> CreateUserAsync(User user, CancellationToken cancellationToken = default)
    {
        var validationResult = validator.Validate(user);
        if (!validationResult.IsValid)
            return Result<User>.Failure(validationResult.Errors);

        var createdUser = await userRepository.CreateAsync(user, cancellationToken);
        
        await emailService.SendWelcomeEmailAsync(user.Email, cancellationToken);
        
        logger.LogInformation("User created successfully: {UserId}", createdUser.Id);
        
        return Result<User>.Success(createdUser);
    }
}
```

### 1.2 Guard Clauses Over Nested Conditions

**Core Requirements:**
- Eliminate deep nesting (max 2 levels)
- Return early to reduce cognitive complexity
- Use pattern matching for type checking

**Bad Example:**
```csharp
// ❌ Deeply nested, hard to read
public decimal CalculateDiscount(Customer customer, Order order)
{
    if (customer != null)
    {
        if (customer.IsActive)
        {
            if (order != null)
            {
                if (order.Total > 1000)
                {
                    if (customer.MembershipLevel == "Gold")
                    {
                        return order.Total * 0.2m;
                    }
                    else if (customer.MembershipLevel == "Silver")
                    {
                        return order.Total * 0.1m;
                    }
                }
            }
        }
    }
    return 0;
}
```

**Good Example:**
```csharp
// ✅ Guard clauses with early returns
public decimal CalculateDiscount(Customer? customer, Order? order)
{
    if (customer is null || !customer.IsActive)
        return 0;

    if (order is null || order.Total <= 1000)
        return 0;

    return customer.MembershipLevel switch
    {
        "Gold" => order.Total * 0.2m,
        "Silver" => order.Total * 0.1m,
        "Bronze" => order.Total * 0.05m,
        _ => 0
    };
}
```

### 1.3 Composition Over Inheritance

**Core Requirements:**
- Prefer interfaces and composition to deep inheritance hierarchies
- Use inheritance only for true "is-a" relationships
- Avoid inheritance depth > 2 levels

**Bad Example:**
```csharp
// ❌ Rigid inheritance hierarchy
public class Animal { public virtual void Move() { } }
public class Mammal : Animal { }
public class Dog : Mammal { public override void Move() => Console.WriteLine("Running"); }
public class RobotDog : Dog { } // ❌ Robot dog is not a mammal!
```

**Good Example:**
```csharp
// ✅ Composition with interfaces
public interface IMovable
{
    void Move();
}

public interface IMakeSound
{
    void MakeSound();
}

public sealed class Dog(IMovable moveBehavior, IMakeSound soundBehavior) : IMovable, IMakeSound
{
    public void Move() => moveBehavior.Move();
    public void MakeSound() => soundBehavior.MakeSound();
}

public sealed class RunMovement : IMovable
{
    public void Move() => Console.WriteLine("Running on four legs");
}

public sealed class BarkSound : IMakeSound
{
    public void MakeSound() => Console.WriteLine("Woof!");
}

// Usage: var dog = new Dog(new RunMovement(), new BarkSound());
```

---

## Modern C# Syntax (C# 12+)

### 2.1 Primary Constructors

**Core Requirements:**
- Use primary constructors for dependency injection
- Reduces boilerplate code significantly
- Combines well with field/property initialization

**Bad Example:**
```csharp
// ❌ Old-style constructor with repetitive code
public class OrderService
{
    private readonly IOrderRepository _orderRepository;
    private readonly ILogger<OrderService> _logger;
    private readonly IMapper _mapper;

    public OrderService(
        IOrderRepository orderRepository,
        ILogger<OrderService> logger,
        IMapper mapper)
    {
        _orderRepository = orderRepository;
        _logger = logger;
        _mapper = mapper;
    }
}
```

**Good Example:**
```csharp
// ✅ C# 12 Primary Constructor - clean and concise
public sealed class OrderService(
    IOrderRepository orderRepository,
    ILogger<OrderService> logger,
    IMapper mapper)
{
    public async Task<Order> GetOrderAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        logger.LogInformation("Fetching order: {OrderId}", orderId);
        var order = await orderRepository.GetByIdAsync(orderId, cancellationToken);
        return mapper.Map<Order>(order);
    }
}
```

### 2.2 Collection Expressions

**Core Requirements:**
- Use collection expressions `[...]` for initialization
- More readable and performant than traditional methods
- Works with arrays, lists, spans

**Bad Example:**
```csharp
// ❌ Verbose collection initialization
var numbers = new List<int> { 1, 2, 3 };
var combined = new List<int>(numbers);
combined.Add(4);
combined.Add(5);

var array = new[] { 1, 2, 3 };
```

**Good Example:**
```csharp
// ✅ C# 12 Collection Expressions
var numbers = [1, 2, 3];
var combined = [.. numbers, 4, 5];
var array = [1, 2, 3];
var spreadExample = [.. firstList, .. secondList, additionalItem];

// Excellent for method parameters
ProcessItems([1, 2, 3, 4, 5]);
```

### 2.3 Records & Init-Only Properties

**Core Requirements:**
- Use `record` for immutable data models
- Prefer `init` over `set` for DTOs
- Leverage with expressions for non-destructive mutation

**Bad Example:**
```csharp
// ❌ Mutable class with manual equality
public class UserDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    
    public override bool Equals(object? obj) { /* manual implementation */ }
    public override int GetHashCode() { /* manual implementation */ }
}
```

**Good Example:**
```csharp
// ✅ Immutable record with structural equality built-in
public sealed record UserDto(
    Guid Id,
    string Name,
    string Email);

public sealed record UserProfile
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public required string Email { get; init; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
}

// Non-destructive mutation
var updatedUser = originalUser with { Name = "New Name" };
```

### 2.4 Pattern Matching Mastery

**Core Requirements:**
- Replace type checking with pattern matching
- Use switch expressions instead of statements
- Leverage property patterns and list patterns

**Bad Example:**
```csharp
// ❌ Old-style type checking and switching
public string GetShapeInfo(object shape)
{
    if (shape is Circle)
    {
        var circle = (Circle)shape;
        return $"Circle with radius {circle.Radius}";
    }
    else if (shape is Rectangle)
    {
        var rect = (Rectangle)shape;
        return $"Rectangle {rect.Width}x{rect.Height}";
    }
    return "Unknown shape";
}
```

**Good Example:**
```csharp
// ✅ Modern pattern matching with switch expressions
public string GetShapeInfo(Shape shape) => shape switch
{
    Circle { Radius: > 0 } c => $"Circle with radius {c.Radius}",
    Rectangle { Width: var w, Height: var h } => $"Rectangle {w}x{h}",
    Triangle { Sides: [var a, var b, var c] } => $"Triangle ({a}, {b}, {c})",
    null => throw new ArgumentNullException(nameof(shape)),
    _ => "Unknown shape"
};

// Property pattern matching
public decimal CalculateShipping(Order order) => order switch
{
    { Total: > 100, IsPrime: true } => 0,
    { Total: > 100 } => 5.99m,
    { Weight: > 10 } => 15.99m,
    _ => 9.99m
};

// List patterns (C# 11+)
public string AnalyzeArray(int[] numbers) => numbers switch
{
    [] => "Empty",
    [var single] => $"Single element: {single}",
    [var first, .., var last] => $"First: {first}, Last: {last}",
    _ => "Multiple elements"
};
```

### 2.5 Raw String Literals

**Core Requirements:**
- Use raw strings `"""..."""` for multi-line content
- Perfect for JSON, SQL, HTML without escaping
- Maintains formatting and indentation

**Bad Example:**
```csharp
// ❌ Escaped strings are unreadable
var json = "{\"name\":\"John\",\"age\":30,\"address\":{\"city\":\"New York\"}}";
var sql = "SELECT u.Id, u.Name, u.Email\r\n" +
          "FROM Users u\r\n" +
          "WHERE u.IsActive = 1\r\n" +
          "ORDER BY u.Name";
```

**Good Example:**
```csharp
// ✅ Raw string literals with perfect readability
var json = """
    {
        "name": "John",
        "age": 30,
        "address": {
            "city": "New York"
        }
    }
    """;

var sql = """
    SELECT u.Id, u.Name, u.Email
    FROM Users u
    WHERE u.IsActive = 1
    ORDER BY u.Name
    """;

// With interpolation
var query = $$"""
    SELECT * FROM {{tableName}}
    WHERE Status = '{{status}}'
    """;
```

---

## Asynchronous Programming

### 3.1 Async/Await Best Practices

**Core Requirements:**
- Always use `async/await`, never `.Result` or `.Wait()`
- Pass `CancellationToken` to all async methods
- Use `ConfigureAwait(false)` in library code
- Return `Task`/`ValueTask` directly when possible

**Bad Example:**
```csharp
// ❌ Blocking async code - causes deadlocks
public User GetUser(Guid id)
{
    return _repository.GetUserAsync(id).Result; // DEADLOCK RISK!
}

// ❌ No cancellation support
public async Task<List<Order>> GetOrdersAsync()
{
    return await _repository.GetAllAsync();
}

// ❌ Unnecessary async/await
public async Task<User> GetUserAsync(Guid id)
{
    return await _repository.FindAsync(id);
}
```

**Good Example:**
```csharp
// ✅ Proper async implementation with cancellation
public async Task<User?> GetUserAsync(Guid id, CancellationToken cancellationToken = default)
{
    return await _repository
        .GetUserAsync(id, cancellationToken)
        .ConfigureAwait(false);
}

// ✅ Return task directly when no additional logic
public Task<User?> GetUserAsync(Guid id, CancellationToken cancellationToken = default)
    => _repository.GetUserAsync(id, cancellationToken);

// ✅ Parallel execution for independent operations
public async Task<DashboardData> GetDashboardAsync(CancellationToken cancellationToken = default)
{
    var userTask = _userService.GetStatsAsync(cancellationToken);
    var orderTask = _orderService.GetStatsAsync(cancellationToken);
    var revenueTask = _revenueService.GetStatsAsync(cancellationToken);

    await Task.WhenAll(userTask, orderTask, revenueTask);

    return new DashboardData
    {
        UserStats = await userTask,
        OrderStats = await orderTask,
        RevenueStats = await revenueTask
    };
}
```

### 3.2 ValueTask for High-Performance Scenarios

**Core Requirements:**
- Use `ValueTask<T>` when results are often synchronously available
- Reduces allocations for hot paths
- Critical for high-throughput scenarios

**Bad Example:**
```csharp
// ❌ Always allocates Task even when cached
public class CacheService
{
    private readonly Dictionary<string, User> _cache = new();

    public async Task<User?> GetUserAsync(string id)
    {
        if (_cache.TryGetValue(id, out var user))
            return user; // Still allocates Task object

        var result = await _repository.GetAsync(id);
        _cache[id] = result;
        return result;
    }
}
```

**Good Example:**
```csharp
// ✅ ValueTask avoids allocation for cache hits
public sealed class CacheService(IUserRepository repository)
{
    private readonly Dictionary<string, User> _cache = new();

    public ValueTask<User?> GetUserAsync(string id, CancellationToken cancellationToken = default)
    {
        if (_cache.TryGetValue(id, out var user))
            return ValueTask.FromResult<User?>(user); // No allocation!

        return GetUserFromRepositoryAsync(id, cancellationToken);
    }

    private async ValueTask<User?> GetUserFromRepositoryAsync(string id, CancellationToken cancellationToken)
    {
        var result = await repository.GetAsync(id, cancellationToken);
        if (result is not null)
            _cache[id] = result;
        return result;
    }
}
```

### 3.3 IAsyncEnumerable for Streaming

**Core Requirements:**
- Use `IAsyncEnumerable<T>` for streaming large datasets
- Implements backpressure naturally
- Reduces memory footprint

**Bad Example:**
```csharp
// ❌ Loads entire dataset into memory
public async Task<List<Order>> GetAllOrdersAsync(CancellationToken cancellationToken = default)
{
    return await _dbContext.Orders
        .ToListAsync(cancellationToken); // Loads millions of records!
}

// Consumer must wait for all data
var orders = await service.GetAllOrdersAsync();
foreach (var order in orders)
{
    await ProcessOrderAsync(order);
}
```

**Good Example:**
```csharp
// ✅ Streams data with IAsyncEnumerable
public async IAsyncEnumerable<Order> GetAllOrdersAsync(
    [EnumeratorCancellation] CancellationToken cancellationToken = default)
{
    await foreach (var order in _dbContext.Orders.AsAsyncEnumerable().WithCancellation(cancellationToken))
    {
        yield return order;
    }
}

// Consumer processes as data arrives
await foreach (var order in service.GetAllOrdersAsync(cancellationToken))
{
    await ProcessOrderAsync(order, cancellationToken);
}
```

---

## Performance & Memory Optimization

### 4.1 Span<T> and Memory<T>

**Core Requirements:**
- Use `Span<T>` for stack-allocated memory operations
- Use `Memory<T>` for async-compatible slicing
- Eliminates allocations in hot paths

**Bad Example:**
```csharp
// ❌ Creates new arrays and strings unnecessarily
public string ProcessData(string input)
{
    var parts = input.Split(',');
    var result = new List<string>();
    
    foreach (var part in parts)
    {
        result.Add(part.Trim().ToUpper());
    }
    
    return string.Join(",", result);
}
```

**Good Example:**
```csharp
// ✅ Zero-allocation with Span<T>
public string ProcessData(string input)
{
    Span<char> buffer = stackalloc char[input.Length];
    input.AsSpan().ToUpperInvariant(buffer);
    
    return new string(buffer.Trim());
}

// ✅ Efficient string parsing with ReadOnlySpan
public int SumNumbers(ReadOnlySpan<char> input)
{
    var sum = 0;
    var currentNumber = 0;
    
    foreach (var c in input)
    {
        if (char.IsDigit(c))
        {
            currentNumber = currentNumber * 10 + (c - '0');
        }
        else if (c == ',')
        {
            sum += currentNumber;
            currentNumber = 0;
        }
    }
    
    return sum + currentNumber;
}
```

### 4.2 ArrayPool for Temporary Buffers

**Core Requirements:**
- Rent arrays from `ArrayPool<T>` instead of allocating
- Always return rented arrays
- Critical for high-frequency operations

**Bad Example:**
```csharp
// ❌ Allocates new array every time
public byte[] ProcessData(Stream stream)
{
    var buffer = new byte[4096]; // GC pressure!
    var bytesRead = stream.Read(buffer, 0, buffer.Length);
    return buffer[..bytesRead];
}
```

**Good Example:**
```csharp
// ✅ Reuses arrays from pool
public byte[] ProcessData(Stream stream)
{
    var buffer = ArrayPool<byte>.Shared.Rent(4096);
    try
    {
        var bytesRead = stream.Read(buffer, 0, buffer.Length);
        return buffer[..bytesRead].ToArray();
    }
    finally
    {
        ArrayPool<byte>.Shared.Return(buffer);
    }
}
```

### 4.3 StringBuilder and String Concatenation

**Core Requirements:**
- Use `StringBuilder` for loops with string concatenation
- Use interpolation or `string.Concat` for small, known strings
- Use `string.Create` for advanced scenarios

**Bad Example:**
```csharp
// ❌ Creates new string objects in each iteration
public string BuildReport(List<Item> items)
{
    var report = "Report:\n";
    foreach (var item in items)
    {
        report += $"{item.Name}: {item.Price}\n"; // O(n²) complexity!
    }
    return report;
}
```

**Good Example:**
```csharp
// ✅ StringBuilder for loops
public string BuildReport(List<Item> items)
{
    var sb = new StringBuilder("Report:\n", capacity: items.Count * 50);
    
    foreach (var item in items)
    {
        sb.AppendLine($"{item.Name}: {item.Price:C}");
    }
    
    return sb.ToString();
}

// ✅ Interpolation for known small strings
public string GetUserGreeting(User user)
    => $"Welcome, {user.Name}! Last login: {user.LastLogin:g}";
```

### 4.4 Struct vs Class Selection

**Core Requirements:**
- Use `struct` for small, immutable value types (< 16 bytes)
- Use `readonly struct` to enforce immutability
- Use `class` for mutable or large objects

**Bad Example:**
```csharp
// ❌ Class for simple value type causes heap allocation
public class Point
{
    public int X { get; set; }
    public int Y { get; set; }
}

// ❌ Large struct causes expensive copying
public struct LargeData
{
    public byte[] Buffer; // 8 bytes reference + data
    public string Name;   // 8 bytes reference + data
    public DateTime Created; // 8 bytes
    // Total: 24+ bytes - too large for struct!
}
```

**Good Example:**
```csharp
// ✅ Readonly struct for small value type
public readonly struct Point(int x, int y)
{
    public int X { get; } = x;
    public int Y { get; } = y;
    
    public Point Add(Point other) => new(X + other.X, Y + other.Y);
}

// ✅ Record struct (C# 10+)
public readonly record struct Money(decimal Amount, string Currency);

// ✅ Class for larger data
public sealed class UserProfile
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public required string Email { get; init; }
    public List<string> Roles { get; init; } = [];
}
```

---

## Design Patterns & Architecture

### 5.1 Dependency Injection (DI)

**Core Requirements:**
- Register services with appropriate lifetime (Singleton, Scoped, Transient)
- Inject interfaces, not concrete implementations
- Use constructor injection over property injection

**Bad Example:**
```csharp
// ❌ Direct instantiation creates tight coupling
public class OrderController : ControllerBase
{
    private readonly OrderService _orderService;
    
    public OrderController()
    {
        var connectionString = "Server=..."; // Hardcoded!
        var repository = new OrderRepository(connectionString);
        _orderService = new OrderService(repository);
    }
}
```

**Good Example:**
```csharp
// ✅ Dependency Injection with interfaces
public sealed class OrderController(
    IOrderService orderService,
    ILogger<OrderController> logger) : ControllerBase
{
    [HttpGet("{id}")]
    public async Task<ActionResult<OrderDto>> GetOrder(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await orderService.GetOrderAsync(id, cancellationToken);
        
        return result.Match<ActionResult<OrderDto>>(
            success => Ok(success),
            failure => NotFound(failure.Error));
    }
}

// Registration in Program.cs
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
```

### 5.2 Repository Pattern

**Core Requirements:**
- Abstract data access behind repositories
- Return domain entities, not EF entities
- Use specification pattern for complex queries

**Bad Example:**
```csharp
// ❌ Direct DbContext usage in business logic
public class OrderService
{
    private readonly ApplicationDbContext _context;
    
    public async Task<Order?> GetOrderAsync(Guid id)
    {
        return await _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id); // Leaks EF into service layer
    }
}
```

**Good Example:**
```csharp
// ✅ Repository abstraction
public interface IOrderRepository
{
    Task<Order?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Order>> GetBySpecificationAsync(
        ISpecification<Order> spec,
        CancellationToken cancellationToken = default);
    Task<Order> AddAsync(Order order, CancellationToken cancellationToken = default);
}

public sealed class OrderRepository(ApplicationDbContext context) : IOrderRepository
{
    public async Task<Order?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<Order>> GetBySpecificationAsync(
        ISpecification<Order> spec,
        CancellationToken cancellationToken = default)
    {
        return await spec
            .Apply(context.Orders)
            .ToListAsync(cancellationToken);
    }

    public async Task<Order> AddAsync(Order order, CancellationToken cancellationToken = default)
    {
        await context.Orders.AddAsync(order, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
        return order;
    }
}
```

### 5.3 Result Pattern (Railway-Oriented Programming)

**Core Requirements:**
- Return `Result<T>` instead of throwing exceptions for business logic failures
- Distinguish between expected failures and exceptional circumstances
- Enable functional composition

**Bad Example:**
```csharp
// ❌ Exceptions for control flow
public class UserService
{
    public async Task<User> CreateUserAsync(CreateUserDto dto)
    {
        if (string.IsNullOrEmpty(dto.Email))
            throw new ValidationException("Email is required"); // Exception for validation!
        
        if (await _repository.ExistsAsync(dto.Email))
            throw new DuplicateException("Email already exists"); // Exception for business rule!
        
        return await _repository.CreateAsync(new User { Email = dto.Email });
    }
}

// Caller must use try-catch for flow control
try
{
    var user = await _userService.CreateUserAsync(dto);
}
catch (ValidationException ex) { }
catch (DuplicateException ex) { }
```

**Good Example:**
```csharp
// ✅ Result pattern for explicit error handling
public readonly record struct Result<T>
{
    public T? Value { get; }
    public Error? Error { get; }
    public bool IsSuccess { get; }
    
    private Result(T value)
    {
        Value = value;
        IsSuccess = true;
        Error = null;
    }
    
    private Result(Error error)
    {
        Error = error;
        IsSuccess = false;
        Value = default;
    }
    
    public static Result<T> Success(T value) => new(value);
    public static Result<T> Failure(Error error) => new(error);
    
    public TResult Match<TResult>(
        Func<T, TResult> success,
        Func<Error, TResult> failure)
        => IsSuccess ? success(Value!) : failure(Error!);
}

public sealed record Error(string Code, string Message);

public sealed class UserService(IUserRepository repository, IUserValidator validator)
{
    public async Task<Result<User>> CreateUserAsync(
        CreateUserDto dto,
        CancellationToken cancellationToken = default)
    {
        var validationResult = validator.Validate(dto);
        if (!validationResult.IsSuccess)
            return Result<User>.Failure(new Error("VALIDATION_ERROR", validationResult.Message));
        
        if (await repository.ExistsAsync(dto.Email, cancellationToken))
            return Result<User>.Failure(new Error("DUPLICATE_EMAIL", "Email already exists"));
        
        var user = await repository.CreateAsync(new User { Email = dto.Email }, cancellationToken);
        return Result<User>.Success(user);
    }
}

// Caller has explicit flow
var result = await _userService.CreateUserAsync(dto, cancellationToken);

result.Match(
    success => Ok(success),
    failure => failure.Code switch
    {
        "VALIDATION_ERROR" => BadRequest(failure.Message),
        "DUPLICATE_EMAIL" => Conflict(failure.Message),
        _ => StatusCode(500, failure.Message)
    });
```

### 5.4 Strategy Pattern with Dependency Injection

**Core Requirements:**
- Define strategy interface for interchangeable algorithms
- Register strategies in DI container
- Use factory or dictionary for strategy selection

**Bad Example:**
```csharp
// ❌ Hard-coded switch statement
public class PaymentProcessor
{
    public async Task ProcessPaymentAsync(Order order, string paymentMethod)
    {
        switch (paymentMethod)
        {
            case "CreditCard":
                // Credit card logic
                await ProcessCreditCardAsync(order);
                break;
            case "PayPal":
                // PayPal logic
                await ProcessPayPalAsync(order);
                break;
            case "Bitcoin":
                // Bitcoin logic
                await ProcessBitcoinAsync(order);
                break;
            default:
                throw new NotSupportedException();
        }
    }
    // Grows forever with new payment methods!
}
```

**Good Example:**
```csharp
// ✅ Strategy pattern with DI
public interface IPaymentStrategy
{
    string PaymentMethod { get; }
    Task<PaymentResult> ProcessAsync(Order order, CancellationToken cancellationToken = default);
}

public sealed class CreditCardStrategy(ICreditCardGateway gateway) : IPaymentStrategy
{
    public string PaymentMethod => "CreditCard";
    
    public async Task<PaymentResult> ProcessAsync(Order order, CancellationToken cancellationToken = default)
        => await gateway.ChargeAsync(order.Total, order.PaymentDetails, cancellationToken);
}

public sealed class PayPalStrategy(IPayPalGateway gateway) : IPaymentStrategy
{
    public string PaymentMethod => "PayPal";
    
    public async Task<PaymentResult> ProcessAsync(Order order, CancellationToken cancellationToken = default)
        => await gateway.ProcessAsync(order.Total, order.PaymentDetails, cancellationToken);
}

// Factory to select strategy
public sealed class PaymentStrategyFactory(IEnumerable<IPaymentStrategy> strategies)
{
    private readonly Dictionary<string, IPaymentStrategy> _strategies = 
        strategies.ToDictionary(s => s.PaymentMethod, StringComparer.OrdinalIgnoreCase);
    
    public IPaymentStrategy GetStrategy(string paymentMethod)
        => _strategies.TryGetValue(paymentMethod, out var strategy)
            ? strategy
            : throw new NotSupportedException($"Payment method '{paymentMethod}' is not supported");
}

public sealed class PaymentProcessor(PaymentStrategyFactory strategyFactory)
{
    public async Task<PaymentResult> ProcessPaymentAsync(
        Order order,
        string paymentMethod,
        CancellationToken cancellationToken = default)
    {
        var strategy = strategyFactory.GetStrategy(paymentMethod);
        return await strategy.ProcessAsync(order, cancellationToken);
    }
}

// DI Registration
builder.Services.AddScoped<IPaymentStrategy, CreditCardStrategy>();
builder.Services.AddScoped<IPaymentStrategy, PayPalStrategy>();
builder.Services.AddScoped<IPaymentStrategy, BitcoinStrategy>();
builder.Services.AddScoped<PaymentStrategyFactory>();
builder.Services.AddScoped<PaymentProcessor>();
```

---

## Error Handling & Resilience

### 6.1 Custom Exception Hierarchy

**Core Requirements:**
- Create domain-specific exception types
- Avoid generic exceptions like `Exception` or `ApplicationException`
- Include meaningful context in exceptions

**Bad Example:**
```csharp
// ❌ Generic exceptions with string messages
public class OrderService
{
    public async Task<Order> GetOrderAsync(Guid id)
    {
        var order = await _repository.GetByIdAsync(id);
        if (order == null)
            throw new Exception("Order not found"); // Too generic!
        
        if (order.Status == OrderStatus.Cancelled)
            throw new Exception("Order is cancelled"); // No context!
        
        return order;
    }
}
```

**Good Example:**
```csharp
// ✅ Domain-specific exceptions with context
public abstract class DomainException(string message, Exception? innerException = null) 
    : Exception(message, innerException)
{
    public DateTime Timestamp { get; } = DateTime.UtcNow;
}

public sealed class OrderNotFoundException(Guid orderId) 
    : DomainException($"Order with ID '{orderId}' was not found")
{
    public Guid OrderId { get; } = orderId;
}

public sealed class OrderCancelledException(Guid orderId, DateTime cancelledAt) 
    : DomainException($"Order '{orderId}' was cancelled at {cancelledAt:O}")
{
    public Guid OrderId { get; } = orderId;
    public DateTime CancelledAt { get; } = cancelledAt;
}

public sealed class OrderService(IOrderRepository repository)
{
    public async Task<Order> GetOrderAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var order = await repository.GetByIdAsync(id, cancellationToken)
            ?? throw new OrderNotFoundException(id);
        
        if (order.Status == OrderStatus.Cancelled)
            throw new OrderCancelledException(order.Id, order.CancelledAt!.Value);
        
        return order;
    }
}
```

### 6.2 Global Exception Handling Middleware

**Core Requirements:**
- Centralize exception handling
- Log exceptions with correlation IDs
- Return consistent error responses

**Good Example:**
```csharp
// ✅ Global exception handler middleware
public sealed class ExceptionHandlingMiddleware(
    RequestDelegate next,
    ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var correlationId = context.TraceIdentifier;
        
        logger.LogError(
            exception,
            "An unhandled exception occurred. CorrelationId: {CorrelationId}",
            correlationId);

        var (statusCode, errorResponse) = exception switch
        {
            OrderNotFoundException notFound => (
                StatusCodes.Status404NotFound,
                new ErrorResponse("ORDER_NOT_FOUND", notFound.Message, correlationId)),
                
            ValidationException validation => (
                StatusCodes.Status400BadRequest,
                new ErrorResponse("VALIDATION_ERROR", validation.Message, correlationId)
                {
                    Errors = validation.Errors
                }),
                
            DomainException domain => (
                StatusCodes.Status422UnprocessableEntity,
                new ErrorResponse("DOMAIN_ERROR", domain.Message, correlationId)),
                
            _ => (
                StatusCodes.Status500InternalServerError,
                new ErrorResponse("INTERNAL_ERROR", "An unexpected error occurred", correlationId))
        };

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";
        
        await context.Response.WriteAsJsonAsync(errorResponse);
    }
}

public sealed record ErrorResponse(
    string Code,
    string Message,
    string CorrelationId,
    DateTime Timestamp = default)
{
    public DateTime Timestamp { get; init; } = Timestamp == default ? DateTime.UtcNow : Timestamp;
    public Dictionary<string, string[]>? Errors { get; init; }
}

// Registration in Program.cs
app.UseMiddleware<ExceptionHandlingMiddleware>();
```

### 6.3 Retry Policies with Polly

**Core Requirements:**
- Implement retry for transient failures
- Use exponential backoff
- Set reasonable retry limits

**Good Example:**
```csharp
// ✅ Polly retry policy
public static class ResiliencePolicies
{
    public static IAsyncPolicy<HttpResponseMessage> GetRetryPolicy()
    {
        return HttpPolicyExtensions
            .HandleTransientHttpError()
            .OrResult(msg => msg.StatusCode == HttpStatusCode.TooManyRequests)
            .WaitAndRetryAsync(
                retryCount: 3,
                sleepDurationProvider: retryAttempt => 
                    TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
                onRetry: (outcome, timespan, retryAttempt, context) =>
                {
                    Log.Warning(
                        "Retry {RetryAttempt} after {Delay}ms. Reason: {Reason}",
                        retryAttempt,
                        timespan.TotalMilliseconds,
                        outcome.Exception?.Message ?? outcome.Result.StatusCode.ToString());
                });
    }

    public static IAsyncPolicy<HttpResponseMessage> GetCircuitBreakerPolicy()
    {
        return HttpPolicyExtensions
            .HandleTransientHttpError()
            .CircuitBreakerAsync(
                handledEventsAllowedBeforeBreaking: 3,
                durationOfBreak: TimeSpan.FromSeconds(30),
                onBreak: (outcome, duration) =>
                {
                    Log.Warning("Circuit breaker opened for {Duration}s", duration.TotalSeconds);
                },
                onReset: () => Log.Information("Circuit breaker reset"));
    }
}

// Usage with HttpClientFactory
builder.Services.AddHttpClient<IExternalApiClient, ExternalApiClient>()
    .AddPolicyHandler(ResiliencePolicies.GetRetryPolicy())
    .AddPolicyHandler(ResiliencePolicies.GetCircuitBreakerPolicy());
```

---

## Naming Conventions & Clean Code

### 7.1 Intentional Naming

**Core Requirements:**
- Names should reveal intent, not require comments
- Avoid abbreviations and single-letter variables (except loop indices)
- Use domain language, not technical jargon

**Bad Example:**
```csharp
// ❌ Unclear, abbreviated names
public class UsrMgr
{
    private readonly IRepo _r;
    
    public async Task<List<Usr>> GetUsr(int id, bool fl)
    {
        var u = await _r.Get(id);
        if (fl && u.Sts == 1) // What is fl? What is Sts?
        {
            return u.GetAll();
        }
        return null;
    }
}
```

**Good Example:**
```csharp
// ✅ Clear, intentional names
public sealed class UserManager(IUserRepository userRepository)
{
    public async Task<IReadOnlyList<User>> GetActiveUsersAsync(
        int departmentId,
        bool includeInactiveUsers,
        CancellationToken cancellationToken = default)
    {
        var department = await userRepository.GetByIdAsync(departmentId, cancellationToken);
        
        if (includeInactiveUsers && department.HasActiveStatus)
        {
            return await userRepository.GetAllUsersInDepartmentAsync(
                departmentId,
                cancellationToken);
        }
        
        return await userRepository.GetActiveUsersInDepartmentAsync(
            departmentId,
            cancellationToken);
    }
}
```

### 7.2 Method Naming Standards

**Core Requirements:**
- Methods should be verbs or verb phrases
- Boolean methods/properties should ask questions (`Is`, `Has`, `Can`)
- Async methods must end with `Async` suffix

**Bad Example:**
```csharp
// ❌ Poor method names
public class Order
{
    public bool Active() { } // Should be IsActive or HasActiveStatus
    public void Update() { } // Update what?
    public async Task Save() { } // Should be SaveAsync
    public decimal Price() { } // Should be GetTotalPrice or TotalPrice property
}
```

**Good Example:**
```csharp
// ✅ Clear, consistent method names
public sealed class Order
{
    public bool IsActive() => Status == OrderStatus.Active;
    public bool HasItems() => Items.Count > 0;
    public bool CanBeCancelled() => Status == OrderStatus.Pending;
    
    public void UpdateShippingAddress(Address newAddress) { }
    public async Task SaveAsync(CancellationToken cancellationToken = default) { }
    public decimal GetTotalPrice() => Items.Sum(i => i.Price * i.Quantity);
}
```

### 7.3 Constants and Magic Numbers

**Core Requirements:**
- Replace magic numbers with named constants
- Use `const` for compile-time constants
- Use `static readonly` for runtime constants

**Bad Example:**
```csharp
// ❌ Magic numbers everywhere
public decimal CalculateShipping(decimal weight)
{
    if (weight < 5)
        return 9.99m;
    else if (weight < 20)
        return 15.99m;
    else
        return 25.99m;
}

public bool IsValidPassword(string password)
{
    return password.Length >= 8 && password.Length <= 64; // Magic numbers
}
```

**Good Example:**
```csharp
// ✅ Named constants with clear intent
public sealed class ShippingCalculator
{
    private const decimal LightPackageMaxWeight = 5m;
    private const decimal MediumPackageMaxWeight = 20m;
    private const decimal LightPackagePrice = 9.99m;
    private const decimal MediumPackagePrice = 15.99m;
    private const decimal HeavyPackagePrice = 25.99m;
    
    public decimal CalculateShipping(decimal weight) => weight switch
    {
        < LightPackageMaxWeight => LightPackagePrice,
        < MediumPackageMaxWeight => MediumPackagePrice,
        _ => HeavyPackagePrice
    };
}

public sealed class PasswordValidator
{
    private const int MinPasswordLength = 8;
    private const int MaxPasswordLength = 64;
    
    public bool IsValidPassword(string password)
        => password.Length >= MinPasswordLength && password.Length <= MaxPasswordLength;
}
```

---

## LINQ & Collections

### 8.1 Efficient LINQ Usage

**Core Requirements:**
- Use method syntax for complex queries
- Avoid multiple enumerations (use `.ToList()` when needed)
- Prefer `Any()` over `Count() > 0`

**Bad Example:**
```csharp
// ❌ Multiple enumerations and inefficient queries
public void ProcessOrders(IEnumerable<Order> orders)
{
    if (orders.Count() > 0) // Enumerates entire sequence!
    {
        var activeOrders = orders.Where(o => o.IsActive);
        
        if (activeOrders.Count() > 0) // Enumerates again!
        {
            var total = 0m;
            foreach (var order in activeOrders) // Enumerates AGAIN!
            {
                total += order.Total;
            }
        }
    }
}

// ❌ Inefficient nested loops
var result = customers
    .Where(c => c.IsActive)
    .Select(c => orders
        .Where(o => o.CustomerId == c.Id) // N+1 query problem!
        .ToList());
```

**Good Example:**
```csharp
// ✅ Single enumeration with materialization
public void ProcessOrders(IEnumerable<Order> orders)
{
    var activeOrders = orders
        .Where(o => o.IsActive)
        .ToList(); // Materialize once
    
    if (!activeOrders.Any()) // Efficient check
        return;
    
    var total = activeOrders.Sum(o => o.Total); // Single pass
}

// ✅ Efficient grouping instead of nested loops
var ordersByCustomer = orders
    .Where(o => o.IsActive)
    .GroupBy(o => o.CustomerId)
    .ToDictionary(g => g.Key, g => g.ToList());

var result = customers
    .Where(c => c.IsActive)
    .Select(c => new
    {
        Customer = c,
        Orders = ordersByCustomer.GetValueOrDefault(c.Id, [])
    });
```

### 8.2 Collection Initialization

**Core Requirements:**
- Use collection expressions `[...]` (C# 12)
- Initialize with capacity when size is known
- Use immutable collections when appropriate

**Bad Example:**
```csharp
// ❌ Inefficient collection initialization
public List<int> GetNumbers()
{
    var numbers = new List<int>();
    numbers.Add(1);
    numbers.Add(2);
    numbers.Add(3);
    return numbers;
}

// ❌ No capacity hint causes resizing
public List<User> ProcessUsers(User[] users)
{
    var result = new List<User>(); // Starts at capacity 0, resizes multiple times
    foreach (var user in users)
    {
        if (user.IsActive)
            result.Add(user);
    }
    return result;
}
```

**Good Example:**
```csharp
// ✅ Collection expression (C# 12)
public List<int> GetNumbers() => [1, 2, 3];

// ✅ Initialize with capacity
public List<User> ProcessUsers(User[] users)
{
    var result = new List<User>(capacity: users.Length);
    
    foreach (var user in users)
    {
        if (user.IsActive)
            result.Add(user);
    }
    
    return result;
}

// ✅ Immutable collection for thread safety
public ImmutableList<string> GetSupportedCurrencies()
    => ["USD", "EUR", "GBP", "JPY"];
```

### 8.3 Avoid Unnecessary Allocations

**Core Requirements:**
- Use `Where` before `Select` to reduce allocations
- Use `FirstOrDefault` instead of `Where().First()`
- Consider `ref` returns for large structs

**Bad Example:**
```csharp
// ❌ Unnecessary allocations
var result = items
    .Select(x => new ExpensiveObject(x)) // Creates object for all items
    .Where(x => x.IsValid) // Then filters
    .ToList();

// ❌ Double enumeration
var first = items.Where(x => x.IsActive).FirstOrDefault();
```

**Good Example:**
```csharp
// ✅ Filter first, then project
var result = items
    .Where(x => x.IsValidForProcessing()) // Filter first
    .Select(x => new ExpensiveObject(x))  // Create only needed objects
    .ToList();

// ✅ Single enumeration with predicate
var first = items.FirstOrDefault(x => x.IsActive);

// ✅ Use ref return for large structs
public ref readonly LargeStruct GetLargestValue(Span<LargeStruct> values)
{
    ref readonly var max = ref values[0];
    
    for (int i = 1; i < values.Length; i++)
    {
        if (values[i].Value > max.Value)
            max = ref values[i];
    }
    
    return ref max;
}
```

---

## Testing & Code Quality

### 9.1 Unit Test Structure (AAA Pattern)

**Core Requirements:**
- Arrange-Act-Assert structure
- One logical assertion per test
- Use descriptive test names that describe behavior

**Bad Example:**
```csharp
// ❌ Poor test structure and naming
[Fact]
public void Test1()
{
    var service = new OrderService(null);
    var result = service.Calculate(100);
    Assert.Equal(90, result);
    var result2 = service.Calculate(200);
    Assert.Equal(180, result2);
}
```

**Good Example:**
```csharp
// ✅ Clear AAA structure with descriptive names
[Fact]
public void CalculateDiscount_WhenOrderTotalIs100_ShouldApply10PercentDiscount()
{
    // Arrange
    var repository = Substitute.For<IOrderRepository>();
    var service = new OrderService(repository);
    var order = new Order { Total = 100m };
    
    // Act
    var result = service.CalculateDiscount(order);
    
    // Assert
    result.Should().Be(10m);
}

[Theory]
[InlineData(100, 10)]
[InlineData(200, 20)]
[InlineData(50, 5)]
public void CalculateDiscount_WhenGivenVariousTotals_ShouldApply10PercentDiscount(
    decimal total,
    decimal expectedDiscount)
{
    // Arrange
    var repository = Substitute.For<IOrderRepository>();
    var service = new OrderService(repository);
    var order = new Order { Total = total };
    
    // Act
    var result = service.CalculateDiscount(order);
    
    // Assert
    result.Should().Be(expectedDiscount);
}
```

### 9.2 Mocking and Test Doubles

**Core Requirements:**
- Use interfaces for testability
- Prefer NSubstitute or Moq for mocking
- Verify behavior, not implementation

**Good Example:**
```csharp
// ✅ Proper mocking with NSubstitute
[Fact]
public async Task CreateOrder_WhenUserIsValid_ShouldCreateOrderAndSendEmail()
{
    // Arrange
    var orderRepository = Substitute.For<IOrderRepository>();
    var emailService = Substitute.For<IEmailService>();
    var logger = Substitute.For<ILogger<OrderService>>();
    
    var service = new OrderService(orderRepository, emailService, logger);
    var order = new Order { UserId = Guid.NewGuid(), Total = 100m };
    
    orderRepository
        .CreateAsync(Arg.Any<Order>(), Arg.Any<CancellationToken>())
        .Returns(order);
    
    // Act
    var result = await service.CreateOrderAsync(order);
    
    // Assert
    result.Should().NotBeNull();
    result.IsSuccess.Should().BeTrue();
    
    await orderRepository
        .Received(1)
        .CreateAsync(Arg.Is<Order>(o => o.UserId == order.UserId), Arg.Any<CancellationToken>());
    
    await emailService
        .Received(1)
        .SendOrderConfirmationAsync(order.UserId, Arg.Any<CancellationToken>());
}
```

### 9.3 Integration Testing with WebApplicationFactory

**Core Requirements:**
- Use `WebApplicationFactory` for API tests
- Test complete request/response pipelines
- Use test databases (SQLite in-memory)

**Good Example:**
```csharp
// ✅ Integration test with WebApplicationFactory
public sealed class OrdersControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    
    public OrdersControllerTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Replace DbContext with in-memory database
                services.RemoveAll<ApplicationDbContext>();
                services.AddDbContext<ApplicationDbContext>(options =>
                    options.UseInMemoryDatabase("TestDb"));
            });
        });
        
        _client = _factory.CreateClient();
    }
    
    [Fact]
    public async Task GetOrder_WhenOrderExists_ShouldReturnOkWithOrder()
    {
        // Arrange
        var orderId = Guid.NewGuid();
        await SeedOrderAsync(orderId);
        
        // Act
        var response = await _client.GetAsync($"/api/orders/{orderId}");
        
        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var order = await response.Content.ReadFromJsonAsync<OrderDto>();
        order.Should().NotBeNull();
        order!.Id.Should().Be(orderId);
    }
    
    private async Task SeedOrderAsync(Guid orderId)
    {
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        context.Orders.Add(new Order { Id = orderId, Total = 100m });
        await context.SaveChangesAsync();
    }
}
```

---

## Security Best Practices

### 10.1 Input Validation

**Core Requirements:**
- Validate all user input
- Use FluentValidation for complex validation
- Never trust client-side validation alone

**Good Example:**
```csharp
// ✅ Comprehensive validation with FluentValidation
public sealed class CreateOrderDtoValidator : AbstractValidator<CreateOrderDto>
{
    public CreateOrderDtoValidator()
    {
        RuleFor(x => x.CustomerId)
            .NotEmpty()
            .WithMessage("Customer ID is required");
        
        RuleFor(x => x.Items)
            .NotEmpty()
            .WithMessage("Order must contain at least one item")
            .Must(items => items.Count <= 100)
            .WithMessage("Order cannot contain more than 100 items");
        
        RuleForEach(x => x.Items)
            .SetValidator(new OrderItemDtoValidator());
        
        RuleFor(x => x.ShippingAddress)
            .NotNull()
            .SetValidator(new AddressValidator());
        
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(256);
    }
}

// Usage in controller
[HttpPost]
public async Task<ActionResult<OrderDto>> CreateOrder(
    [FromBody] CreateOrderDto dto,
    [FromServices] IValidator<CreateOrderDto> validator,
    CancellationToken cancellationToken)
{
    var validationResult = await validator.ValidateAsync(dto, cancellationToken);
    
    if (!validationResult.IsValid)
        return BadRequest(validationResult.Errors);
    
    var result = await _orderService.CreateOrderAsync(dto, cancellationToken);
    
    return result.Match<ActionResult<OrderDto>>(
        success => CreatedAtAction(nameof(GetOrder), new { id = success.Id }, success),
        failure => BadRequest(failure.Error));
}
```

### 10.2 Secure Configuration Management

**Core Requirements:**
- Never hardcode secrets
- Use User Secrets for local development
- Use Azure Key Vault or environment variables for production

**Bad Example:**
```csharp
// ❌ Hardcoded secrets
public class EmailService
{
    private const string ApiKey = "sk-1234567890abcdef"; // NEVER DO THIS!
    private const string ConnectionString = "Server=prod;User=sa;Password=P@ssw0rd"; // EXPOSED!
}
```

**Good Example:**
```csharp
// ✅ Configuration from secure sources
public sealed class EmailConfiguration
{
    public required string ApiKey { get; init; }
    public required string SenderEmail { get; init; }
    public required string SenderName { get; init; }
}

// appsettings.json
{
  "EmailConfiguration": {
    "ApiKey": "", // Filled by User Secrets or Key Vault
    "SenderEmail": "noreply@example.com",
    "SenderName": "My App"
  }
}

// Program.cs
builder.Configuration.AddUserSecrets<Program>(); // Development
builder.Configuration.AddAzureKeyVault(/* ... */); // Production

builder.Services.Configure<EmailConfiguration>(
    builder.Configuration.GetSection(nameof(EmailConfiguration)));

// Usage
public sealed class EmailService(IOptions<EmailConfiguration> config)
{
    private readonly EmailConfiguration _config = config.Value;
    
    public async Task SendAsync(string to, string subject, string body)
    {
        // Use _config.ApiKey securely
    }
}
```

### 10.3 SQL Injection Prevention

**Core Requirements:**
- Always use parameterized queries
- Never concatenate user input into SQL
- Use EF Core or Dapper with parameters

**Bad Example:**
```csharp
// ❌ VULNERABLE TO SQL INJECTION!
public async Task<User?> GetUserAsync(string email)
{
    var sql = $"SELECT * FROM Users WHERE Email = '{email}'"; // DANGEROUS!
    return await _connection.QueryFirstOrDefaultAsync<User>(sql);
}
```

**Good Example:**
```csharp
// ✅ Parameterized query with Dapper
public async Task<User?> GetUserAsync(string email, CancellationToken cancellationToken = default)
{
    const string sql = """
        SELECT Id, Name, Email, CreatedAt
        FROM Users
        WHERE Email = @Email
        """;
    
    return await _connection.QueryFirstOrDefaultAsync<User>(
        new CommandDefinition(sql, new { Email = email }, cancellationToken: cancellationToken));
}

// ✅ EF Core (automatically parameterized)
public async Task<User?> GetUserAsync(string email, CancellationToken cancellationToken = default)
{
    return await _context.Users
        .FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
}
```

---

## Summary: The Championship Mindset

This guide represents 15+ years of battle-tested experience in building world-class C# applications. When generating code, always ask:

1. **Is this SOLID?** Can each class be changed for only one reason?
2. **Is this performant?** Am I causing unnecessary allocations or enumerations?
3. **Is this testable?** Can I easily write unit tests for this?
4. **Is this readable?** Will another developer understand this in 6 months?
5. **Is this secure?** Have I validated inputs and secured secrets?
6. **Is this modern?** Am I using C# 12+ features effectively?

**Remember:** Writing code is easy. Writing maintainable, performant, and elegant code that stands the test of time is what separates good developers from great ones.

> *"Any fool can write code that a computer can understand. Good programmers write code that humans can understand."* — Martin Fowler

Now go forth and write championship-level C# code! 🏆

