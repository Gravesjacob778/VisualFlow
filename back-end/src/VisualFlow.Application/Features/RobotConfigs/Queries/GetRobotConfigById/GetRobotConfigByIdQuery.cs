using MediatR;
using VisualFlow.Application.Features.RobotConfigs.Dtos;

namespace VisualFlow.Application.Features.RobotConfigs.Queries.GetRobotConfigById;

/// <summary>
/// Query to get a robot configuration by ID.
/// </summary>
public sealed record GetRobotConfigByIdQuery(Guid Id) : IRequest<RobotConfigDto>;