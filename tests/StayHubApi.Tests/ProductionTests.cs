using System.Net;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace StayHubApi.Tests;

public class ProductionTests : IClassFixture<ApiFactory>
{
    private readonly ApiFactory _factory;

    public ProductionTests(ApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Production_DisablesResetAndKeepsHealthAndHeaders()
    {
        using var production = _factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Production");
            builder.ConfigureAppConfiguration((_, configuration) => configuration.AddInMemoryCollection(
                new Dictionary<string, string?> { ["DemoMode:ResetOnStart"] = "false" }));
        });
        using var client = production.CreateClient();
        using var reset = await client.PostAsync("/v1/system/reset", null);
        Assert.Equal(HttpStatusCode.NotFound, reset.StatusCode);
        Assert.Contains("max-age=31536000", reset.Headers.GetValues("Strict-Transport-Security").Single());
        using var health = await client.GetAsync("/v1/system/health");
        Assert.Equal(HttpStatusCode.OK, health.StatusCode);
        Assert.Contains("Production", await health.Content.ReadAsStringAsync());
    }
}
