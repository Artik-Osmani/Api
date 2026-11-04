using System.Net;
using System.Text.Json;
using Xunit;

namespace StayHubApi.Tests;

public class SearchTests : ApiTestBase
{
    public SearchTests(ApiFactory factory) : base(factory)
    {
    }

    [Fact]
    public async Task Search_NoFilters_ReturnsAllSeededListings()
    {
        var (status, body) = await PostAsync("/v1/listings/search", new { });

        Assert.Equal(HttpStatusCode.OK, status);
        Assert.Equal(18, body.GetProperty("totalRecords").GetInt32());
        Assert.Equal(18, body.GetProperty("results").GetArrayLength());
        Assert.Equal("recommended", body.GetProperty("appliedFilters").GetProperty("sortBy").GetString());
    }

    [Fact]
    public async Task Search_ReversedDates_Returns422WithFieldErrors()
    {
        var (status, body) = await PostAsync("/v1/listings/search", new
        {
            checkInDate = "2027-03-07",
            checkOutDate = "2027-03-01"
        });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, status);
        Assert.Equal("DATE_ORDER", body.GetProperty("code").GetString());
        Assert.True(body.GetProperty("fieldErrors").TryGetProperty("checkOutDate", out _));
    }

    [Fact]
    public async Task Search_SingleDate_Returns422()
    {
        var (status, body) = await PostAsync("/v1/listings/search", new { checkInDate = "2027-03-01" });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, status);
        Assert.Equal("VALIDATION_FAILED", body.GetProperty("code").GetString());
        Assert.True(body.GetProperty("fieldErrors").TryGetProperty("checkInDate", out _));
        Assert.True(body.GetProperty("fieldErrors").TryGetProperty("checkOutDate", out _));
    }

    [Fact]
    public async Task Search_CategoryAndAmenities_FilterCorrectly()
    {
        var (status, body) = await PostAsync("/v1/listings/search", new
        {
            categories = new[] { "CABIN" },
            requiredAmenities = new[] { "Sauna" }
        });

        Assert.Equal(HttpStatusCode.OK, status);
        Assert.Equal(2, body.GetProperty("totalRecords").GetInt32());

        foreach (var result in body.GetProperty("results").EnumerateArray())
        {
            Assert.Equal("cabin", result.GetProperty("category").GetString());
            Assert.Contains(
                result.GetProperty("amenities").EnumerateArray().Select(a => a.GetString()),
                amenity => string.Equals(amenity, "sauna", StringComparison.OrdinalIgnoreCase));
        }
    }

    [Fact]
    public async Task Search_DateRange_ExcludesBookedListing()
    {
        var checkIn = Today.AddDays(15);
        var checkOut = Today.AddDays(17);

        var (status, body) = await PostAsync("/v1/listings/search", new
        {
            checkInDate = Date(checkIn),
            checkOutDate = Date(checkOut)
        });

        Assert.Equal(HttpStatusCode.OK, status);
        Assert.Equal(17, body.GetProperty("totalRecords").GetInt32());

        var ids = body.GetProperty("results").EnumerateArray()
            .Select(result => result.GetProperty("id").GetGuid())
            .ToList();

        Assert.DoesNotContain(Listing1Id, ids);
    }

    [Fact]
    public async Task Search_CircleFilter_ReturnsOnlyNearby()
    {
        var (status, body) = await PostAsync("/v1/listings/search", new
        {
            circleSearch = new
            {
                center = new { latitude = 42.6629, longitude = 21.1655 },
                radiusMeters = 5_000
            },
            sortBy = "distance_asc"
        });

        Assert.Equal(HttpStatusCode.OK, status);
        Assert.Equal(2, body.GetProperty("totalRecords").GetInt32());

        foreach (var result in body.GetProperty("results").EnumerateArray())
        {
            Assert.Equal("Pristina", result.GetProperty("address").GetProperty("city").GetString());
        }
    }

    [Fact]
    public async Task Search_PolygonFilter_ReturnsOnlyInside()
    {
        var (status, body) = await PostAsync("/v1/listings/search", new
        {
            polygonSearch = new
            {
                boundaryPoints = new[]
                {
                    new { latitude = 42.15, longitude = 20.65 },
                    new { latitude = 42.30, longitude = 20.65 },
                    new { latitude = 42.30, longitude = 20.80 },
                    new { latitude = 42.15, longitude = 20.80 }
                }
            }
        });

        Assert.Equal(HttpStatusCode.OK, status);
        Assert.Equal(2, body.GetProperty("totalRecords").GetInt32());

        foreach (var result in body.GetProperty("results").EnumerateArray())
        {
            Assert.Equal("Prizren", result.GetProperty("address").GetProperty("city").GetString());
        }
    }

    [Fact]
    public async Task Search_PetsFilter_RespectsHouseRules()
    {
        var (status, body) = await PostAsync("/v1/listings/search", new { petsCount = 2 });

        Assert.Equal(HttpStatusCode.OK, status);
        Assert.Equal(4, body.GetProperty("totalRecords").GetInt32());

        foreach (var result in body.GetProperty("results").EnumerateArray())
        {
            Assert.True(result.GetProperty("houseRules").GetProperty("maxPets").GetInt32() >= 2);
        }
    }

    [Fact]
    public async Task Search_UnknownSort_Returns422()
    {
        var (status, body) = await PostAsync("/v1/listings/search", new { sortBy = "cheapest" });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, status);
        Assert.Equal("INVALID_SORT", body.GetProperty("code").GetString());
        Assert.Equal(6, body.GetProperty("details").GetProperty("allowed").GetArrayLength());
    }

    [Fact]
    public async Task Search_DistanceSortWithoutCircle_Returns422()
    {
        var (status, body) = await PostAsync("/v1/listings/search", new { sortBy = "distance_asc" });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, status);
        Assert.Equal("INVALID_SORT", body.GetProperty("code").GetString());
    }

    [Fact]
    public async Task Search_PageSizeAboveMaximum_Returns422()
    {
        var (status, body) = await PostAsync("/v1/listings/search", new { pageSize = 9999 });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, status);
        Assert.True(body.GetProperty("fieldErrors").TryGetProperty("pageSize", out _));
    }
}
