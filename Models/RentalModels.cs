using System.ComponentModel.DataAnnotations;

namespace StayHubApi.Models;

/// <summary>
/// A WGS84 coordinate pair used for the map-oriented search filters.
/// </summary>
public record CoordinatePair(double Latitude, double Longitude);

/// <summary>
/// A postal address plus the neighbourhood identifier used by search.
/// </summary>
public record Address(
    [StringLength(160)] string Street,
    [StringLength(80, MinimumLength = 2)] string City,
    [StringLength(80)] string State,
    [StringLength(20)] string PostalCode,
    [StringLength(2, MinimumLength = 2)] string CountryCode,
    [StringLength(60)] string NeighborhoodId);

/// <summary>
/// The six categories a stay can belong to. The JSON value is the snake_case name.
/// </summary>
public enum PropertyCategory
{
    entire_home,
    private_room,
    shared_room,
    villa,
    apartment,
    cabin
}

/// <summary>
/// How many people a stay sleeps and how many rooms it has.
/// </summary>
public record CapacityBreakdown(
    int MaxGuests,
    int Bedrooms,
    int Beds,
    double Bathrooms);

/// <summary>
/// The host data embedded in every listing. The extended host record lives in the host directory.
/// </summary>
public record HostDetails(
    Guid HostId,
    string Name,
    string ProfilePhotoUrl,
    double ResponseRate,
    int ResponseTimeMinutes,
    bool SuperhostStatus,
    bool VerifiedIdentity);

/// <summary>
/// Length-of-stay discounts. Percentages are 0 to 100.
/// </summary>
public record DynamicDiscounts(
    double WeeklyDiscountPercent,
    double MonthlyDiscountPercent);

/// <summary>
/// The pricing matrix for a stay. All money is EUR and rounded to two decimals.
/// Cleaning and service fees are flat per booking, occupancy tax is flat per stay and
/// the security deposit is refundable, so it is never part of the total.
/// </summary>
public record PricingMatrix(
    string Currency,
    decimal BaseNightlyRate,
    decimal CleaningFee,
    decimal ServiceFee,
    decimal LocalOccupancyTax,
    decimal SecurityDeposit,
    DynamicDiscounts Discounts,
    int MinNights = 2);

/// <summary>
/// House rules shown on the stay detail page and used by the pets filter.
/// </summary>
public record HouseRules(
    [StringLength(5)] string QuietHoursStart,
    [StringLength(5)] string QuietHoursEnd,
    bool SmokingAllowed,
    bool PartiesAllowed,
    int MaxPets);

/// <summary>
/// A stay in the catalogue.
/// </summary>
public class ListingDetail
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string Category { get; set; } = "entire_home";
    public CoordinatePair Coordinates { get; set; } = new(0, 0);
    public Address Address { get; set; } = new(string.Empty, string.Empty, string.Empty, string.Empty, string.Empty, string.Empty);
    public CapacityBreakdown Capacity { get; set; } = new(1, 0, 1, 1);
    public List<string> Amenities { get; set; } = [];
    public HostDetails Host { get; set; } = new(Guid.Empty, string.Empty, string.Empty, 100, 30, false, false);
    public PricingMatrix Pricing { get; set; } = new("EUR", 0, 0, 0, 0, 0, new DynamicDiscounts(0, 0), 2);
    public HouseRules HouseRules { get; set; } = new("22:00", "08:00", false, false, 0);
    public bool InstantBookEnabled { get; set; }
    public double StarRating { get; set; }
    public int ReviewCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Circular geographic filter. Radius is validated between 100 and 100000 metres.
/// </summary>
public record GeoCircleSearch(CoordinatePair Center, int RadiusMeters);

/// <summary>
/// Polygon geographic filter. At least three boundary points are required.
/// </summary>
public record GeoPolygonSearch(List<CoordinatePair> BoundaryPoints);

/// <summary>
/// Search request. One <c>guestsCount</c> replaces the old adults, children and infants fields.
/// The catalogue is EUR-only, so the old <c>currency</c> field is gone.
/// </summary>
public class ListingSearchRequest
{
    /// <summary>Free text matched against title, description, city, state and category.</summary>
    public string? Query { get; set; }

