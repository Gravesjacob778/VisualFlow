using FluentValidation;
using VisualFlow.Application.Features.RobotConfigs.Validators;

namespace VisualFlow.Application.Features.RobotConfigs.Commands.PatchRobotConfig;

/// <summary>
/// Validator for patching robot configurations.
/// </summary>
public sealed class PatchRobotConfigCommandValidator : AbstractValidator<PatchRobotConfigCommand>
{
    public PatchRobotConfigCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty().WithMessage("Id is required");

        When(x => x.Name is not null, () =>
        {
            RuleFor(x => x.Name!).NameRules();
        });

        When(x => x.Description is not null, () =>
        {
            RuleFor(x => x.Description).DescriptionRules();
        });

        When(x => x.Transform is not null, () =>
        {
            RuleFor(x => x.Transform!).TransformRules();
        });

        When(x => x.JointAngles is not null, () =>
        {
            RuleFor(x => x.JointAngles!).JointAnglesRules();
        });

        When(x => x.Gripper is not null, () =>
        {
            RuleFor(x => x.Gripper!).GripperRules();
        });

        When(x => x.BoneControls is not null, () =>
        {
            RuleFor(x => x.BoneControls!).BoneControlsRules();
        });

        When(x => x.Materials is not null, () =>
        {
            RuleFor(x => x.Materials!).MaterialsRules();
        });
    }
}