namespace VisualFlow.Domain.Exceptions;

/// <summary>
/// Exception thrown when validation fails.
/// </summary>
public class DomainValidationException : DomainException
{
    public IDictionary<string, string[]> Errors { get; }

    public DomainValidationException()
        : base("One or more validation failures have occurred.")
    {
        Errors = new Dictionary<string, string[]>();
    }

    public DomainValidationException(string message)
        : base(message)
    {
        Errors = new Dictionary<string, string[]>();
    }

    public DomainValidationException(IDictionary<string, string[]> errors)
        : base("One or more validation failures have occurred.")
    {
        Errors = errors;
    }
}
