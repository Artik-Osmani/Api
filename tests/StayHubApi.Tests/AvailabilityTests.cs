using System.Net;
using Xunit;

namespace StayHubApi.Tests;

public class AvailabilityTests : ApiTestBase
{
    public AvailabilityTests(ApiFactory factory) : base(factory)
    {
    }

    [Fact]
    public async Task Availability_MissingDates_Returns422()
    {
        var (status, body) = await GetAsync($"/v1/listings/{Listing1Id}/availability");

        Assert.Equal(HttpStatusCode.UnprocessableEntity, status);
        Assert.Equal("VALIDATION_FAILED", body.GetProperty("code").GetString());
        Assert.True(body.GetProperty("fieldErrors").TryGetProperty("start_date", out _));
        Assert.True(body.GetProperty("fieldErrors").TryGetProperty("end_date", out _));
    }

    [Fact]
    public async Task Availability_WindowOver92Days_Returns422()
    {
        var (status, body) = await GetAsync(
            $"/v1/listings/{Listing1Id}/availability?start_date={Date(Today.AddDays(10))}&end_date={Date(Today.AddDays(110))}");

        Assert.Equal(HttpStatusCode.UnprocessableEntity, status);
        Assert.Equal("VALIDATION_FAILED", body.GetProperty("code").GetString());
        Assert.Contains("92", body.GetProperty("message").GetString());
    }

    [Fact]
    public async Task Availability_PastDaysMarkedUnavailable()
    {
        var (status, body) = await GetAsync(
            $"/v1/listings/{Listing1Id}/availability?start_date={Date(Today.AddDays(-3))}&end_date={Date(Today.AddDays(-1))}");

        Assert.Equal(HttpStatusCode.OK, status);
        var days = body.GetProperty("days").EnumerateArray().ToList();
        Assert.Equal(3, days.Count);

        foreach (var day in days)
        {
            Assert.False(day.GetProperty("isAvailable").GetBoolean());
            Assert.Equal("past", day.GetProperty("blockReason").GetString());
        }
    }

    [Fact]
    public async Task Availability_SeededBookingIsMarkedBooked()
    {
        var (status, body) = await GetAsync(
            $"/v1/listings/{Listing1Id}/availability?start_date={Date(Today.AddDays(14))}&end_date={Date(Today.AddDays(15))}");

        Assert.Equal(HttpStatusCode.OK, status);
        var days = body.GetProperty("days").EnumerateArray().ToList();
        Assert.Equal(2, days.Count);
        Assert.All(days, day =>
        {
            Assert.False(day.GetProperty("isAvailable").GetBoolean());
            Assert.Equal("booked", day.GetProperty("blockReason").GetString());
        });
        Assert.Equal(2, days[0].GetProperty("minimumStayNights").GetInt32());
    }
}
