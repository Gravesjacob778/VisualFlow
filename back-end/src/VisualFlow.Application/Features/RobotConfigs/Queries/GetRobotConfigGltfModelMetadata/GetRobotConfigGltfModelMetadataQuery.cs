using MediatR;
using VisualFlow.Application.Features.RobotConfigs.Dtos;

namespace VisualFlow.Application.Features.RobotConfigs.Queries.GetRobotConfigGltfModelMetadata;

/// <summary>
/// Query to get GLTF model metadata for a robot configuration.
/// </summary>
public sealed record GetRobotConfigGltfModelMetadataQuery(Guid RobotConfigId) : IRequest<GltfModelDto>;