using MediatR;

namespace VisualFlow.Application.Features.RobotConfigs.Commands.DeleteRobotConfig;

/// <summary>
/// Command to delete a robot configuration.
/// </summary>
public sealed record DeleteRobotConfigCommand(Guid Id) : IRequest;