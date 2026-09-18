using System.Collections.Concurrent;

namespace StayHubApi.Middleware;

public class RateLimitMiddleware
{
    private readonly RequestDelegate _next;
    private static readonly ConcurrentDictionary<string, (int Count, DateTime WindowStart)> _store = new();
    private const int MaxRequests = 100;
    private static readonly TimeSpan Window = TimeSpan.FromMinutes(1);

    public RateLimitMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var now = DateTime.UtcNow;

        var entry = _store.GetOrAdd(ip, _ => (0, now));

        if (now - entry.WindowStart > Window)
            entry = (0, now);

        entry = (entry.Count + 1, entry.WindowStart);
        _store[ip] = entry;

        context.Response.Headers["X-RateLimit-Limit"] = MaxRequests.ToString();
        context.Response.Headers["X-RateLimit-Remaining"] = Math.Max(0, MaxRequests - entry.Count).ToString();

        if (entry.Count > MaxRequests)
        {
            context.Response.StatusCode = 429;
            await context.Response.WriteAsJsonAsync(new { code = "RATE_LIMIT_EXCEEDED", message = "Too many requests. Please slow down." });
            return;
        }

        await _next(context);
    }
}
