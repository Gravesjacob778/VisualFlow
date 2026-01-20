using AutoMapper;
using VisualFlow.Application.Features.RobotConfigs.Dtos;
using VisualFlow.Domain.Entities;

namespace VisualFlow.Application.Features.RobotConfigs.Mappings;

/// <summary>
/// AutoMapper profile for robot configuration mappings.
/// </summary>
public sealed class RobotConfigProfile : Profile
{
    public RobotConfigProfile()
    {
        CreateMap<RobotConfigGltfModel, GltfModelDto>()
            .ForCtorParam(nameof(GltfModelDto.Url), opt => opt.MapFrom(_ => string.Empty));

        CreateMap<RobotConfig, RobotConfigDto>()
            .ForCtorParam(nameof(RobotConfigDto.UpdatedAt), opt => opt.MapFrom(src => src.ModifiedAt))
            .ForCtorParam(nameof(RobotConfigDto.GltfModel), opt => opt.MapFrom(src => src.GltfModel));

        CreateMap<RobotConfig, RobotConfigSummaryDto>()
            .ForCtorParam(nameof(RobotConfigSummaryDto.UpdatedAt), opt => opt.MapFrom(src => src.ModifiedAt))
            .ForCtorParam(nameof(RobotConfigSummaryDto.GltfModel), opt => opt.MapFrom(src => src.GltfModel));
    }
}