namespace StayHubApi.Services;

/// <summary>
/// Rate limiting configuration, bound from the <c>RateLimiting</c> section. Static assets and the
/// health check are exempt, and the review write limit is stricter than the general write limit.
/// </summary>
public sealed class RateLimitOptions
{
    public const string SectionName = "RateLimiting";

    public int ApiRequestsPerMinute { get; set; } = 120;

    public int WriteRequestsPerMinute { get; set; } = 20;

    public int ReviewRequestsPerMinute { get; set; } = 5;

    public string[] ExemptPaths { get; set; } = [];
}
