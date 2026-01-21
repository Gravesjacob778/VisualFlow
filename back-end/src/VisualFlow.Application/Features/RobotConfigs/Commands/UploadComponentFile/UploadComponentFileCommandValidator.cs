using FluentValidation;

namespace VisualFlow.Application.Features.RobotConfigs.Commands.UploadComponentFile;

/// <summary>
/// Validator for component file upload command.
/// </summary>
public sealed class UploadComponentFileCommandValidator : AbstractValidator<UploadComponentFileCommand>
{
    public UploadComponentFileCommandValidator()
    {
        RuleFor(x => x.FileName)
            .NotEmpty()
            .WithMessage("檔案名稱不能為空")
            .Must(fileName => Path.GetExtension(fileName).Equals(".zip", StringComparison.OrdinalIgnoreCase))
            .WithMessage("只允許 .zip 格式的壓縮檔")
            .Must(fileName => fileName.Length <= ComponentFileConstraints.MaxFileNameLength)
            .WithMessage($"檔案名稱過長（最多 {ComponentFileConstraints.MaxFileNameLength} 字元）");

        RuleFor(x => x.FileSize)
            .GreaterThan(0)
            .WithMessage("檔案為空或未提供")
            .LessThanOrEqualTo(ComponentFileConstraints.MaxZipFileSizeBytes)
            .WithMessage("檔案大小超過 50MB 限制");

        RuleFor(x => x.FileStream)
            .NotNull()
            .WithMessage("檔案流不能為空");

        RuleFor(x => x.ComponentType)
            .Must(type => string.IsNullOrWhiteSpace(type) || 
                         ComponentFileConstraints.ComponentTypes.Contains(type.ToLowerInvariant()))
            .WithMessage($"元件類型必須是以下之一：{string.Join(", ", ComponentFileConstraints.ComponentTypes)}");
    }
}
