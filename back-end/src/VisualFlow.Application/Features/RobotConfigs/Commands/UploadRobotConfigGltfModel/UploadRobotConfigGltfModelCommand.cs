using MediatR;
using VisualFlow.Application.Features.RobotConfigs.Dtos;

namespace VisualFlow.Application.Features.RobotConfigs.Commands.UploadRobotConfigGltfModel;

/// <summary>
/// Command to upload a GLTF model for a robot configuration.
/// </summary>
public sealed record UploadRobotConfigGltfModelCommand(
    Guid RobotConfigId,
    Stream Content,
    string FileName,
    string ContentType,
    long FileSize) : IRequest<GltfModelDto>;