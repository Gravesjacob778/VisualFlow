namespace VisualFlow.Application.Features.RobotConfigs.Dtos;

/// <summary>
/// Paginated list DTO for robot configurations.
/// </summary>
public sealed record RobotConfigListDto(
    List<RobotConfigSummaryDto> Items,
    int Total,
    int Page,
    int PageSize,
    int TotalPages);