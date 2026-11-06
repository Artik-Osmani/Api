using StayHubApi.Models;

namespace StayHubApi.Services;

/// <summary>
/// Builds the in-memory catalogue. Every listing, host and seeded reservation has a deterministic
/// GUID so screenshots, deep links and the README stay valid across restarts. Dates are relative to
/// <c>DateTime.UtcNow</c> so the demo always has upcoming, current and past content. The stable ids
/// referenced by the README are listed in <c>docs/SEED_IDS.md</c>.
/// </summary>
public static class SeedData
{
    public static readonly Guid Listing1Id = Guid.Parse("e14c1d68-0fa4-44bc-b17b-4b248a31e8fd");
    public static readonly Guid Listing2Id = Guid.Parse("d026d4f6-d073-5c03-b1f9-27d89ea8e094");
    public static readonly Guid Listing3Id = Guid.Parse("9e6a0619-a3d8-536b-a869-cd205a948d7b");
    public static readonly Guid Listing4Id = Guid.Parse("8ca68aa1-f475-5794-bd82-21fac849e4a8");
    public static readonly Guid Listing5Id = Guid.Parse("dcf8b3de-f101-5abd-9077-8f79cd5ce83d");
    public static readonly Guid Listing6Id = Guid.Parse("f395add4-3e2d-5190-a841-eca977f3ffa3");
    public static readonly Guid Listing7Id = Guid.Parse("4ac9e0cf-1aa6-5460-a17d-cf5c96c8723f");
    public static readonly Guid Listing8Id = Guid.Parse("e2ae2bac-d511-52b2-a894-918d9946ad88");
    public static readonly Guid Listing9Id = Guid.Parse("a44f2f51-5a93-51f7-b507-99d6582d45c7");
    public static readonly Guid Listing10Id = Guid.Parse("2dbd5a22-5da4-5d79-8e28-1cc4fbd0c0ea");
    public static readonly Guid Listing11Id = Guid.Parse("3686c1bd-e109-5069-8d01-f74f19fda33e");
    public static readonly Guid Listing12Id = Guid.Parse("fdcc614d-5475-595c-b823-8157f44ee9fc");
    public static readonly Guid Listing13Id = Guid.Parse("d2dd4abb-c3ae-5721-98d3-67faddc8668a");
    public static readonly Guid Listing14Id = Guid.Parse("028f2395-f895-5a6a-9b28-5c9d2ff5d525");
    public static readonly Guid Listing15Id = Guid.Parse("8023abec-14c7-54fd-8dd3-dcf787522e61");
    public static readonly Guid Listing16Id = Guid.Parse("7c88c175-689d-59b3-b3b0-865c771bfe90");
    public static readonly Guid Listing17Id = Guid.Parse("349bde06-a4b0-5def-96be-43125db7a653");
    public static readonly Guid Listing18Id = Guid.Parse("2528d8ee-6af7-5b9c-bd60-d7560a6a7fa9");

    public static readonly Guid Host1Id = Guid.Parse("9a78cd9c-c9c7-43cf-bc82-01967fa7e93b");
    public static readonly Guid Host2Id = Guid.Parse("b2c3d4e5-f6a7-48b9-c0d1-e2f3a4b5c6d7");
    public static readonly Guid Host3Id = Guid.Parse("c3d4e5f6-a7b8-49c0-d1e2-f3a4b5c6d7e8");
    public static readonly Guid Host4Id = Guid.Parse("d4e5f6a7-b8c9-40d1-e2f3-a4b5c6d7e8f9");

    public static readonly Guid Reservation1Id = Guid.Parse("3f7bf08e-1678-43d9-959c-6e6ad9d20c5b");
    public static readonly Guid Reservation2Id = Guid.Parse("cb0fe11b-9030-5818-acd2-d822f61f0424");
    public static readonly Guid Reservation3Id = Guid.Parse("0b06a930-6c59-5c47-95c1-35fb6127b8a5");
    public static readonly Guid Reservation4Id = Guid.Parse("47d225cc-7224-5b11-a775-2aeb0c2ee218");

    public static readonly Guid Guest1Id = Guid.Parse("f4c8ac19-942a-5b70-a90d-b07d174db403");
    public static readonly Guid Guest2Id = Guid.Parse("b61bf6ca-707c-5f62-87b2-9edb3e55f93b");
    public static readonly Guid Guest3Id = Guid.Parse("12ed4aef-aa93-57dc-9274-6ae9e7604ad5");
    public static readonly Guid Guest4Id = Guid.Parse("84f0dff7-2335-5e05-86e8-7cbe165d44a1");

    private static readonly PricingCalculator Calculator = new();

    public sealed record Snapshot(
        List<ListingDetail> Listings,
        List<HostRecord> Hosts,
        List<Reservation> Reservations,
        List<Review> Reviews,
        List<Message> Messages,
        HashSet<Guid> FavoriteIds);

