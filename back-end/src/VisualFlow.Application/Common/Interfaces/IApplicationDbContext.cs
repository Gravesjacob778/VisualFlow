using Microsoft.EntityFrameworkCore;

namespace VisualFlow.Application.Common.Interfaces;

/// <summary>
/// Database context interface for the application.
/// </summary>
public interface IApplicationDbContext
{
    DbSet<TEntity> Set<TEntity>() where TEntity : class;
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
