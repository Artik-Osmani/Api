namespace StayHubApi.Models;

public record CoordinatePair(double Latitude, double Longitude);

public record Address(
    string Street,
    string City,
    string State,
    string PostalCode,
    string CountryCode,
    string NeighborhoodId
);

public enum PropertyCategory
{
    entire_home,
    private_room,
    shared_room,
    villa,
    apartment,
    cabin
}

public record CapacityBreakdown(
    int MaxGuests,
    int Bedrooms,
    int Beds,
    double Bathrooms
);

public record HostDetails(
    Guid HostId,
    string Name,
    string ProfilePhotoUrl,
    double ResponseRate,
    int ResponseTimeMinutes,
    bool SuperhostStatus,
    bool VerifiedIdentity
);

public record DynamicDiscounts(
    double WeeklyDiscountPercent,
    double MonthlyDiscountPercent,
    double EarlyBirdDiscountPercent
);

public record PricingMatrix(
    string Currency,
    decimal BaseNightlyRate,
    decimal CleaningFee,
    decimal ServiceFee,
    decimal LocalOccupancyTax,
    decimal SecurityDeposit,
    DynamicDiscounts Discounts
);

public record HouseRules(
    string QuietHoursStart,
    string QuietHoursEnd,
    bool SmokingAllowed,
    bool PartiesAllowed,
    int MaxPets
);

public class ListingDetail
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string Category { get; set; } = "entire_home";
    public CoordinatePair Coordinates { get; set; } = default!;
    public Address Address { get; set; } = default!;
    public CapacityBreakdown Capacity { get; set; } = default!;
    public List<string> Amenities { get; set; } = [];
    public HostDetails Host { get; set; } = default!;
    public PricingMatrix Pricing { get; set; } = default!;
    public HouseRules HouseRules { get; set; } = default!;
    public bool InstantBookEnabled { get; set; }
    public double StarRating { get; set; }
    public int ReviewCount { get; set; }
}

public record GeoCircleSearch(CoordinatePair Center, int RadiusMeters);
public record GeoPolygonSearch(List<CoordinatePair> BoundaryPoints);

public class ListingSearchRequest
{
    public DateOnly CheckInDate { get; set; }
    public DateOnly CheckOutDate { get; set; }
    public int GuestsCount { get; set; } = 1;
    public int AdultsCount { get; set; } = 1;
    public int ChildrenCount { get; set; } = 0;
    public int InfantsCount { get; set; } = 0;
    public int PetsCount { get; set; } = 0;
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public string Currency { get; set; } = "USD";
    public List<string>? Categories { get; set; }
    public List<string>? RequiredAmenities { get; set; }
    public GeoCircleSearch? CircleSearch { get; set; }
    public GeoPolygonSearch? PolygonSearch { get; set; }
    public int? MinBedrooms { get; set; }
    public int? MinBeds { get; set; }
    public double? MinBathrooms { get; set; }
    public bool SuperhostOnly { get; set; } = false;
    public bool InstantBookOnly { get; set; } = false;
    public double? MinRating { get; set; }
    public string? NeighborhoodId { get; set; }
    public string SortBy { get; set; } = "popularity_desc";
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class ListingSearchResponse
{
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalRecords { get; set; }
    public int TotalPages { get; set; }
    public List<ListingDetail> Results { get; set; } = [];
}

public record DailyAvailability(
    DateOnly Date,
    bool IsAvailable,
    decimal NightlyPrice,
    int MinimumStayNights,
    string BlockReason = "not_blocked"
);

public record ListingAvailabilityResponse(
    Guid ListingId,
    DateOnly StartDate,
    DateOnly EndDate,
    List<DailyAvailability> Days
);

public record HostVerificationDetail(
    Guid HostId,
    string IdentityStatus,
    bool PhoneVerified,
    bool EmailVerified,
    bool GovernmentIdVerified,
    bool BackgroundCheckCleared,
    int ReviewCount,
    double AggregateRating
);

public record PrimaryGuest(
    string FirstName,
    string LastName,
    string Email,
    string PhoneNumber
);

public record PriceBreakdownItem(string Description, decimal Amount);

public record ReservationPricingSummary(
    string Currency,
    decimal BasePrice,
    decimal CleaningFee,
    decimal ServiceFee,
    decimal LocalOccupancyTax,
    decimal SecurityDeposit,
    decimal DiscountAmount,
    decimal TotalAmount,
    List<PriceBreakdownItem> Items
);

public class CreateReservationRequest
{
    public Guid ListingId { get; set; }
    public DateOnly CheckInDate { get; set; }
    public DateOnly CheckOutDate { get; set; }
    public int GuestsCount { get; set; } = 1;
    public PrimaryGuest PrimaryGuest { get; set; } = default!;
    public string PaymentAuthorizationToken { get; set; } = string.Empty;
    public string BookingFlow { get; set; } = "instant_book"; // instant_book or request_to_book
    public string? SpecialRequests { get; set; }
}

public class Reservation
{
    public Guid Id { get; set; }
    public Guid ListingId { get; set; }
    public Guid HostId { get; set; }
    public string Status { get; set; } = "pending_approval"; // pending_approval, confirmed, checked_in, cancelled, completed
    public string BookingFlow { get; set; } = "instant_book";
    public DateOnly CheckInDate { get; set; }
    public DateOnly CheckOutDate { get; set; }
    public int GuestsCount { get; set; }
    public PrimaryGuest PrimaryGuest { get; set; } = default!;
    public ReservationPricingSummary PricingSummary { get; set; } = default!;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public record CreateMessageRequest(
    Guid SenderId,
    string SenderRole, // guest or host
    string MessageBody
);

public record Message(
    Guid Id,
    Guid ReservationId,
    Guid SenderId,
    string SenderRole,
    string MessageBody,
    DateTime SentAt,
    bool Read
);
