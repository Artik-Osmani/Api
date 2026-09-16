using Microsoft.AspNetCore.Mvc;
using StayHubApi.Models;
using StayHubApi.Services;

namespace StayHubApi.Controllers;

[ApiController]
[Route("v1/listings")]
[Produces("application/json")]
public class ListingsController : ControllerBase
{
    private readonly MockDataStore _dataStore;

    public ListingsController(MockDataStore dataStore)
    {
        _dataStore = dataStore;
    }

    [HttpPost("search")]
    public ActionResult<ListingSearchResponse> SearchListings([FromBody] ListingSearchRequest request)
    {
        if (request.CheckOutDate <= request.CheckInDate)
        {
            return UnprocessableEntity(new { code = "VALIDATION_FAILED", message = "check_out_date must be strictly after check_in_date" });
        }

        var query = _dataStore.Listings.AsEnumerable();

        if (request.GuestsCount > 0)
        {
            query = query.Where(l => l.Capacity.MaxGuests >= request.GuestsCount);
        }

        if (request.MinPrice.HasValue)
        {
            query = query.Where(l => l.Pricing.BaseNightlyRate >= request.MinPrice.Value);
        }

        if (request.MaxPrice.HasValue)
        {
            query = query.Where(l => l.Pricing.BaseNightlyRate <= request.MaxPrice.Value);
        }

        if (request.SuperhostOnly)
        {
            query = query.Where(l => l.Host.SuperhostStatus);
        }

        if (request.InstantBookOnly)
        {
            query = query.Where(l => l.InstantBookEnabled);
        }

        if (request.Categories != null && request.Categories.Count > 0)
        {
            query = query.Where(l => request.Categories.Contains(l.Category));
        }

        if (request.RequiredAmenities != null && request.RequiredAmenities.Count > 0)
        {
            query = query.Where(l => request.RequiredAmenities.All(a => l.Amenities.Contains(a)));
        }

        var results = query.ToList();

        return Ok(new ListingSearchResponse
        {
            Page = request.Page,
            PageSize = request.PageSize,
            TotalRecords = results.Count,
            TotalPages = (int)Math.Ceiling(results.Count / (double)request.PageSize),
            Results = results.Skip((request.Page - 1) * request.PageSize).Take(request.PageSize).ToList()
        });
    }

    [HttpGet("{id:guid}")]
    public ActionResult<ListingDetail> GetListingById(Guid id)
    {
        var listing = _dataStore.Listings.FirstOrDefault(l => l.Id == id);
        if (listing == null)
        {
            return NotFound(new { code = "RESOURCE_NOT_FOUND", message = $"Listing {id} not found." });
        }

        return Ok(listing);
    }

    [HttpGet("{id:guid}/availability")]
    public ActionResult<ListingAvailabilityResponse> GetListingAvailability(
        Guid id,
        [FromQuery] DateOnly start_date,
        [FromQuery] DateOnly end_date)
    {
        var listing = _dataStore.Listings.FirstOrDefault(l => l.Id == id);
        if (listing == null)
        {
            return NotFound(new { code = "RESOURCE_NOT_FOUND", message = $"Listing {id} not found." });
        }

        if (end_date < start_date)
        {
            return UnprocessableEntity(new { code = "VALIDATION_FAILED", message = "end_date cannot precede start_date" });
        }

        var days = new List<DailyAvailability>();
        for (var dt = start_date; dt <= end_date; dt = dt.AddDays(1))
        {
            days.Add(new DailyAvailability(
                Date: dt,
                IsAvailable: true,
                NightlyPrice: listing.Pricing.BaseNightlyRate,
                MinimumStayNights: 2,
                BlockReason: "not_blocked"
            ));
        }

        return Ok(new ListingAvailabilityResponse(id, start_date, end_date, days));
    }
}
