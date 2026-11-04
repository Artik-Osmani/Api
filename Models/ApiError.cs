namespace StayHubApi.Models;

/// <summary>
/// The single error envelope returned by every 4xx and 5xx response.
/// </summary>
/// <param name="Code">Stable machine-readable error code, for example <c>VALIDATION_FAILED</c>.</param>
/// <param name="Message">Short sentence that is safe to show to a user.</param>
/// <param name="TraceId">Correlation id taken from <c>HttpContext.TraceIdentifier</c>.</param>
/// <param name="FieldErrors">Field level errors keyed by the camelCase JSON field name.</param>
/// <param name="Details">Optional structured context, for example the conflicting dates.</param>
public sealed record ApiError(
    string Code,
    string Message,
    string TraceId,
    IReadOnlyDictionary<string, string[]>? FieldErrors = null,
    object? Details = null);

/// <summary>
/// Stable error codes shared by controllers, middleware and the web client.
/// </summary>
public static class ErrorCodes
{
    public const string ValidationFailed = "VALIDATION_FAILED";
    public const string ResourceNotFound = "RESOURCE_NOT_FOUND";
    public const string BookingConflict = "BOOKING_CONFLICT";
    public const string InvalidStatusTransition = "INVALID_STATUS_TRANSITION";
    public const string MinStayNotMet = "MIN_STAY_NOT_MET";
    public const string DateOrder = "DATE_ORDER";
    public const string DateInPast = "DATE_IN_PAST";
    public const string StayTooLong = "STAY_TOO_LONG";
    public const string CapacityExceeded = "CAPACITY_EXCEEDED";
    public const string CancellationNotAllowed = "CANCELLATION_NOT_ALLOWED";
    public const string ListingHasActiveReservations = "LISTING_HAS_ACTIVE_RESERVATIONS";
    public const string RateLimitExceeded = "RATE_LIMIT_EXCEEDED";
    public const string InvalidSort = "INVALID_SORT";
    public const string InternalServerError = "INTERNAL_SERVER_ERROR";
    public const string UnsupportedMediaType = "UNSUPPORTED_MEDIA_TYPE";
}
