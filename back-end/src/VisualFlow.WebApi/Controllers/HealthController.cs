using Microsoft.AspNetCore.Mvc;

namespace VisualFlow.WebApi.Controllers;

/// <summary>
/// Health check controller for monitoring.
/// </summary>
public class HealthController : BaseApiController
{
    /// <summary>
    /// Basic health check endpoint.
    /// </summary>
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            Status = "Healthy",
            Timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Detailed health check endpoint.
    /// </summary>
    [HttpGet("details")]
    public IActionResult GetDetails()
    {
        return Ok(new
        {
            Status = "Healthy",
            Timestamp = DateTime.UtcNow,
            Environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
            MachineName = Environment.MachineName
        });
    }
}
