using System.Net;
using StayHubApi.Services;
using Xunit;

namespace StayHubApi.Tests;

public class ContractRegressionTests : ApiTestBase
{
    public ContractRegressionTests(ApiFactory factory) : base(factory) { }

    [Theory]
    [InlineData("/v1/does-not-exist")]
    [InlineData("/v1/listings/not-a-guid")]
    public async Task UnknownRoute_UsesApiError(string path)
    {
        var (status, body) = await GetAsync(path);
        Assert.Equal(HttpStatusCode.NotFound, status);
        Assert.Equal("RESOURCE_NOT_FOUND", body.GetProperty("code").GetString());
        Assert.False(string.IsNullOrWhiteSpace(body.GetProperty("traceId").GetString()));
    }

    [Fact]
    public async Task UnsupportedMethod_UsesApiError()
    {
        var (status, body) = await SendAsync(HttpMethod.Delete, "/v1/system/health");
        Assert.Equal(HttpStatusCode.MethodNotAllowed, status);
        Assert.Equal("VALIDATION_FAILED", body.GetProperty("code").GetString());
        Assert.False(string.IsNullOrWhiteSpace(body.GetProperty("traceId").GetString()));
    }

    [Fact]
    public async Task Review_ValidatesLengthAfterTrimming()
    {
        var (status, body) = await PostAsync($"/v1/listings/{Listing1Id}/reviews", new
        {
            authorName = " A ", rating = 1, comment = "       too short       "
        });
        Assert.Equal(HttpStatusCode.BadRequest, status);
        Assert.True(body.GetProperty("fieldErrors").TryGetProperty("authorName", out _));
        Assert.True(body.GetProperty("fieldErrors").TryGetProperty("comment", out _));
    }

    [Fact]
    public async Task Guest_NestedStringsTrimBeforeValidation()
    {
        var (status, body) = await PostAsync("/v1/reservations", new
        {
            listingId = Listing1Id,
            checkInDate = Today.AddDays(70), checkOutDate = Today.AddDays(73), guestsCount = 2,
            primaryGuest = new { firstName = " A ", lastName = " Guest ", email = " test@example.com ", phoneNumber = " 12345678 " }
        });
        Assert.Equal(HttpStatusCode.BadRequest, status);
        Assert.True(body.GetProperty("fieldErrors").TryGetProperty("primaryGuest.firstName", out _));
    }

    [Fact]
    public async Task InvalidUpdate_DoesNotChangeHost()
    {
        var (_, before) = await GetAsync($"/v1/listings/{Listing1Id}");
        var (status, _) = await SendAsync(HttpMethod.Put, $"/v1/listings/{Listing1Id}", new
        {
            hostId = SeedData.Host2Id, category = "unknown"
        });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, status);
        var (_, after) = await GetAsync($"/v1/listings/{Listing1Id}");
        Assert.Equal(before.GetProperty("host").GetRawText(), after.GetProperty("host").GetRawText());
    }

    [Fact]
    public async Task ConcurrentBookings_ExactlyOneSucceeds()
    {
        var booking = Booking(Listing1Id, Today.AddDays(80), Today.AddDays(87));
        var results = await Task.WhenAll(Enumerable.Range(0, 8).Select(_ => PostAsync("/v1/reservations", booking)));
        Assert.Single(results, result => result.Status == HttpStatusCode.Created);
        Assert.Equal(7, results.Count(result => result.Status == HttpStatusCode.Conflict));
    }

    [Fact]
    public void Pricing_ExcessiveFeesAreRejected()
    {
        var pricing = new StayHubApi.Models.PricingMatrix("EUR", 95m, decimal.MaxValue, 0, 0, 0, new(0, 0));
        Assert.Contains("pricing.cleaningFee", CatalogRules.ValidatePricing(pricing).Keys);
    }

    [Theory]
    [InlineData("/\\example.com/photo.webp")]
    [InlineData("//example.com/photo.webp")]
    [InlineData("/images/\nphoto.webp")]
    public void Images_RejectAmbiguousRemotePaths(string path)
        => Assert.False(CatalogRules.IsLocalImagePath(path));

    [Fact]
    public async Task SemanticError_KeepsSecurityHeaders()
    {
        using var response = await Client.PostAsync("/v1/listings/search", JsonBody(new { sortBy = "unknown" }));
        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Contains("script-src 'self'", response.Headers.GetValues("Content-Security-Policy").Single());
        Assert.Equal("nosniff", response.Headers.GetValues("X-Content-Type-Options").Single());
    }
}
