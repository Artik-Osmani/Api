using System.Net;
using Xunit;

namespace StayHubApi.Tests;

public class HostTests : ApiTestBase
{
    public HostTests(ApiFactory factory) : base(factory)
    {
    }

    [Fact]
    public async Task Hosts_ListReturnsEveryHost()
    {
        var (status, body) = await GetAsync("/v1/hosts");

        Assert.Equal(HttpStatusCode.OK, status);
        Assert.Equal(4, body.GetArrayLength());

        var names = body.EnumerateArray().Select(host => host.GetProperty("name").GetString()).ToList();
        Assert.Equal(names.OrderBy(name => name, StringComparer.OrdinalIgnoreCase), names);
        Assert.All(body.EnumerateArray(), host =>
        {
            Assert.False(string.IsNullOrWhiteSpace(host.GetProperty("bio").GetString()));
            Assert.True(host.GetProperty("joinedYear").GetInt32() >= 2015);
        });
    }

    [Fact]
    public async Task Hosts_AggregateRating_IsWeighted()
    {
        var (status, body) = await GetAsync($"/v1/hosts/{Host1Id}");
        Assert.Equal(HttpStatusCode.OK, status);

        // Listings 1, 5 and 9 carry 4.67 (3 reviews), 4.00 (3) and 4.50 (2).
        // Weighted: (14 + 12 + 9) / 8 = 4.375 -> 4.38. A simple average of the six
        // listing averages would be 2.20 because three listings have no reviews.
        Assert.Equal(4.38, body.GetProperty("aggregateRating").GetDouble());
        Assert.Equal(8, body.GetProperty("totalReviewsReceived").GetInt32());
        Assert.Equal(6, body.GetProperty("totalProperties").GetInt32());
        Assert.NotEqual(2.20, body.GetProperty("aggregateRating").GetDouble());
    }

    [Fact]
    public async Task Hosts_VerificationFlagsComeFromStoredRecord()
    {
        var (status, body) = await GetAsync($"/v1/hosts/b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7/verification");

        Assert.Equal(HttpStatusCode.OK, status);
        Assert.True(body.GetProperty("phoneVerified").GetBoolean());
        Assert.True(body.GetProperty("emailVerified").GetBoolean());
        Assert.True(body.GetProperty("governmentIdVerified").GetBoolean());
        Assert.False(body.GetProperty("backgroundCheckCleared").GetBoolean());
        Assert.Equal("verified", body.GetProperty("identityStatus").GetString());
    }

    [Fact]
    public async Task Hosts_UnknownId_Returns404()
    {
        var (status, body) = await GetAsync($"/v1/hosts/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, status);
        Assert.Equal("RESOURCE_NOT_FOUND", body.GetProperty("code").GetString());
    }

    [Fact]
    public async Task Hosts_HostListingsFilterByHostId()
    {
        var (status, body) = await PostAsync("/v1/listings/search", new { hostId = Host1Id });

        Assert.Equal(HttpStatusCode.OK, status);
        Assert.Equal(6, body.GetProperty("totalRecords").GetInt32());
    }
}
