using MediatR;

namespace VisualFlow.Application.Features.Models.Queries.GetModelResourceFile;

/// <summary>
/// Query to get a resource file from a model package.
/// </summary>
public sealed record GetModelResourceFileQuery(Guid ModelId, string ResourcePath) : IRequest<ModelResourceFileResult>;
