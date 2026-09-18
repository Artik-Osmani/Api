using StayHubApi.Models;

namespace StayHubApi.Services;

public class MockDataStore
{
    public List<ListingDetail> Listings { get; } = [];
    public List<Reservation> Reservations { get; } = [];
    public List<Message> Messages { get; } = [];
    public HashSet<Guid> FavoriteIds { get; } = [];

    public MockDataStore()
    {
        SeedData();
    }

    private void SeedData()
    {
        var hostId1 = Guid.Parse("9a78cd9c-c9c7-43cf-bc82-01967fa7e93b");
        var hostId2 = Guid.Parse("b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7");
        var hostId3 = Guid.Parse("c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8");

        var listing1 = new ListingDetail
        {
            Id = Guid.Parse("e14c1d68-0fa4-44bc-b17b-4b248a31e8fd"),
            Title = "Modern Sunlit Loft Near Historic Center",
            Description = "Elegant open-plan studio loft featuring modern decor, dedicated workstation, high-speed fiber internet, and a private balcony overlooking the city skyline.",
            Category = "apartment",
            ImageUrl = "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
            Coordinates = new CoordinatePair(37.774929, -122.419416),
            Address = new Address("742 Evergreen Terrace", "San Francisco", "CA", "94103", "US", "neigh_mission"),
            Capacity = new CapacityBreakdown(4, 2, 2, 1.5),
            Amenities = ["wifi", "workspace", "air_conditioning", "self_check_in"],
            Host = new HostDetails(hostId1, "Elena Vance", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80", 99.5, 15, true, true),
            Pricing = new PricingMatrix("USD", 150.00m, 75.00m, 22.50m, 18.00m, 200.00m, new DynamicDiscounts(10.0, 25.0, 5.0)),
            HouseRules = new HouseRules("22:00", "08:00", false, false, 1),
            InstantBookEnabled = true,
            StarRating = 4.88,
            ReviewCount = 87
        };

        var listing2 = new ListingDetail
        {
            Id = Guid.NewGuid(),
            Title = "Secluded Mountain Cabin with Hot Tub",
            Description = "A cozy wood-paneled cabin nestled in the pines with a private hot tub, fireplace, and breathtaking mountain views. Perfect for a romantic escape or family retreat.",
            Category = "cabin",
            ImageUrl = "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
            Coordinates = new CoordinatePair(39.5501, -105.7821),
            Address = new Address("Pine Trail Road 12", "Breckenridge", "CO", "80424", "US", "neigh_mountains"),
            Capacity = new CapacityBreakdown(6, 3, 4, 2.0),
            Amenities = ["wifi", "hot_tub", "pet_friendly", "self_check_in"],
            Host = new HostDetails(hostId2, "Marcus Reeve", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80", 97.0, 30, true, true),
            Pricing = new PricingMatrix("USD", 220.00m, 120.00m, 33.00m, 24.00m, 350.00m, new DynamicDiscounts(12.0, 30.0, 8.0)),
            HouseRules = new HouseRules("23:00", "07:00", false, false, 2),
            InstantBookEnabled = true,
            StarRating = 4.96,
            ReviewCount = 213
        };

        var listing3 = new ListingDetail
        {
            Id = Guid.NewGuid(),
            Title = "Beachfront Villa with Infinity Pool",
            Description = "Luxurious 5-bedroom villa right on the beach with a stunning infinity pool, home theater, fully equipped gourmet kitchen, and private dock.",
            Category = "villa",
            ImageUrl = "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80",
            Coordinates = new CoordinatePair(25.7617, -80.1918),
            Address = new Address("Ocean Drive 1 Penthouse", "Miami Beach", "FL", "33139", "US", "neigh_southbeach"),
            Capacity = new CapacityBreakdown(10, 5, 7, 4.5),
            Amenities = ["wifi", "pool", "air_conditioning", "ev_charger"],
            Host = new HostDetails(hostId3, "Sofia Marekis", "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80", 100.0, 5, true, true),
            Pricing = new PricingMatrix("USD", 890.00m, 300.00m, 133.50m, 89.00m, 1500.00m, new DynamicDiscounts(15.0, 35.0, 10.0)),
            HouseRules = new HouseRules("23:00", "09:00", true, true, 0),
            InstantBookEnabled = false,
            StarRating = 4.99,
            ReviewCount = 42
        };

        var listing4 = new ListingDetail
        {
            Id = Guid.NewGuid(),
            Title = "Charming Brooklyn Brownstone Room",
            Description = "A beautifully furnished private room in a historic Brooklyn brownstone. Shared living room and kitchen with friendly hosts. Steps from the subway and local cafes.",
            Category = "private_room",
            ImageUrl = "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80",
            Coordinates = new CoordinatePair(40.6782, -73.9442),
            Address = new Address("Bedford Ave 45", "Brooklyn", "NY", "11211", "US", "neigh_williamsburg"),
            Capacity = new CapacityBreakdown(2, 1, 1, 1.0),
            Amenities = ["wifi", "workspace", "self_check_in"],
            Host = new HostDetails(hostId1, "Elena Vance", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80", 99.5, 15, true, true),
            Pricing = new PricingMatrix("USD", 85.00m, 40.00m, 12.75m, 9.00m, 100.00m, new DynamicDiscounts(7.0, 18.0, 3.0)),
            HouseRules = new HouseRules("22:00", "08:00", false, false, 0),
            InstantBookEnabled = true,
            StarRating = 4.75,
            ReviewCount = 156
        };

        var listing5 = new ListingDetail
        {
            Id = Guid.NewGuid(),
            Title = "Desert Adobe Home with Stargazing Deck",
            Description = "Authentic Southwestern adobe home with a rooftop stargazing deck, private pool, and stunning panoramic desert views. Remotely located for total peace.",
            Category = "entire_home",
            ImageUrl = "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
            Coordinates = new CoordinatePair(33.4152, -111.8315),
            Address = new Address("Desert Sun Lane 88", "Scottsdale", "AZ", "85255", "US", "neigh_northscottsdale"),
            Capacity = new CapacityBreakdown(8, 4, 5, 3.0),
            Amenities = ["wifi", "pool", "pet_friendly", "air_conditioning", "ev_charger"],
            Host = new HostDetails(hostId2, "Marcus Reeve", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80", 97.0, 30, true, true),
            Pricing = new PricingMatrix("USD", 340.00m, 150.00m, 51.00m, 34.00m, 500.00m, new DynamicDiscounts(10.0, 25.0, 7.0)),
            HouseRules = new HouseRules("22:00", "08:00", false, false, 2),
            InstantBookEnabled = true,
            StarRating = 4.92,
            ReviewCount = 68
        };

        var listing6 = new ListingDetail
        {
            Id = Guid.NewGuid(),
            Title = "Stylish Downtown Apartment with Skyline Views",
            Description = "A sleek, modern apartment on the 28th floor with panoramic city skyline views, concierge service, rooftop access, and walking distance to restaurants and nightlife.",
            Category = "apartment",
            ImageUrl = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
            Coordinates = new CoordinatePair(41.8827, -87.6233),
            Address = new Address("Michigan Ave 1000", "Chicago", "IL", "60611", "US", "neigh_magnificentmile"),
            Capacity = new CapacityBreakdown(3, 1, 2, 1.0),
            Amenities = ["wifi", "air_conditioning", "workspace", "self_check_in"],
            Host = new HostDetails(hostId3, "Sofia Marekis", "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80", 100.0, 5, true, true),
            Pricing = new PricingMatrix("USD", 175.00m, 80.00m, 26.25m, 19.00m, 250.00m, new DynamicDiscounts(8.0, 20.0, 4.0)),
            HouseRules = new HouseRules("23:00", "09:00", false, false, 0),
            InstantBookEnabled = true,
            StarRating = 4.85,
            ReviewCount = 129
        };

        Listings.AddRange([listing1, listing2, listing3, listing4, listing5, listing6]);

        var resId = Guid.Parse("3f7bf08e-1678-43d9-959c-6e6ad9d20c5b");
        Reservations.Add(new Reservation
        {
            Id = resId,
            ListingId = listing1.Id,
            HostId = hostId1,
            Status = "confirmed",
            BookingFlow = "instant_book",
            CheckInDate = new DateOnly(2026, 10, 15),
            CheckOutDate = new DateOnly(2026, 10, 20),
            GuestsCount = 2,
            PrimaryGuest = new PrimaryGuest("Arthur", "Dent", "arthur.dent@example.com", "+14155552671"),
            PricingSummary = new ReservationPricingSummary(
                "USD", 750.00m, 75.00m, 22.50m, 18.00m, 200.00m, 50.00m, 1015.50m,
                [new PriceBreakdownItem("5 Nights Base Accommodation", 750.00m), new PriceBreakdownItem("Cleaning Fee", 75.00m), new PriceBreakdownItem("Service Fee", 22.50m), new PriceBreakdownItem("Occupancy Tax", 18.00m)]
            ),
            CreatedAt = DateTime.UtcNow.AddDays(-3),
            UpdatedAt = DateTime.UtcNow.AddDays(-3)
        });

        Messages.Add(new Message(Guid.NewGuid(), resId, Guid.Parse("18b76c8d-2917-4861-b9cb-1718bf14bb44"), "guest", "Hello Elena! Will it be possible to drop off our luggage two hours early?", DateTime.UtcNow.AddHours(-12), true));
        Messages.Add(new Message(Guid.NewGuid(), resId, hostId1, "host", "Hi Arthur! Of course, no problem. I can have the place ready by 1 PM. See you soon!", DateTime.UtcNow.AddHours(-11), true));
    }
}
