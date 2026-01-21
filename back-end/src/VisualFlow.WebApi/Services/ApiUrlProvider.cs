using VisualFlow.Application.Common.Interfaces;

namespace VisualFlow.WebApi.Services;

/// <summary>
/// Builds API URLs based on the current HTTP request.
/// </summary>
public sealed class ApiUrlProvider : IApiUrlProvider
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ApiUrlProvider(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string GetRobotConfigGltfModelUrl(Guid robotConfigId)
    {
        var request = _httpContextAccessor.HttpContext?.Request;
        if (request is null)
        {
            return $"/api/robot-configs/{robotConfigId}/gltf-model";
        }

        var baseUrl = $"{request.Scheme}://{request.Host}{request.PathBase}";
        return $"{baseUrl}/api/robot-configs/{robotConfigId}/gltf-model";
    }

    public string GetComponentFileUrl(Guid componentFileId)
    {
        var request = _httpContextAccessor.HttpContext?.Request;
        if (request is null)
        {
            return $"/api/robot-configs/components/{componentFileId}";
        }

        var baseUrl = $"{request.Scheme}://{request.Host}{request.PathBase}";
        return $"{baseUrl}/api/robot-configs/components/{componentFileId}";
    }
}