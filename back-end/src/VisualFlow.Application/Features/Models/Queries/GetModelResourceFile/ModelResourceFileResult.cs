namespace VisualFlow.Application.Features.Models.Queries.GetModelResourceFile;

/// <summary>
/// Represents a model resource file ready for download.
/// </summary>
public sealed record ModelResourceFileResult(
    Stream Content,
    string ContentType,
    string FileName,
    long Length,
    string ETag);