    /// <summary>Builds a fresh catalogue for the supplied UTC timestamp.</summary>
    public static Snapshot Build(DateTime utcNow)
    {
        var today = DateOnly.FromDateTime(utcNow);
        var hosts = BuildHosts();
        var byId = hosts.ToDictionary(h => h.Details.HostId);
        var listings = BuildListings(utcNow, byId);
        var reviews = BuildReviews(utcNow);

        foreach (var listing in listings)
        {
            var listingReviews = reviews.Where(r => r.ListingId == listing.Id).ToList();
            listing.ReviewCount = listingReviews.Count;
            listing.StarRating = listingReviews.Count == 0
                ? 0
                : Math.Round(listingReviews.Average(r => r.Rating), 2, MidpointRounding.AwayFromZero);
        }

        var reservations = BuildReservations(today, utcNow, listings);
        var messages = BuildMessages(utcNow, reservations);
        var favorites = new HashSet<Guid> { Listing3Id, Listing17Id };

        return new Snapshot(listings, hosts, reservations, reviews, messages, favorites);
    }

    private static List<HostRecord> BuildHosts()
    {
        return
        [
            new HostRecord
            {
                Details = new HostDetails(Host1Id, "Elira Krasniqi", string.Empty, 99.5, 15, true, true),
                Bio = "I grew up in Prishtina and rent out the flats my family has kept for three generations. I answer messages between coffee and the school run.",
                JoinedYear = 2016,
                Verification = new HostVerification(true, true, true, true)
            },
            new HostRecord
            {
                Details = new HostDetails(Host2Id, "Arben Gashi", string.Empty, 98, 20, true, true),
                Bio = "A carpenter from Prizren. I restored our stone house myself and will point you to the quietest courtyard in the old town.",
                JoinedYear = 2018,
                Verification = new HostVerification(true, true, true, false)
            },
            new HostRecord
            {
                Details = new HostDetails(Host3Id, "Mira Hoxha", string.Empty, 100, 5, true, true),
                Bio = "I have looked after apartments in Tirana since 2015. I leave a short list of places I actually eat at, not the ones on the posters.",
                JoinedYear = 2015,
                Verification = new HostVerification(true, true, true, true)
            },
            new HostRecord
            {
                Details = new HostDetails(Host4Id, "Dritan Beqiri", string.Empty, 96, 35, false, true),
                Bio = "I sail in the summer and host the rest of the year. The villas are family houses, and the sea is a four minute walk from most of them.",
                JoinedYear = 2020,
                Verification = new HostVerification(true, true, true, false)
            }
        ];
    }

