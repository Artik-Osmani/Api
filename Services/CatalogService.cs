using StayHubApi.Models;

namespace StayHubApi.Services;

/// <summary>
/// All listing reads and writes: catalogue, create, update, delete, availability and reviews.
/// Controllers stay thin and every deliberate failure is thrown as an <see cref="ApiException"/>.
/// Deleting a stay is blocked with 409 while it has an active reservation, and otherwise removes its
/// reviews, favorites and any finished reservations. That choice is documented in the README.
/// </summary>
public sealed class CatalogService
{
    public const int AvailabilityWindowDays = 92;

    private readonly MockDataStore _store;

    public CatalogService(MockDataStore store)
    {
        _store = store;
    }

    public List<ListingDetail> GetAll(int limit)
        => _store.Read(db => db.Listings.Take(Math.Clamp(limit, 1, 100)).ToList());

    public ListingDetail GetById(Guid id)
        => _store.Read(db => db.Listings.FirstOrDefault(l => l.Id == id))
           ?? throw ApiException.NotFound($"Stay {id} was not found.");

    public ListingDetail Create(CreateListingRequest request)
    {
        return _store.Modify(db =>
        {
            var host = db.Hosts.FirstOrDefault(h => h.Details.HostId == request.HostId)
                       ?? throw ApiException.Validation("hostId", "hostId does not match a known host.");

            var errors = ValidateListingRequest(
                request.Title, request.Description, request.Category, request.Coordinates,
                request.Address, request.Capacity, request.Pricing, request.HouseRules,
                request.ImageUrl, request.Amenities);

            if (errors.Count > 0)
            {
                throw ApiException.Validation(errors);
            }

            var listing = new ListingDetail
            {
                Id = Guid.NewGuid(),
                Title = request.Title.Trim(),
                Description = request.Description.Trim(),
                ImageUrl = string.IsNullOrWhiteSpace(request.ImageUrl)
                    ? "/images/stays/placeholder-1200.webp"
                    : request.ImageUrl.Trim(),
                Category = NormaliseCategory(request.Category),
                Coordinates = request.Coordinates!,
                Address = NormaliseAddress(request.Address!),
                Capacity = request.Capacity!,
                Amenities = NormaliseAmenities(request.Amenities),
                Host = host.Details,
                Pricing = NormalisePricing(request.Pricing!),
                HouseRules = request.HouseRules!,
                InstantBookEnabled = request.InstantBookEnabled,
                StarRating = 0,
                ReviewCount = 0,
                CreatedAt = DateTime.UtcNow
            };

            db.Listings.Add(listing);
            return listing;
        });
    }

    public ListingDetail Update(Guid id, UpdateListingRequest request)
    {
        return _store.Modify(db =>
        {
            var listing = db.Listings.FirstOrDefault(l => l.Id == id)
                          ?? throw ApiException.NotFound($"Stay {id} was not found.");

            if (request.HostId is { } hostId)
            {
                var host = db.Hosts.FirstOrDefault(h => h.Details.HostId == hostId)
                           ?? throw ApiException.Validation("hostId", "hostId does not match a known host.");
                listing.Host = host.Details;
            }

            var errors = ValidateListingRequest(
                request.Title ?? listing.Title,
                request.Description ?? listing.Description,
                request.Category ?? listing.Category,
                request.Coordinates ?? listing.Coordinates,
                request.Address ?? listing.Address,
                request.Capacity ?? listing.Capacity,
                request.Pricing ?? listing.Pricing,
                request.HouseRules ?? listing.HouseRules,
                request.ImageUrl ?? listing.ImageUrl,
                request.Amenities ?? listing.Amenities);

            if (errors.Count > 0)
            {
                throw ApiException.Validation(errors);
            }

            if (request.Title is not null)
            {
                listing.Title = request.Title.Trim();
            }

            if (request.Description is not null)
            {
                listing.Description = request.Description.Trim();
            }

            if (!string.IsNullOrWhiteSpace(request.ImageUrl))
            {
                listing.ImageUrl = request.ImageUrl.Trim();
            }

            if (request.Category is not null)
            {
                listing.Category = NormaliseCategory(request.Category);
            }

            if (request.Coordinates is not null)
            {
                listing.Coordinates = request.Coordinates;
            }

            if (request.Address is not null)
            {
                listing.Address = NormaliseAddress(request.Address);
            }

            if (request.Capacity is not null)
            {
                listing.Capacity = request.Capacity;
            }

            if (request.Amenities is not null)
            {
                listing.Amenities = NormaliseAmenities(request.Amenities);
            }

            if (request.Pricing is not null)
            {
                listing.Pricing = NormalisePricing(request.Pricing);
            }

            if (request.HouseRules is not null)
            {
                listing.HouseRules = request.HouseRules;
            }

            if (request.InstantBookEnabled.HasValue)
            {
                listing.InstantBookEnabled = request.InstantBookEnabled.Value;
            }

            return listing;
        });
    }

