using MediatR;

namespace VisualFlow.Domain.Events;

/// <summary>
/// Base class for domain events.
/// </summary>
public abstract class DomainEvent : INotification
{
    public DateTime OccurredOn { get; protected set; } = DateTime.UtcNow;
    public Guid EventId { get; protected set; } = Guid.NewGuid();
}
