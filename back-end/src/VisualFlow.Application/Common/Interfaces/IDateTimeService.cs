namespace VisualFlow.Application.Common.Interfaces;

/// <summary>
/// Interface for date/time services to support testing.
/// </summary>
public interface IDateTimeService
{
    DateTime Now { get; }
    DateTime UtcNow { get; }
}
