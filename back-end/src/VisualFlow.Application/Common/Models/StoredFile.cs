namespace VisualFlow.Application.Common.Models;

/// <summary>
/// Represents a stored file result.
/// </summary>
public sealed record StoredFile(
    string StoragePath,
    string FileName,
    long FileSize,
    string ContentType,
    DateTime UploadedAt);