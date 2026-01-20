using System.Net;
using System.Text.Json;
using FluentValidation;
using VisualFlow.Domain.Exceptions;
using VisualFlow.WebApi.Models;

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

        var response = new ApiErrorResponse();

        switch (exception)
        {
            case ValidationException validationException:
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                response = new ApiErrorResponse
                {
                    Message = "Validation failed",
                    Errors = validationException.Errors
                        .Select(e => new FieldError(e.PropertyName, e.ErrorMessage))
                        .ToList()
                };
                break;

            case NotFoundException notFoundException:
                context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                response = new ApiErrorResponse { Message = notFoundException.Message };
                break;

            case DomainValidationException domainValidationException:
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                response = new ApiErrorResponse
                {
                    Message = domainValidationException.Message,
                    Errors = domainValidationException.Errors
                        .SelectMany(kvp => kvp.Value.Select(message => new FieldError(kvp.Key, message)))
                        .ToList()
                };
                break;

            case DomainException domainException:
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                response = new ApiErrorResponse { Message = domainException.Message };
                break;

            case ConflictException conflictException:
                context.Response.StatusCode = (int)HttpStatusCode.Conflict;
                response = new ApiErrorResponse { Message = conflictException.Message };
                break;

            case UnauthorizedAccessException:
                context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                response = new ApiErrorResponse { Message = "Unauthorized access" };
                break;

            default:
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                response = new ApiErrorResponse { Message = "An internal server error occurred" };
                break;
        }

        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response, jsonOptions));
    }
}
