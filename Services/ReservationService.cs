using StayHubApi.Models;

namespace StayHubApi.Services;

/// <summary>
/// Quotes, creates and moves reservations. Validation runs in the order required by the brief, the
/// overlap check and the insert happen inside one store lock so two requests cannot double-book the
/// same dates, and every price comes from <see cref="PricingCalculator"/>.
/// </summary>
public sealed class ReservationService
{
    private readonly MockDataStore _store;
    private readonly PricingCalculator _pricing;

    public ReservationService(MockDataStore store, PricingCalculator pricing)
    {
        _store = store;
        _pricing = pricing;
    }

    public List<Reservation> GetAll(string? status)
    {
        if (!string.IsNullOrWhiteSpace(status) && !ReservationRules.IsValidStatus(status))
        {
            throw ApiException.Validation(
                "status",
                $"status must be one of: {string.Join(", ", ReservationRules.Statuses)}.");
        }

        var wanted = ReservationRules.Normalise(status);

        return _store.Read(db => db.Reservations
            .Where(r => wanted.Length == 0 || r.Status == wanted)
            .OrderByDescending(r => r.CreatedAt)
            .ToList());
    }

    public Reservation GetById(Guid id)
        => _store.Read(db => db.Reservations.FirstOrDefault(r => r.Id == id))
           ?? throw ApiException.NotFound($"Reservation {id} was not found.");

