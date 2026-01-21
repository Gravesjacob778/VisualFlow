using MediatR;
using VisualFlow.Application.Features.RobotConfigs.Dtos;

namespace VisualFlow.Application.Features.RobotConfigs.Queries.GetAllComponentFiles;

/// <summary>
/// Query to get all uploaded component files.
/// </summary>
public sealed record GetAllComponentFilesQuery : IRequest<ComponentFileListDto>;
