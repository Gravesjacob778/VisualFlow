using System.Net;
using System.Text.Json;
using FluentValidation;
using VisualFlow.Domain.Exceptions;

namespace VisualFlow.WebApi.Middleware;

/// <summary>
/// Global exception handling middleware.
/// </summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var response = new ErrorResponse();

        switch (exception)
        {
            case ValidationException validationException:
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                response.StatusCode = (int)HttpStatusCode.BadRequest;
                response.Message = "Validation failed";
                response.Errors = validationException.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(
                        g => g.Key,
                        g => g.Select(e => e.ErrorMessage).ToArray()
                    );
                break;

            case NotFoundException notFoundException:
                context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                response.StatusCode = (int)HttpStatusCode.NotFound;
                response.Message = notFoundException.Message;
                break;

            case DomainValidationException domainValidationException:
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                response.StatusCode = (int)HttpStatusCode.BadRequest;
                response.Message = domainValidationException.Message;
                response.Errors = domainValidationException.Errors;
                break;

            case DomainException domainException:
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                response.StatusCode = (int)HttpStatusCode.BadRequest;
                response.Message = domainException.Message;
                break;

            case UnauthorizedAccessException:
                context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                response.StatusCode = (int)HttpStatusCode.Unauthorized;
                response.Message = "Unauthorized access";
                break;

            default:
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                response.StatusCode = (int)HttpStatusCode.InternalServerError;
                response.Message = "An internal server error occurred";
                break;
        }

        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response, jsonOptions));
    }
}

/// <summary>
/// Standard error response model.
/// </summary>
public class ErrorResponse
{
    public int StatusCode { get; set; }
    public string Message { get; set; } = string.Empty;
    public IDictionary<string, string[]>? Errors { get; set; }
}
