using FluentValidation;
using VisualFlow.Application.Features.RobotConfigs.Validators;

namespace VisualFlow.Application.Features.RobotConfigs.Commands.UpdateRobotConfig;

/// <summary>
/// Validator for updating robot configurations.
/// </summary>
public sealed class UpdateRobotConfigCommandValidator : AbstractValidator<UpdateRobotConfigCommand>
{
    public UpdateRobotConfigCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty().WithMessage("Id is required");
        RuleFor(x => x.Name).NameRules();
        RuleFor(x => x.Description).DescriptionRules();
        RuleFor(x => x.Transform).TransformRules();
        RuleFor(x => x.JointAngles).JointAnglesRules();
        RuleFor(x => x.Gripper).GripperRules();

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