using VisualFlow.Application.Common.Interfaces;

namespace VisualFlow.Infrastructure.Services;

/// <summary>
/// Implementation of date/time service.
/// </summary>
public class DateTimeService : IDateTimeService
{
    public DateTime Now => DateTime.Now;
    public DateTime UtcNow => DateTime.UtcNow;
}
