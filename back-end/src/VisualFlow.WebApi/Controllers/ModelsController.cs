using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VisualFlow.Application.Features.Models.Queries.GetModelGltfJson;
using VisualFlow.Application.Features.Models.Queries.GetModelResourceFile;
using VisualFlow.Domain.Entities;
using VisualFlow.Domain.Exceptions;
using VisualFlow.WebApi.Models;

namespace VisualFlow.WebApi.Controllers;

/// <summary>
/// Serves model assets for 3D rendering.
/// </summary>
[Authorize]
[Route("api/models")]
public sealed class ModelsController : BaseApiController
{
    /// <summary>
    /// Gets the GLTF JSON for a model package.
    /// </summary>
    /// <param name="modelId">Model identifier.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>GLTF JSON.</returns>
    [HttpGet("{modelId}/gltf")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetGltf(string modelId, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(modelId, out var parsedId))
        {
            throw new NotFoundException(nameof(ComponentFile), modelId);
        }

        var result = await Mediator.Send(new GetModelGltfJsonQuery(parsedId), cancellationToken);

        Response.Headers.CacheControl = "public, max-age=3600";
        Response.Headers.ETag = $"\"{result.ETag}\"";

        return Content(result.Json, "application/json");
    }

    /// <summary>
    /// Gets a binary resource from a model package.
    /// </summary>
    /// <param name="modelId">Model identifier.</param>
    /// <param name="filePath">Resource file path inside the model package.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Resource file.</returns>
    [HttpGet("{modelId}/resources/{*filePath}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetResource(string modelId, string filePath, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(modelId, out var parsedId))
        {
            throw new NotFoundException(nameof(ComponentFile), modelId);
        }

        var result = await Mediator.Send(new GetModelResourceFileQuery(parsedId, filePath), cancellationToken);

        Response.Headers.CacheControl = "public, max-age=31536000, immutable";
        Response.Headers.ETag = $"\"{result.ETag}\"";
        Response.Headers.AcceptRanges = "bytes";
        Response.ContentLength = result.Length;

        return File(result.Content, result.ContentType, enableRangeProcessing: true);
    }
}
