using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VisualFlow.Application.Features.RobotConfigs;
using VisualFlow.Application.Features.RobotConfigs.Commands.CreateRobotConfig;
using VisualFlow.Application.Features.RobotConfigs.Commands.DeleteRobotConfig;
using VisualFlow.Application.Features.RobotConfigs.Commands.DeleteRobotConfigGltfModel;
using VisualFlow.Application.Features.RobotConfigs.Commands.PatchRobotConfig;
using VisualFlow.Application.Features.RobotConfigs.Commands.UpdateRobotConfig;
using VisualFlow.Application.Features.RobotConfigs.Commands.UploadComponentFile;
using VisualFlow.Application.Features.RobotConfigs.Commands.UploadRobotConfigGltfModel;
using VisualFlow.Application.Features.RobotConfigs.Dtos;
using VisualFlow.Application.Features.RobotConfigs.Queries.DownloadRobotConfigGltfModel;
using VisualFlow.Application.Features.RobotConfigs.Queries.GetRobotConfigById;
using VisualFlow.Application.Features.RobotConfigs.Queries.GetRobotConfigGltfModelMetadata;
using VisualFlow.Application.Features.RobotConfigs.Queries.GetRobotConfigs;
using VisualFlow.Domain.Exceptions;
using VisualFlow.WebApi.Models;

namespace VisualFlow.WebApi.Controllers;

