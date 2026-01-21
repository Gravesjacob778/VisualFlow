namespace VisualFlow.Application.Common.Interfaces;

/// <summary>
/// Provides API URLs based on the current request context.
/// </summary>
public interface IApiUrlProvider
{
    string GetRobotConfigGltfModelUrl(Guid robotConfigId);
    string GetComponentFileUrl(Guid componentFileId);
}