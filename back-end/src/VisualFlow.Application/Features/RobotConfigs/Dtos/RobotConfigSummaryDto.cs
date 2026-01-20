using VisualFlow.Domain.ValueObjects;

namespace VisualFlow.Application.Features.RobotConfigs.Dtos;

/// <summary>
/// Summary DTO for robot configurations list.
/// </summary>
public sealed record RobotConfigSummaryDto(
    Guid Id,
    string Name,
    string? Description,
    TransformData Transform,
    JointAngles JointAngles,
    GripperData Gripper,
    GltfModelDto? GltfModel,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    List<string> Tags);