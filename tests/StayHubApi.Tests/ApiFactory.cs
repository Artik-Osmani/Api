using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace StayHubApi.Tests;

/// <summary>
/// Boots the API in the Testing environment with generous rate limits so ordinary tests never collide.
/// Each test class gets its own factory, and therefore its own in-memory store.
/// </summary>
public sealed class ApiFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, configuration) =>
        {
            configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["RateLimiting:ApiRequestsPerMinute"] = "100000",
                ["RateLimiting:WriteRequestsPerMinute"] = "100000",
                ["RateLimiting:ReviewRequestsPerMinute"] = "100000",
                ["DemoMode:ResetOnStart"] = "true",
                ["StageConfig:EnableDetailedErrors"] = "false"
            });
        });
    }
}
