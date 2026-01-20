namespace VisualFlow.Domain.Exceptions;

/// <summary>
/// Exception for conflict errors (HTTP 409).
/// </summary>
public class ConflictException : Exception
{
    public ConflictException(string message) : base(message)
    {
    }
}