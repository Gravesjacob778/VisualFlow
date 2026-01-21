namespace VisualFlow.Application.Features.RobotConfigs;

/// <summary>
/// File upload constraints for robot component ZIP archives.
/// </summary>
public static class ComponentFileConstraints
{
    /// <summary>
    /// Maximum allowed ZIP file size: 50 MB.
    /// </summary>
    public const long MaxZipFileSizeBytes = 52_428_800; // 50 MB

    /// <summary>
    /// Maximum allowed uncompressed size: 200 MB (ZIP bomb protection).
    /// </summary>
    public const long MaxUncompressedSizeBytes = 209_715_200; // 200 MB

    /// <summary>
    /// Maximum file name length.
    /// </summary>
    public const int MaxFileNameLength = 255;

    /// <summary>
    /// Allowed file extensions within the ZIP archive.
    /// </summary>
    public static readonly string[] AllowedContentExtensions = 
    [
        ".gltf", ".glb", ".bin",
        ".jpg", ".jpeg", ".png",
        ".json", ".txt"
    ];

    /// <summary>
    /// Forbidden executable file extensions.
    /// </summary>
    public static readonly string[] ForbiddenExecutableExtensions = 
    [
        ".exe", ".dll", ".so", ".sh",
        ".bat", ".cmd", ".ps1", ".vbs",
        ".app", ".deb", ".rpm"
    ];

    /// <summary>
    /// Allowed component types.
    /// </summary>
    public static readonly string[] ComponentTypes = 
    [
        "gripper", "sensor", "tool", "other"
    ];
}
