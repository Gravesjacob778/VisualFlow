namespace VisualFlow.Application.Features.RobotConfigs.Queries.DownloadRobotConfigGltfModel;

/// <summary>
/// Represents a downloadable GLTF model file.
/// </summary>
public sealed record RobotConfigGltfModelFile(
    Stream Content,
    string FileName,
    string ContentType);