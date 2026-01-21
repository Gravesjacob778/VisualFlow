using Microsoft.Extensions.Configuration;
using VisualFlow.Application.Common.Interfaces;
using VisualFlow.Application.Common.Models;
using VisualFlow.Application.Features.RobotConfigs;

namespace VisualFlow.Infrastructure.Services;

/// <summary>
/// Stores files on the local file system.
/// </summary>
public sealed class FileSystemStorageService : IFileStorageService
{
    private readonly string _rootPath;

    public FileSystemStorageService(IConfiguration configuration)
    {
        _rootPath = configuration["FileStorage:RootPath"] ?? "storage";
    }

    public async Task<StoredFile> SaveRobotConfigModelAsync(
        Guid robotConfigId,
        Stream content,
        string fileName,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        var extension = Path.GetExtension(fileName);
        if (!RobotConfigFileConstraints.AllowedExtensions
                .Any(ext => string.Equals(ext, extension, StringComparison.OrdinalIgnoreCase)))
        {
            throw new InvalidOperationException("File extension is not allowed");
        }

        var safeFileName = Path.GetFileName(fileName);
        var fileId = Guid.NewGuid().ToString("D");
        var storageFileName = $"{fileId}{extension}";
        var relativePath = Path.Combine("gltf-models", storageFileName);
        var fullPath = GetSafeFullPath(relativePath);

        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);

        await using var fileStream = new FileStream(fullPath, FileMode.CreateNew, FileAccess.Write, FileShare.None);
        await content.CopyToAsync(fileStream, cancellationToken);

        var stored = new FileInfo(fullPath);

        return new StoredFile(
            relativePath,
            storageFileName,
            stored.Length,
            contentType,
            DateTime.UtcNow);
    }

    public async Task<StoredFile> SaveComponentFileAsync(
        Stream content,
        string fileName,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        // Only accept .zip files
        var extension = Path.GetExtension(fileName);
        if (!string.Equals(extension, ".zip", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Only ZIP files are allowed");
        }

        var safeFileName = Path.GetFileName(fileName);
        var fileId = Guid.NewGuid().ToString("D");
        var storageFileName = $"{fileId}.zip";
        var relativePath = Path.Combine("components", storageFileName);
        var fullPath = GetSafeFullPath(relativePath);

        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);

        await using var fileStream = new FileStream(fullPath, FileMode.CreateNew, FileAccess.Write, FileShare.None);
        await content.CopyToAsync(fileStream, cancellationToken);

        var stored = new FileInfo(fullPath);

        return new StoredFile(
            relativePath,
            storageFileName,
            stored.Length,
            contentType,
            DateTime.UtcNow);
    }

    public Task<Stream> OpenReadAsync(string storagePath, CancellationToken cancellationToken = default)
    {
        var fullPath = GetSafeFullPath(storagePath);
        Stream stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return Task.FromResult(stream);
    }

    public Task DeleteAsync(string storagePath, CancellationToken cancellationToken = default)
    {
        var fullPath = GetSafeFullPath(storagePath);
        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);
        }

        return Task.CompletedTask;
    }

    private string GetSafeFullPath(string relativePath)
    {
        var combined = Path.GetFullPath(Path.Combine(_rootPath, relativePath));
        var rootFullPath = Path.GetFullPath(_rootPath);

        if (!combined.StartsWith(rootFullPath, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Invalid storage path");
        }

        return combined;
    }
}