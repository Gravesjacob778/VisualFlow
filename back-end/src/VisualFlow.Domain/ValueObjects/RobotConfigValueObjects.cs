namespace VisualFlow.Domain.ValueObjects;

/// <summary>
/// Transform data for a robot configuration.
/// </summary>
public sealed record TransformData(
    double[] Position,
    double[] Rotation,
    double[] Scale);

/// <summary>
/// Joint angles for a robot configuration.
/// </summary>
public sealed record JointAngles(
    double J1,
    double J2,
    double J3,
    double J4,
    double J5,
    double J6);

/// <summary>
/// Gripper control data.
/// </summary>
public sealed record GripperData(
    double GripperValue,
    double ClawValue);

/// <summary>
/// Bone control data for a robot configuration.
/// </summary>
public sealed record BoneControlData(
    string BoneName,
    double[] Position,
    double[] Rotation,
    double[] Scale);

/// <summary>
/// Material settings for a robot configuration.
/// </summary>
public sealed record MaterialData(
    string Name,
    string Color,
    double Metalness,
    double Roughness,
    string? Emissive,
    double? EmissiveIntensity);