    public DateOnly? CheckInDate { get; set; }
    public DateOnly? CheckOutDate { get; set; }

    /// <summary>Number of guests, 1 to 20.</summary>
    public int GuestsCount { get; set; } = 1;

    /// <summary>Pets travelling with the guest. Listings with fewer allowed pets are excluded.</summary>
    public int PetsCount { get; set; }

    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public List<string>? Categories { get; set; }
    public List<string>? RequiredAmenities { get; set; }
    public GeoCircleSearch? CircleSearch { get; set; }
    public GeoPolygonSearch? PolygonSearch { get; set; }
    public int? MinBedrooms { get; set; }
    public int? MinBeds { get; set; }
    public double? MinBathrooms { get; set; }
    public bool SuperhostOnly { get; set; }
    public bool InstantBookOnly { get; set; }
    public double? MinRating { get; set; }

    /// <summary>Case-insensitive neighbourhood identifier, for example <c>neigh_oldtown</c>.</summary>
    public string? NeighborhoodId { get; set; }

    /// <summary>Exact host match, used by the host detail page.</summary>
    public Guid? HostId { get; set; }

    /// <summary>
    /// One of <c>recommended</c>, <c>price_asc</c>, <c>price_desc</c>, <c>rating_desc</c>,
    /// <c>reviews_desc</c> or <c>distance_asc</c>. <c>distance_asc</c> requires a circle.
    /// </summary>
    public string SortBy { get; set; } = "recommended";

    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 24;
}

/// <summary>
/// The normalised filters the server actually applied. The web client renders chips from this
/// instead of guessing which fields were used.
/// </summary>
public record AppliedFilters(
    string? Query,
    DateOnly? CheckInDate,
    DateOnly? CheckOutDate,
    int GuestsCount,
    int PetsCount,
    decimal? MinPrice,
    decimal? MaxPrice,
    double? MinRating,
    int? MinBedrooms,
    int? MinBeds,
    double? MinBathrooms,
    bool SuperhostOnly,
    bool InstantBookOnly,
    string? NeighborhoodId,
    Guid? HostId,
    IReadOnlyList<string> Categories,
    IReadOnlyList<string> RequiredAmenities,
    bool HasCircle,
    bool HasPolygon,
    string SortBy);

public class ListingSearchResponse
{
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalRecords { get; set; }
    public int TotalPages { get; set; }
    public AppliedFilters AppliedFilters { get; set; } = default!;
    public List<ListingDetail> Results { get; set; } = [];
}

/// <summary>
/// Create request. The host is referenced by id, never supplied as a nested object, so a caller
/// cannot impersonate a host.
/// </summary>
public class CreateListingRequest
{
    [Required]
    [StringLength(120, MinimumLength = 5)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(2000, MinimumLength = 20)]
    public string Description { get; set; } = string.Empty;

    /// <summary>Optional same-origin image path, for example <c>/images/stays/pristina-loft-1200.webp</c>.</summary>
    [MaxLength(300)]
    public string? ImageUrl { get; set; }

    [Required]
    public string Category { get; set; } = "entire_home";

    [Required]
    public CoordinatePair? Coordinates { get; set; }

    [Required]
    public Address? Address { get; set; }

    [Required]
    public CapacityBreakdown? Capacity { get; set; }

    public List<string> Amenities { get; set; } = [];

    [Required]
    public Guid HostId { get; set; }

    [Required]
    public PricingMatrix? Pricing { get; set; }

    [Required]
    public HouseRules? HouseRules { get; set; }

    public bool InstantBookEnabled { get; set; } = true;
}

/// <summary>
/// Partial update. Any property left null keeps its stored value.
/// </summary>
public class UpdateListingRequest
{
    [StringLength(120, MinimumLength = 5)]
    public string? Title { get; set; }

    [StringLength(2000, MinimumLength = 20)]
    public string? Description { get; set; }

    [MaxLength(300)]
    public string? ImageUrl { get; set; }

