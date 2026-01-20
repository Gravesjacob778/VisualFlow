namespace VisualFlow.Domain.Entities;

/// <summary>
/// Represents a GLTF model associated with a robot configuration.
/// </summary>
public class RobotConfigGltfModel : BaseEntity
{
    public Guid RobotConfigId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; }
    public string StoragePath { get; set; } = string.Empty;

    public RobotConfig? RobotConfig { get; set; }
}