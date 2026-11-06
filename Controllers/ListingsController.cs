using Microsoft.AspNetCore.Mvc;
using StayHubApi.Models;
using StayHubApi.Services;

namespace StayHubApi.Controllers;

/// <summary>
/// Stays: search, read, write, availability and reviews. Every error is returned as
/// <see cref="ApiError"/> with a stable <c>code</c>.
/// </summary>
[ApiController]
[Route("v1/listings")]
[Produces("application/json")]
public class ListingsController : ControllerBase
{
    private readonly CatalogService _catalog;
    private readonly ListingSearchService _search;

    public ListingsController(CatalogService catalog, ListingSearchService search)
    {
        _catalog = catalog;
        _search = search;
    }

    /// <summary>Lists stays without filtering. Use the search endpoint for anything else.</summary>
    /// <param name="limit">Maximum number of stays, clamped to 1 through 100. Defaults to 50.</param>
    /// <response code="200">The stays, newest first.</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<ListingDetail>), StatusCodes.Status200OK)]
    public ActionResult<List<ListingDetail>> GetAll([FromQuery] int limit = 50)
        => Ok(_catalog.GetAll(limit));

    /// <summary>
    /// Searches stays by text, dates, guests, pets, price, rooms, amenities, rating, neighbourhood,
    /// host, circle or polygon, with sorting and pagination. Both dates or neither.
    /// </summary>
    /// <response code="200">A page of results plus <c>appliedFilters</c>.</response>
    /// <response code="422">Invalid dates, sort, category, price, geo filter or paging.</response>
    [HttpPost("search")]
    [ProducesResponseType(typeof(ListingSearchResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status422UnprocessableEntity)]
    public ActionResult<ListingSearchResponse> Search([FromBody] ListingSearchRequest request)
        => Ok(_search.Search(request));

    /// <summary>Reads one stay by id.</summary>
    /// <param name="id">Listing GUID.</param>
    /// <response code="200">The stay.</response>
    /// <response code="404">No stay has that id.</response>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ListingDetail), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    public ActionResult<ListingDetail> GetById(Guid id)
        => Ok(_catalog.GetById(id));

    /// <summary>
    /// Creates a stay. The host is looked up by <c>hostId</c>; a caller cannot supply host details.
    /// </summary>
    /// <response code="201">The created stay, with a Location header.</response>
    /// <response code="400">Model binding or DataAnnotations failure.</response>
    /// <response code="422">Semantic validation failure, for example an unknown category or host.</response>
    [HttpPost]
    [ProducesResponseType(typeof(ListingDetail), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status422UnprocessableEntity)]
    public ActionResult<ListingDetail> Create([FromBody] CreateListingRequest request)
    {
        var listing = _catalog.Create(request);
        return CreatedAtAction(nameof(GetById), new { id = listing.Id }, listing);
    }

    /// <summary>Partially updates a stay. Null properties keep their stored value.</summary>
    /// <param name="id">Listing GUID.</param>
    /// <param name="request">Fields to change.</param>
    /// <response code="200">The updated stay.</response>
    /// <response code="400">Model binding or DataAnnotations failure.</response>
    /// <response code="404">No stay has that id.</response>
    /// <response code="422">Semantic validation failure.</response>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ListingDetail), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status422UnprocessableEntity)]
    public ActionResult<ListingDetail> Update(Guid id, [FromBody] UpdateListingRequest request)
        => Ok(_catalog.Update(id, request));

    /// <summary>
    /// Deletes a stay. Blocked with 409 while an active reservation exists. Otherwise the stay, its
    /// reviews, its favorite entry and any finished reservations are removed.
    /// </summary>
    /// <param name="id">Listing GUID.</param>
    /// <response code="204">Deleted.</response>
    /// <response code="404">No stay has that id.</response>
    /// <response code="409">The stay has active reservations.</response>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status409Conflict)]
    public IActionResult Delete(Guid id)
    {
        _catalog.Delete(id);
        return NoContent();
    }

    /// <summary>
    /// Day-by-day availability. Both dates are required, the window is capped at 92 days, past days
    /// are marked with <c>blockReason: "past"</c> and booked days with <c>"booked"</c>.
    /// </summary>
    /// <param name="id">Listing GUID.</param>
    /// <param name="start_date">First day, <c>YYYY-MM-DD</c>.</param>
    /// <param name="end_date">Last day, inclusive.</param>
    /// <response code="200">The calendar window.</response>
    /// <response code="404">No stay has that id.</response>
    /// <response code="422">Missing dates, reversed range or a window over 92 days.</response>
    [HttpGet("{id:guid}/availability")]
    [ProducesResponseType(typeof(ListingAvailabilityResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status422UnprocessableEntity)]
    public ActionResult<ListingAvailabilityResponse> GetAvailability(
        Guid id,
        [FromQuery] DateOnly? start_date,
        [FromQuery] DateOnly? end_date)
        => Ok(_catalog.GetAvailability(id, start_date, end_date));

    /// <summary>Reviews for a stay, newest first, with the stored average and count.</summary>
    /// <param name="id">Listing GUID.</param>
    /// <param name="page">Page number, defaults to 1.</param>
    /// <param name="pageSize">Page size, clamped to 1 through 50.</param>
    /// <response code="200">The reviews page.</response>
    /// <response code="404">No stay has that id.</response>
    [HttpGet("{id:guid}/reviews")]
    [ProducesResponseType(typeof(ReviewsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    public ActionResult<ReviewsResponse> GetReviews(
        Guid id,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
        => Ok(_catalog.GetReviews(id, page, pageSize));

    /// <summary>
    /// Adds a review and recomputes the stay rating and review count from the real records.
    /// Writes are limited to 5 per minute per IP.
    /// </summary>
    /// <param name="id">Listing GUID.</param>
    /// <param name="request">Rating 1 to 5, comment 20 to 1200 characters, name 2 to 80.</param>
    /// <response code="201">The created review.</response>
    /// <response code="400">Rating, comment or name failed validation.</response>
    /// <response code="404">No stay has that id.</response>
    /// <response code="429">More than 5 review writes in a minute from this IP.</response>
    [HttpPost("{id:guid}/reviews")]
    [ProducesResponseType(typeof(Review), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status429TooManyRequests)]
    public ActionResult<Review> AddReview(Guid id, [FromBody] CreateReviewRequest request)
        => StatusCode(StatusCodes.Status201Created, _catalog.AddReview(id, request));
}
