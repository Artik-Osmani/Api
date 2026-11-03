namespace StayHubApi.Middleware;

/// <summary>
/// Fonts, images and scripts are binary or static; the separate document policy is a compromise the
/// strict application policy cannot make. The application policy has no <c>unsafe-inline</c>, no
/// <c>unsafe-eval</c> and no external host, which is only possible because the web client has no
/// inline handlers, inline styles or remote assets.
/// </summary>
public class SecurityHeadersMiddleware
{
    private const string ApplicationPolicy =
        "default-src 'none'; " +
        "script-src 'self'; " +
        "style-src 'self'; " +
        "style-src-attr 'none'; " +
        "img-src 'self' data:; " +
        "font-src 'self'; " +
        "connect-src 'self'; " +
        "manifest-src 'self'; " +
        "base-uri 'none'; " +
        "form-action 'self'; " +
        "frame-ancestors 'none'; " +
        "object-src 'none'";

    private const string SwaggerPolicy =
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data:; " +
        "font-src 'self'; " +
        "connect-src 'self'; " +
        "frame-ancestors 'none'";

    private readonly RequestDelegate _next;
    private readonly IWebHostEnvironment _environment;

    public SecurityHeadersMiddleware(RequestDelegate next, IWebHostEnvironment environment)
    {
        _next = next;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // The exception handler may clear the response. Apply these at send time so errors keep them.
        context.Response.OnStarting(() =>
        {
            var headers = context.Response.Headers;

            headers["X-Content-Type-Options"] = "nosniff";
            headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
            headers["X-Frame-Options"] = "DENY";
            headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
            headers["Cross-Origin-Opener-Policy"] = "same-origin";
            headers["Cross-Origin-Resource-Policy"] = "same-origin";

            if (!_environment.IsDevelopment())
            {
                headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
            }

            var isSwagger = context.Request.Path.StartsWithSegments("/swagger", StringComparison.OrdinalIgnoreCase);
            headers["Content-Security-Policy"] = isSwagger ? SwaggerPolicy : ApplicationPolicy;

            return Task.CompletedTask;
        });

        await _next(context);
    }
}