    public void Delete(Guid id)
    {
        _store.Modify(db =>
        {
            var listing = db.Listings.FirstOrDefault(l => l.Id == id)
                          ?? throw ApiException.NotFound($"Stay {id} was not found.");

            var activeReservations = db.Reservations
                .Count(r => r.ListingId == id && ReservationRules.IsActive(r.Status));
            if (activeReservations > 0)
            {
                throw ApiException.Conflict(
                    ErrorCodes.ListingHasActiveReservations,
                    "This stay has active reservations and cannot be deleted. Cancel them first.",
                    new { activeReservations });
            }

            var removedReservationIds = db.Reservations
                .Where(r => r.ListingId == id)
                .Select(r => r.Id)
                .ToHashSet();

            db.Listings.Remove(listing);
            db.FavoriteIds.Remove(id);
            db.Reviews.RemoveAll(r => r.ListingId == id);
            db.Reservations.RemoveAll(r => r.ListingId == id);
            db.Messages.RemoveAll(m => removedReservationIds.Contains(m.ReservationId));
        });
    }

    public ListingAvailabilityResponse GetAvailability(Guid id, DateOnly? startDate, DateOnly? endDate)
    {
        var missing = new Dictionary<string, string[]>();
        if (startDate is null)
        {
            missing["start_date"] = ["start_date is required, for example 2027-03-01."];
        }

        if (endDate is null)
        {
            missing["end_date"] = ["end_date is required, for example 2027-03-07."];
        }

        if (missing.Count > 0)
        {
            throw ApiException.Validation(missing, "Both start_date and end_date are required.");
        }

        var from = startDate!.Value;
        var to = endDate!.Value;

        if (to < from)
        {
            throw ApiException.Validation(
                new Dictionary<string, string[]> { ["end_date"] = ["end_date cannot be before start_date."] },
                "end_date cannot be before start_date.",
                ErrorCodes.DateOrder);
        }

        var window = to.DayNumber - from.DayNumber + 1;
        if (window > AvailabilityWindowDays)
        {
            throw ApiException.Validation(
                "end_date",
                $"The availability window is limited to {AvailabilityWindowDays} days.");
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        return _store.Read(db =>
        {
            var listing = db.Listings.FirstOrDefault(l => l.Id == id)
                          ?? throw ApiException.NotFound($"Stay {id} was not found.");

            var bookings = db.Reservations
                .Where(r => r.ListingId == id && ReservationRules.BlocksAvailability(r.Status))
                .ToList();

            var days = new List<DailyAvailability>(window);
            for (var date = from; date <= to; date = date.AddDays(1))
            {
                var isPast = date < today;
                var isBooked = !isPast && bookings.Any(r => date >= r.CheckInDate && date < r.CheckOutDate);
                days.Add(new DailyAvailability(
                    Date: date,
                    IsAvailable: !isPast && !isBooked,
                    NightlyPrice: PricingCalculator.Round(listing.Pricing.BaseNightlyRate),
                    MinimumStayNights: listing.Pricing.MinNights,
                    BlockReason: isPast ? "past" : isBooked ? "booked" : "available"));
            }

            return new ListingAvailabilityResponse(id, from, to, days);
        });
    }

    public ReviewsResponse GetReviews(Guid id, int page, int pageSize)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        return _store.Read(db =>
        {
            var listing = db.Listings.FirstOrDefault(l => l.Id == id)
                          ?? throw ApiException.NotFound($"Stay {id} was not found.");

            var reviews = db.Reviews
                .Where(r => r.ListingId == id)
                .OrderByDescending(r => r.CreatedAt)
                .ToList();

            return new ReviewsResponse(
                ListingId: id,
                AverageRating: listing.StarRating,
                TotalReviews: reviews.Count,
                Page: page,
                PageSize: pageSize,
                Reviews: reviews.Skip((page - 1) * pageSize).Take(pageSize).ToList());
        });
    }

    public Review AddReview(Guid id, CreateReviewRequest request)
    {
        return _store.Modify(db =>
        {
            var listing = db.Listings.FirstOrDefault(l => l.Id == id)
                          ?? throw ApiException.NotFound($"Stay {id} was not found.");

            var author = request.AuthorName.Trim();
            var comment = request.Comment.Trim();

            if (author.Length < 2)
            {
                throw ApiException.BadRequest("authorName must be at least 2 characters after trimming.");
            }

            if (comment.Length < 20)
            {
                throw ApiException.BadRequest("comment must be at least 20 characters after trimming.");
            }

            if (request.Rating is < 1 or > 5)
            {
                throw ApiException.BadRequest("rating must be between 1 and 5.");
            }

            var review = new Review(
                Id: Guid.NewGuid(),
                ListingId: id,
                AuthorId: Guid.NewGuid(),
                AuthorName: author,
                AuthorAvatarUrl: null,
                Rating: request.Rating,
                Comment: comment,
                CreatedAt: DateTime.UtcNow);

            db.Reviews.Add(review);

            var ratings = db.Reviews.Where(r => r.ListingId == id).Select(r => r.Rating).ToList();
            listing.ReviewCount = ratings.Count;
            listing.StarRating = Math.Round(ratings.Average(), 2, MidpointRounding.AwayFromZero);

            return review;
        });
    }

