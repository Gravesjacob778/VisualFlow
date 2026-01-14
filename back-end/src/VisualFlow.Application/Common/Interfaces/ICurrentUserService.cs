namespace VisualFlow.Application.Common.Interfaces;

/// <summary>
/// Interface for accessing current user information.
/// </summary>
public interface ICurrentUserService
{
    string? UserId { get; }
    string? UserName { get; }
    bool IsAuthenticated { get; }
}
