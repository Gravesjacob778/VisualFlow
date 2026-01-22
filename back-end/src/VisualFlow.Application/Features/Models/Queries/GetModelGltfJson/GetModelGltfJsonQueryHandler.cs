using System.IO.Compression;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Nodes;
using MediatR;
using Microsoft.EntityFrameworkCore;
using VisualFlow.Application.Common.Interfaces;
using VisualFlow.Domain.Entities;
using VisualFlow.Domain.Exceptions;

namespace VisualFlow.Application.Features.Models.Queries.GetModelGltfJson;

/// <summary>
/// Handler for retrieving GLTF JSON from a component model package.
/// </summary>
public sealed class GetModelGltfJsonQueryHandler(
    IApplicationDbContext dbContext,
    IFileStorageService fileStorageService)
    : IRequestHandler<GetModelGltfJsonQuery, ModelGltfJsonResult>
{
    private readonly IApplicationDbContext _dbContext = dbContext;
    private readonly IFileStorageService _fileStorageService = fileStorageService;

    public async Task<ModelGltfJsonResult> Handle(GetModelGltfJsonQuery request, CancellationToken cancellationToken)
    {
        var component = await _dbContext.Set<ComponentFile>()
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.ModelId, cancellationToken)
            ?? throw new NotFoundException(nameof(ComponentFile), request.ModelId);

        await using var zipStream = await _fileStorageService.OpenReadAsync(component.StoragePath, cancellationToken);
        using var archive = new ZipArchive(zipStream, ZipArchiveMode.Read, leaveOpen: false);

        var gltfEntry = archive.Entries
            .FirstOrDefault(entry => string.Equals(Path.GetExtension(entry.FullName), ".gltf", StringComparison.OrdinalIgnoreCase)) ?? throw new NotFoundException("GLTF", request.ModelId);
        await using var entryStream = gltfEntry.Open();
        using var reader = new StreamReader(entryStream);
        var rawJson = await reader.ReadToEndAsync(cancellationToken);
        var rewrittenJson = RewriteGltfJsonUris(rawJson, request.ModelId);
        var etag = CreateETag(rewrittenJson);

        return new ModelGltfJsonResult(rewrittenJson, etag);
    }

    private static string RewriteGltfJsonUris(string json, Guid modelId)
    {
        var node = JsonNode.Parse(json);
        if (node is null)
        {
            return json;
        }

        RewriteUrisInArray(node["buffers"] as JsonArray, modelId);
        RewriteUrisInArray(node["images"] as JsonArray, modelId);

        return node.ToJsonString(new JsonSerializerOptions
        {
            WriteIndented = false
        });
    }

    private static void RewriteUrisInArray(JsonArray? array, Guid modelId)
    {
        if (array is null)
        {
            return;
        }

        foreach (var item in array)
        {
            if (item is not JsonObject obj)
            {
                continue;
            }

            if (obj["uri"] is not JsonValue uriValue)
            {
                continue;
            }

            var uri = uriValue.GetValue<string>();
            if (string.IsNullOrWhiteSpace(uri))
            {
                continue;
            }

            if (uri.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (Uri.TryCreate(uri, UriKind.Absolute, out _))
            {
                continue;
            }

            if (!IsSafeRelativePath(uri))
            {
                continue;
            }

            var safeResourcePath = EncodePathSegments(uri);
            obj["uri"] = $"{safeResourcePath}";
        }
    }

    private static bool IsSafeRelativePath(string path)
    {
        if (string.IsNullOrWhiteSpace(path))
        {
            return false;
        }

        if (path.Contains('\0', StringComparison.Ordinal))
        {
            return false;
        }

        if (Path.IsPathRooted(path))
        {
            return false;
        }

        var normalized = path.Replace('\\', '/');
        var segments = normalized.Split('/', StringSplitOptions.RemoveEmptyEntries);
        return segments.All(segment => segment is not ".." and not ".");
    }

    private static string EncodePathSegments(string path)
    {
        var normalized = path.Replace('\\', '/');
        var segments = normalized.Split('/', StringSplitOptions.RemoveEmptyEntries);
        return string.Join('/', segments.Select(Uri.EscapeDataString));
    }

    private static string CreateETag(string content)
    {
        var hash = SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(content));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
