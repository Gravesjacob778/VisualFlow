using MediatR;

namespace VisualFlow.Application.Features.Models.Queries.GetModelGltfJson;

/// <summary>
/// Query to get a GLTF JSON payload for a model.
/// </summary>
public sealed record GetModelGltfJsonQuery(Guid ModelId) : IRequest<ModelGltfJsonResult>;
