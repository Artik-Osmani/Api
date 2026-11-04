using System.Collections.Concurrent;
using Microsoft.Extensions.Options;
using StayHubApi.Models;
using StayHubApi.Services;

namespace StayHubApi.Middleware;

/// <summary>
/// Per-IP fixed-window limiting for <c>/v1</c> only. Static files are served before this middleware,
/// so browsing the page no longer consumes the API budget. The limit, write limit, review limit and
/// exempt paths come from configuration. Every response carries the limit headers, 429 responses add
/// <c>Retry-After</c>, and stale windows are swept periodically.
/// </summary>
public class RateLimitMiddleware
{
    private static readonly TimeSpan WindowLength = TimeSpan.FromMinutes(1);
    private const int MaxTrackedWindows = 20_000;

    private readonly RequestDelegate _next;
    private readonly RateLimitOptions _options;
    private readonly ConcurrentDictionary<string, WindowEntry> _windows = new(StringComparer.Ordinal);
    private long _hits;

    public RateLimitMiddleware(RequestDelegate next, IOptions<RateLimitOptions> options)
    {
        _next = next;
        _options = options.Value;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (!context.Request.Path.StartsWithSegments("/v1", StringComparison.OrdinalIgnoreCase)
            || IsExempt(context.Request.Path))
        {
            await _next(context);
            return;
        }

        var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var isWrite = HttpMethods.IsPost(context.Request.Method)
                      || HttpMethods.IsPut(context.Request.Method)
                      || HttpMethods.IsPatch(context.Request.Method)
                      || HttpMethods.IsDelete(context.Request.Method);
        var isReviewWrite = isWrite
                            && HttpMethods.IsPost(context.Request.Method)
                            && context.Request.Path.Value?.EndsWith("/reviews", StringComparison.OrdinalIgnoreCase) == true;

        var buckets = new List<(string Name, int Limit)>
        {
            ("api", _options.ApiRequestsPerMinute)
        };

        if (isWrite)
        {
            buckets.Add(("write", _options.WriteRequestsPerMinute));
        }

        if (isReviewWrite)
        {
            buckets.Add(("review", _options.ReviewRequestsPerMinute));
        }

        var primaryIndex = buckets.Count - 1;
        var primaryLimit = buckets[primaryIndex].Limit;
        var now = DateTimeOffset.UtcNow;
        var limited = false;
        var retryAfter = 0;
        var remaining = int.MaxValue;
        long resetUnix = now.Add(WindowLength).ToUnixTimeSeconds();

        for (var index = 0; index < buckets.Count; index++)
        {
            var bucket = buckets[index];
            var entry = Hit($"{ip}|{bucket.Name}", now);
            var windowEnd = entry.WindowStart.Add(WindowLength);

            remaining = Math.Min(remaining, Math.Max(0, bucket.Limit - entry.Count));

            if (index == primaryIndex)
            {
                resetUnix = windowEnd.ToUnixTimeSeconds();
            }

            if (entry.Count > bucket.Limit)
            {
                limited = true;
                retryAfter = Math.Max(
                    retryAfter,
                    (int)Math.Ceiling(Math.Max(0, (windowEnd - now).TotalSeconds)));
            }
        }

        context.Response.Headers["X-RateLimit-Limit"] = primaryLimit.ToString();
        context.Response.Headers["X-RateLimit-Remaining"] = remaining.ToString();
        context.Response.Headers["X-RateLimit-Reset"] = resetUnix.ToString();

        if (limited)
        {
            context.Response.Headers["Retry-After"] = Math.Max(1, retryAfter).ToString();
            context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
            context.Response.ContentType = "application/json; charset=utf-8";
            context.Response.Headers.CacheControl = "no-store";

            await context.Response.WriteAsJsonAsync(new ApiError(
                ErrorCodes.RateLimitExceeded,
                "Too many requests from this address. Wait a moment and try again.",
                context.TraceIdentifier));

            return;
        }

        await _next(context);
    }

    private bool IsExempt(PathString path)
        => _options.ExemptPaths.Any(exempt =>
            !string.IsNullOrWhiteSpace(exempt)
            && path.StartsWithSegments(exempt, StringComparison.OrdinalIgnoreCase));

    private WindowEntry Hit(string key, DateTimeOffset now)
    {
        var entry = _windows.AddOrUpdate(
            key,
            _ => new WindowEntry(1, now),
            (_, existing) => now - existing.WindowStart >= WindowLength
                ? new WindowEntry(1, now)
                : new WindowEntry(existing.Count + 1, existing.WindowStart));

        if (Interlocked.Increment(ref _hits) % 500 == 0)
        {
            Sweep(now);
        }

        return entry;
    }

    private void Sweep(DateTimeOffset now)
    {
        foreach (var pair in _windows)
        {
            if (now - pair.Value.WindowStart > WindowLength + WindowLength)
            {
                _windows.TryRemove(pair.Key, out _);
            }
        }

        if (_windows.Count > MaxTrackedWindows)
        {
            _windows.Clear();
        }
    }

    private readonly record struct WindowEntry(int Count, DateTimeOffset WindowStart);
}
