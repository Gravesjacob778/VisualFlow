using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using VisualFlow.Application.Common.Interfaces;
using VisualFlow.Application.Features.RobotConfigs.Dtos;
using VisualFlow.Domain.Entities;

namespace VisualFlow.Application.Features.RobotConfigs.Queries.GetAllComponentFiles;

/// <summary>
/// Handler for retrieving all uploaded component files.
/// </summary>
public sealed class GetAllComponentFilesQueryHandler(
    IApplicationDbContext dbContext,
    IMapper mapper,
    IApiUrlProvider apiUrlProvider)
    : IRequestHandler<GetAllComponentFilesQuery, ComponentFileListDto>
{
    public async Task<ComponentFileListDto> Handle(
        GetAllComponentFilesQuery request,
        CancellationToken cancellationToken)
    {
        var componentFiles = await dbContext.Set<ComponentFile>()
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        var dtos = mapper.Map<List<ComponentFileDto>>(componentFiles);

        // Set URLs for each component file
        dtos = [.. dtos.Select(dto => dto with
        {
            Url = apiUrlProvider.GetComponentFileUrl(dto.Id)
        })];

        return new ComponentFileListDto(dtos);
    }
}
