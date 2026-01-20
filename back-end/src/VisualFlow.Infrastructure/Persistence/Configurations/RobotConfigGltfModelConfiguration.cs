using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VisualFlow.Domain.Entities;

namespace VisualFlow.Infrastructure.Persistence.Configurations;

/// <summary>
/// EF Core configuration for RobotConfigGltfModel.
/// </summary>
public sealed class RobotConfigGltfModelConfiguration : IEntityTypeConfiguration<RobotConfigGltfModel>
{
    public void Configure(EntityTypeBuilder<RobotConfigGltfModel> builder)
    {
        builder.ToTable("RobotConfigGltfModels");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.FileName)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(x => x.ContentType)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.StoragePath)
            .IsRequired();
    }
}