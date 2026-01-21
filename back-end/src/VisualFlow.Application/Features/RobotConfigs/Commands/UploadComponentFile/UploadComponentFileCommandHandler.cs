using AutoMapper;
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
    IRepository<ComponentFile> repository,
    IMapper mapper,
    IApiUrlProvider apiUrlProvider)
        : IRequestHandler<UploadComponentFileCommand, ComponentFileDto>
{
    private readonly IUnitOfWork _unitOfWork = unitOfWork;
    private readonly IFileStorageService _fileStorageService = fileStorageService;
    private readonly IZipValidationService _zipValidationService = zipValidationService;
    private readonly IRepository<ComponentFile> _repository = repository;
    private readonly IMapper _mapper = mapper;
    private readonly IApiUrlProvider _apiUrlProvider = apiUrlProvider;

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

        // Map to DTO and set URL
        var dto = _mapper.Map<ComponentFileDto>(componentFile);
        return dto with
        {
            Url = _apiUrlProvider.GetComponentFileUrl(componentFile.Id)
        };
    }
}
