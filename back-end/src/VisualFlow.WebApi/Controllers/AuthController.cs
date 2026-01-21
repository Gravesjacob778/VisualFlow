using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VisualFlow.WebApi.Services;

namespace VisualFlow.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private const string TokenCookieName = "accessToken";
    private const int TokenCookieExpirationHours = 24;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Login endpoint - generates JWT token and stores it in cookies
    /// </summary>
    /// <param name="request">Login credentials</param>
    /// <returns>Token stored in cookies</returns>
    [AllowAnonymous]
    [HttpPost("login")]
    public IActionResult Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // TODO: Validate credentials against database
        // For demo purposes, we'll accept any credentials
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest("Email and password are required");

        // Generate JWT token
        var token = _authService.GenerateToken(
            userId: Guid.NewGuid().ToString(),
            email: request.Email,
            username: request.Email.Split('@')[0]);

        // Set token in secure cookie
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,        // Prevent JavaScript access (XSS protection)
            Secure = true,          // Only send over HTTPS
            SameSite = SameSiteMode.Strict,  // CSRF protection
            Expires = DateTimeOffset.UtcNow.AddHours(TokenCookieExpirationHours)
        };

        Response.Cookies.Append(TokenCookieName, token, cookieOptions);

        return Ok(new { message = "Login successful", expiresIn = TokenCookieExpirationHours });
    }

    /// <summary>
    /// Logout endpoint - removes token from cookies
    /// </summary>
    [Authorize]
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        // Remove token cookie
        Response.Cookies.Delete(TokenCookieName);
        return Ok(new { message = "Logout successful" });
    }

    /// <summary>
    /// Protected endpoint - requires authentication
    /// </summary>
    [Authorize]
    [HttpGet("profile")]
    public IActionResult GetProfile()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        var username = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;

        return Ok(new
        {
            userId,
            email,
            username,
            message = "This is a protected endpoint, authenticated via cookie"
        });
    }
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
