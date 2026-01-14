using System.Reflection;
using Microsoft.EntityFrameworkCore;
using VisualFlow.Application.Common.Interfaces;
using VisualFlow.Domain.Entities;

namespace VisualFlow.Infrastructure.Persistence;

/// <summary>
/// Entity Framework Core database context implementation.
/// </summary>
public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    private readonly ICurrentUserService _currentUserService;
    private readonly IDateTimeService _dateTimeService;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ICurrentUserService currentUserService,
        IDateTimeService dateTimeService)
        : base(options)
    {
        _currentUserService = currentUserService;
        _dateTimeService = dateTimeService;
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        base.OnModelCreating(modelBuilder);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = _dateTimeService.UtcNow;
                    entry.Entity.CreatedBy = _currentUserService.UserId;
                    break;
                case EntityState.Modified:
                    entry.Entity.ModifiedAt = _dateTimeService.UtcNow;
                    entry.Entity.ModifiedBy = _currentUserService.UserId;
                    break;
            }
        }

        foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
        {
            if (entry.State == EntityState.Deleted)
            {
                // Soft delete
                entry.State = EntityState.Modified;
                entry.Entity.IsDeleted = true;
                entry.Entity.DeletedAt = _dateTimeService.UtcNow;
                entry.Entity.DeletedBy = _currentUserService.UserId;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}
