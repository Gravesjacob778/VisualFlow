using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VisualFlow.Domain.Entities;

namespace VisualFlow.Infrastructure.Persistence.Configurations;

/// <summary>
/// EF Core configuration for ComponentFile.
/// </summary>
public sealed class ComponentFileConfiguration : IEntityTypeConfiguration<ComponentFile>
{
    public void Configure(EntityTypeBuilder<ComponentFile> builder)
    {
        builder.ToTable("ComponentFiles");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.FileName)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(x => x.StorageFileName)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(x => x.ContentType)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.ComponentType)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(x => x.StoragePath)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(x => x.ContainedFiles)
            .HasConversion(
                v => string.Join(";", v),
                v => v.Split(";", StringSplitOptions.RemoveEmptyEntries).ToList())
            .HasColumnType("nvarchar(max)");

        builder.HasIndex(x => x.ComponentType);
        builder.HasIndex(x => x.CreatedAt);
    }
}
