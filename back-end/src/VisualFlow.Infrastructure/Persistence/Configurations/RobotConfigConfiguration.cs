using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VisualFlow.Domain.Entities;
using VisualFlow.Domain.ValueObjects;
using VisualFlow.Infrastructure.Persistence.Converters;

namespace VisualFlow.Infrastructure.Persistence.Configurations;

/// <summary>
/// EF Core configuration for RobotConfig.
/// </summary>
public sealed class RobotConfigConfiguration : IEntityTypeConfiguration<RobotConfig>
{
    public void Configure(EntityTypeBuilder<RobotConfig> builder)
    {
        builder.ToTable("RobotConfigs");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(x => x.Name)
            .IsUnique();

        builder.Property(x => x.Description)
            .HasMaxLength(500);

        builder.Property(x => x.Transform)
            .HasConversion(new JsonValueConverter<TransformData>())
            .IsRequired();

        builder.Property(x => x.JointAngles)
            .HasConversion(new JsonValueConverter<JointAngles>())
            .IsRequired();

        builder.Property(x => x.Gripper)
            .HasConversion(new JsonValueConverter<GripperData>())
            .IsRequired();

        builder.Property(x => x.BoneControls)
            .HasConversion(new JsonValueConverter<List<BoneControlData>>());

        builder.Property(x => x.Materials)
            .HasConversion(new JsonValueConverter<List<MaterialData>>());

        builder.Property(x => x.Tags)
            .HasConversion(new JsonValueConverter<List<string>>());

        builder.HasOne(x => x.GltfModel)
            .WithOne(x => x.RobotConfig)
            .HasForeignKey<RobotConfigGltfModel>(x => x.RobotConfigId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}