    private static Dictionary<string, string[]> ValidateListingRequest(
        string title,
        string description,
        string category,
        CoordinatePair? coordinates,
        Address? address,
        CapacityBreakdown? capacity,
        PricingMatrix? pricing,
        HouseRules? houseRules,
        string? imageUrl,
        List<string>? amenities)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(title) || title.Trim().Length is < 5 or > 120)
        {
            errors["title"] = ["Title must be between 5 and 120 characters."];
        }

        if (string.IsNullOrWhiteSpace(description) || description.Trim().Length is < 20 or > 2000)
        {
            errors["description"] = ["Description must be between 20 and 2000 characters."];
        }

        if (!CatalogRules.TryNormaliseCategory(category, out _))
        {
            errors["category"] =
                [$"Category must be one of: {string.Join(", ", CatalogRules.AllowedCategories)}."];
        }

        if (!CatalogRules.IsValidCoordinate(coordinates))
        {
            errors["coordinates"] = ["Coordinates must be valid WGS84 latitude and longitude values."];
        }

        foreach (var pair in CatalogRules.ValidateAddress(address))
        {
            errors[pair.Key] = pair.Value;
        }

        foreach (var pair in CatalogRules.ValidateCapacity(capacity))
        {
            errors[pair.Key] = pair.Value;
        }

        foreach (var pair in CatalogRules.ValidatePricing(pricing))
        {
            errors[pair.Key] = pair.Value;
        }

        if (houseRules is null)
        {
            errors["houseRules"] = ["House rules are required."];
        }
        else
        {
            if (!TimeOnly.TryParseExact(houseRules.QuietHoursStart, "HH:mm", out _)
                || !TimeOnly.TryParseExact(houseRules.QuietHoursEnd, "HH:mm", out _))
            {
                errors["houseRules.quietHours"] = ["Quiet hours must use HH:mm, for example 22:00."];
            }

            if (houseRules.MaxPets is < 0 or > 10)
            {
                errors["houseRules.maxPets"] = ["Max pets must be between 0 and 10."];
            }
        }

        if (!CatalogRules.IsLocalImagePath(imageUrl))
        {
            errors["imageUrl"] = ["imageUrl must be a same-origin path such as /images/stays/name-1200.webp."];
        }

        if (amenities is not null)
        {
            if (amenities.Count > 20)
            {
                errors["amenities"] = ["At most 20 amenities are allowed."];
            }
            else if (amenities.Any(a => string.IsNullOrWhiteSpace(a) || a.Trim().Length > 40))
            {
                errors["amenities"] = ["Amenity names must be 1 to 40 characters."];
            }
        }

        return errors;
    }

    private static string NormaliseCategory(string category)
    {
        if (!CatalogRules.TryNormaliseCategory(category, out var normalised))
        {
            throw ApiException.Validation("category", "Unknown category.");
        }

        return normalised;
    }

    private static List<string> NormaliseAmenities(IEnumerable<string>? amenities)
        => (amenities ?? [])
            .Where(a => !string.IsNullOrWhiteSpace(a))
            .Select(CatalogRules.NormaliseAmenity)
            .Distinct(StringComparer.Ordinal)
            .ToList();

    private static Address NormaliseAddress(Address address)
        => new(
            address.Street.Trim(),
            address.City.Trim(),
            address.State.Trim(),
            address.PostalCode.Trim(),
            address.CountryCode.Trim().ToUpperInvariant(),
            address.NeighborhoodId.Trim());

    private static PricingMatrix NormalisePricing(PricingMatrix pricing)
        => new(
            Currency: "EUR",
            BaseNightlyRate: PricingCalculator.Round(pricing.BaseNightlyRate),
            CleaningFee: PricingCalculator.Round(pricing.CleaningFee),
            ServiceFee: PricingCalculator.Round(pricing.ServiceFee),
            LocalOccupancyTax: PricingCalculator.Round(pricing.LocalOccupancyTax),
            SecurityDeposit: PricingCalculator.Round(pricing.SecurityDeposit),
            Discounts: pricing.Discounts,
            MinNights: pricing.MinNights);
}
