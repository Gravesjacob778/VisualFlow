namespace VisualFlow.Domain.Entities;

/// <summary>
/// Base class for all domain entities with common audit properties.
/// </summary>
public abstract class BaseEntity
{
    public Guid Id { get; protected set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? ModifiedBy { get; set; }
}
