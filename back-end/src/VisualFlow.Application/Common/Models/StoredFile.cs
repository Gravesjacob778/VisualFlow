namespace VisualFlow.Application.Common.Models;

/// <summary>
/// Represents a stored file result.
/// </summary>
public sealed record StoredFile(
    string StoragePath,
    string StorageFileName,
    long FileSize,
    string ContentType,
    DateTime UploadedAt)
{
    /// <summary>
    /// Legacy property for backward compatibility.
    /// </summary>
    public string FileName => StorageFileName;
};