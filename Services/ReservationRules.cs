using StayHubApi.Models;

namespace StayHubApi.Services;

/// <summary>
/// Reservation overlap, minimum stay and status transition rules. Pure functions so the
/// controllers, the services and the tests all share one definition of the state machine.
/// </summary>
public static class ReservationRules
{
    public const string PendingApproval = "pending_approval";
    public const string Confirmed = "confirmed";
    public const string CheckedIn = "checked_in";
    public const string Completed = "completed";
    public const string Cancelled = "cancelled";

    public static readonly IReadOnlyList<string> Statuses =
        [PendingApproval, Confirmed, CheckedIn, Completed, Cancelled];

    private static readonly IReadOnlyDictionary<string, string[]> Transitions =
        new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
        {
            [PendingApproval] = [Confirmed, Cancelled],
            [Confirmed] = [CheckedIn, Cancelled],
            [CheckedIn] = [Completed],
            [Completed] = [],
            [Cancelled] = []
        };

    public static bool IsValidStatus(string? status)
        => !string.IsNullOrWhiteSpace(status) && Statuses.Contains(status.Trim().ToLowerInvariant());

    public static string Normalise(string? status)
        => (status ?? string.Empty).Trim().ToLowerInvariant();

    /// <summary>A booking still holds the calendar when it is pending, confirmed or checked in.</summary>
    public static bool IsActive(string status)
        => Normalise(status) is PendingApproval or Confirmed or CheckedIn;

    /// <summary>Completed and cancelled bookings do not block new dates.</summary>
    public static bool BlocksAvailability(string status)
        => Normalise(status) is PendingApproval or Confirmed or CheckedIn;

    /// <summary>Half-open interval overlap: a check-out day is free for a new check-in.</summary>
    public static bool Overlaps(DateOnly startA, DateOnly endA, DateOnly startB, DateOnly endB)
        => startA < endB && endA > startB;

    public static Reservation? FindConflict(
        IEnumerable<Reservation> reservations,
        Guid listingId,
        DateOnly checkIn,
        DateOnly checkOut)
        => reservations
            .Where(r => r.ListingId == listingId
                        && BlocksAvailability(r.Status)
                        && Overlaps(checkIn, checkOut, r.CheckInDate, r.CheckOutDate))
            .OrderBy(r => r.CheckInDate)
            .FirstOrDefault();

    public static IReadOnlyList<string> AllowedNext(string status)
        => Transitions.TryGetValue(Normalise(status), out var allowed) ? allowed : [];

    /// <summary>
    /// Returns null when the transition is legal, otherwise a short reason. Date-sensitive
    /// transitions are checked here: check-in only on or after the arrival date, completion only
    /// after the departure date, cancellation only before arrival.
    /// </summary>
    public static string? ValidateTransition(Reservation reservation, string target, DateOnly today)
    {
        var from = Normalise(reservation.Status);
        var to = Normalise(target);

        if (!Transitions.TryGetValue(from, out var allowed) || !allowed.Contains(to))
        {
            return $"A {from} booking cannot move to {to}.";
        }

        if (to == CheckedIn && today < reservation.CheckInDate)
        {
            return "A booking can only be checked in on or after its arrival date.";
        }

        if (to == Completed && today < reservation.CheckOutDate)
        {
            return "A booking can only be completed on or after its departure date.";
        }

        if (to == Cancelled && !CanCancel(reservation, today))
        {
            return "This booking can no longer be cancelled.";
        }

        return null;
    }

    /// <summary>Cancellation is allowed from pending or confirmed, and only before the arrival date.</summary>
    public static bool CanCancel(Reservation reservation, DateOnly today)
    {
        var status = Normalise(reservation.Status);
        var cancellable = status is PendingApproval or Confirmed;
        return cancellable && today < reservation.CheckInDate;
    }
}
