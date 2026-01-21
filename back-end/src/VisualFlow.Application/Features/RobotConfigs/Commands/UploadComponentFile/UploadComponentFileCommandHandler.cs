using MediatR;
using VisualFlow.Application.Common.Interfaces;
using VisualFlow.Application.Features.RobotConfigs.Dtos;
using VisualFlow.Domain.Entities;
using VisualFlow.Domain.Interfaces;

namespace VisualFlow.Application.Features.RobotConfigs.Commands.UploadComponentFile;

/// <summary>
/// Handles the upload of robot component ZIP files.
/// </summary>
public sealed class UploadComponentFileCommandHandler(
    IUnitOfWork unitOfWork,
    IFileStorageService fileStorageService,
    IZipValidationService zipValidationService,
    IRepository<ComponentFile> repository)
        : IRequestHandler<UploadComponentFileCommand, ComponentFileDto>
{
    private readonly IUnitOfWork _unitOfWork = unitOfWork;
    private readonly IFileStorageService _fileStorageService = fileStorageService;
    private readonly IZipValidationService _zipValidationService = zipValidationService;
    private readonly IRepository<ComponentFile> _repository = repository;

    public async Task<ComponentFileDto> Handle(
        UploadComponentFileCommand request,
        CancellationToken cancellationToken)
    {
        // Validate ZIP content and extract metadata
        var (Files, UncompressedSize) = await _zipValidationService
            .ValidateAndExtractMetadataAsync(request.FileStream, cancellationToken);
        var containedFiles = Files;
        var uncompressedSize = UncompressedSize;

        // Reset stream position for storage
        request.FileStream.Position = 0;

        // Save file to storage
        var storedFile = await _fileStorageService.SaveComponentFileAsync(
            request.FileStream,
            request.FileName,
            request.ContentType,
            cancellationToken);

        // Create entity
        var componentFile = new ComponentFile
        {
            FileName = request.FileName,
            StorageFileName = Path.GetFileNameWithoutExtension(storedFile.StorageFileName),
            FileSize = request.FileSize,
            ContentType = request.ContentType,
            ComponentType = request.ComponentType?.ToLowerInvariant() ?? "other",
            ContainedFiles = containedFiles,
            UncompressedSize = uncompressedSize,
            StoragePath = storedFile.StoragePath
        };

        // Save to database
        await _repository.AddAsync(componentFile, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Return DTO
        return new ComponentFileDto
        {
            Id = componentFile.Id,
            FileName = componentFile.FileName,
            FileSize = componentFile.FileSize,
            ContentType = componentFile.ContentType,
            UploadedAt = componentFile.CreatedAt,
            ComponentType = componentFile.ComponentType,
            ContainsFiles = componentFile.ContainedFiles,
            Url = $"/api/robot-configs/components/{componentFile.Id}"
        };
    }
}
