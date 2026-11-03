using System.Net;
using Xunit;

namespace StayHubApi.Tests;

public class ReviewTests : ApiTestBase
{
    public ReviewTests(ApiFactory factory) : base(factory)
    {
    }

    [Fact]
    public async Task Reviews_RatingOutOfRange_Returns400()
    {
        var (status, body) = await PostAsync($"/v1/listings/{Listing1Id}/reviews", new
        {
            authorName = "Test Reviewer",
            rating = 0,
            comment = "This comment is long enough to pass the comment length rule."
        });

        Assert.Equal(HttpStatusCode.BadRequest, status);
        Assert.Equal("VALIDATION_FAILED", body.GetProperty("code").GetString());
        Assert.True(body.GetProperty("fieldErrors").TryGetProperty("rating", out _));
    }

    [Fact]
    public async Task Reviews_ShortComment_Returns400()
    {
        var (status, body) = await PostAsync($"/v1/listings/{Listing1Id}/reviews", new
        {
            authorName = "Test Reviewer",
            rating = 5,
            comment = "Too short"
        });

        Assert.Equal(HttpStatusCode.BadRequest, status);
        Assert.True(body.GetProperty("fieldErrors").TryGetProperty("comment", out _));
    }

    [Fact]
    public async Task Reviews_AddRecalculatesAverageAndCount()
    {
        var (beforeStatus, before) = await GetAsync($"/v1/listings/{Listing2Id}/reviews");
        Assert.Equal(HttpStatusCode.OK, beforeStatus);
        Assert.Equal(0, before.GetProperty("totalReviews").GetInt32());

        var (addStatus, added) = await PostAsync($"/v1/listings/{Listing2Id}/reviews", new
        {
            authorName = "Nora Test",
            rating = 4,
            comment = "Clean, quiet, and exactly the size advertised. The bakery below is a bonus."
        });
        Assert.Equal(HttpStatusCode.Created, addStatus);
        Assert.Equal(4, added.GetProperty("rating").GetInt32());

        var (detailStatus, detail) = await GetAsync($"/v1/listings/{Listing2Id}");
        Assert.Equal(HttpStatusCode.OK, detailStatus);
        Assert.Equal(1, detail.GetProperty("reviewCount").GetInt32());
        Assert.Equal(4, detail.GetProperty("starRating").GetDouble());

        var (afterStatus, after) = await GetAsync($"/v1/listings/{Listing2Id}/reviews");
        Assert.Equal(HttpStatusCode.OK, afterStatus);
        Assert.Equal(1, after.GetProperty("totalReviews").GetInt32());
        Assert.Equal(4, after.GetProperty("averageRating").GetDouble());
    }

    [Fact]
    public async Task Reviews_UnknownListing_Returns404()
    {
        var (status, body) = await PostAsync($"/v1/listings/{Guid.NewGuid()}/reviews", new
        {
            authorName = "Test Reviewer",
            rating = 5,
            comment = "This comment is long enough to pass the comment length rule."
        });

        Assert.Equal(HttpStatusCode.NotFound, status);
        Assert.Equal("RESOURCE_NOT_FOUND", body.GetProperty("code").GetString());
    }
}