    private static List<ListingDetail> BuildListings(DateTime utcNow, IReadOnlyDictionary<Guid, HostRecord> hosts)
    {
        var created = utcNow.Date;

        return
        [
            new ListingDetail
            {
                Id = Listing1Id,
                Title = "Sunlit loft above Prishtina's old town",
                Description = "A quiet loft on the top floor of a 1930s house, five minutes from the bazaar and the National Library. Morning light comes in from both sides, and the balcony looks over tiled roofs towards the Kosovo plain.",
                ImageUrl = "/images/stays/pristina-loft-1200.webp",
                Category = PropertyCategory.apartment.ToString(),
                Coordinates = new CoordinatePair(42.6642, 21.1668),
                Address = new Address("Rruga Ilir Konushevci 18", "Pristina", "Kosovo", "10000", "XK", "neigh_oldtown"),
                Capacity = new CapacityBreakdown(4, 1, 2, 1.5),
                Amenities = ["wifi", "workspace", "kitchen", "air_conditioning", "self_check_in", "balcony"],
                Host = hosts[Host1Id].Details,
                Pricing = new PricingMatrix("EUR", 95.00m, 30.00m, 14.25m, 4.00m, 100.00m, new DynamicDiscounts(10, 25), 2),
                HouseRules = new HouseRules("22:00", "08:00", false, false, 0),
                InstantBookEnabled = true,
                CreatedAt = created.AddDays(-120)
            },
            new ListingDetail
            {
                Id = Listing2Id,
                Title = "Studio on Mother Teresa Boulevard",
                Description = "A compact studio for two in the middle of the city, with a desk by the window and a bakery downstairs that opens at six. Everything worth seeing in Prishtina is within a twenty minute walk.",
                ImageUrl = "/images/stays/pristina-studio-1200.webp",
                Category = PropertyCategory.apartment.ToString(),
                Coordinates = new CoordinatePair(42.6622, 21.1655),
                Address = new Address("Bulevardi Nënë Tereza 44", "Pristina", "Kosovo", "10000", "XK", "neigh_center"),
                Capacity = new CapacityBreakdown(2, 1, 1, 1.0),
                Amenities = ["wifi", "workspace", "air_conditioning", "self_check_in", "kitchen"],
                Host = hosts[Host1Id].Details,
                Pricing = new PricingMatrix("EUR", 62.00m, 18.00m, 9.00m, 3.00m, 80.00m, new DynamicDiscounts(8, 20), 3),
                HouseRules = new HouseRules("23:00", "08:00", false, false, 0),
                InstantBookEnabled = true,
                CreatedAt = created.AddDays(-98)
            },
            new ListingDetail
            {
                Id = Listing3Id,
                Title = "Stone house below the Prizren fortress",
                Description = "A restored Ottoman house a short walk from Shadërvan square and the Lumbardhi river. Wooden ceilings, a cool courtyard and the fortress lit up above the terrace after dark.",
                ImageUrl = "/images/stays/prizren-stone-house-1200.webp",
                Category = PropertyCategory.entire_home.ToString(),
                Coordinates = new CoordinatePair(42.2106, 20.7412),
                Address = new Address("Rruga e Shadërvanit 7", "Prizren", "Kosovo", "20000", "XK", "neigh_shadervan"),
                Capacity = new CapacityBreakdown(5, 2, 3, 1.5),
                Amenities = ["wifi", "kitchen", "air_conditioning", "self_check_in", "terrace", "fireplace"],
                Host = hosts[Host2Id].Details,
                Pricing = new PricingMatrix("EUR", 78.00m, 25.00m, 11.00m, 4.00m, 100.00m, new DynamicDiscounts(10, 25), 2),
                HouseRules = new HouseRules("22:00", "08:00", false, false, 1),
                InstantBookEnabled = true,
                CreatedAt = created.AddDays(-91)
            },
            new ListingDetail
            {
                Id = Listing4Id,
                Title = "Courtyard room in Prizren's old town",
                Description = "One quiet room off a shared stone courtyard, with breakfast taken under the vine. The bazaar is two streets away and the fortress path starts behind the house.",
                ImageUrl = "/images/stays/prizren-courtyard-room-1200.webp",
                Category = PropertyCategory.private_room.ToString(),
                Coordinates = new CoordinatePair(42.2129, 20.7391),
                Address = new Address("Rruga Kërka 3", "Prizren", "Kosovo", "20000", "XK", "neigh_oldtown"),
                Capacity = new CapacityBreakdown(2, 1, 1, 1.0),
                Amenities = ["wifi", "breakfast", "air_conditioning", "garden"],
                Host = hosts[Host2Id].Details,
                Pricing = new PricingMatrix("EUR", 45.00m, 10.00m, 6.00m, 2.00m, 50.00m, new DynamicDiscounts(5, 15), 2),
                HouseRules = new HouseRules("22:00", "07:00", false, false, 0),
                InstantBookEnabled = true,
                CreatedAt = created.AddDays(-84)
            },
            new ListingDetail
            {
                Id = Listing5Id,
                Title = "Cabin at the mouth of Rugova",
                Description = "A wooden cabin at the edge of the Rugova canyon, close to the hiking trails and the via ferrata. A wood stove, a sauna and a deck facing the peaks, with no neighbours in sight.",
                ImageUrl = "/images/stays/rugova-cabin-1200.webp",
                Category = PropertyCategory.cabin.ToString(),
                Coordinates = new CoordinatePair(42.6950, 20.1900),
                Address = new Address("Rruga e Rugovës km 14", "Peja", "Kosovo", "30000", "XK", "neigh_rugova"),
                Capacity = new CapacityBreakdown(6, 2, 4, 1.0),
                Amenities = ["wifi", "fireplace", "sauna", "pet_friendly", "self_check_in", "parking", "kitchen"],
                Host = hosts[Host1Id].Details,
                Pricing = new PricingMatrix("EUR", 88.00m, 30.00m, 12.00m, 4.00m, 150.00m, new DynamicDiscounts(12, 30), 3),
                HouseRules = new HouseRules("22:00", "08:00", false, false, 2),
                InstantBookEnabled = true,
                CreatedAt = created.AddDays(-77)
            },
            new ListingDetail
            {
                Id = Listing6Id,
                Title = "River house near the Patriarchate",
                Description = "A family house above the Bistrica, ten minutes from the Patriarchate of Peja and the start of the Rugova road. Shade in the garden, a long table and a kitchen built for cooking.",
                ImageUrl = "/images/stays/peja-river-house-1200.webp",
                Category = PropertyCategory.entire_home.ToString(),
                Coordinates = new CoordinatePair(42.6572, 20.2965),
                Address = new Address("Rruga e Patriarkanës 26", "Peja", "Kosovo", "30000", "XK", "neigh_river"),
                Capacity = new CapacityBreakdown(6, 3, 4, 2.0),
                Amenities = ["wifi", "kitchen", "garden", "parking", "washing_machine", "family_friendly"],
                Host = hosts[Host1Id].Details,
                Pricing = new PricingMatrix("EUR", 70.00m, 22.00m, 10.00m, 3.00m, 100.00m, new DynamicDiscounts(8, 20), 2),
                HouseRules = new HouseRules("22:00", "08:00", false, false, 1),
                InstantBookEnabled = true,
                CreatedAt = created.AddDays(-70)
            },
            new ListingDetail
            {
                Id = Listing7Id,
                Title = "House by the Gjakova bazaar",
                Description = "A family home with a walled garden, two streets from the Çarshia e Madhe and the Hadum mosque. Breakfast with local produce can be arranged, and the coffee is always on.",
                ImageUrl = "/images/stays/gjakova-bazaar-house-1200.webp",
                Category = PropertyCategory.entire_home.ToString(),
                Coordinates = new CoordinatePair(42.3798, 20.4312),
                Address = new Address("Rruga Ismail Qemali 12", "Gjakova", "Kosovo", "50000", "XK", "neigh_bazaar"),
                Capacity = new CapacityBreakdown(6, 3, 4, 2.0),
                Amenities = ["wifi", "kitchen", "garden", "air_conditioning", "self_check_in", "family_friendly"],
                Host = hosts[Host2Id].Details,
                Pricing = new PricingMatrix("EUR", 65.00m, 20.00m, 9.00m, 3.00m, 80.00m, new DynamicDiscounts(8, 20), 2),
                HouseRules = new HouseRules("22:00", "08:00", false, false, 1),
                InstantBookEnabled = true,
                CreatedAt = created.AddDays(-63)
            },
            new ListingDetail
            {
                Id = Listing8Id,
                Title = "Guesthouse room on Ismail Qemali",
                Description = "A simple room in a guesthouse by the bazaar, with a shared kitchen and a terrace over the street. The owners keep the place spotless and know every tailor in the market.",
                ImageUrl = "/images/stays/gjakova-guesthouse-room-1200.webp",
                Category = PropertyCategory.private_room.ToString(),
                Coordinates = new CoordinatePair(42.3807, 20.4301),
                Address = new Address("Rruga Ismail Qemali 40", "Gjakova", "Kosovo", "50000", "XK", "neigh_bazaar"),
                Capacity = new CapacityBreakdown(2, 1, 1, 1.0),
                Amenities = ["wifi", "kitchen", "terrace", "heating"],
                Host = hosts[Host2Id].Details,
                Pricing = new PricingMatrix("EUR", 35.00m, 8.00m, 5.00m, 2.00m, 40.00m, new DynamicDiscounts(5, 15), 2),
                HouseRules = new HouseRules("22:00", "07:00", false, false, 0),
                InstantBookEnabled = true,
                CreatedAt = created.AddDays(-56)
            },
            new ListingDetail
            {
                Id = Listing9Id,
                Title = "Ski chalet at the foot of the Sharr",
                Description = "A warm alpine chalet minutes from the Brezovica lifts, with a boot room, a fireplace and a hot tub for the evening. Snow stays on the north side until April.",
                ImageUrl = "/images/stays/brezovica-chalet-1200.webp",
                Category = PropertyCategory.cabin.ToString(),
                Coordinates = new CoordinatePair(42.2042, 21.0098),
                Address = new Address("Rruga e Brezovicës 3", "Brezovica", "Kosovo", "73000", "XK", "neigh_sharr"),
                Capacity = new CapacityBreakdown(8, 3, 5, 2.0),
                Amenities = ["wifi", "fireplace", "hot_tub", "parking", "pet_friendly", "self_check_in", "heating"],
                Host = hosts[Host1Id].Details,
                Pricing = new PricingMatrix("EUR", 120.00m, 35.00m, 16.00m, 5.00m, 200.00m, new DynamicDiscounts(10, 25), 3),
                HouseRules = new HouseRules("23:00", "07:00", false, false, 2),
                InstantBookEnabled = true,
                CreatedAt = created.AddDays(-49)
            },
            new ListingDetail
            {
                Id = Listing10Id,
                Title = "Alpine lodge with a sauna",
                Description = "A larger lodge for groups, with a sauna, a drying room and a long kitchen table. Ten minutes from the slopes, and quiet enough to hear the river at night.",
                ImageUrl = "/images/stays/brezovica-lodge-1200.webp",
                Category = PropertyCategory.cabin.ToString(),
                Coordinates = new CoordinatePair(42.1987, 21.0152),
                Address = new Address("Rruga e Sharrit 9", "Brezovica", "Kosovo", "73000", "XK", "neigh_slopes"),
                Capacity = new CapacityBreakdown(10, 4, 6, 2.5),
                Amenities = ["wifi", "sauna", "fireplace", "parking", "kitchen", "heating", "family_friendly"],
                Host = hosts[Host1Id].Details,
                Pricing = new PricingMatrix("EUR", 140.00m, 45.00m, 18.00m, 5.00m, 250.00m, new DynamicDiscounts(12, 30), 5),
                HouseRules = new HouseRules("23:00", "07:00", false, true, 2),
                InstantBookEnabled = false,
                CreatedAt = created.AddDays(-42)
            },
            new ListingDetail
            {
                Id = Listing11Id,
                Title = "Apartment in Blloku",
                Description = "A renovated apartment in Tirana's Blloku district, surrounded by cafes and a short walk from Skanderbeg Square and the Grand Park lake. Tall windows, high ceilings and a proper coffee machine.",
                ImageUrl = "/images/stays/tirana-blloku-apartment-1200.webp",
                Category = PropertyCategory.apartment.ToString(),
                Coordinates = new CoordinatePair(41.3189, 19.8150),
                Address = new Address("Rruga Pjetër Bogdani 21", "Tirana", "Albania", "1019", "AL", "neigh_blloku"),
                Capacity = new CapacityBreakdown(4, 2, 2, 1.0),
                Amenities = ["wifi", "workspace", "air_conditioning", "kitchen", "washing_machine", "balcony"],
                Host = hosts[Host3Id].Details,
                Pricing = new PricingMatrix("EUR", 68.00m, 20.00m, 10.00m, 3.00m, 100.00m, new DynamicDiscounts(8, 20), 2),
                HouseRules = new HouseRules("23:00", "08:00", false, false, 0),
                InstantBookEnabled = true,
                CreatedAt = created.AddDays(-35)
            },
            new ListingDetail
            {
                Id = Listing12Id,
                Title = "Garden suite in the villa quarter",
                Description = "A suite in a 1930s villa on a quiet street east of the centre, with a private entrance and a garden of fig trees. Fifteen minutes on foot to the Block, five to the lake.",
                ImageUrl = "/images/stays/tirana-garden-suite-1200.webp",
                Category = PropertyCategory.entire_home.ToString(),
                Coordinates = new CoordinatePair(41.3241, 19.8283),
                Address = new Address("Rruga Themistokli Gërmenji 8", "Tirana", "Albania", "1017", "AL", "neigh_villaquarter"),
                Capacity = new CapacityBreakdown(3, 1, 2, 1.0),
                Amenities = ["wifi", "garden", "air_conditioning", "kitchen", "workspace", "self_check_in"],
                Host = hosts[Host3Id].Details,
                Pricing = new PricingMatrix("EUR", 110.00m, 30.00m, 14.00m, 4.00m, 150.00m, new DynamicDiscounts(10, 25), 2),
                HouseRules = new HouseRules("22:00", "08:00", false, false, 0),
                InstantBookEnabled = false,
                CreatedAt = created.AddDays(-28)
            },
            new ListingDetail
            {
                Id = Listing13Id,
                Title = "Room with a castle view in Mangalem",
                Description = "A room in a whitewashed Ottoman house in the city of a thousand windows, with a terrace facing Berat castle and the Osum. Breakfast is included and served on the roof.",
                ImageUrl = "/images/stays/berat-castle-room-1200.webp",
                Category = PropertyCategory.private_room.ToString(),
                Coordinates = new CoordinatePair(40.7058, 19.9522),
                Address = new Address("Lagjja Mangalem 18", "Berat", "Albania", "5001", "AL", "neigh_mangalem"),
                Capacity = new CapacityBreakdown(2, 1, 1, 1.0),
                Amenities = ["wifi", "breakfast", "air_conditioning", "terrace"],
                Host = hosts[Host3Id].Details,
                Pricing = new PricingMatrix("EUR", 42.00m, 10.00m, 6.00m, 2.00m, 50.00m, new DynamicDiscounts(5, 15), 2),
                HouseRules = new HouseRules("22:00", "08:00", false, false, 0),
                InstantBookEnabled = true,
                CreatedAt = created.AddDays(-21)
            },
            new ListingDetail
            {
                Id = Listing14Id,
                Title = "White house on the Osum",
                Description = "A whole house on the quiet side of the river, with a courtyard, a fig tree and room for six. The bridge and the old town are eight minutes on foot.",
                ImageUrl = "/images/stays/berat-osum-house-1200.webp",
                Category = PropertyCategory.entire_home.ToString(),
                Coordinates = new CoordinatePair(40.7029, 19.9488),
                Address = new Address("Rruga Antipatrea 63", "Berat", "Albania", "5001", "AL", "neigh_osum"),
                Capacity = new CapacityBreakdown(6, 3, 4, 2.0),
                Amenities = ["wifi", "kitchen", "garden", "parking", "washing_machine", "family_friendly"],
                Host = hosts[Host3Id].Details,
                Pricing = new PricingMatrix("EUR", 85.00m, 25.00m, 12.00m, 4.00m, 120.00m, new DynamicDiscounts(8, 20), 2),
                HouseRules = new HouseRules("22:00", "08:00", false, false, 1),
                InstantBookEnabled = true,
                CreatedAt = created.AddDays(-14)
            },
            new ListingDetail
            {
                Id = Listing15Id,
                Title = "Villa above Sarandë bay",
                Description = "A hillside villa with a private pool and a terrace facing Corfu. Ten minutes from the Ksamil beaches and the Butrint ruins, and far enough up the hill to be quiet at night.",
                ImageUrl = "/images/stays/saranda-villa-1200.webp",
                Category = PropertyCategory.villa.ToString(),
                Coordinates = new CoordinatePair(39.8756, 20.0053),
                Address = new Address("Rruga Butrinti 22", "Sarandë", "Albania", "9701", "AL", "neigh_bay"),
                Capacity = new CapacityBreakdown(8, 4, 5, 3.0),
                Amenities = ["wifi", "pool", "air_conditioning", "kitchen", "parking", "terrace", "washing_machine"],
                Host = hosts[Host4Id].Details,
                Pricing = new PricingMatrix("EUR", 165.00m, 50.00m, 20.00m, 6.00m, 300.00m, new DynamicDiscounts(10, 25), 3),
                HouseRules = new HouseRules("23:00", "09:00", false, true, 1),
                InstantBookEnabled = true,
                CreatedAt = created.AddDays(-150)
            },
            new ListingDetail
            {
                Id = Listing16Id,
                Title = "Seafront studio near the port",
                Description = "A small studio one street back from the promenade, with a balcony that catches the afternoon sun. Ferries to Corfu leave from the port ten minutes away.",
                ImageUrl = "/images/stays/saranda-studio-1200.webp",
                Category = PropertyCategory.apartment.ToString(),
                Coordinates = new CoordinatePair(39.8741, 20.0102),
                Address = new Address("Rruga Mithat Hoxha 11", "Sarandë", "Albania", "9701", "AL", "neigh_port"),
                Capacity = new CapacityBreakdown(2, 1, 1, 1.0),
                Amenities = ["wifi", "air_conditioning", "kitchen", "balcony", "beach_access"],
                Host = hosts[Host4Id].Details,
                Pricing = new PricingMatrix("EUR", 75.00m, 18.00m, 10.00m, 3.00m, 80.00m, new DynamicDiscounts(7, 18), 2),
                HouseRules = new HouseRules("23:00", "08:00", false, false, 0),
                InstantBookEnabled = true,
                CreatedAt = created.AddDays(-160)
            },
            new ListingDetail
            {
                Id = Listing17Id,
                Title = "Clifftop villa over Dhërmi",
                Description = "A contemporary villa on the Riviera with a pool that hangs over the Ionian, an outdoor kitchen and a path down to the white pebble beach. The road is steep and the view is the point.",
                ImageUrl = "/images/stays/dhermi-cliff-villa-1200.webp",
                Category = PropertyCategory.villa.ToString(),
                Coordinates = new CoordinatePair(40.1531, 19.6386),
                Address = new Address("Rruga e Plazhit 5", "Dhërmi", "Albania", "9404", "AL", "neigh_riviera"),
                Capacity = new CapacityBreakdown(10, 5, 6, 4.0),
                Amenities = ["wifi", "pool", "air_conditioning", "kitchen", "parking", "terrace", "beach_access", "family_friendly"],
                Host = hosts[Host4Id].Details,
                Pricing = new PricingMatrix("EUR", 180.00m, 55.00m, 22.00m, 6.00m, 400.00m, new DynamicDiscounts(12, 30), 3),
                HouseRules = new HouseRules("23:00", "09:00", false, true, 1),
                InstantBookEnabled = true,
                CreatedAt = created.AddDays(-170)
            },
            new ListingDetail
            {
                Id = Listing18Id,
                Title = "Olive house behind the beach",
                Description = "A white house in an olive grove, four minutes from the beach and out of earshot of the bars. A long shaded table outside, and figs in August if the birds leave any.",
                ImageUrl = "/images/stays/dhermi-olive-house-1200.webp",
                Category = PropertyCategory.entire_home.ToString(),
                Coordinates = new CoordinatePair(40.1468, 19.6421),
                Address = new Address("Rruga e Ullishtës 2", "Dhërmi", "Albania", "9404", "AL", "neigh_olivegrove"),
                Capacity = new CapacityBreakdown(6, 3, 4, 2.0),
                Amenities = ["wifi", "kitchen", "garden", "parking", "beach_access", "pet_friendly", "family_friendly"],
                Host = hosts[Host4Id].Details,
                Pricing = new PricingMatrix("EUR", 95.00m, 25.00m, 13.00m, 4.00m, 120.00m, new DynamicDiscounts(10, 25), 2),
                HouseRules = new HouseRules("23:00", "08:00", false, false, 2),
                InstantBookEnabled = true,
                CreatedAt = created.AddDays(-180)
            }
        ];
    }

