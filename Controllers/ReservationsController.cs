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

    [HttpPost]
    public ActionResult<Reservation> CreateReservation([FromBody] CreateReservationRequest request)
    {
        if (request.CheckOutDate <= request.CheckInDate)
        {
            return UnprocessableEntity(new { code = "VALIDATION_FAILED", message = "check_out_date must be strictly after check_in_date" });
        }

        var listing = _dataStore.Listings.FirstOrDefault(l => l.Id == request.ListingId);
        if (listing == null)
        {
            return NotFound(new { code = "RESOURCE_NOT_FOUND", message = $"Listing {request.ListingId} not found." });
        }

        int nights = request.CheckOutDate.DayNumber - request.CheckInDate.DayNumber;
        decimal basePrice = listing.Pricing.BaseNightlyRate * nights;
        decimal cleaning = listing.Pricing.CleaningFee;
        decimal service = listing.Pricing.ServiceFee;
        decimal tax = listing.Pricing.LocalOccupancyTax;
        decimal total = basePrice + cleaning + service + tax;

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
                0m,
                total,
                [
                    new PriceBreakdownItem($"{nights} Nights Base Accommodation", basePrice),
                    new PriceBreakdownItem("Cleaning Fee", cleaning),
                    new PriceBreakdownItem("Service Fee", service),
                    new PriceBreakdownItem("Local Occupancy Tax", tax)
                ]
            ),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _dataStore.Reservations.Add(reservation);
        return CreatedAtAction(nameof(GetReservationById), new { id = reservation.Id }, reservation);
    }

    [HttpGet("{id:guid}")]
    public ActionResult<Reservation> GetReservationById(Guid id)
    {
        var res = _dataStore.Reservations.FirstOrDefault(r => r.Id == id);
        if (res == null)
        {
            return NotFound(new { code = "RESOURCE_NOT_FOUND", message = $"Reservation {id} not found." });
        }

        return Ok(res);
    }

    [HttpPost("{id:guid}/messages")]
    public ActionResult<Message> SendMessage(Guid id, [FromBody] CreateMessageRequest request)
    {
        var res = _dataStore.Reservations.FirstOrDefault(r => r.Id == id);
        if (res == null)
        {
            return NotFound(new { code = "RESOURCE_NOT_FOUND", message = $"Reservation {id} not found." });
        }

        if (string.IsNullOrWhiteSpace(request.MessageBody))
        {
            return UnprocessableEntity(new { code = "VALIDATION_FAILED", message = "message_body cannot be empty." });
        }

        var message = new Message(
            Id: Guid.NewGuid(),
            ReservationId: id,
            SenderId: request.SenderId,
            SenderRole: request.SenderRole,
            MessageBody: request.MessageBody,
            SentAt: DateTime.UtcNow,
            Read: false
        );

        _dataStore.Messages.Add(message);
        return StatusCode(201, message);
    }
}
