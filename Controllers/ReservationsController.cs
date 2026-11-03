using Microsoft.AspNetCore.Mvc;
using StayHubApi.Models;
using StayHubApi.Services;

namespace StayHubApi.Controllers;

/// <summary>
/// Reservations: quote, create, status transitions, cancellation and the guest-host message thread.
/// </summary>
[ApiController]
[Route("v1/reservations")]
[Produces("application/json")]
public class ReservationsController : ControllerBase
{
    private readonly ReservationService _reservations;

    public ReservationsController(ReservationService reservations)
    {
        _reservations = reservations;
    }

    /// <summary>Lists reservations, newest first, optionally filtered by status.</summary>
    /// <param name="status">One of pending_approval, confirmed, checked_in, completed, cancelled.</param>
    /// <response code="200">Reservations.</response>
    /// <response code="422">Unknown status filter.</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<Reservation>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status422UnprocessableEntity)]
    public ActionResult<List<Reservation>> GetAll([FromQuery] string? status = null)
        => Ok(_reservations.GetAll(status));

    /// <summary>
    /// Prices a stay without booking it. Returns 200 with <c>isAvailable: false</c> and a reason when
    /// the dates overlap an active reservation.
    /// </summary>
    /// <response code="200">The quote.</response>
    /// <response code="404">No stay has that id.</response>
    /// <response code="422">Missing or reversed dates, too short or too long a stay, too many guests.</response>
    [HttpPost("quote")]
    [ProducesResponseType(typeof(ReservationQuote), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status422UnprocessableEntity)]
    public ActionResult<ReservationQuote> Quote([FromBody] QuoteRequest request)
        => Ok(_reservations.Quote(request));

    /// <summary>
    /// Creates a reservation. Past check-in, minimum stay, capacity, booking flow and overlaps are
    /// enforced, and the stored total is the same number the quote endpoint returns.
    /// </summary>
    /// <response code="201">The reservation, with a Location header.</response>
    /// <response code="400">Model binding or DataAnnotations failure.</response>
    /// <response code="404">No stay has that id.</response>
    /// <response code="409">The dates overlap an active reservation.</response>
    /// <response code="422">Semantic validation failure.</response>
    [HttpPost]
    [ProducesResponseType(typeof(Reservation), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status422UnprocessableEntity)]
    public ActionResult<Reservation> Create([FromBody] CreateReservationRequest request)
    {
        var reservation = _reservations.Create(request);
        return CreatedAtAction(nameof(GetById), new { id = reservation.Id }, reservation);
    }

    /// <summary>Reads one reservation, including its price breakdown.</summary>
    /// <param name="id">Reservation GUID.</param>
    /// <response code="200">The reservation.</response>
    /// <response code="404">No reservation has that id.</response>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(Reservation), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    public ActionResult<Reservation> GetById(Guid id)
        => Ok(_reservations.GetById(id));

    /// <summary>
    /// Moves a reservation through its state machine. Only the transitions listed in the README are
    /// allowed, and check-in and completion respect the arrival and departure dates.
    /// </summary>
    /// <param name="id">Reservation GUID.</param>
    /// <param name="request">Target status and an optional reason.</param>
    /// <response code="200">The updated reservation.</response>
    /// <response code="404">No reservation has that id.</response>
    /// <response code="409">Illegal transition, with <c>details.allowed</c>.</response>
    /// <response code="422">Unknown status or an over-long reason.</response>
    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(typeof(Reservation), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status422UnprocessableEntity)]
    public ActionResult<Reservation> UpdateStatus(Guid id, [FromBody] UpdateReservationStatusRequest request)
        => Ok(_reservations.UpdateStatus(id, request));

    /// <summary>Cancels a booking that has not started. Past, completed or cancelled bookings return 409.</summary>
    /// <param name="id">Reservation GUID.</param>
    /// <param name="reason">Optional cancellation reason, at most 240 characters.</param>
    /// <response code="200">The cancelled reservation.</response>
    /// <response code="404">No reservation has that id.</response>
    /// <response code="409">Cancellation is no longer allowed.</response>
    [HttpPost("{id:guid}/cancel")]
    [ProducesResponseType(typeof(Reservation), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status422UnprocessableEntity)]
    public ActionResult<Reservation> Cancel(Guid id, [FromQuery] string? reason = null)
        => Ok(_reservations.Cancel(id, reason));

    /// <summary>Reads the message thread for a reservation, oldest first.</summary>
    /// <param name="id">Reservation GUID.</param>
    /// <response code="200">Messages.</response>
    /// <response code="404">No reservation has that id.</response>
    [HttpGet("{id:guid}/messages")]
    [ProducesResponseType(typeof(List<Message>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    public ActionResult<List<Message>> GetMessages(Guid id)
        => Ok(_reservations.GetMessages(id));

    /// <summary>
    /// Sends a message to the thread. The sender id is derived from the participant role, so a client
    /// cannot post as an arbitrary user.
    /// </summary>
    /// <param name="id">Reservation GUID.</param>
    /// <param name="request">Role, body and an optional sender id that must be a participant.</param>
    /// <response code="201">The created message.</response>
    /// <response code="400">Empty or over-long body.</response>
    /// <response code="404">No reservation has that id.</response>
    /// <response code="422">Unknown role or a sender that is not a participant.</response>
    [HttpPost("{id:guid}/messages")]
    [ProducesResponseType(typeof(Message), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status422UnprocessableEntity)]
    public ActionResult<Message> SendMessage(Guid id, [FromBody] CreateMessageRequest request)
        => StatusCode(StatusCodes.Status201Created, _reservations.SendMessage(id, request));
}