    private static List<Review> BuildReviews(DateTime utcNow)
    {
        return
        [
            NewReview("29c5221d-2005-54e3-9ba9-e1caa1b5fefd", Listing1Id, "Mira Lleshi", 5,
                "The light in the morning is the whole reason to stay here. Elira left coffee and a map of the bazaar, and the flat was spotless.",
                utcNow.AddDays(-14)),
            NewReview("8c5d24fa-739b-53a1-b0a0-345adc20a59e", Listing1Id, "Tom Whitaker", 5,
                "Quiet at night, five minutes from everything, and the balcony is bigger than the photos suggest. Would book again without hesitating.",
                utcNow.AddDays(-32)),
            NewReview("2b0d5b76-bb5c-5200-a956-1b371a62132a", Listing1Id, "Sara Bekteshi", 4,
                "Lovely loft and a very helpful host. The stairs are steep, which is worth knowing if you arrive with heavy luggage.",
                utcNow.AddDays(-51)),
            NewReview("e6002ffe-44a6-5cdd-b500-1fb597be8adc", Listing3Id, "Jonas Meier", 5,
                "We woke up to the fortress above the roofs. The courtyard stays cool even in August, and the kitchen is properly equipped.",
                utcNow.AddDays(-9)),
            NewReview("4973f76f-026a-5ab7-9f33-aaf0776dea2d", Listing3Id, "Elira Berisha", 5,
                "Stone walls, wooden ceilings, and a host who knows every bakery in town. The terrace at dusk is the best seat in Prizren.",
                utcNow.AddDays(-27)),
            NewReview("42098cfc-eff0-5ce8-b3a7-137dd0694c9c", Listing5Id, "Nora Fischer", 4,
                "The cabin smells of pine and the wood stove heats the whole room. The last kilometre of road is rough, so arrive before dark.",
                utcNow.AddDays(-12)),
            NewReview("a7150501-eabe-5c22-9b29-8820f116d1b4", Listing5Id, "Ben Carter", 5,
                "We hiked to the via ferrata straight from the door. Sauna afterwards, snow outside. Exactly what we came for.",
                utcNow.AddDays(-40)),
            NewReview("c4061804-2461-518d-9d58-5bd1a55b65b6", Listing5Id, "Arta Gashi", 3,
                "Beautiful setting, but the wifi is slow and the kitchen is basic. Come for the mountains rather than for remote work.",
                utcNow.AddDays(-63)),
            NewReview("0e10a9ec-dc45-5faa-a513-a621945feb4c", Listing9Id, "Lukas Brandt", 5,
                "Boot room, hot tub, and the lift five minutes away. We are already planning next winter in the same chalet.",
                utcNow.AddDays(-18)),
            NewReview("4a2ec5f9-c1c9-556f-955e-bc20612cb768", Listing9Id, "Drita Hoxha", 4,
                "Warm and well kept. Bring slippers, the stone floor is cold in January, and the road up needs a careful driver.",
                utcNow.AddDays(-44)),
            NewReview("8851e493-3fc3-597e-80af-c0a5106ddb34", Listing15Id, "Emma Laurent", 5,
                "The pool hangs over the bay and the sunset is the event of the evening. We barely left the terrace for three days.",
                utcNow.AddDays(-6)),
            NewReview("af3d5871-c302-5e55-b41a-44ff7b22b855", Listing15Id, "Marko Petrić", 5,
                "Spotless, calm, and a short drive to Ksamil. Dritan answered every message within minutes, including on Sunday.",
                utcNow.AddDays(-22)),
            NewReview("2ceb2237-89c2-5a50-9944-6415e79c829b", Listing15Id, "Ines Dema", 4,
                "Wonderful house and a generous host. The hill road is steep, so a small car makes the last stretch easier.",
                utcNow.AddDays(-58)),
            NewReview("ded9dc7c-43bc-5c5c-b0b7-60b219588248", Listing17Id, "Chloe Adams", 5,
                "White stone, blue water, and nothing to do but swim. The kitchen is better than most restaurants nearby.",
                utcNow.AddDays(-11)),
            NewReview("9ae3c98e-60d4-5ec2-831f-d8ca328f9224", Listing17Id, "Fatmir Krasniqi", 5,
                "We stayed a week and did not move the car once. The path to the beach takes four minutes and the water is clear.",
                utcNow.AddDays(-35))
        ];
    }

