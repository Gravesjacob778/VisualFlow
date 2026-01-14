namespace VisualFlow.Domain.Entities;

/// <summary>
/// Base class for auditable entities with soft delete support.
/// </summary>
public abstract class AuditableEntity : BaseEntity
{
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    public string? DeletedBy { get; set; }
}
