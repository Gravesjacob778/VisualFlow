namespace VisualFlow.Application.Common.Models;

/// <summary>
/// Represents the result of an operation.
/// </summary>
/// <typeparam name="T">The type of the value</typeparam>
public class Result<T>
{
    public bool IsSuccess { get; private init; }
    public T? Value { get; private init; }
    public string? Error { get; private init; }
    public int StatusCode { get; private init; }

    private Result() { }

    public static Result<T> Success(T value) => new()
    {
        IsSuccess = true,
        Value = value,
        StatusCode = 200
    };

    public static Result<T> Success(T value, int statusCode) => new()
    {
        IsSuccess = true,
        Value = value,
        StatusCode = statusCode
    };

    public static Result<T> Failure(string error, int statusCode = 400) => new()
    {
        IsSuccess = false,
        Error = error,
        StatusCode = statusCode
    };
}

/// <summary>
/// Non-generic result class for operations without return value.
/// </summary>
public class Result
{
    public bool IsSuccess { get; private init; }
    public string? Error { get; private init; }
    public int StatusCode { get; private init; }

    private Result() { }

    public static Result Success() => new()
    {
        IsSuccess = true,
        StatusCode = 200
    };

    public static Result Failure(string error, int statusCode = 400) => new()
    {
        IsSuccess = false,
        Error = error,
        StatusCode = statusCode
    };
}
