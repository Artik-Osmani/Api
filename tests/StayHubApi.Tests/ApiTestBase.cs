using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace StayHubApi.Tests;

/// <summary>
/// Shared plumbing for the integration tests. The constructor resets the store, so every test starts
/// from the same eighteen stays, four hosts and four seeded reservations.
/// </summary>
public abstract class ApiTestBase : IClassFixture<ApiFactory>
{
    protected static readonly Guid Listing1Id = Guid.Parse("e14c1d68-0fa4-44bc-b17b-4b248a31e8fd");
    protected static readonly Guid Listing2Id = Guid.Parse("d026d4f6-d073-5c03-b1f9-27d89ea8e094");
    protected static readonly Guid Listing3Id = Guid.Parse("9e6a0619-a3d8-536b-a869-cd205a948d7b");
    protected static readonly Guid Listing5Id = Guid.Parse("dcf8b3de-f101-5abd-9077-8f79cd5ce83d");
    protected static readonly Guid Listing11Id = Guid.Parse("3686c1bd-e109-5069-8d01-f74f19fda33e");
    protected static readonly Guid Listing12Id = Guid.Parse("fdcc614d-5475-595c-b823-8157f44ee9fc");
    protected static readonly Guid Host1Id = Guid.Parse("9a78cd9c-c9c7-43cf-bc82-01967fa7e93b");
    protected static readonly Guid Reservation1Id = Guid.Parse("3f7bf08e-1678-43d9-959c-6e6ad9d20c5b");
    protected static readonly Guid Reservation2Id = Guid.Parse("cb0fe11b-9030-5818-acd2-d822f61f0424");

    protected static readonly DateOnly Today = DateOnly.FromDateTime(DateTime.UtcNow);

    protected ApiTestBase(ApiFactory factory)
    {
        Client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });

        using var reset = Client.PostAsync("/v1/system/reset", content: null).GetAwaiter().GetResult();
        reset.EnsureSuccessStatusCode();
    }

    protected HttpClient Client { get; }

    protected static StringContent JsonBody(object value)
        => new(JsonSerializer.Serialize(value), Encoding.UTF8, "application/json");

    protected async Task<(HttpStatusCode Status, JsonElement Body)> SendAsync(
        HttpMethod method,
        string path,
        object? body = null)
    {
        using var request = new HttpRequestMessage(method, path);
        if (body is not null)
        {
            request.Content = JsonBody(body);
        }

        using var response = await Client.SendAsync(request);
        var text = await response.Content.ReadAsStringAsync();

        using var document = JsonDocument.Parse(string.IsNullOrWhiteSpace(text) ? "{}" : text);
        return (response.StatusCode, document.RootElement.Clone());
    }

    protected Task<(HttpStatusCode Status, JsonElement Body)> GetAsync(string path)
        => SendAsync(HttpMethod.Get, path);

    protected Task<(HttpStatusCode Status, JsonElement Body)> PostAsync(string path, object? body = null)
        => SendAsync(HttpMethod.Post, path, body);

    protected Task<(HttpStatusCode Status, JsonElement Body)> PatchAsync(string path, object? body = null)
        => SendAsync(HttpMethod.Patch, path, body);

    protected static object Guest(string first = "Test", string last = "Guest", string email = "test.guest@example.com")
        => new
        {
            firstName = first,
            lastName = last,
            email,
            phoneNumber = "12345678"
        };

    protected static object Booking(
        Guid listingId,
        DateOnly checkIn,
        DateOnly checkOut,
        int guests = 2,
        string flow = "instant_book")
        => new
        {
            listingId,
            checkInDate = checkIn.ToString("yyyy-MM-dd"),
            checkOutDate = checkOut.ToString("yyyy-MM-dd"),
            guestsCount = guests,
            primaryGuest = Guest(),
            bookingFlow = flow,
            paymentAuthorizationToken = "demo-token"
        };

    protected static string Date(DateOnly date) => date.ToString("yyyy-MM-dd");
}
