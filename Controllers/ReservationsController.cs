using Microsoft.AspNetCore.Mvc;
using StayHubApi.Models;
using StayHubApi.Services;

namespace StayHubApi.Controllers;

[ApiController]
[Route("v1/reservations")]
[Produces("application/json")]
public class ReservationsController : ControllerBase
{
    private readonly MockDataStore _dataStore;

    public ReservationsController(MockDataStore dataStore)
    {
        _dataStore = dataStore;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<Reservation>), StatusCodes.Status200OK)]
    public ActionResult<List<Reservation>> GetAllReservations([FromQuery] string? status = null)
    {
        var reservations = _dataStore.Read(db =>
        {
            var query = db.Reservations.AsEnumerable();
            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(r => r.Status.Equals(status, StringComparison.OrdinalIgnoreCase));
            }
            return query.OrderByDescending(r => r.CreatedAt).ToList();
        });

        return Ok(reservations);
    }

    [HttpPost]
    [ProducesResponseType(typeof(Reservation), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public ActionResult<Reservation> CreateReservation([FromBody] CreateReservationRequest request)
    {
        if (request.CheckOutDate <= request.CheckInDate)
        {
            return UnprocessableEntity(new { code = "VALIDATION_FAILED", message = "check_out_date must be strictly after check_in_date" });
        }

        if (request.GuestsCount < 1)
        {
            return BadRequest(new { code = "VALIDATION_FAILED", message = "guests_count must be at least 1." });
        }

        var result = _dataStore.Modify<(Reservation? res, string? error, int statusCode)>(db =>
        {
            var listing = db.Listings.FirstOrDefault(l => l.Id == request.ListingId);
            if (listing == null)
            {
                return (null, $"Listing {request.ListingId} not found.", 404);
            }

            if (request.GuestsCount > listing.Capacity.MaxGuests)
            {
                return (null, $"Guests count exceeds maximum capacity of {listing.Capacity.MaxGuests}.", 422);
            }

            // Real overlap conflict check: check if any active reservation conflicts
            bool hasOverlap = db.Reservations.Any(r =>
                r.ListingId == request.ListingId &&
                r.Status != "cancelled" &&
                r.CheckInDate < request.CheckOutDate &&
                r.CheckOutDate > request.CheckInDate);

            if (hasOverlap)
            {
                return (null, "The requested dates are no longer available for this property.", 409);
            }

            int nights = request.CheckOutDate.DayNumber - request.CheckInDate.DayNumber;
            decimal basePrice = listing.Pricing.BaseNightlyRate * nights;
            decimal cleaning = listing.Pricing.CleaningFee;
            decimal service = listing.Pricing.ServiceFee;
            decimal tax = listing.Pricing.LocalOccupancyTax;

            // Apply discounts if stay >= 7 nights (weekly) or >= 30 nights (monthly)
            decimal discount = 0m;
            if (nights >= 30 && listing.Pricing.Discounts.MonthlyDiscountPercent > 0)
            {
                discount = Math.Round(basePrice * (decimal)(listing.Pricing.Discounts.MonthlyDiscountPercent / 100.0), 2);
            }
            else if (nights >= 7 && listing.Pricing.Discounts.WeeklyDiscountPercent > 0)
            {
                discount = Math.Round(basePrice * (decimal)(listing.Pricing.Discounts.WeeklyDiscountPercent / 100.0), 2);
            }

            decimal total = (basePrice - discount) + cleaning + service + tax;

            var items = new List<PriceBreakdownItem>
            {
                new($"{nights} Nights Base Accommodation", basePrice)
            };

            if (discount > 0)
            {
                items.Add(new("Length of Stay Discount", -discount));
            }

            items.Add(new("Cleaning Fee", cleaning));
            items.Add(new("Service Fee", service));
            items.Add(new("Local Occupancy Tax", tax));

            var reservation = new Reservation
            {
                Id = Guid.NewGuid(),
                ListingId = listing.Id,
                HostId = listing.Host.HostId,
                Status = request.BookingFlow == "instant_book" ? "confirmed" : "pending_approval",
                BookingFlow = request.BookingFlow,
                CheckInDate = request.CheckInDate,
                CheckOutDate = request.CheckOutDate,
                GuestsCount = request.GuestsCount,
                PrimaryGuest = request.PrimaryGuest,
                PricingSummary = new ReservationPricingSummary(
                    listing.Pricing.Currency,
                    basePrice,
                    cleaning,
                    service,
                    tax,
                    listing.Pricing.SecurityDeposit,
                    discount,
                    total,
                    items
                ),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            db.Reservations.Add(reservation);
            return (reservation, null, 201);
        });

        if (result.error != null)
        {
            var code = result.statusCode switch
            {
                404 => "RESOURCE_NOT_FOUND",
                409 => "BOOKING_CONFLICT",
                _ => "VALIDATION_FAILED"
            };
            return StatusCode(result.statusCode, new { code, message = result.error });
        }

        return CreatedAtAction(nameof(GetReservationById), new { id = result.res!.Id }, result.res);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(Reservation), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult<Reservation> GetReservationById(Guid id)
    {
        var res = _dataStore.Read(db => db.Reservations.FirstOrDefault(r => r.Id == id));
        if (res == null)
        {
            return NotFound(new { code = "RESOURCE_NOT_FOUND", message = $"Reservation {id} not found." });
        }

        return Ok(res);
    }

    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(typeof(Reservation), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult<Reservation> UpdateReservationStatus(Guid id, [FromBody] UpdateReservationStatusRequest request)
    {
        var allowedStatuses = new[] { "pending_approval", "confirmed", "checked_in", "cancelled", "completed" };
        if (!allowedStatuses.Contains(request.Status.ToLowerInvariant()))
        {
            return BadRequest(new { code = "INVALID_STATUS", message = $"Status must be one of: {string.Join(", ", allowedStatuses)}" });
        }

        var res = _dataStore.Modify(db =>
        {
            var existing = db.Reservations.FirstOrDefault(r => r.Id == id);
            if (existing == null) return null;

            existing.Status = request.Status.ToLowerInvariant();
            if (!string.IsNullOrWhiteSpace(request.Reason))
            {
                existing.CancellationReason = request.Reason;
            }
            existing.UpdatedAt = DateTime.UtcNow;
            return existing;
        });

        if (res == null)
        {
            return NotFound(new { code = "RESOURCE_NOT_FOUND", message = $"Reservation {id} not found." });
        }

        return Ok(res);
    }

    [HttpPost("{id:guid}/cancel")]
    [ProducesResponseType(typeof(Reservation), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult<Reservation> CancelReservation(Guid id, [FromQuery] string? reason = null)
    {
        var res = _dataStore.Modify(db =>
        {
            var existing = db.Reservations.FirstOrDefault(r => r.Id == id);
            if (existing == null) return null;

            existing.Status = "cancelled";
            existing.CancellationReason = reason ?? "Cancelled by user";
            existing.UpdatedAt = DateTime.UtcNow;
            return existing;
        });

        if (res == null)
        {
            return NotFound(new { code = "RESOURCE_NOT_FOUND", message = $"Reservation {id} not found." });
        }

        return Ok(res);
    }

    [HttpGet("{id:guid}/messages")]
    [ProducesResponseType(typeof(List<Message>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult<List<Message>> GetReservationMessages(Guid id)
    {
        var exists = _dataStore.Read(db => db.Reservations.Any(r => r.Id == id));
        if (!exists)
        {
            return NotFound(new { code = "RESOURCE_NOT_FOUND", message = $"Reservation {id} not found." });
        }

        var messages = _dataStore.Read(db => db.Messages
            .Where(m => m.ReservationId == id)
            .OrderBy(m => m.SentAt)
            .ToList());

        return Ok(messages);
    }

    [HttpPost("{id:guid}/messages")]
    [ProducesResponseType(typeof(Message), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult<Message> SendMessage(Guid id, [FromBody] CreateMessageRequest request)
    {
        var exists = _dataStore.Read(db => db.Reservations.Any(r => r.Id == id));
        if (!exists)
        {
            return NotFound(new { code = "RESOURCE_NOT_FOUND", message = $"Reservation {id} not found." });
        }

        if (string.IsNullOrWhiteSpace(request.MessageBody))
        {
            return BadRequest(new { code = "VALIDATION_FAILED", message = "message_body cannot be empty." });
        }

        var message = new Message(
            Id: Guid.NewGuid(),
            ReservationId: id,
            SenderId: request.SenderId,
            SenderRole: string.IsNullOrWhiteSpace(request.SenderRole) ? "guest" : request.SenderRole,
            MessageBody: request.MessageBody,
            SentAt: DateTime.UtcNow,
            Read: false
        );

        _dataStore.Modify(db => db.Messages.Add(message));
        return StatusCode(201, message);
    }
}

