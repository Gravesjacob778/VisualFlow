using MediatR;
using Microsoft.EntityFrameworkCore;
using VisualFlow.Application.Common.Interfaces;
using VisualFlow.Domain.Entities;
using VisualFlow.Domain.Exceptions;

namespace VisualFlow.Application.Features.RobotConfigs.Commands.DeleteRobotConfig;

/// <summary>
/// Handler for deleting robot configurations.
/// </summary>
public sealed class DeleteRobotConfigCommandHandler(
    IApplicationDbContext dbContext,
    IFileStorageService fileStorageService)
    : IRequestHandler<DeleteRobotConfigCommand>
{
    public async Task Handle(DeleteRobotConfigCommand request, CancellationToken cancellationToken)
    {
        var entity = await dbContext.Set<RobotConfig>()
            .Include(x => x.GltfModel)
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(RobotConfig), request.Id);

        if (entity.GltfModel is not null)
        {
            await fileStorageService.DeleteAsync(entity.GltfModel.StoragePath, cancellationToken);
            dbContext.Set<RobotConfigGltfModel>().Remove(entity.GltfModel);
        }

        dbContext.Set<RobotConfig>().Remove(entity);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}