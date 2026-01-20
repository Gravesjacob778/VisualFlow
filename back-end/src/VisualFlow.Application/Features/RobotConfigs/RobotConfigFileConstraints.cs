namespace VisualFlow.Application.Features.RobotConfigs;

/// <summary>
/// File upload constraints for robot configuration assets.
/// </summary>
public static class RobotConfigFileConstraints
{
    public const long MaxGltfFileSizeBytes = 52_428_800;
    public static readonly string[] AllowedExtensions = [".gltf", ".glb"];
}