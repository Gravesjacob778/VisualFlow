using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using VisualFlow.Application.Common.Interfaces;
using VisualFlow.Application.Features.RobotConfigs.Dtos;
using VisualFlow.Domain.Entities;
using VisualFlow.Domain.Exceptions;

namespace VisualFlow.Application.Features.RobotConfigs.Commands.UpdateRobotConfig;

/// <summary>
/// Handler for updating robot configurations.
/// </summary>
public sealed class UpdateRobotConfigCommandHandler(
    IApplicationDbContext dbContext,
    IMapper mapper,
    IApiUrlProvider apiUrlProvider)
    : IRequestHandler<UpdateRobotConfigCommand, RobotConfigDto>
{
    public async Task<RobotConfigDto> Handle(UpdateRobotConfigCommand request, CancellationToken cancellationToken)
    {
        var entity = await dbContext.Set<RobotConfig>()
            .Include(x => x.GltfModel)
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(RobotConfig), request.Id);

        var nameConflict = await dbContext.Set<RobotConfig>()
            .AsNoTracking()
            .AnyAsync(x => x.Id != request.Id && x.Name == request.Name, cancellationToken);

        if (nameConflict)
        {
            throw new ConflictException("Robot configuration name already exists");
        }

        entity.Name = request.Name;
        entity.Description = request.Description;
        entity.Transform = request.Transform;
        entity.JointAngles = request.JointAngles;
        entity.Gripper = request.Gripper;
        entity.BoneControls = request.BoneControls ?? [];
        entity.Materials = request.Materials ?? [];
        entity.Tags = request.Tags ?? [];

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