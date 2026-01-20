using FluentValidation;

namespace VisualFlow.Application.Features.RobotConfigs.Queries.GetRobotConfigs;

/// <summary>
/// Validator for robot config list query.
/// </summary>
public sealed class GetRobotConfigsQueryValidator : AbstractValidator<GetRobotConfigsQuery>
{
    private static readonly HashSet<string> AllowedSortBy = ["name", "createdat", "updatedat"];
    private static readonly HashSet<string> AllowedSortOrder = ["asc", "desc"];

    public GetRobotConfigsQueryValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1).WithMessage("Page must be at least 1");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100).WithMessage("PageSize must be between 1 and 100");

        RuleFor(x => x.SortBy)
            .Must(value => AllowedSortBy.Contains(value.ToLowerInvariant()))
            .WithMessage("SortBy must be one of: name, createdAt, updatedAt");

        RuleFor(x => x.SortOrder)
            .Must(value => AllowedSortOrder.Contains(value.ToLowerInvariant()))
            .WithMessage("SortOrder must be asc or desc");
    }
}