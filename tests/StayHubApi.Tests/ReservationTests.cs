using System.Net;
using Xunit;

namespace StayHubApi.Tests;

public class ReservationTests : ApiTestBase
{
    public ReservationTests(ApiFactory factory) : base(factory)
    {
    }

    private static object Quote(Guid listingId, DateOnly checkIn, DateOnly checkOut, int guests = 2)
        => new
        {
            listingId,
            checkInDate = Date(checkIn),
            checkOutDate = Date(checkOut),
            guestsCount = guests
        };

    [Fact]
    public async Task Quote_TotalMatchesCreatedReservation()
    {
        var checkIn = new DateOnly(2027, 4, 10);
        var checkOut = new DateOnly(2027, 4, 14);

        var (quoteStatus, quote) = await PostAsync(
            "/v1/reservations/quote",
            Quote(Listing3Id, checkIn, checkOut));

        Assert.Equal(HttpStatusCode.OK, quoteStatus);
        var quotedTotal = quote.GetProperty("totalAmount").GetDecimal();

        var (createStatus, created) = await PostAsync(
            "/v1/reservations",
            Booking(Listing3Id, checkIn, checkOut));

        Assert.Equal(HttpStatusCode.Created, createStatus);
        var storedTotal = created.GetProperty("pricingSummary").GetProperty("totalAmount").GetDecimal();

        Assert.Equal(quotedTotal, storedTotal);
        Assert.Equal(352.00m, storedTotal);

        var itemsSum = created.GetProperty("pricingSummary").GetProperty("items").EnumerateArray()
            .Sum(item => item.GetProperty("amount").GetDecimal());
        Assert.Equal(storedTotal, itemsSum);
    }

    [Fact]
    public async Task Quote_WeeklyDiscountAtSevenNights()
    {
        var (status, body) = await PostAsync(
            "/v1/reservations/quote",
            Quote(Listing1Id, new DateOnly(2027, 5, 1), new DateOnly(2027, 5, 8)));

        Assert.Equal(HttpStatusCode.OK, status);
        Assert.Equal(7, body.GetProperty("nights").GetInt32());
        Assert.Equal(665.00m, body.GetProperty("basePrice").GetDecimal());
        Assert.Equal(10m, body.GetProperty("discountPercent").GetDecimal());
        Assert.Equal(66.50m, body.GetProperty("discountAmount").GetDecimal());
        Assert.Equal(646.75m, body.GetProperty("totalAmount").GetDecimal());
    }

    [Fact]
    public async Task Quote_MonthlyDiscountAtThirtyNights()
    {
        var (status, body) = await PostAsync(
            "/v1/reservations/quote",
            Quote(Listing1Id, new DateOnly(2027, 6, 1), new DateOnly(2027, 7, 1)));

        Assert.Equal(HttpStatusCode.OK, status);
        Assert.Equal(30, body.GetProperty("nights").GetInt32());
        Assert.Equal(25m, body.GetProperty("discountPercent").GetDecimal());
        Assert.Equal(712.50m, body.GetProperty("discountAmount").GetDecimal());
        Assert.Equal(2185.75m, body.GetProperty("totalAmount").GetDecimal());
    }

    [Fact]
    public async Task CreateReservation_PastCheckIn_Returns422()
    {
        var (status, body) = await PostAsync(
            "/v1/reservations",
            Booking(Listing1Id, new DateOnly(2025, 1, 10), new DateOnly(2025, 1, 12)));

        Assert.Equal(HttpStatusCode.UnprocessableEntity, status);
        Assert.Equal("DATE_IN_PAST", body.GetProperty("code").GetString());
    }

    [Fact]
    public async Task CreateReservation_BelowMinimumStay_Returns422()
    {
        var checkIn = Today.AddDays(60);

        var (status, body) = await PostAsync(
            "/v1/reservations",
            Booking(Listing2Id, checkIn, checkIn.AddDays(2)));

        Assert.Equal(HttpStatusCode.UnprocessableEntity, status);
        Assert.Equal("MIN_STAY_NOT_MET", body.GetProperty("code").GetString());
        Assert.Contains("3 nights", body.GetProperty("message").GetString());
    }

