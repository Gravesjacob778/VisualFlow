using System.IO.Compression;
using System.Security.Cryptography;
using MediatR;
using Microsoft.EntityFrameworkCore;
using VisualFlow.Application.Common.Interfaces;
using VisualFlow.Domain.Entities;
using VisualFlow.Domain.Exceptions;

namespace VisualFlow.Application.Features.Models.Queries.GetModelResourceFile;

/// <summary>
/// Handler for retrieving resource files from a model package.
/// </summary>
public sealed class GetModelResourceFileQueryHandler(
    IApplicationDbContext dbContext,
    IFileStorageService fileStorageService)
    : IRequestHandler<GetModelResourceFileQuery, ModelResourceFileResult>
{
    private readonly IApplicationDbContext _dbContext = dbContext;
    private readonly IFileStorageService _fileStorageService = fileStorageService;

    public async Task<ModelResourceFileResult> Handle(GetModelResourceFileQuery request, CancellationToken cancellationToken)
    {
        if (!IsSafeRelativePath(request.ResourcePath))
        {
            throw new NotFoundException("Resource", request.ResourcePath);
        }

        var component = await _dbContext.Set<ComponentFile>()
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.ModelId, cancellationToken)
            ?? throw new NotFoundException(nameof(ComponentFile), request.ModelId);

        var normalizedResource = NormalizePath(request.ResourcePath);
        var entryName = component.ContainedFiles
            .FirstOrDefault(file => string.Equals(NormalizePath(file), normalizedResource, StringComparison.OrdinalIgnoreCase));

        if (string.IsNullOrWhiteSpace(entryName))
        {
            throw new NotFoundException("Resource", request.ResourcePath);
        }

        await using var zipStream = await _fileStorageService.OpenReadAsync(component.StoragePath, cancellationToken);
        using var archive = new ZipArchive(zipStream, ZipArchiveMode.Read, leaveOpen: false);
        var entry = archive.GetEntry(entryName) ?? throw new NotFoundException("Resource", request.ResourcePath);
        await using var entryStream = entry.Open();
        var memoryStream = new MemoryStream();
        await entryStream.CopyToAsync(memoryStream, cancellationToken);
        memoryStream.Position = 0;

        var contentType = ResolveContentType(entryName);
        var eTag = CreateETag(memoryStream);
        memoryStream.Position = 0;

        return new ModelResourceFileResult(
            memoryStream,
            contentType,
            Path.GetFileName(entryName),
            memoryStream.Length,
            eTag);
    }

    private static string NormalizePath(string path)
    {
        return path.Replace('\\', '/').TrimStart('.', '/');
    }

    private static bool IsSafeRelativePath(string path)
    {
        if (string.IsNullOrWhiteSpace(path))
        {
            return false;
        }

        if (path.Contains('\0', StringComparison.Ordinal))
        {
            return false;
        }

        if (Path.IsPathRooted(path))
        {
            return false;
        }

        var normalized = path.Replace('\\', '/');
        var segments = normalized.Split('/', StringSplitOptions.RemoveEmptyEntries);
        return segments.All(segment => segment is not ".." and not ".");
    }

    private static string ResolveContentType(string fileName)
    {
        var extension = Path.GetExtension(fileName);
        return extension.ToLowerInvariant() switch
        {
            ".bin" => "application/octet-stream",
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".gltf" => "model/gltf+json",
            ".glb" => "model/gltf-binary",
            ".json" => "application/json",
            ".txt" => "text/plain",
            _ => "application/octet-stream"
        };
    }

    private static string CreateETag(Stream contentStream)
    {
        var hash = SHA256.HashData(contentStream);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
