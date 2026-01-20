using MediatR;
using Microsoft.EntityFrameworkCore;
using VisualFlow.Application.Common.Interfaces;
using VisualFlow.Domain.Entities;
using VisualFlow.Domain.Exceptions;

namespace VisualFlow.Application.Features.RobotConfigs.Commands.DeleteRobotConfigGltfModel;

/// <summary>
/// Handler for deleting GLTF models.
/// </summary>
public sealed class DeleteRobotConfigGltfModelCommandHandler(
    IApplicationDbContext dbContext,
    IFileStorageService fileStorageService)
    : IRequestHandler<DeleteRobotConfigGltfModelCommand>
{
    public async Task Handle(DeleteRobotConfigGltfModelCommand request, CancellationToken cancellationToken)
    {
        var config = await dbContext.Set<RobotConfig>()
            .Include(x => x.GltfModel)
            .FirstOrDefaultAsync(x => x.Id == request.RobotConfigId, cancellationToken)
            ?? throw new NotFoundException(nameof(RobotConfig), request.RobotConfigId);

        if (config.GltfModel is null)
        {
            throw new NotFoundException(nameof(RobotConfigGltfModel), request.RobotConfigId);
        }

        await fileStorageService.DeleteAsync(config.GltfModel.StoragePath, cancellationToken);
        dbContext.Set<RobotConfigGltfModel>().Remove(config.GltfModel);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}