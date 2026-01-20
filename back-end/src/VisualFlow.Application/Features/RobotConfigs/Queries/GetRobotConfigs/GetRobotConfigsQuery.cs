using MediatR;
using VisualFlow.Application.Features.RobotConfigs.Dtos;

namespace VisualFlow.Application.Features.RobotConfigs.Queries.GetRobotConfigs;

/// <summary>
/// Query to get paginated robot configurations.
/// </summary>
public sealed record GetRobotConfigsQuery(
    int Page = 1,
    int PageSize = 10,
    string? Search = null,
    List<string>? Tags = null,
    string SortBy = "createdAt",
    string SortOrder = "desc") : IRequest<RobotConfigListDto>;