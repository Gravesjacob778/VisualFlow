using MediatR;
using Microsoft.Extensions.Logging;
using VisualFlow.Application.Common.Interfaces;

namespace VisualFlow.Application.Common.Behaviours;

/// <summary>
/// MediatR pipeline behavior for unhandled exception logging.
/// </summary>
public class UnhandledExceptionBehaviour<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly ILogger<UnhandledExceptionBehaviour<TRequest, TResponse>> _logger;
    private readonly ICurrentUserService _currentUserService;

    public UnhandledExceptionBehaviour(
        ILogger<UnhandledExceptionBehaviour<TRequest, TResponse>> logger,
        ICurrentUserService currentUserService)
    {
        _logger = logger;
        _currentUserService = currentUserService;
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        try
        {
            return await next();
        }
        catch (Exception ex)
        {
            var requestName = typeof(TRequest).Name;
            var userId = _currentUserService.UserId ?? "Anonymous";

            _logger.LogError(ex,
                "Unhandled Exception for Request {Name} {@Request} by User {UserId}",
                requestName, request, userId);

            throw;
        }
    }
}
