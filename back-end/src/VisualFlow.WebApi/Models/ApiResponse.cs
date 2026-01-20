namespace VisualFlow.WebApi.Models;

/// <summary>
/// Standard API response wrapper.
/// </summary>
public class ApiResponse
{
    public bool Success { get; init; }
    public string? Message { get; init; }

    public static ApiResponse OkMessage(string message) => new() { Success = true, Message = message };
    public static ApiResponse Fail(string message) => new() { Success = false, Message = message };
}

/// <summary>
/// Standard API response wrapper with data.
/// </summary>
public class ApiResponse<T>
{
    public bool Success { get; init; }
    public T? Data { get; init; }
    public string? Message { get; init; }

    public static ApiResponse<T> Ok(T data) => new() { Success = true, Data = data };
    public static ApiResponse<T> Fail(string message) => new() { Success = false, Message = message };
}

/// <summary>
/// Standard field error detail.
/// </summary>
public sealed record FieldError(string Field, string Message);

/// <summary>
/// Standard API error response.
/// </summary>
public sealed class ApiErrorResponse
{
    public bool Success { get; init; } = false;
    public string Message { get; init; } = string.Empty;
    public List<FieldError>? Errors { get; init; }
}