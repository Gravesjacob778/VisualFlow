using VisualFlow.Domain.ValueObjects;

namespace VisualFlow.Domain.Entities;

/// <summary>
/// Represents a robot configuration.
/// </summary>
public class RobotConfig : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TransformData Transform { get; set; } = new(new[] { 0d, 0d, 0d }, new[] { 0d, 0d, 0d }, new[] { 1d, 1d, 1d });
    public JointAngles JointAngles { get; set; } = new(0, 0, 0, 0, 0, 0);
    public GripperData Gripper { get; set; } = new(0, 0);
    public List<BoneControlData> BoneControls { get; set; } = [];
    public List<MaterialData> Materials { get; set; } = [];
    public List<string> Tags { get; set; } = [];

    public RobotConfigGltfModel? GltfModel { get; set; }
}