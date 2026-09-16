using StayHubApi.Models;

namespace StayHubApi.Services;

public class MockDataStore
{
    public List<ListingDetail> Listings { get; } = [];
    public List<Reservation> Reservations { get; } = [];
    public List<Message> Messages { get; } = [];

    public MockDataStore()
    {
        SeedData();
    }

    private void SeedData()
    {
        var hostId = Guid.Parse("9a78cd9c-c9c7-43cf-bc82-01967fa7e93b");
        var listingId = Guid.Parse("e14c1d68-0fa4-44bc-b17b-4b248a31e8fd");

        var sampleListing = new ListingDetail
        {
            Id = listingId,
            Title = "Modern Sunlit Loft Near Historic Center",
            Description = "Elegant open-plan studio loft featuring modern decor, dedicated workstation, high-speed fiber internet, and a private balcony.",
            Category = "apartment",
            Coordinates = new CoordinatePair(37.774929, -122.419416),
            Address = new Address(
                "742 Evergreen Terrace",
                "Springfield",
                "OR",
                "97477",
                "US",
                "neigh_downtown_01"
            ),
            Capacity = new CapacityBreakdown(4, 2, 2, 1.5),
            Amenities = ["wifi", "workspace", "air_conditioning", "self_check_in"],
            Host = new HostDetails(
                hostId,
                "Elena Vance",
                "https://images.example.com/hosts/elena.jpg",
                99.5,
                15,
                true,
                true
            ),
            Pricing = new PricingMatrix(
                "USD",
                150.00m,
                75.00m,
                22.50m,
                18.00m,
                200.00m,
                new DynamicDiscounts(10.0, 25.0, 5.0)
            ),
            HouseRules = new HouseRules("22:00", "08:00", false, false, 1),
            InstantBookEnabled = true,
            StarRating = 4.88,
            ReviewCount = 87
        };

        Listings.Add(sampleListing);

        // Seed 1 reservation
        var resId = Guid.Parse("3f7bf08e-1678-43d9-959c-6e6ad9d20c5b");
        Reservations.Add(new Reservation
        {
            Id = resId,
            ListingId = listingId,
            HostId = hostId,
            Status = "confirmed",
            BookingFlow = "instant_book",
            CheckInDate = new DateOnly(2026, 10, 15),
            CheckOutDate = new DateOnly(2026, 10, 20),
            GuestsCount = 2,
            PrimaryGuest = new PrimaryGuest("Arthur", "Dent", "arthur.dent@example.com", "+14155552671"),
            PricingSummary = new ReservationPricingSummary(
                "USD",
                750.00m,
                75.00m,
                22.50m,
                18.00m,
                200.00m,
                50.00m,
                1015.50m,
                [
                    new PriceBreakdownItem("5 Nights Base Accommodation", 750.00m),
                    new PriceBreakdownItem("Cleaning Fee", 75.00m),
                    new PriceBreakdownItem("Service Fee", 22.50m),
                    new PriceBreakdownItem("Occupancy Tax", 18.00m)
                ]
            ),
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow.AddDays(-1)
        });

        // Seed 1 message
        Messages.Add(new Message(
            Guid.Parse("cb0ee3e8-54c3-424f-a9db-c3f912e73546"),
            resId,
            Guid.Parse("18b76c8d-2917-4861-b9cb-1718bf14bb44"),
            "guest",
            "Hello Elena, will it be possible to drop off our luggage two hours early?",
            DateTime.UtcNow.AddHours(-12),
            true
        ));
    }
}
