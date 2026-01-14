using System.Reflection;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using VisualFlow.Application.Common.Behaviours;

namespace VisualFlow.Application;

/// <summary>
/// Dependency injection extension methods for the Application layer.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();

        // Register MediatR with all handlers from this assembly
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(assembly);
        });

        // Register AutoMapper profiles from this assembly
        services.AddAutoMapper(assembly);

        // Register FluentValidation validators
        services.AddValidatorsFromAssembly(assembly);

        // Register pipeline behaviors (order matters)
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(UnhandledExceptionBehaviour<,>));
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(LoggingBehaviour<,>));
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehaviour<,>));
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(PerformanceBehaviour<,>));

        return services;
    }
}
