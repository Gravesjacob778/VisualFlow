namespace VisualFlow.Application.Features.RobotConfigs.Dtos;

/// <summary>
/// DTO for GLTF model metadata.
/// </summary>
public sealed record GltfModelDto(
    Guid Id,
    string FileName,
    long FileSize,
    string ContentType,
    DateTime UploadedAt,
    string Url);