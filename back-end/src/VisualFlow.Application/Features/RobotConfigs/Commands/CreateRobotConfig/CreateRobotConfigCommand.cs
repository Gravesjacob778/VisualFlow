using MediatR;
using VisualFlow.Application.Features.RobotConfigs.Dtos;
using VisualFlow.Domain.ValueObjects;

namespace VisualFlow.Application.Features.RobotConfigs.Commands.CreateRobotConfig;

/// <summary>
/// Command to create a robot configuration.
/// </summary>
public sealed record CreateRobotConfigCommand(
    string Name,
    string? Description,
    TransformData Transform,
    JointAngles JointAngles,
    GripperData Gripper,
    List<BoneControlData>? BoneControls,
    List<MaterialData>? Materials,
    List<string>? Tags) : IRequest<RobotConfigDto>;