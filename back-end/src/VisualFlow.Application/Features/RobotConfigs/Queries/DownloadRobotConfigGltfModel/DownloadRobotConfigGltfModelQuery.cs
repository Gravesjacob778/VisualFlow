using MediatR;

namespace VisualFlow.Application.Features.RobotConfigs.Queries.DownloadRobotConfigGltfModel;

/// <summary>
/// Query to download GLTF model file.
/// </summary>
public sealed record DownloadRobotConfigGltfModelQuery(Guid RobotConfigId) : IRequest<RobotConfigGltfModelFile>;