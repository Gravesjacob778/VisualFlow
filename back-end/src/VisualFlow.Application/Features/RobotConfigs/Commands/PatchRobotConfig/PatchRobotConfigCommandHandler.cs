using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using VisualFlow.Application.Common.Interfaces;
using VisualFlow.Application.Features.RobotConfigs.Dtos;
using VisualFlow.Domain.Entities;
using VisualFlow.Domain.Exceptions;

namespace VisualFlow.Application.Features.RobotConfigs.Commands.PatchRobotConfig;

/// <summary>
/// Handler for partially updating robot configurations.
/// </summary>
public sealed class PatchRobotConfigCommandHandler(
    IApplicationDbContext dbContext,
    IMapper mapper,
    IApiUrlProvider apiUrlProvider)
    : IRequestHandler<PatchRobotConfigCommand, RobotConfigDto>
{
    public async Task<RobotConfigDto> Handle(PatchRobotConfigCommand request, CancellationToken cancellationToken)
    {
        var entity = await dbContext.Set<RobotConfig>()
            .Include(x => x.GltfModel)
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(RobotConfig), request.Id);

        if (!string.IsNullOrWhiteSpace(request.Name) && !string.Equals(entity.Name, request.Name, StringComparison.Ordinal))
        {
            var nameConflict = await dbContext.Set<RobotConfig>()
                .AsNoTracking()
                .AnyAsync(x => x.Id != request.Id && x.Name == request.Name, cancellationToken);

            if (nameConflict)
            {
                throw new ConflictException("Robot configuration name already exists");
            }

            entity.Name = request.Name;
        }

        if (request.Description is not null)
        {
            entity.Description = request.Description;
        }

        if (request.Transform is not null)
        {
            entity.Transform = request.Transform;
        }

        if (request.JointAngles is not null)
        {
            entity.JointAngles = request.JointAngles;
        }

        if (request.Gripper is not null)
        {
            entity.Gripper = request.Gripper;
        }

        if (request.BoneControls is not null)
        {
            entity.BoneControls = request.BoneControls;
        }

        if (request.Materials is not null)
        {
            entity.Materials = request.Materials;
        }

        if (request.Tags is not null)
        {
            entity.Tags = request.Tags;
        }

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