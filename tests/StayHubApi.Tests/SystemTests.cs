using System.Net;
using System.Text.Json;
using Xunit;

namespace StayHubApi.Tests;

public class SystemTests : ApiTestBase
{
    public SystemTests(ApiFactory factory) : base(factory)
    {
    }

    [Fact]
    public async Task Health_IncludesStoreCheckVersionAndUptime()
    {
        var (status, body) = await GetAsync("/v1/system/health");

        Assert.Equal(HttpStatusCode.OK, status);
        Assert.Equal("healthy", body.GetProperty("status").GetString());
        Assert.Equal("ok", body.GetProperty("checks").GetProperty("store").GetString());
        Assert.Equal("2.0.0", body.GetProperty("version").GetString());
        Assert.Equal("Testing", body.GetProperty("environment").GetString());
        Assert.True(body.GetProperty("uptimeSeconds").GetInt32() >= 0);
    }

    [Fact]
    public async Task Health_IsNotCached()
    {
        using var response = await Client.GetAsync("/v1/system/health");
        Assert.True(response.Headers.CacheControl?.NoStore);
    }

    [Fact]
    public async Task Stats_GroupsPaidTotalsByCurrency()
    {
        var (status, body) = await GetAsync("/v1/system/stats");

        Assert.Equal(HttpStatusCode.OK, status);
        Assert.Equal(18, body.GetProperty("totalListings").GetInt32());
        Assert.Equal(4, body.GetProperty("totalReservations").GetInt32());
        Assert.Equal(15, body.GetProperty("totalReviews").GetInt32());
        Assert.Equal(2, body.GetProperty("totalFavorites").GetInt32());
        Assert.Equal(2, body.GetProperty("upcomingReservations").GetInt32());
        Assert.Equal(89.89m, body.GetProperty("averageNightlyRate").GetDecimal());

        var paid = body.GetProperty("totalPaidByCurrency");
        Assert.Single(paid.EnumerateObject());
        Assert.Equal(1387.25m, paid.GetProperty("EUR").GetDecimal());
    }

    [Fact]
    public async Task Stage_IsServedFromSystemController()
    {
        var (status, body) = await GetAsync("/v1/system/stage");

        Assert.Equal(HttpStatusCode.OK, status);
        Assert.Equal("TEST", body.GetProperty("stage").GetString());
        Assert.Equal("Testing", body.GetProperty("environment").GetString());
        Assert.False(body.GetProperty("isProduction").GetBoolean());
    }

    [Fact]
    public async Task Reset_RestoresSeededCounts()
    {
        var (toggleStatus, _) = await PostAsync($"/v1/favorites/{Listing1Id}");
        Assert.Equal(HttpStatusCode.OK, toggleStatus);

        var (status, body) = await PostAsync("/v1/system/reset");

        Assert.Equal(HttpStatusCode.OK, status);
        Assert.True(body.GetProperty("reset").GetBoolean());
        Assert.Equal(18, body.GetProperty("listings").GetInt32());
        Assert.Equal(2, body.GetProperty("favorites").GetInt32());
    }

    [Fact]
    public async Task Errors_AllFailuresUseApiErrorShape()
    {
        var failures = new List<(HttpStatusCode Status, JsonElement Body)>
        {
            await GetAsync($"/v1/listings/{Guid.NewGuid()}"),
            await PostAsync("/v1/listings/search", new { sortBy = "unknown" }),
            await PostAsync($"/v1/listings/{Listing1Id}/reviews", new
            {
                authorName = "Test Reviewer",
                rating = 9,
                comment = "This comment is long enough to pass the comment length rule."
            }),
            await PostAsync(
                "/v1/reservations",
                Booking(Listing1Id, Today.AddDays(15), Today.AddDays(17)))
        };

        Assert.Contains(failures, failure => failure.Status == HttpStatusCode.NotFound);
        Assert.Contains(failures, failure => failure.Status == HttpStatusCode.UnprocessableEntity);
        Assert.Contains(failures, failure => failure.Status == HttpStatusCode.BadRequest);
        Assert.Contains(failures, failure => failure.Status == HttpStatusCode.Conflict);

        foreach (var (_, body) in failures)
        {
            Assert.True(body.TryGetProperty("code", out var code));
            Assert.False(string.IsNullOrWhiteSpace(code.GetString()));
            Assert.True(body.TryGetProperty("message", out var message));
            Assert.False(string.IsNullOrWhiteSpace(message.GetString()));
            Assert.True(body.TryGetProperty("traceId", out var traceId));
            Assert.False(string.IsNullOrWhiteSpace(traceId.GetString()));
            Assert.False(body.TryGetProperty("title", out _));
        }
    }
}
