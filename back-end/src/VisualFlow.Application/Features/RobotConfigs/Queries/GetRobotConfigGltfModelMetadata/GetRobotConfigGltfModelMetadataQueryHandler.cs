using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using VisualFlow.Application.Common.Interfaces;
using VisualFlow.Application.Features.RobotConfigs.Dtos;
using VisualFlow.Domain.Entities;
using VisualFlow.Domain.Exceptions;

namespace VisualFlow.Application.Features.RobotConfigs.Queries.GetRobotConfigGltfModelMetadata;

/// <summary>
/// Handler for retrieving GLTF model metadata.
/// </summary>
public sealed class GetRobotConfigGltfModelMetadataQueryHandler(
    IApplicationDbContext dbContext,
    IMapper mapper,
    IApiUrlProvider apiUrlProvider)
    : IRequestHandler<GetRobotConfigGltfModelMetadataQuery, GltfModelDto>
{
    public async Task<GltfModelDto> Handle(GetRobotConfigGltfModelMetadataQuery request, CancellationToken cancellationToken)
    {
        var config = await dbContext.Set<RobotConfig>()
            .AsNoTracking()
            .Include(x => x.GltfModel)
            .FirstOrDefaultAsync(x => x.Id == request.RobotConfigId, cancellationToken)
            ?? throw new NotFoundException(nameof(RobotConfig), request.RobotConfigId);

        if (config.GltfModel is null)
        {
            throw new NotFoundException(nameof(RobotConfigGltfModel), request.RobotConfigId);
        }

        var dto = mapper.Map<GltfModelDto>(config.GltfModel) with
        {
            Url = apiUrlProvider.GetRobotConfigGltfModelUrl(config.Id)
        };

        return dto;
    }
}