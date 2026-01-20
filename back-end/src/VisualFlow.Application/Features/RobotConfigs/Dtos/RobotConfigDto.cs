using VisualFlow.Domain.ValueObjects;

namespace VisualFlow.Application.Features.RobotConfigs.Dtos;

/// <summary>
/// Detailed robot configuration DTO.
/// </summary>
public sealed record RobotConfigDto(
    Guid Id,
    string Name,
    string? Description,
    TransformData Transform,
    JointAngles JointAngles,
    GripperData Gripper,
    List<BoneControlData> BoneControls,
    List<MaterialData> Materials,
    GltfModelDto? GltfModel,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    string? CreatedBy,
    List<string> Tags);