    public string? Category { get; set; }
    public CoordinatePair? Coordinates { get; set; }
    public Address? Address { get; set; }
    public CapacityBreakdown? Capacity { get; set; }
    public List<string>? Amenities { get; set; }
    public Guid? HostId { get; set; }
    public PricingMatrix? Pricing { get; set; }
    public HouseRules? HouseRules { get; set; }
    public bool? InstantBookEnabled { get; set; }
}

/// <summary>
/// A guest review. <c>authorAvatarUrl</c> is kept for compatibility but the web client ignores it
/// and renders initials instead, so an untrusted URL can never become an image request.
/// </summary>
public record Review(
    Guid Id,
    Guid ListingId,
    Guid AuthorId,
    string AuthorName,
    string? AuthorAvatarUrl,
    int Rating,
    string Comment,
    DateTime CreatedAt);

public class CreateReviewRequest
{
    [Required]
    [StringLength(80, MinimumLength = 2)]
    public string AuthorName { get; set; } = string.Empty;

    [MaxLength(300)]
    public string? AuthorAvatarUrl { get; set; }

    [Range(1, 5)]
    public int Rating { get; set; }

    [Required]
    [StringLength(1200, MinimumLength = 20)]
    public string Comment { get; set; } = string.Empty;
}

public record ReviewsResponse(
    Guid ListingId,
    double AverageRating,
    int TotalReviews,
    int Page,
    int PageSize,
    List<Review> Reviews);

/// <summary>
/// One day in the availability calendar. <c>BlockReason</c> is one of <c>available</c>, <c>booked</c>
/// or <c>past</c>.
/// </summary>
public record DailyAvailability(
    DateOnly Date,
    bool IsAvailable,
    decimal NightlyPrice,
    int MinimumStayNights,
    string BlockReason);

public record ListingAvailabilityResponse(
    Guid ListingId,
    DateOnly StartDate,
    DateOnly EndDate,
    List<DailyAvailability> Days);

/// <summary>
/// Extended host record stored in the host directory. A host can exist with zero listings.
/// </summary>
public sealed record HostVerification(
    bool PhoneVerified,
    bool EmailVerified,
    bool GovernmentIdVerified,
    bool BackgroundCheckCleared);

/// <summary>
/// The directory entry for a host, including the bio and verification flags.
/// </summary>
public sealed class HostRecord
{
    public HostDetails Details { get; init; } = new(Guid.Empty, string.Empty, string.Empty, 100, 30, false, false);
    public string Bio { get; init; } = string.Empty;
    public int JoinedYear { get; init; }
    public HostVerification Verification { get; init; } = new(false, false, false, false);
}

public record HostVerificationDetail(
    Guid HostId,
    string IdentityStatus,
    bool PhoneVerified,
    bool EmailVerified,
    bool GovernmentIdVerified,
    bool BackgroundCheckCleared,
    int ReviewCount,
    double AggregateRating);

public record HostProfileResponse(
    Guid HostId,
    string Name,
    string ProfilePhotoUrl,
    double ResponseRate,
    int ResponseTimeMinutes,
    bool SuperhostStatus,
    bool VerifiedIdentity,
    int TotalProperties,
    double AggregateRating,
    int TotalReviewsReceived,
    string Bio,
    int JoinedYear);

/// <summary>
/// The guest who made the booking. Validated with DataAnnotations, so missing or malformed values
/// produce the unified <c>VALIDATION_FAILED</c> envelope.
/// </summary>
public class PrimaryGuest
{
    [Required]
    [StringLength(80, MinimumLength = 2)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [StringLength(80, MinimumLength = 2)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(254)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(20, MinimumLength = 7)]
    public string PhoneNumber { get; set; } = string.Empty;
}

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
    List<PriceBreakdownItem> Items);

/// <summary>
/// Quote request. Dates are nullable so a missing date returns a field error instead of 0001-01-01.
/// </summary>
public class QuoteRequest
{
    public Guid ListingId { get; set; }
    public DateOnly? CheckInDate { get; set; }
    public DateOnly? CheckOutDate { get; set; }

