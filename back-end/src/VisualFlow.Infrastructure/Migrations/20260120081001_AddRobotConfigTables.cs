using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VisualFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRobotConfigTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "RobotConfigs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Transform = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    JointAngles = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Gripper = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BoneControls = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Materials = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Tags = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RobotConfigs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RobotConfigGltfModels",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RobotConfigId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    ContentType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    StoragePath = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RobotConfigGltfModels", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RobotConfigGltfModels_RobotConfigs_RobotConfigId",
                        column: x => x.RobotConfigId,
                        principalTable: "RobotConfigs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RobotConfigGltfModels_RobotConfigId",
                table: "RobotConfigGltfModels",
                column: "RobotConfigId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RobotConfigs_Name",
                table: "RobotConfigs",
                column: "Name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RobotConfigGltfModels");

            migrationBuilder.DropTable(
                name: "RobotConfigs");
        }
    }
}
