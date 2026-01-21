using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using VisualFlow.Application.Common.Interfaces;
using VisualFlow.Domain.Interfaces;
using VisualFlow.Infrastructure.Persistence;
using VisualFlow.Infrastructure.Persistence.Repositories;
using VisualFlow.Infrastructure.Services;

namespace VisualFlow.Infrastructure;

/// <summary>
/// Dependency injection extension methods for the Infrastructure layer.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Register DbContext
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"),
                b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)));

        // Register IApplicationDbContext
        services.AddScoped<IApplicationDbContext>(provider =>
            provider.GetRequiredService<ApplicationDbContext>());

        // Register Unit of Work
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // Register generic repository
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

        // Register services
        services.AddTransient<IDateTimeService, DateTimeService>();
        services.AddSingleton<IFileStorageService, FileSystemStorageService>();
        services.AddTransient<IZipValidationService, ZipValidationService>();

        return services;
    }
}
