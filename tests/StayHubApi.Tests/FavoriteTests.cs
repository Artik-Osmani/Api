using System.Net;
using Xunit;

namespace StayHubApi.Tests;

public class FavoriteTests : ApiTestBase
{
    public FavoriteTests(ApiFactory factory) : base(factory)
    {
    }

    [Fact]
    public async Task Favorites_SeededListIsIndependentOfSearch()
    {
        var (searchStatus, _) = await PostAsync("/v1/listings/search", new
        {
            query = "prizren",
            categories = new[] { "cabin" }
        });
        Assert.Equal(HttpStatusCode.OK, searchStatus);

        var (status, body) = await GetAsync("/v1/favorites");
        Assert.Equal(HttpStatusCode.OK, status);
        Assert.Equal(2, body.GetArrayLength());

        var titles = body.EnumerateArray().Select(item => item.GetProperty("title").GetString()).ToList();
        Assert.Equal(titles.OrderBy(title => title, StringComparer.OrdinalIgnoreCase), titles);
    }

    [Fact]
    public async Task Favorites_ToggleTwice_ReturnsFalse()
    {
        var (firstStatus, first) = await PostAsync($"/v1/favorites/{Listing1Id}");
        Assert.Equal(HttpStatusCode.OK, firstStatus);
        Assert.True(first.GetProperty("favorited").GetBoolean());

        var (listStatus, list) = await GetAsync("/v1/favorites");
        Assert.Equal(HttpStatusCode.OK, listStatus);
        Assert.Equal(3, list.GetArrayLength());

        var (secondStatus, second) = await PostAsync($"/v1/favorites/{Listing1Id}");
        Assert.Equal(HttpStatusCode.OK, secondStatus);
        Assert.False(second.GetProperty("favorited").GetBoolean());

        var (_, after) = await GetAsync("/v1/favorites");
        Assert.Equal(2, after.GetArrayLength());
    }

    [Fact]
    public async Task Favorites_UnknownListing_Returns404()
    {
        var (status, body) = await PostAsync($"/v1/favorites/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, status);
        Assert.Equal("RESOURCE_NOT_FOUND", body.GetProperty("code").GetString());
    }
}
