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

    /// <summary>
    /// Retrieves all vacation rental listings with an optional limit.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<ListingDetail>), StatusCodes.Status200OK)]
    public ActionResult<List<ListingDetail>> GetAllListings([FromQuery] int limit = 50)
    {
        var listings = _dataStore.Read(db => db.Listings.Take(Math.Clamp(limit, 1, 100)).ToList());
        return Ok(listings);
    }

    /// <summary>
    /// Searches listings by text, date availability, price, room capacities, amenities, and custom sort order.
    /// </summary>
    [HttpPost("search")]
    [ProducesResponseType(typeof(ListingSearchResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public ActionResult<ListingSearchResponse> SearchListings([FromBody] ListingSearchRequest request)
    {
        if (request.CheckInDate.HasValue && request.CheckOutDate.HasValue && request.CheckOutDate <= request.CheckInDate)
        {
            return UnprocessableEntity(new { code = "VALIDATION_FAILED", message = "check_out_date must be strictly after check_in_date" });
        }

        var results = _dataStore.Read(db =>
        {
            var query = db.Listings.AsEnumerable();

            if (!string.IsNullOrWhiteSpace(request.Query))
            {
                var q = request.Query.Trim();
                query = query.Where(l =>
                    l.Title.Contains(q, StringComparison.OrdinalIgnoreCase) ||
                    l.Description.Contains(q, StringComparison.OrdinalIgnoreCase) ||
                    l.Address.City.Contains(q, StringComparison.OrdinalIgnoreCase) ||
                    l.Address.State.Contains(q, StringComparison.OrdinalIgnoreCase) ||
                    l.Category.Contains(q, StringComparison.OrdinalIgnoreCase));
            }

            if (request.GuestsCount > 0)
            {
                query = query.Where(l => l.Capacity.MaxGuests >= request.GuestsCount);
            }

            if (request.MinBedrooms.HasValue)
            {
                query = query.Where(l => l.Capacity.Bedrooms >= request.MinBedrooms.Value);
            }

            if (request.MinBeds.HasValue)
            {
                query = query.Where(l => l.Capacity.Beds >= request.MinBeds.Value);
            }

            if (request.MinBathrooms.HasValue)
            {
                query = query.Where(l => l.Capacity.Bathrooms >= request.MinBathrooms.Value);
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

            if (request.MinRating.HasValue)
            {
                query = query.Where(l => l.StarRating >= request.MinRating.Value);
            }

            if (request.Categories != null && request.Categories.Count > 0)
            {
                query = query.Where(l => request.Categories.Contains(l.Category, StringComparer.OrdinalIgnoreCase));
            }

            if (request.RequiredAmenities != null && request.RequiredAmenities.Count > 0)
            {
                query = query.Where(l => request.RequiredAmenities.All(a => l.Amenities.Contains(a, StringComparer.OrdinalIgnoreCase)));
            }

            // Availability filtering if dates supplied
            if (request.CheckInDate.HasValue && request.CheckOutDate.HasValue)
            {
                var checkIn = request.CheckInDate.Value;
                var checkOut = request.CheckOutDate.Value;

                var bookedListingIds = db.Reservations
                    .Where(r => r.Status != "cancelled" && r.CheckInDate < checkOut && r.CheckOutDate > checkIn)
                    .Select(r => r.ListingId)
                    .ToHashSet();

                query = query.Where(l => !bookedListingIds.Contains(l.Id));
            }

            // Sorting
            query = request.SortBy?.ToLowerInvariant() switch
            {
                "price_asc" => query.OrderBy(l => l.Pricing.BaseNightlyRate),
                "price_desc" => query.OrderByDescending(l => l.Pricing.BaseNightlyRate),
                "rating_desc" => query.OrderByDescending(l => l.StarRating).ThenByDescending(l => l.ReviewCount),
                "reviews_desc" => query.OrderByDescending(l => l.ReviewCount),
                _ => query.OrderByDescending(l => l.StarRating * l.ReviewCount) // popularity default
            };

            return query.ToList();
        });

        int pageSize = Math.Clamp(request.PageSize, 1, 100);
        int page = Math.Max(1, request.Page);

        return Ok(new ListingSearchResponse
        {
            Page = page,
            PageSize = pageSize,
            TotalRecords = results.Count,
            TotalPages = (int)Math.Ceiling(results.Count / (double)pageSize),
            Results = results.Skip((page - 1) * pageSize).Take(pageSize).ToList()
        });
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ListingDetail), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult<ListingDetail> GetListingById(Guid id)
    {
        var listing = _dataStore.Read(db => db.Listings.FirstOrDefault(l => l.Id == id));
        if (listing == null)
        {
            return NotFound(new { code = "RESOURCE_NOT_FOUND", message = $"Listing {id} not found." });
        }

        return Ok(listing);
    }

    [HttpPost]
    [ProducesResponseType(typeof(ListingDetail), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public ActionResult<ListingDetail> CreateListing([FromBody] CreateListingRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest(new { code = "VALIDATION_FAILED", message = "Title is required" });

        var newListing = new ListingDetail
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Description = request.Description,
            ImageUrl = string.IsNullOrWhiteSpace(request.ImageUrl) ? "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80" : request.ImageUrl,
            Category = request.Category,
            Coordinates = request.Coordinates ?? new CoordinatePair(37.7749, -122.4194),
            Address = request.Address ?? new Address("New St 1", "San Francisco", "CA", "94103", "US", "neigh_central"),
            Capacity = request.Capacity ?? new CapacityBreakdown(2, 1, 1, 1),
            Amenities = request.Amenities ?? [],
            Host = request.Host ?? new HostDetails(Guid.NewGuid(), "Host User", "", 100, 10, true, true),
            Pricing = request.Pricing ?? new PricingMatrix("USD", 120, 50, 15, 12, 150, new DynamicDiscounts(10, 20, 5)),
            HouseRules = request.HouseRules ?? new HouseRules("22:00", "08:00", false, false, 0),
            InstantBookEnabled = request.InstantBookEnabled,
            StarRating = 5.0,
            ReviewCount = 0
        };

        _dataStore.Modify(db => db.Listings.Add(newListing));

        return CreatedAtAction(nameof(GetListingById), new { id = newListing.Id }, newListing);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ListingDetail), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult<ListingDetail> UpdateListing(Guid id, [FromBody] UpdateListingRequest request)
    {
        var updated = _dataStore.Modify(db =>
        {
            var listing = db.Listings.FirstOrDefault(l => l.Id == id);
            if (listing == null) return null;

            if (!string.IsNullOrWhiteSpace(request.Title)) listing.Title = request.Title;
            if (!string.IsNullOrWhiteSpace(request.Description)) listing.Description = request.Description;
            if (!string.IsNullOrWhiteSpace(request.ImageUrl)) listing.ImageUrl = request.ImageUrl;
            if (!string.IsNullOrWhiteSpace(request.Category)) listing.Category = request.Category;
            if (request.Capacity != null) listing.Capacity = request.Capacity;
            if (request.Amenities != null) listing.Amenities = request.Amenities;
            if (request.Pricing != null) listing.Pricing = request.Pricing;
            if (request.HouseRules != null) listing.HouseRules = request.HouseRules;
            if (request.InstantBookEnabled.HasValue) listing.InstantBookEnabled = request.InstantBookEnabled.Value;

            return listing;
        });

        if (updated == null)
            return NotFound(new { code = "RESOURCE_NOT_FOUND", message = $"Listing {id} not found." });

        return Ok(updated);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult DeleteListing(Guid id)
    {
        var removed = _dataStore.Modify(db =>
        {
            var idx = db.Listings.FindIndex(l => l.Id == id);
            if (idx >= 0)
            {
                db.Listings.RemoveAt(idx);
                db.FavoriteIds.Remove(id);
                return true;
            }
            return false;
        });

        if (!removed)
            return NotFound(new { code = "RESOURCE_NOT_FOUND", message = $"Listing {id} not found." });

        return NoContent();
    }

    [HttpGet("{id:guid}/availability")]
    [ProducesResponseType(typeof(ListingAvailabilityResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public ActionResult<ListingAvailabilityResponse> GetListingAvailability(
        Guid id,
        [FromQuery] DateOnly start_date,
        [FromQuery] DateOnly end_date)
    {
        var listing = _dataStore.Read(db => db.Listings.FirstOrDefault(l => l.Id == id));
        if (listing == null)
        {
            return NotFound(new { code = "RESOURCE_NOT_FOUND", message = $"Listing {id} not found." });
        }

        if (end_date < start_date)
        {
            return UnprocessableEntity(new { code = "VALIDATION_FAILED", message = "end_date cannot precede start_date" });
        }

        // Check active reservations overlapping this listing
        var reservations = _dataStore.Read(db => db.Reservations
            .Where(r => r.ListingId == id && r.Status != "cancelled")
            .ToList());

        var days = new List<DailyAvailability>();
        for (var dt = start_date; dt <= end_date; dt = dt.AddDays(1))
        {
            var isBooked = reservations.Any(r => dt >= r.CheckInDate && dt < r.CheckOutDate);

            days.Add(new DailyAvailability(
                Date: dt,
                IsAvailable: !isBooked,
                NightlyPrice: listing.Pricing.BaseNightlyRate,
                MinimumStayNights: 2,
                BlockReason: isBooked ? "reservation_booked" : "not_blocked"
            ));
        }

        return Ok(new ListingAvailabilityResponse(id, start_date, end_date, days));
    }

    [HttpGet("{id:guid}/reviews")]
    [ProducesResponseType(typeof(ReviewsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult<ReviewsResponse> GetListingReviews(Guid id)
    {
        var listing = _dataStore.Read(db => db.Listings.FirstOrDefault(l => l.Id == id));
        if (listing == null)
        {
            return NotFound(new { code = "RESOURCE_NOT_FOUND", message = $"Listing {id} not found." });
        }

        var reviews = _dataStore.Read(db => db.Reviews
            .Where(r => r.ListingId == id)
            .OrderByDescending(r => r.CreatedAt)
            .ToList());

        return Ok(new ReviewsResponse(id, listing.StarRating, listing.ReviewCount, reviews));
    }

    [HttpPost("{id:guid}/reviews")]
    [ProducesResponseType(typeof(Review), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult<Review> AddReview(Guid id, [FromBody] CreateReviewRequest request)
    {
        if (request.Rating < 1 || request.Rating > 5)
        {
            return BadRequest(new { code = "VALIDATION_FAILED", message = "Rating must be between 1 and 5." });
        }

        if (string.IsNullOrWhiteSpace(request.Comment))
        {
            return BadRequest(new { code = "VALIDATION_FAILED", message = "Review comment is required." });
        }

        var review = _dataStore.Modify(db =>
        {
            var listing = db.Listings.FirstOrDefault(l => l.Id == id);
            if (listing == null) return null;

            var newRev = new Review(
                Id: Guid.NewGuid(),
                ListingId: id,
                AuthorId: Guid.NewGuid(),
                AuthorName: string.IsNullOrWhiteSpace(request.AuthorName) ? "Verified Guest" : request.AuthorName,
                AuthorAvatarUrl: request.AuthorAvatarUrl,
                Rating: request.Rating,
                Comment: request.Comment,
                CreatedAt: DateTime.UtcNow
            );

            db.Reviews.Add(newRev);

            // Dynamically recalculate average rating & review count on listing
            var allRatings = db.Reviews.Where(r => r.ListingId == id).Select(r => r.Rating).ToList();
            listing.ReviewCount = allRatings.Count;
            listing.StarRating = Math.Round(allRatings.Average(), 2);

            return newRev;
        });

        if (review == null)
        {
            return NotFound(new { code = "RESOURCE_NOT_FOUND", message = $"Listing {id} not found." });
        }

        return StatusCode(201, review);
    }
}