    private static Review NewReview(string id, Guid listingId, string author, int rating, string comment, DateTime createdAt)
        => new(
            Guid.Parse(id),
            listingId,
            AuthorId(author),
            author,
            null,
            rating,
            comment,
            createdAt);

    /// <summary>
    /// Stable author id derived from the display name. <see cref="string.GetHashCode()"/> is
    /// randomised per process, so a fixed FNV-1a hash is used instead.
    /// </summary>
    private static Guid AuthorId(string author)
    {
        const ulong offset = 14695981039346656037;
        const ulong prime = 1099511628211;
        var hash = offset;
        foreach (var c in author)
        {
            hash ^= c;
            hash *= prime;
        }

        var suffix = hash % 1_000_000_000_000UL;
        return Guid.Parse($"a0000000-0000-4000-8000-{suffix:D12}");
    }

    private static List<Reservation> BuildReservations(DateOnly today, DateTime utcNow, List<ListingDetail> listings)
    {
        var byId = listings.ToDictionary(l => l.Id);
        var reservations = new List<Reservation>
        {
            NewReservation(
                Reservation1Id, byId[Listing1Id], Guest1Id,
                primaryGuest: new PrimaryGuest
                {
                    FirstName = "Lena",
                    LastName = "Hoffmann",
                    Email = "lena.hoffmann@example.com",
                    PhoneNumber = "+383 44 123 456"
                },
                status: ReservationRules.Confirmed,
                bookingFlow: "instant_book",
                checkIn: today.AddDays(14),
                checkOut: today.AddDays(19),
                guests: 2,
                createdAt: utcNow.AddDays(-3),
                specialRequests: "We arrive on the evening bus and would like to leave bags early if possible."),
            NewReservation(
                Reservation2Id, byId[Listing12Id], Guest2Id,
                primaryGuest: new PrimaryGuest
                {
                    FirstName = "Marco",
                    LastName = "Rossi",
                    Email = "marco.rossi@example.com",
                    PhoneNumber = "+355 69 204 1188"
                },
                status: ReservationRules.PendingApproval,
                bookingFlow: "request_to_book",
                checkIn: today.AddDays(30),
                checkOut: today.AddDays(33),
                guests: 3,
                createdAt: utcNow.AddDays(-2),
                specialRequests: null),
            NewReservation(
                Reservation3Id, byId[Listing5Id], Guest3Id,
                primaryGuest: new PrimaryGuest
                {
                    FirstName = "Anna",
                    LastName = "Keller",
                    Email = "anna.keller@example.com",
                    PhoneNumber = "+49 151 2233 4455"
                },
                status: ReservationRules.Completed,
                bookingFlow: "instant_book",
                checkIn: today.AddDays(-45),
                checkOut: today.AddDays(-40),
                guests: 2,
                createdAt: utcNow.AddDays(-60),
                specialRequests: null),
            NewReservation(
                Reservation4Id, byId[Listing13Id], Guest4Id,
                primaryGuest: new PrimaryGuest
                {
                    FirstName = "Peter",
                    LastName = "Novak",
                    Email = "peter.novak@example.com",
                    PhoneNumber = "+420 601 332 908"
                },
                status: ReservationRules.Cancelled,
                bookingFlow: "instant_book",
                checkIn: today.AddDays(-20),
                checkOut: today.AddDays(-17),
                guests: 2,
                createdAt: utcNow.AddDays(-35),
                specialRequests: null)
        };

        var cancelled = reservations.Single(r => r.Status == ReservationRules.Cancelled);
        cancelled.CancellationReason = "A family matter at home. The host was kind about it.";
        cancelled.CancelledAt = utcNow.AddDays(-21);

        return reservations;
    }

