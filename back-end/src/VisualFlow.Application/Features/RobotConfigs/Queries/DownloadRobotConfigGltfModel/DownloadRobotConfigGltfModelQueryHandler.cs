using MediatR;
using Microsoft.EntityFrameworkCore;
using VisualFlow.Application.Common.Interfaces;
using VisualFlow.Domain.Entities;
using VisualFlow.Domain.Exceptions;

namespace VisualFlow.Application.Features.RobotConfigs.Queries.DownloadRobotConfigGltfModel;

/// <summary>
/// Handler for downloading GLTF model files.
/// </summary>
public sealed class DownloadRobotConfigGltfModelQueryHandler(
    IApplicationDbContext dbContext,
    IFileStorageService fileStorageService)
    : IRequestHandler<DownloadRobotConfigGltfModelQuery, RobotConfigGltfModelFile>
{
    public async Task<RobotConfigGltfModelFile> Handle(DownloadRobotConfigGltfModelQuery request, CancellationToken cancellationToken)
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

        var stream = await fileStorageService.OpenReadAsync(config.GltfModel.StoragePath, cancellationToken);
        return new RobotConfigGltfModelFile(stream, config.GltfModel.FileName, config.GltfModel.ContentType);
    }
}