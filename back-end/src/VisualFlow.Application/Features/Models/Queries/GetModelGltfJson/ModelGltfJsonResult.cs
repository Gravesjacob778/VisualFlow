namespace VisualFlow.Application.Features.Models.Queries.GetModelGltfJson;

/// <summary>
/// Represents a GLTF JSON payload with an associated ETag.
/// </summary>
public sealed record ModelGltfJsonResult(string Json, string ETag);