    [Range(1, 20)]
    public int GuestsCount { get; set; } = 1;
}

/// <summary>
/// The authoritative price for a stay. Both the quote endpoint and the create endpoint return
/// numbers produced by this record, so the receipt and the stored reservation always agree.
/// </summary>
public sealed record ReservationQuote(
    Guid ListingId,
    string Currency,
    int Nights,
    decimal NightlyRate,
    decimal BasePrice,
    decimal DiscountPercent,
    decimal DiscountAmount,
    decimal CleaningFee,
    decimal ServiceFee,
    decimal OccupancyTax,
    decimal SecurityDeposit,
    decimal TotalAmount,
    int MinimumStayNights,
    bool IsAvailable,
    string? UnavailableReason,
    IReadOnlyList<PriceBreakdownItem> Items);

public class CreateReservationRequest
{
    public Guid ListingId { get; set; }
    public DateOnly? CheckInDate { get; set; }
    public DateOnly? CheckOutDate { get; set; }

    [Range(1, 20)]
    public int GuestsCount { get; set; } = 1;

    [Required]
    public PrimaryGuest? PrimaryGuest { get; set; }

    /// <summary>Simulated payment token. It is checked for length, then discarded and never logged.</summary>
    [StringLength(128)]
    public string? PaymentAuthorizationToken { get; set; }

    /// <summary>Either <c>instant_book</c> or <c>request_to_book</c>.</summary>
    [StringLength(30)]
    public string BookingFlow { get; set; } = "instant_book";

    [StringLength(500)]
    public string? SpecialRequests { get; set; }
}

public class UpdateReservationStatusRequest
{
    [Required]
    [StringLength(30)]
    public string Status { get; set; } = string.Empty;

    [StringLength(240)]
    public string? Reason { get; set; }
}

/// <summary>
/// A booking. <c>paymentAuthorizationToken</c> is never stored or returned.
/// </summary>
public class Reservation
{
    public Guid Id { get; set; }
    public Guid ListingId { get; set; }
    public Guid HostId { get; set; }
    public Guid GuestId { get; set; }
    public string Status { get; set; } = "pending_approval";
    public string BookingFlow { get; set; } = "instant_book";
    public DateOnly CheckInDate { get; set; }
    public DateOnly CheckOutDate { get; set; }
    public int GuestsCount { get; set; }
    public PrimaryGuest PrimaryGuest { get; set; } = new();
    public ReservationPricingSummary PricingSummary { get; set; } = null!;
    public string? SpecialRequests { get; set; }
    public string? CancellationReason { get; set; }
    public DateTime? CancelledAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateMessageRequest
{
    /// <summary>Optional. When omitted the server derives the sender from the role and the reservation.</summary>
    public Guid? SenderId { get; set; }

    [Required]
    [StringLength(20)]
    public string SenderRole { get; set; } = "guest";

    [Required]
    [StringLength(2000, MinimumLength = 1)]
    public string MessageBody { get; set; } = string.Empty;
}

public record Message(
    Guid Id,
    Guid ReservationId,
    Guid SenderId,
    string SenderRole,
    string MessageBody,
    DateTime SentAt,
    bool Read);

public record FavoriteToggleResponse(Guid ListingId, bool Favorited);

public record SystemStatsResponse(
    int TotalListings,
    int TotalReservations,
    int TotalReviews,
    int TotalFavorites,
    string SystemVersion,
    DateTime ServerTimeUtc,
    int UptimeSeconds,
    IReadOnlyDictionary<string, decimal> TotalPaidByCurrency,
    int UpcomingReservations,
    decimal AverageNightlyRate);

public record HealthResponse(
    string Status,
    IReadOnlyDictionary<string, string> Checks,
    string Version,
    int UptimeSeconds,
    string Environment);

public record StageResponse(
    string Stage,
    string Environment,
    bool IsDevelopment,
    bool IsProduction,
    string Version,
    DateTime Timestamp);

public record ResetResponse(
    bool Reset,
    int Listings,
    int Reservations,
    int Reviews,
    int Favorites,
    DateTime Timestamp);
