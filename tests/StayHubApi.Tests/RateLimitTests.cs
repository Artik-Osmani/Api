using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace StayHubApi.Tests;

/// <summary>
/// A dedicated factory with a tiny limit. The limiter lives in the middleware instance, so this app
/// starts with an empty window and never interferes with the other test classes.
/// </summary>
public class RateLimitTests
{
    [Fact]
    public async Task RateLimit_Returns429WithRetryAfterAndLeavesStaticFilesAlone()
    {
        using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Testing");
            builder.ConfigureAppConfiguration((_, configuration) =>
            {
                configuration.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["RateLimiting:ApiRequestsPerMinute"] = "3",
                    ["RateLimiting:WriteRequestsPerMinute"] = "100000",
                    ["RateLimiting:ReviewRequestsPerMinute"] = "100000"
                });
            });
        });

        using var client = factory.CreateClient();

        for (var i = 0; i < 3; i++)
        {
            using var allowed = await client.GetAsync("/v1/listings");
            Assert.Equal(HttpStatusCode.OK, allowed.StatusCode);
        }

        using var limited = await client.GetAsync("/v1/listings");
        Assert.Equal(HttpStatusCode.TooManyRequests, limited.StatusCode);
        Assert.True(limited.Headers.Contains("Retry-After"));
        Assert.True(int.Parse(limited.Headers.GetValues("Retry-After").Single()) >= 1);

        using var document = JsonDocument.Parse(await limited.Content.ReadAsStringAsync());
        Assert.Equal("RATE_LIMIT_EXCEEDED", document.RootElement.GetProperty("code").GetString());
        Assert.False(string.IsNullOrWhiteSpace(document.RootElement.GetProperty("traceId").GetString()));

        using var css = await client.GetAsync("/index.html");
        Assert.Equal(HttpStatusCode.OK, css.StatusCode);
    }
}
