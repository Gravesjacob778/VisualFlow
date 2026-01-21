using System.Text.RegularExpressions;
using FluentValidation;
using VisualFlow.Domain.ValueObjects;

namespace VisualFlow.Application.Features.RobotConfigs.Validators;

/// <summary>
/// Shared validation rules for robot configuration payloads.
/// </summary>
public static class RobotConfigValidationRules
{
    private const int VectorLength = 3;
    private const string HexColorPattern = "^#([0-9a-fA-F]{6})$";

    public static IRuleBuilderOptions<T, string> NameRules<T>(this IRuleBuilder<T, string> ruleBuilder)
    {
        return ruleBuilder
            .NotEmpty().WithMessage("Name is required")
            .MaximumLength(100).WithMessage("Name must not exceed 100 characters");
    }

    public static IRuleBuilderOptions<T, string?> DescriptionRules<T>(this IRuleBuilder<T, string?> ruleBuilder)
    {
        return ruleBuilder
            .MaximumLength(500).WithMessage("Description must not exceed 500 characters");
    }

    public static IRuleBuilderOptions<T, TransformData> TransformRules<T>(this IRuleBuilder<T, TransformData> ruleBuilder)
    {
        return ruleBuilder
            .NotNull().WithMessage("Transform is required")
            .Must(t => t.Position is { Length: VectorLength } && t.Rotation is { Length: VectorLength } && t.Scale is { Length: VectorLength })
            .WithMessage("Transform position, rotation, and scale must each contain exactly 3 elements");
    }

    public static IRuleBuilderOptions<T, JointAngles> JointAnglesRules<T>(this IRuleBuilder<T, JointAngles> ruleBuilder)
    {
        return ruleBuilder.NotNull().WithMessage("Joint angles are required");
    }

    public static IRuleBuilderOptions<T, GripperData> GripperRules<T>(this IRuleBuilder<T, GripperData> ruleBuilder)
    {
        return ruleBuilder
            .NotNull().WithMessage("Gripper is required")
            .Must(g => g.GripperValue is >= -360 and <= 360)
            .WithMessage("Gripper value must be between -360 and 360")
            .Must(g => g.ClawValue is >= 0 and <= 1)
            .WithMessage("Claw value must be between 0 and 1");
    }

    public static IRuleBuilderOptions<T, List<BoneControlData>> BoneControlsRules<T>(this IRuleBuilder<T, List<BoneControlData>> ruleBuilder)
    {
        return ruleBuilder
            .Must(list => list.All(b => !string.IsNullOrWhiteSpace(b.BoneName)))
            .WithMessage("Bone name is required")
            .Must(list => list.All(b => b.Position is { Length: VectorLength } && b.Rotation is { Length: VectorLength } && b.Scale is { Length: VectorLength }))
            .WithMessage("Bone position, rotation, and scale must each contain exactly 3 elements");
    }

    public static IRuleBuilderOptions<T, List<MaterialData>> MaterialsRules<T>(this IRuleBuilder<T, List<MaterialData>> ruleBuilder)
    {
        return ruleBuilder
            .Must(list => list.All(m => !string.IsNullOrWhiteSpace(m.Name)))
            .WithMessage("Material name is required")
            .Must(list => list.All(m => Regex.IsMatch(m.Color, HexColorPattern)))
            .WithMessage("Material color must be a valid hex color")
            .Must(list => list.All(m => m.Metalness is >= 0 and <= 1))
            .WithMessage("Material metalness must be between 0 and 1")
            .Must(list => list.All(m => m.Roughness is >= 0 and <= 1))
            .WithMessage("Material roughness must be between 0 and 1")
            .Must(list => list.All(m => m.EmissiveIntensity is null or >= 0 and <= 10))
            .WithMessage("Material emissive intensity must be between 0 and 10");
    }
}