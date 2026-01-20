using FluentValidation;
using VisualFlow.Application.Features.RobotConfigs;

namespace VisualFlow.Application.Features.RobotConfigs.Commands.UploadRobotConfigGltfModel;

/// <summary>
/// Validator for GLTF model uploads.
/// </summary>
public sealed class UploadRobotConfigGltfModelCommandValidator : AbstractValidator<UploadRobotConfigGltfModelCommand>
{
    public UploadRobotConfigGltfModelCommandValidator()
    {
        RuleFor(x => x.RobotConfigId).NotEmpty().WithMessage("RobotConfigId is required");
        RuleFor(x => x.FileName)
            .NotEmpty().WithMessage("FileName is required")
            .MaximumLength(255).WithMessage("FileName must not exceed 255 characters")
            .Must(HasAllowedExtension).WithMessage("File extension is not allowed");

        RuleFor(x => x.FileSize)
            .GreaterThan(0).WithMessage("FileSize must be greater than 0")
            .LessThanOrEqualTo(RobotConfigFileConstraints.MaxGltfFileSizeBytes)
            .WithMessage("FileSize exceeds maximum allowed size");
    }

    private static bool HasAllowedExtension(string fileName)
    {
        var extension = Path.GetExtension(fileName);
        return RobotConfigFileConstraints.AllowedExtensions
            .Any(ext => string.Equals(ext, extension, StringComparison.OrdinalIgnoreCase));
    }
}