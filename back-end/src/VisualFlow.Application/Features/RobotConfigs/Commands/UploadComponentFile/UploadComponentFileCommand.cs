using MediatR;
using VisualFlow.Application.Features.RobotConfigs.Dtos;

namespace VisualFlow.Application.Features.RobotConfigs.Commands.UploadComponentFile;

/// <summary>
/// Command to upload a robot component ZIP file.
/// </summary>
public sealed record UploadComponentFileCommand : IRequest<ComponentFileDto>
{
    public required Stream FileStream { get; init; }
    public required string FileName { get; init; }
    public required string ContentType { get; init; }
    public required long FileSize { get; init; }
    public string? ComponentType { get; init; }
}
