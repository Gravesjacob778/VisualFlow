using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using VisualFlow.Application.Common.Interfaces;
using VisualFlow.Application.Features.RobotConfigs.Dtos;
using VisualFlow.Domain.Entities;
using VisualFlow.Domain.Exceptions;

namespace VisualFlow.Application.Features.RobotConfigs.Commands.CreateRobotConfig;

/// <summary>
/// Handler for creating robot configurations.
/// </summary>
public sealed class CreateRobotConfigCommandHandler(
    IApplicationDbContext dbContext,
    IMapper mapper,
    IApiUrlProvider apiUrlProvider)
    : IRequestHandler<CreateRobotConfigCommand, RobotConfigDto>
{
    public async Task<RobotConfigDto> Handle(CreateRobotConfigCommand request, CancellationToken cancellationToken)
    {
        var existingName = await dbContext.Set<RobotConfig>()
            .AsNoTracking()
            .AnyAsync(x => x.Name == request.Name, cancellationToken);

        if (existingName)
        {
            throw new ConflictException("Robot configuration name already exists");
        }

        var entity = new RobotConfig
        {
            Name = request.Name,
            Description = request.Description,
            Transform = request.Transform,
            JointAngles = request.JointAngles,
            Gripper = request.Gripper,
            BoneControls = request.BoneControls ?? [],
            Materials = request.Materials ?? [],
            Tags = request.Tags ?? []
        };

        await dbContext.Set<RobotConfig>().AddAsync(entity, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

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