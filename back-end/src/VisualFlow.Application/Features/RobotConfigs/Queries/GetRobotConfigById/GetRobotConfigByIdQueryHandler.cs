using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using VisualFlow.Application.Common.Interfaces;
using VisualFlow.Application.Features.RobotConfigs.Dtos;
using VisualFlow.Domain.Entities;
using VisualFlow.Domain.Exceptions;

namespace VisualFlow.Application.Features.RobotConfigs.Queries.GetRobotConfigById;

/// <summary>
/// Handler for retrieving robot configuration by ID.
/// </summary>
public sealed class GetRobotConfigByIdQueryHandler(
    IApplicationDbContext dbContext,
    IMapper mapper,
    IApiUrlProvider apiUrlProvider)
    : IRequestHandler<GetRobotConfigByIdQuery, RobotConfigDto>
{
    public async Task<RobotConfigDto> Handle(GetRobotConfigByIdQuery request, CancellationToken cancellationToken)
    {
        var entity = await dbContext.Set<RobotConfig>()
            .AsNoTracking()
            .Include(x => x.GltfModel)
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(RobotConfig), request.Id);

        var dto = mapper.Map<RobotConfigDto>(entity);
        var gltfUrl = apiUrlProvider.GetRobotConfigGltfModelUrl(entity.Id);

        dto = dto with
        {
            GltfModel = dto.GltfModel is null
                ? null
                : dto.GltfModel with { Url = gltfUrl }
        };

        return dto;
    }
}