using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using VisualFlow.Application.Common.Interfaces;
using VisualFlow.Application.Features.RobotConfigs.Dtos;
using VisualFlow.Domain.Entities;
using VisualFlow.Domain.Exceptions;

namespace VisualFlow.Application.Features.RobotConfigs.Commands.UploadRobotConfigGltfModel;

/// <summary>
/// Handler for uploading GLTF model files.
/// </summary>
public sealed class UploadRobotConfigGltfModelCommandHandler(
    IApplicationDbContext dbContext,
    IFileStorageService fileStorageService,
    IMapper mapper,
    IApiUrlProvider apiUrlProvider)
    : IRequestHandler<UploadRobotConfigGltfModelCommand, GltfModelDto>
{
    public async Task<GltfModelDto> Handle(UploadRobotConfigGltfModelCommand request, CancellationToken cancellationToken)
    {
        var config = await dbContext.Set<RobotConfig>()
            .Include(x => x.GltfModel)
            .FirstOrDefaultAsync(x => x.Id == request.RobotConfigId, cancellationToken)
            ?? throw new NotFoundException(nameof(RobotConfig), request.RobotConfigId);

        if (config.GltfModel is not null)
        {
            await fileStorageService.DeleteAsync(config.GltfModel.StoragePath, cancellationToken);
            dbContext.Set<RobotConfigGltfModel>().Remove(config.GltfModel);
        }

        var stored = await fileStorageService.SaveRobotConfigModelAsync(
            request.RobotConfigId,
            request.Content,
            request.FileName,
            request.ContentType,
            cancellationToken);

        var model = new RobotConfigGltfModel
        {
            RobotConfigId = config.Id,
            FileName = stored.FileName,
            FileSize = stored.FileSize,
            ContentType = stored.ContentType,
            UploadedAt = stored.UploadedAt,
            StoragePath = stored.StoragePath
        };

        await dbContext.Set<RobotConfigGltfModel>().AddAsync(model, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        var dto = mapper.Map<GltfModelDto>(model) with
        {
            Url = apiUrlProvider.GetRobotConfigGltfModelUrl(config.Id)
        };

        return dto;
    }
}