    private static Reservation NewReservation(
        Guid id,
        ListingDetail listing,
        Guid guestId,
        PrimaryGuest primaryGuest,
        string status,
        string bookingFlow,
        DateOnly checkIn,
        DateOnly checkOut,
        int guests,
        DateTime createdAt,
        string? specialRequests)
    {
        var quote = Calculator.BuildQuote(listing, checkIn, checkOut, isAvailable: true, unavailableReason: null);

        return new Reservation
        {
            Id = id,
            ListingId = listing.Id,
            HostId = listing.Host.HostId,
            GuestId = guestId,
            Status = status,
            BookingFlow = bookingFlow,
            CheckInDate = checkIn,
            CheckOutDate = checkOut,
            GuestsCount = guests,
            PrimaryGuest = primaryGuest,
            PricingSummary = PricingCalculator.ToSummary(quote),
            SpecialRequests = specialRequests,
            CreatedAt = createdAt,
            UpdatedAt = createdAt
        };
    }

    private static List<Message> BuildMessages(DateTime utcNow, List<Reservation> reservations)
    {
        var reservation = reservations.Single(r => r.Id == Reservation1Id);
        var hostId = reservation.HostId;
        var guestId = reservation.GuestId;

        return
        [
            new Message(
                Guid.Parse("59284474-a77c-59fa-85f1-1a50372bd32d"),
                reservation.Id, guestId, "guest",
                "Hello Elira, we arrive on the 14:30 bus from Skopje. Is it possible to leave our bags before check-in?",
                utcNow.AddDays(-2).AddHours(-3), true),
            new Message(
                Guid.Parse("dfad8e28-ed59-5578-8726-2c31cbe288e2"),
                reservation.Id, hostId, "host",
                "Of course. The door code works from 13:00, and you can leave the bags in the hallway if the cleaner is still there.",
                utcNow.AddDays(-2).AddHours(-2), true),
            new Message(
                Guid.Parse("a277b58d-6dd9-5a5e-a24d-6fc25776c807"),
                reservation.Id, guestId, "guest",
                "Perfect, thank you. One more thing: is there a parking space nearby?",
                utcNow.AddDays(-1).AddHours(-5), true),
            new Message(
                Guid.Parse("6fe96448-b77c-55d2-a454-7da236a3bb23"),
                reservation.Id, hostId, "host",
                "There is a public garage on UÇK Street, about six minutes on foot. I can send the pin.",
                utcNow.AddDays(-1).AddHours(-4), true),
            new Message(
                Guid.Parse("9fcc7d14-6ff7-50bd-a479-89af12ace4a6"),
                reservation.Id, guestId, "guest",
                "That would help. See you on Friday.",
                utcNow.AddDays(-1).AddHours(-3), false)
        ];
    }
}
