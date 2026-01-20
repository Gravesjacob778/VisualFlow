using MediatR;

namespace VisualFlow.Application.Features.RobotConfigs.Commands.DeleteRobotConfigGltfModel;

/// <summary>
/// Command to delete a GLTF model from a robot configuration.
/// </summary>
public sealed record DeleteRobotConfigGltfModelCommand(Guid RobotConfigId) : IRequest;