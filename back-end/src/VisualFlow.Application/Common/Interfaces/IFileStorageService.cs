using VisualFlow.Application.Common.Models;

namespace VisualFlow.Application.Common.Interfaces;

/// <summary>
/// Abstraction for file storage operations.
/// </summary>
public interface IFileStorageService
{
    Task<StoredFile> SaveRobotConfigModelAsync(
        Guid robotConfigId,
        Stream content,
        string fileName,
        string contentType,
        CancellationToken cancellationToken = default);

    Task<StoredFile> SaveComponentFileAsync(
        Stream content,
        string fileName,
        string contentType,
        CancellationToken cancellationToken = default);

    Task<Stream> OpenReadAsync(string storagePath, CancellationToken cancellationToken = default);

    Task DeleteAsync(string storagePath, CancellationToken cancellationToken = default);
}