    /// <summary>
    /// Prices a stay without creating it. Invalid dates, guests or minimum stay return 422.
    /// Unavailable dates return 200 with <c>isAvailable: false</c> and a reason, so the client can
    /// explain the conflict instead of failing.
    /// </summary>
    public ReservationQuote Quote(QuoteRequest request)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        return _store.Read(db =>
        {
            var listing = db.Listings.FirstOrDefault(l => l.Id == request.ListingId)
                          ?? throw ApiException.NotFound($"Stay {request.ListingId} was not found.");

            var (checkIn, checkOut) = RequireDates(request.CheckInDate, request.CheckOutDate);
            ValidateStay(listing, checkIn, checkOut, request.GuestsCount, today);

            var conflict = ReservationRules.FindConflict(db.Reservations, listing.Id, checkIn, checkOut);

            return _pricing.BuildQuote(
                listing,
                checkIn,
                checkOut,
                isAvailable: conflict is null,
                unavailableReason: conflict is null ? null : "Those dates are no longer available.");
        });
    }

    public Reservation Create(CreateReservationRequest request)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        return _store.Modify(db =>
        {
            var listing = db.Listings.FirstOrDefault(l => l.Id == request.ListingId)
                          ?? throw ApiException.NotFound($"Stay {request.ListingId} was not found.");

            var (checkIn, checkOut) = RequireDates(request.CheckInDate, request.CheckOutDate);
            ValidateStay(listing, checkIn, checkOut, request.GuestsCount, today);

            var flow = NormaliseBookingFlow(request.BookingFlow, listing);
            var conflict = ReservationRules.FindConflict(db.Reservations, listing.Id, checkIn, checkOut);

            if (conflict is not null)
            {
                throw ApiException.Conflict(
                    ErrorCodes.BookingConflict,
                    "Those dates are no longer available. Choose another range.",
                    new
                    {
                        checkInDate = conflict.CheckInDate,
                        checkOutDate = conflict.CheckOutDate
                    });
            }

            var quote = _pricing.BuildQuote(listing, checkIn, checkOut, isAvailable: true, unavailableReason: null);
            var now = DateTime.UtcNow;

            var reservation = new Reservation
            {
                Id = Guid.NewGuid(),
                ListingId = listing.Id,
                HostId = listing.Host.HostId,
                GuestId = Guid.NewGuid(),
                Status = flow == "instant_book" ? ReservationRules.Confirmed : ReservationRules.PendingApproval,
                BookingFlow = flow,
                CheckInDate = checkIn,
                CheckOutDate = checkOut,
                GuestsCount = request.GuestsCount,
                PrimaryGuest = new PrimaryGuest
                {
                    FirstName = request.PrimaryGuest!.FirstName.Trim(),
                    LastName = request.PrimaryGuest.LastName.Trim(),
                    Email = request.PrimaryGuest.Email.Trim(),
                    PhoneNumber = request.PrimaryGuest.PhoneNumber.Trim()
                },
                PricingSummary = PricingCalculator.ToSummary(quote),
                SpecialRequests = string.IsNullOrWhiteSpace(request.SpecialRequests)
                    ? null
                    : request.SpecialRequests.Trim(),
                CreatedAt = now,
                UpdatedAt = now
            };

            db.Reservations.Add(reservation);
            return reservation;
        });
    }

    public Reservation UpdateStatus(Guid id, UpdateReservationStatusRequest request)
    {
        if (!ReservationRules.IsValidStatus(request.Status))
        {
            throw ApiException.Validation(
                "status",
                $"status must be one of: {string.Join(", ", ReservationRules.Statuses)}.");
        }

        if (request.Reason is { Length: > 240 })
        {
            throw ApiException.Validation("reason", "reason must be at most 240 characters.");
        }

        return _store.Modify(db =>
        {
            var reservation = db.Reservations.FirstOrDefault(r => r.Id == id)
                              ?? throw ApiException.NotFound($"Reservation {id} was not found.");

            var target = ReservationRules.Normalise(request.Status);
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var failure = ReservationRules.ValidateTransition(reservation, target, today);

            if (failure is not null)
            {
                throw ApiException.Conflict(
                    ErrorCodes.InvalidStatusTransition,
                    failure,
                    new
                    {
                        from = reservation.Status,
                        to = target,
                        allowed = ReservationRules.AllowedNext(reservation.Status)
                    });
            }

            if (target == ReservationRules.Cancelled)
            {
                reservation.CancelledAt = DateTime.UtcNow;
                reservation.CancellationReason = string.IsNullOrWhiteSpace(request.Reason)
                    ? reservation.CancellationReason ?? "Cancelled by guest."
                    : request.Reason.Trim();
            }

            reservation.Status = target;
            reservation.UpdatedAt = DateTime.UtcNow;
            return reservation;
        });
    }

    public Reservation Cancel(Guid id, string? reason)
    {
        if (reason is { Length: > 240 })
        {
            throw ApiException.Validation("reason", "reason must be at most 240 characters.");
        }

        return _store.Modify(db =>
        {
            var reservation = db.Reservations.FirstOrDefault(r => r.Id == id)
                              ?? throw ApiException.NotFound($"Reservation {id} was not found.");

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            if (!ReservationRules.CanCancel(reservation, today))
            {
                throw ApiException.Conflict(
                    ErrorCodes.CancellationNotAllowed,
                    "This booking can no longer be cancelled.",
                    new { status = reservation.Status, checkInDate = reservation.CheckInDate });
            }

            reservation.Status = ReservationRules.Cancelled;
            reservation.CancelledAt = DateTime.UtcNow;
            reservation.CancellationReason = string.IsNullOrWhiteSpace(reason)
                ? "Cancelled by guest."
                : reason.Trim();
            reservation.UpdatedAt = DateTime.UtcNow;
            return reservation;
        });
    }

    public List<Message> GetMessages(Guid id)
        => _store.Read(db =>
        {
            _ = db.Reservations.FirstOrDefault(r => r.Id == id)
                ?? throw ApiException.NotFound($"Reservation {id} was not found.");

            return db.Messages
                .Where(m => m.ReservationId == id)
                .OrderBy(m => m.SentAt)
                .ToList();
        });

    public Message SendMessage(Guid id, CreateMessageRequest request)
    {
        var role = (request.SenderRole ?? string.Empty).Trim().ToLowerInvariant();
        if (role is not ("guest" or "host"))
        {
            throw ApiException.Validation("senderRole", "senderRole must be guest or host.");
        }

        var body = request.MessageBody.Trim();
        if (body.Length == 0)
        {
            throw ApiException.Validation("messageBody", "messageBody cannot be empty.");
        }

        return _store.Modify(db =>
        {
            var reservation = db.Reservations.FirstOrDefault(r => r.Id == id)
                              ?? throw ApiException.NotFound($"Reservation {id} was not found.");

            var senderId = role == "host" ? reservation.HostId : reservation.GuestId;

            if (request.SenderId is { } supplied && supplied != reservation.HostId && supplied != reservation.GuestId)
            {
                throw ApiException.Validation("senderId", "senderId is not a participant in this booking.");
            }

            var message = new Message(
                Id: Guid.NewGuid(),
                ReservationId: id,
                SenderId: senderId,
                SenderRole: role,
                MessageBody: body,
                SentAt: DateTime.UtcNow,
                Read: false);

            db.Messages.Add(message);
            return message;
        });
    }

    private static (DateOnly CheckIn, DateOnly CheckOut) RequireDates(DateOnly? checkIn, DateOnly? checkOut)
    {
        var errors = new Dictionary<string, string[]>();
        if (checkIn is null)
        {
            errors["checkInDate"] = ["checkInDate is required."];
        }

        if (checkOut is null)
        {
            errors["checkOutDate"] = ["checkOutDate is required."];
        }

        if (errors.Count > 0)
        {
            throw ApiException.Validation(errors, "Both checkInDate and checkOutDate are required.");
        }

        return (checkIn!.Value, checkOut!.Value);
    }

    /// <summary>Booking validation order: order, past, minimum, maximum, capacity.</summary>
    private static void ValidateStay(
        ListingDetail listing,
        DateOnly checkIn,
        DateOnly checkOut,
        int guests,
        DateOnly today)
    {
        if (checkOut <= checkIn)
        {
            throw ApiException.Validation(
                new Dictionary<string, string[]> { ["checkOutDate"] = ["Check-out must be after check-in."] },
                "Check-out must be after check-in.",
                ErrorCodes.DateOrder);
        }

        if (checkIn < today)
        {
            throw ApiException.Validation(
                "checkInDate",
                "Check-in cannot be in the past.",
                ErrorCodes.DateInPast);
        }

        var nights = checkOut.DayNumber - checkIn.DayNumber;
        var minimum = listing.Pricing.MinNights;

        if (nights < minimum)
        {
            throw ApiException.Validation(
                new Dictionary<string, string[]>
                {
                    ["checkOutDate"] = [$"This stay needs at least {minimum} nights."]
                },
                $"This stay needs at least {minimum} nights.",
                ErrorCodes.MinStayNotMet);
        }

        if (nights > PricingCalculator.MaxNights)
        {
            throw ApiException.Validation(
                "checkOutDate",
                $"A stay can be at most {PricingCalculator.MaxNights} nights.",
                ErrorCodes.StayTooLong);
        }

        if (guests < 1 || guests > listing.Capacity.MaxGuests)
        {
            throw ApiException.Unprocessable(
                ErrorCodes.CapacityExceeded,
                $"This stay sleeps at most {listing.Capacity.MaxGuests} guests.",
                new { maxGuests = listing.Capacity.MaxGuests });
        }
    }

    private static string NormaliseBookingFlow(string? flow, ListingDetail listing)
    {
        var normalised = (flow ?? string.Empty).Trim().ToLowerInvariant();
        if (normalised is not ("instant_book" or "request_to_book"))
        {
            throw ApiException.Validation(
                "bookingFlow",
                "bookingFlow must be instant_book or request_to_book.");
        }

        if (normalised == "instant_book" && !listing.InstantBookEnabled)
        {
            throw ApiException.Validation(
                "bookingFlow",
                "This stay accepts booking requests only. Use request_to_book.");
        }

        return normalised;
    }
}