    [Fact]
    public async Task CreateReservation_Overlap_Returns409()
    {
        var checkIn = Today.AddDays(14);
        var checkOut = Today.AddDays(16);

        var (status, body) = await PostAsync(
            "/v1/reservations",
            Booking(Listing1Id, checkIn, checkOut));

        Assert.Equal(HttpStatusCode.Conflict, status);
        Assert.Equal("BOOKING_CONFLICT", body.GetProperty("code").GetString());
        Assert.True(body.GetProperty("details").TryGetProperty("checkInDate", out _));
        Assert.True(body.GetProperty("details").TryGetProperty("checkOutDate", out _));
    }

    [Fact]
    public async Task CreateReservation_GuestsAboveCapacity_Returns422()
    {
        var checkIn = Today.AddDays(60);

        var (status, body) = await PostAsync(
            "/v1/reservations",
            Booking(Listing1Id, checkIn, checkIn.AddDays(3), guests: 5));

        Assert.Equal(HttpStatusCode.UnprocessableEntity, status);
        Assert.Equal("CAPACITY_EXCEEDED", body.GetProperty("code").GetString());
        Assert.Equal(4, body.GetProperty("details").GetProperty("maxGuests").GetInt32());
    }

    [Fact]
    public async Task CreateReservation_MissingDates_Returns422WithBothFields()
    {
        var (status, body) = await PostAsync("/v1/reservations", new
        {
            listingId = Listing1Id,
            guestsCount = 2,
            primaryGuest = Guest()
        });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, status);
        Assert.True(body.GetProperty("fieldErrors").TryGetProperty("checkInDate", out _));
        Assert.True(body.GetProperty("fieldErrors").TryGetProperty("checkOutDate", out _));
    }

    [Fact]
    public async Task Status_IllegalTransition_Returns409()
    {
        var checkIn = Today.AddDays(70);
        var (createdStatus, created) = await PostAsync(
            "/v1/reservations",
            Booking(Listing3Id, checkIn, checkIn.AddDays(3)));
        Assert.Equal(HttpStatusCode.Created, createdStatus);

        var id = created.GetProperty("id").GetGuid();
        var (cancelStatus, cancelled) = await PostAsync($"/v1/reservations/{id}/cancel?reason=Testing");
        Assert.Equal(HttpStatusCode.OK, cancelStatus);
        Assert.Equal("cancelled", cancelled.GetProperty("status").GetString());

        var (patchStatus, patchBody) = await PatchAsync(
            $"/v1/reservations/{id}/status",
            new { status = "confirmed" });

        Assert.Equal(HttpStatusCode.Conflict, patchStatus);
        Assert.Equal("INVALID_STATUS_TRANSITION", patchBody.GetProperty("code").GetString());
        Assert.Equal("cancelled", patchBody.GetProperty("details").GetProperty("from").GetString());
        Assert.Equal(0, patchBody.GetProperty("details").GetProperty("allowed").GetArrayLength());
    }

    [Fact]
    public async Task Status_PendingToConfirmed_Succeeds()
    {
        var (beforeStatus, before) = await GetAsync($"/v1/reservations/{Reservation2Id}");
        Assert.Equal(HttpStatusCode.OK, beforeStatus);
        Assert.Equal("pending_approval", before.GetProperty("status").GetString());

        var (status, body) = await PatchAsync(
            $"/v1/reservations/{Reservation2Id}/status",
            new { status = "confirmed" });

        Assert.Equal(HttpStatusCode.OK, status);
        Assert.Equal("confirmed", body.GetProperty("status").GetString());
    }

    [Fact]
    public async Task CheckedIn_BeforeArrival_Returns409()
    {
        var (status, body) = await PatchAsync(
            $"/v1/reservations/{Reservation1Id}/status",
            new { status = "checked_in" });

        Assert.Equal(HttpStatusCode.Conflict, status);
        Assert.Equal("INVALID_STATUS_TRANSITION", body.GetProperty("code").GetString());
    }

    [Fact]
    public async Task Cancel_PastBooking_Returns409()
    {
        var (status, body) = await PostAsync(
            "/v1/reservations/0b06a930-6c59-5c47-95c1-35fb6127b8a5/cancel");

        Assert.Equal(HttpStatusCode.Conflict, status);
        Assert.Equal("CANCELLATION_NOT_ALLOWED", body.GetProperty("code").GetString());
    }
}
