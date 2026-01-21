namespace VisualFlow.Application.Features.RobotConfigs.Dtos;

/// <summary>
/// Data transfer object for component file information.
/// </summary>
public sealed record ComponentFileDto
{
    public Guid Id { get; init; }
    public string FileName { get; init; } = string.Empty;
    public long FileSize { get; init; }
    public string ContentType { get; init; } = string.Empty;
    public DateTime UploadedAt { get; init; }
    public string? UploadedBy { get; init; }
    public string ComponentType { get; init; } = string.Empty;
    public List<string> ContainsFiles { get; init; } = [];
    public string Url { get; init; } = string.Empty;
}
