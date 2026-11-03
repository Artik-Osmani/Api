using System.Net;
using Xunit;

namespace StayHubApi.Tests;

public class SecurityHeaderTests : ApiTestBase
{
    public SecurityHeaderTests(ApiFactory factory) : base(factory)
    {
    }

    [Fact]
    public async Task SecurityHeaders_AppCspHasNoUnsafeInline()
    {
        using var response = await Client.GetAsync("/index.html");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var csp = string.Join(";", response.Headers.GetValues("Content-Security-Policy"));
        Assert.Contains("default-src 'none'", csp);
        Assert.Contains("style-src-attr 'none'", csp);
        Assert.Contains("frame-ancestors 'none'", csp);
        Assert.DoesNotContain("unsafe-inline", csp);
        Assert.DoesNotContain("unsafe-eval", csp);

        Assert.Equal("nosniff", response.Headers.GetValues("X-Content-Type-Options").Single());
        Assert.Equal("DENY", response.Headers.GetValues("X-Frame-Options").Single());
        Assert.Equal("same-origin", response.Headers.GetValues("Cross-Origin-Opener-Policy").Single());
        Assert.Equal("same-origin", response.Headers.GetValues("Cross-Origin-Resource-Policy").Single());
        Assert.DoesNotContain("X-XSS-Protection", response.Headers.Select(header => header.Key));
    }

    [Fact]
    public async Task SecurityHeaders_SwaggerCspAllowsInline()
    {
        using var response = await Client.GetAsync("/swagger/index.html");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var csp = string.Join(";", response.Headers.GetValues("Content-Security-Policy"));
        Assert.Contains("unsafe-inline", csp);
        Assert.Contains("frame-ancestors 'none'", csp);
    }

    [Fact]
    public async Task StaticAssets_AreNotRateLimited()
    {
        using var response = await Client.GetAsync("/index.html");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.False(response.Headers.Contains("X-RateLimit-Limit"));
        Assert.True(response.Headers.CacheControl?.NoCache);
    }
}
