using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using VisualFlow.Application.Common.Interfaces;
using VisualFlow.Application.Features.RobotConfigs.Dtos;
using VisualFlow.Domain.Entities;

namespace VisualFlow.Application.Features.RobotConfigs.Queries.GetRobotConfigs;

/// <summary>
/// Handler for retrieving paginated robot configurations.
/// </summary>
public sealed class GetRobotConfigsQueryHandler(
    IApplicationDbContext dbContext,
    IMapper mapper,
    IApiUrlProvider apiUrlProvider)
    : IRequestHandler<GetRobotConfigsQuery, RobotConfigListDto>
{
    public async Task<RobotConfigListDto> Handle(GetRobotConfigsQuery request, CancellationToken cancellationToken)
    {
        var queryable = dbContext.Set<RobotConfig>()
            .AsNoTracking()
            .Include(x => x.GltfModel)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            queryable = queryable.Where(x =>
                x.Name.Contains(search) ||
                (x.Description != null && x.Description.Contains(search)));
        }

        queryable = ApplySorting(queryable, request.SortBy, request.SortOrder);

        var items = await queryable.ToListAsync(cancellationToken);

        if (request.Tags is { Count: > 0 })
        {
            items = items
                .Where(x => request.Tags.All(tag => x.Tags.Contains(tag)))
                .ToList();
        }

        var total = items.Count;
        var totalPages = (int)Math.Ceiling(total / (double)request.PageSize);
        var pagedItems = items
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        var summaries = mapper.Map<List<RobotConfigSummaryDto>>(pagedItems);
        var gltfUrlLookup = pagedItems
            .Where(x => x.GltfModel is not null)
            .ToDictionary(x => x.GltfModel!.Id, x => apiUrlProvider.GetRobotConfigGltfModelUrl(x.Id));

        summaries = summaries
            .Select(summary =>
            {
                if (summary.GltfModel is null)
                {
                    return summary;
                }

                return summary with
                {
                    GltfModel = summary.GltfModel with
                    {
                        Url = gltfUrlLookup[summary.GltfModel.Id]
                    }
                };
            })
            .ToList();

        return new RobotConfigListDto(
            summaries,
            total,
            request.Page,
            request.PageSize,
            totalPages);
    }

    private static IQueryable<RobotConfig> ApplySorting(IQueryable<RobotConfig> queryable, string sortBy, string sortOrder)
    {
        var desc = string.Equals(sortOrder, "desc", StringComparison.OrdinalIgnoreCase);
        return sortBy.ToLowerInvariant() switch
        {
            "name" => desc ? queryable.OrderByDescending(x => x.Name) : queryable.OrderBy(x => x.Name),
            "updatedat" => desc ? queryable.OrderByDescending(x => x.ModifiedAt ?? x.CreatedAt) : queryable.OrderBy(x => x.ModifiedAt ?? x.CreatedAt),
            _ => desc ? queryable.OrderByDescending(x => x.CreatedAt) : queryable.OrderBy(x => x.CreatedAt)
        };
    }
}