/// <summary>
/// Manages robot configuration resources.
/// </summary>
[Authorize]
[Route("api/robot-configs")]
public sealed class RobotConfigsController : BaseApiController
{
    /// <summary>
    /// Creates a new robot configuration.
    /// </summary>
    /// <param name="command">The create command payload.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The created robot configuration.</returns>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<RobotConfigDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create([FromBody] CreateRobotConfigCommand command, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, ApiResponse<RobotConfigDto>.Ok(result));
    }

    /// <summary>
    /// Gets robot configurations with pagination, search, and sorting.
    /// </summary>
    /// <param name="query">Query parameters.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Paginated list of robot configurations.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<RobotConfigListDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] GetRobotConfigsQuery query, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(query, cancellationToken);
        return Ok(ApiResponse<RobotConfigListDto>.Ok(result));
    }

    /// <summary>
    /// Gets a robot configuration by ID.
    /// </summary>
    /// <param name="id">Robot configuration ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Robot configuration details.</returns>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<RobotConfigDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetRobotConfigByIdQuery(id), cancellationToken);
        return Ok(ApiResponse<RobotConfigDto>.Ok(result));
    }

    /// <summary>
    /// Updates a robot configuration.
    /// </summary>
    /// <param name="id">Robot configuration ID.</param>
    /// <param name="command">Update payload.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Updated robot configuration.</returns>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<RobotConfigDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateRobotConfigCommand command, CancellationToken cancellationToken)
    {
        if (id != command.Id)
        {
            return BadRequest(ApiResponse.Fail("ID mismatch"));
        }

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<RobotConfigDto>.Ok(result));
    }

    /// <summary>
    /// Partially updates a robot configuration.
    /// </summary>
    /// <param name="id">Robot configuration ID.</param>
    /// <param name="command">Patch payload.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Updated robot configuration.</returns>
    [HttpPatch("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<RobotConfigDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Patch(Guid id, [FromBody] PatchRobotConfigCommand command, CancellationToken cancellationToken)
    {
        if (id != command.Id)
        {
            return BadRequest(ApiResponse.Fail("ID mismatch"));
        }

        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<RobotConfigDto>.Ok(result));
    }

    /// <summary>
    /// Deletes a robot configuration and its associated GLTF model.
    /// </summary>
    /// <param name="id">Robot configuration ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Delete confirmation message.</returns>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await Mediator.Send(new DeleteRobotConfigCommand(id), cancellationToken);
        return Ok(ApiResponse.OkMessage("配置已成功刪除"));
    }

    /// <summary>
    /// Uploads a GLTF model file for a robot configuration.
    /// </summary>
    /// <param name="id">Robot configuration ID.</param>
    /// <param name="file">GLTF/GLB file.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Uploaded GLTF model metadata.</returns>
    [HttpPost("{id:guid}/gltf-model")]
    [RequestSizeLimit(RobotConfigFileConstraints.MaxGltfFileSizeBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = RobotConfigFileConstraints.MaxGltfFileSizeBytes)]
    [ProducesResponseType(typeof(ApiResponse<GltfModelDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status413PayloadTooLarge)]
    public async Task<IActionResult> UploadGltfModel(Guid id, [FromForm] IFormFile file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(ApiResponse.Fail("File is required"));
        }

        if (file.Length > RobotConfigFileConstraints.MaxGltfFileSizeBytes)
        {
            return StatusCode(StatusCodes.Status413PayloadTooLarge, ApiResponse.Fail("File exceeds maximum size"));
        }

        var extension = Path.GetExtension(file.FileName);
        if (!RobotConfigFileConstraints.AllowedExtensions.Any(ext =>
                string.Equals(ext, extension, StringComparison.OrdinalIgnoreCase)))
        {
            return BadRequest(ApiResponse.Fail("Invalid file extension"));
        }

        await using var stream = file.OpenReadStream();
        var command = new UploadRobotConfigGltfModelCommand(id, stream, file.FileName, file.ContentType, file.Length);
        var result = await Mediator.Send(command, cancellationToken);
        return Ok(ApiResponse<GltfModelDto>.Ok(result));
    }

    /// <summary>
    /// Downloads the GLTF model file for a robot configuration.
    /// </summary>
    /// <param name="id">Robot configuration ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>GLTF model file.</returns>
    [HttpGet("{id:guid}/gltf-model")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadGltfModel(Guid id, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new DownloadRobotConfigGltfModelQuery(id), cancellationToken);
        return File(result.Content, result.ContentType, result.FileName);
    }

    /// <summary>
    /// Gets GLTF model metadata for a robot configuration.
    /// </summary>
    /// <param name="id">Robot configuration ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>GLTF model metadata.</returns>
    [HttpGet("{id:guid}/gltf-model/metadata")]
    [ProducesResponseType(typeof(ApiResponse<GltfModelDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetGltfModelMetadata(Guid id, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new GetRobotConfigGltfModelMetadataQuery(id), cancellationToken);
        return Ok(ApiResponse<GltfModelDto>.Ok(result));
    }

    /// <summary>
    /// Deletes the GLTF model file for a robot configuration.
    /// </summary>
    /// <param name="id">Robot configuration ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Delete confirmation message.</returns>
    [HttpDelete("{id:guid}/gltf-model")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteGltfModel(Guid id, CancellationToken cancellationToken)
    {
        await Mediator.Send(new DeleteRobotConfigGltfModelCommand(id), cancellationToken);
        return Ok(ApiResponse.OkMessage("模型檔案已成功刪除"));
    }

    /// <summary>
    /// Uploads a component ZIP file containing 3D models and resources.
    /// Components are interchangeable robot arm attachments like grippers, sensors, and tools.
    /// </summary>
    /// <param name="file">ZIP file containing GLTF/GLB models and related resources.</param>
    /// <param name="componentType">Type of component (gripper, sensor, tool, other).</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Upload result with component metadata.</returns>
    [HttpPost("components")]
    [RequestSizeLimit(52_428_800)] // 50 MB
    [ProducesResponseType(typeof(ApiResponse<ComponentFileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status413PayloadTooLarge)]
    [ProducesResponseType(typeof(ApiErrorResponse), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UploadComponent(
        IFormFile file,
        [FromForm] string? componentType,
        CancellationToken cancellationToken)
    {
        // Validate file presence
        if (file == null || file.Length == 0)
        {
            return BadRequest(new ApiErrorResponse
            {
                Message = "檔案驗證失敗",
                Errors =
                [
                    new FieldError("file", "檔案為空或未提供")
                ]
            });
        }

        // Validate file extension
        var extension = Path.GetExtension(file.FileName);
        if (!string.Equals(extension, ".zip", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new ApiErrorResponse
            {
                Message = "檔案驗證失敗",
                Errors =
                [
                    new FieldError("file", "只允許 .zip 格式的壓縮檔")
                ]
            });
        }

        // Validate file size
        if (file.Length > ComponentFileConstraints.MaxZipFileSizeBytes)
        {
            return StatusCode(StatusCodes.Status413PayloadTooLarge,
                new ApiErrorResponse
                {
                    Message = "檔案大小超過 50MB 限制"
                });
        }

        try
        {
            // Open file stream
            await using var stream = file.OpenReadStream();

            // Create and send command
            var command = new UploadComponentFileCommand
            {
                FileStream = stream,
                FileName = file.FileName,
                ContentType = file.ContentType,
                FileSize = file.Length,
                ComponentType = componentType
            };

            var result = await Mediator.Send(command, cancellationToken);

            // Return success response
            return Ok(new
            {
                success = true,
                message = "元件壓縮檔上傳成功",
                data = result
            });
        }
        catch (DomainValidationException ex)
        {
            return BadRequest(new
            {
                success = false,
                message = "檔案驗證失敗",
                errors = new[]
                {
                    new
                    {
                        field = "file",
                        message = ex.Message
                    }
                }
            });
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError,
                new
                {
                    success = false,
                    message = "檔案儲存失敗，請稍後再試"
                });
        }
    }
}