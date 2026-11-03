using StayHubApi.Models;

namespace StayHubApi.Services;

/// <summary>
/// Search, filtering, geo filtering, sorting and pagination for the catalogue. Every advertised
/// field is implemented: nothing in the request model is a no-op. The three old guest counts and the
/// old currency field were removed because one <c>guestsCount</c> and a EUR-only catalogue replaced
/// them.
/// </summary>
public sealed class ListingSearchService
{
    public const int MaxPageSize = 48;
    public const int MaxQueryLength = 120;
    public const int MaxSearchNights = 366;
    public const int MinRadiusMeters = 100;
    public const int MaxRadiusMeters = 100_000;

    public static readonly string[] SortOptions =
        ["recommended", "price_asc", "price_desc", "rating_desc", "reviews_desc", "distance_asc"];

    private readonly MockDataStore _store;

    public ListingSearchService(MockDataStore store)
    {
        _store = store;
    }

    public ListingSearchResponse Search(ListingSearchRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        var criteria = Normalise(request);

        return _store.Read(db =>
        {
            IEnumerable<ListingDetail> query = db.Listings;

            if (criteria.Query is { Length: > 0 } text)
            {
                query = query.Where(l =>
                    l.Title.Contains(text, StringComparison.OrdinalIgnoreCase)
                    || l.Description.Contains(text, StringComparison.OrdinalIgnoreCase)
                    || l.Address.City.Contains(text, StringComparison.OrdinalIgnoreCase)
                    || l.Address.State.Contains(text, StringComparison.OrdinalIgnoreCase)
                    || l.Address.NeighborhoodId.Contains(text, StringComparison.OrdinalIgnoreCase)
                    || l.Category.Contains(text, StringComparison.OrdinalIgnoreCase));
            }

            if (criteria.Categories.Count > 0)
            {
                query = query.Where(l => criteria.Categories.Contains(l.Category, StringComparer.Ordinal));
            }

            if (criteria.RequiredAmenities.Count > 0)
            {
                query = query.Where(l => criteria.RequiredAmenities
                    .All(a => l.Amenities.Contains(a, StringComparer.OrdinalIgnoreCase)));
            }

            if (criteria.GuestsCount > 0)
            {
                query = query.Where(l => l.Capacity.MaxGuests >= criteria.GuestsCount);
            }

            if (criteria.PetsCount > 0)
            {
                query = query.Where(l => l.HouseRules.MaxPets >= criteria.PetsCount);
            }

            if (criteria.MinPrice is { } minPrice)
            {
                query = query.Where(l => l.Pricing.BaseNightlyRate >= minPrice);
            }

            if (criteria.MaxPrice is { } maxPrice)
            {
                query = query.Where(l => l.Pricing.BaseNightlyRate <= maxPrice);
            }

            if (criteria.MinBedrooms is { } minBedrooms)
            {
                query = query.Where(l => l.Capacity.Bedrooms >= minBedrooms);
            }

            if (criteria.MinBeds is { } minBeds)
            {
                query = query.Where(l => l.Capacity.Beds >= minBeds);
            }

            if (criteria.MinBathrooms is { } minBathrooms)
            {
                query = query.Where(l => l.Capacity.Bathrooms >= minBathrooms);
            }

            if (criteria.MinRating is { } minRating)
            {
                query = query.Where(l => l.StarRating >= minRating);
            }

            if (criteria.SuperhostOnly)
            {
                query = query.Where(l => l.Host.SuperhostStatus);
            }

            if (criteria.InstantBookOnly)
            {
                query = query.Where(l => l.InstantBookEnabled);
            }

            if (criteria.NeighborhoodId is { Length: > 0 } neighborhood)
            {
                query = query.Where(l =>
                    string.Equals(l.Address.NeighborhoodId, neighborhood, StringComparison.OrdinalIgnoreCase));
            }

            if (criteria.HostId is { } hostId)
            {
                query = query.Where(l => l.Host.HostId == hostId);
            }

            if (criteria.CheckInDate is { } checkIn && criteria.CheckOutDate is { } checkOut)
            {
                var blocked = db.Reservations
                    .Where(r => ReservationRules.BlocksAvailability(r.Status)
                                && ReservationRules.Overlaps(checkIn, checkOut, r.CheckInDate, r.CheckOutDate))
                    .Select(r => r.ListingId)
                    .ToHashSet();

                query = query.Where(l => !blocked.Contains(l.Id));
            }

            var distances = new Dictionary<Guid, double>();
            if (criteria.Circle is { } circle)
            {
                foreach (var listing in query.ToList())
                {
                    var distance = CatalogRules.HaversineMeters(circle.Center, listing.Coordinates);
                    if (distance <= circle.RadiusMeters)
                    {
                        distances[listing.Id] = distance;
                    }
                }

                query = query.Where(l => distances.ContainsKey(l.Id));
            }

            if (criteria.Polygon is { } polygon)
            {
                query = query.Where(l => CatalogRules.PointInPolygon(l.Coordinates, polygon.BoundaryPoints));
            }

            var results = query.ToList();

            var rated = db.Listings
                .Where(l => l.ReviewCount > 0)
                .Select(l => (l.StarRating, l.ReviewCount))
                .ToList();

            var meanRating = rated.Count > 0
                ? rated.Sum(x => x.StarRating * x.ReviewCount) / rated.Sum(x => x.ReviewCount)
                : 4.5;

            results = criteria.SortBy switch
            {
                "price_asc" => results
                    .OrderBy(l => l.Pricing.BaseNightlyRate)
                    .ThenByDescending(l => l.StarRating)
                    .ToList(),
                "price_desc" => results
                    .OrderByDescending(l => l.Pricing.BaseNightlyRate)
                    .ThenByDescending(l => l.StarRating)
                    .ToList(),
                "rating_desc" => results
                    .OrderByDescending(l => l.StarRating)
                    .ThenByDescending(l => l.ReviewCount)
                    .ThenByDescending(l => l.CreatedAt)
                    .ToList(),
                "reviews_desc" => results
                    .OrderByDescending(l => l.ReviewCount)
                    .ThenByDescending(l => l.StarRating)
                    .ToList(),
                "distance_asc" => results
                    .OrderBy(l => distances[l.Id])
                    .ThenByDescending(l => l.StarRating)
                    .ToList(),
                _ => results
                    .OrderByDescending(l => BayesianScore(l, meanRating))
                    .ThenByDescending(l => l.ReviewCount)
                    .ThenByDescending(l => l.CreatedAt)
                    .ToList()
            };

            var totalRecords = results.Count;
            var totalPages = totalRecords == 0
                ? 0
                : (int)Math.Ceiling(totalRecords / (double)criteria.PageSize);

            return new ListingSearchResponse
            {
                Page = criteria.Page,
                PageSize = criteria.PageSize,
                TotalRecords = totalRecords,
                TotalPages = totalPages,
                AppliedFilters = new AppliedFilters(
                    Query: criteria.Query,
                    CheckInDate: criteria.CheckInDate,
                    CheckOutDate: criteria.CheckOutDate,
                    GuestsCount: criteria.GuestsCount,
                    PetsCount: criteria.PetsCount,
                    MinPrice: criteria.MinPrice,
                    MaxPrice: criteria.MaxPrice,
                    MinRating: criteria.MinRating,
                    MinBedrooms: criteria.MinBedrooms,
                    MinBeds: criteria.MinBeds,
                    MinBathrooms: criteria.MinBathrooms,
                    SuperhostOnly: criteria.SuperhostOnly,
                    InstantBookOnly: criteria.InstantBookOnly,
                    NeighborhoodId: criteria.NeighborhoodId,
                    HostId: criteria.HostId,
                    Categories: criteria.Categories,
                    RequiredAmenities: criteria.RequiredAmenities,
                    HasCircle: criteria.Circle is not null,
                    HasPolygon: criteria.Polygon is not null,
                    SortBy: criteria.SortBy),
                Results = results
                    .Skip((criteria.Page - 1) * criteria.PageSize)
                    .Take(criteria.PageSize)
                    .ToList()
            };
        });
    }

    /// <summary>
    /// A Bayesian average keeps a stay with a single five star review from outranking a stay with
    /// thirty reviews at 4.8. Five reviews is the prior weight, the catalogue mean is the prior.
    /// </summary>
    private static double BayesianScore(ListingDetail listing, double meanRating)
    {
        const double priorWeight = 5;
        var count = listing.ReviewCount;
        if (count == 0)
        {
            return 0;
        }

        return (count / (count + priorWeight)) * listing.StarRating
               + (priorWeight / (count + priorWeight)) * meanRating;
    }

    private static SearchCriteria Normalise(ListingSearchRequest request)
    {
        var errors = new Dictionary<string, string[]>();

        var query = request.Query?.Trim();
        if (query is { Length: > MaxQueryLength })
        {
            errors["query"] = [$"query must be at most {MaxQueryLength} characters."];
        }

        if (request.GuestsCount is < 1 or > 20)
        {
            errors["guestsCount"] = ["guestsCount must be between 1 and 20."];
        }

        if (request.PetsCount is < 0 or > 20)
        {
            errors["petsCount"] = ["petsCount must be between 0 and 20."];
        }

        if (request.MinPrice is { } minPrice && minPrice <= 0)
        {
            errors["minPrice"] = ["minPrice must be greater than 0."];
        }

        if (request.MaxPrice is { } maxPrice && maxPrice <= 0)
        {
            errors["maxPrice"] = ["maxPrice must be greater than 0."];
        }

        if (request.MinPrice is { } min && request.MaxPrice is { } max2 && min > max2)
        {
            errors["maxPrice"] = ["maxPrice must be greater than or equal to minPrice."];
        }

        if (request.MinRating is { } minRating && (minRating < 0 || minRating > 5 || !CatalogRules.IsFinite(minRating)))
        {
            errors["minRating"] = ["minRating must be between 0 and 5."];
        }

        if (request.MinBedrooms is < 0 or > 30)
        {
            errors["minBedrooms"] = ["minBedrooms must be between 0 and 30."];
        }

        if (request.MinBeds is < 0 or > 50)
        {
            errors["minBeds"] = ["minBeds must be between 0 and 50."];
        }

        if (request.MinBathrooms is { } minBathrooms
            && (minBathrooms < 0 || minBathrooms > 20 || !CatalogRules.IsFinite(minBathrooms)))
        {
            errors["minBathrooms"] = ["minBathrooms must be between 0 and 20."];
        }

        if (request.Page < 1)
        {
            errors["page"] = ["page must be 1 or greater."];
        }

        if (request.PageSize is < 1 or > MaxPageSize)
        {
            errors["pageSize"] = [$"pageSize must be between 1 and {MaxPageSize}."];
        }

        var categories = new List<string>();
        foreach (var raw in request.Categories ?? [])
        {
            if (!CatalogRules.TryNormaliseCategory(raw, out var category))
            {
                errors["categories"] =
                    [$"Unknown category '{raw}'. Allowed: {string.Join(", ", CatalogRules.AllowedCategories)}."];
                break;
            }

            if (!categories.Contains(category))
            {
                categories.Add(category);
            }
        }

        var amenities = (request.RequiredAmenities ?? [])
            .Where(a => !string.IsNullOrWhiteSpace(a))
            .Select(CatalogRules.NormaliseAmenity)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (amenities.Any(a => a.Length > 40))
        {
            errors["requiredAmenities"] = ["Amenity names must be at most 40 characters."];
        }

        if (request.NeighborhoodId is { Length: > 60 })
        {
            errors["neighborhoodId"] = ["neighborhoodId must be at most 60 characters."];
        }

        var sortBy = string.IsNullOrWhiteSpace(request.SortBy)
            ? "recommended"
            : request.SortBy.Trim().ToLowerInvariant();

        if (!SortOptions.Contains(sortBy))
        {
            throw ApiException.Unprocessable(
                ErrorCodes.InvalidSort,
                $"Unknown sortBy '{request.SortBy}'.",
                new { allowed = SortOptions });
        }

        if (request.CheckInDate.HasValue != request.CheckOutDate.HasValue)
        {
            errors["checkInDate"] = ["Provide both checkInDate and checkOutDate, or neither."];
            errors["checkOutDate"] = ["Provide both checkInDate and checkOutDate, or neither."];
        }

        GeoCircleSearch? circle = null;
        if (request.CircleSearch is { } rawCircle)
        {
            if (!CatalogRules.IsValidCoordinate(rawCircle.Center))
            {
                errors["circleSearch.center"] = ["Circle center must be a valid latitude and longitude."];
            }

            if (rawCircle.RadiusMeters is < MinRadiusMeters or > MaxRadiusMeters)
            {
                errors["circleSearch.radiusMeters"] =
                    [$"radiusMeters must be between {MinRadiusMeters} and {MaxRadiusMeters}."];
            }

            circle = rawCircle;
        }

        GeoPolygonSearch? polygon = null;
        if (request.PolygonSearch is { } rawPolygon)
        {
            var points = rawPolygon.BoundaryPoints ?? [];
            if (points.Count < 3)
            {
                errors["polygonSearch.boundaryPoints"] = ["A polygon needs at least 3 boundary points."];
            }
            else if (points.Any(p => !CatalogRules.IsValidCoordinate(p)))
            {
                errors["polygonSearch.boundaryPoints"] = ["Every boundary point must be a valid latitude and longitude."];
            }

            polygon = new GeoPolygonSearch(points);
        }

        if (sortBy == "distance_asc" && circle is null)
        {
            throw ApiException.Unprocessable(
                ErrorCodes.InvalidSort,
                "sortBy distance_asc requires circleSearch.",
                new { allowed = SortOptions });
        }

        if (errors.Count > 0)
        {
            throw ApiException.Validation(errors);
        }

        if (request.CheckInDate is { } checkIn && request.CheckOutDate is { } checkOut)
        {
            if (checkOut <= checkIn)
            {
                throw ApiException.Validation(
                    new Dictionary<string, string[]> { ["checkOutDate"] = ["checkOutDate must be after checkInDate."] },
                    "checkOutDate must be after checkInDate.",
                    ErrorCodes.DateOrder);
            }

            if (checkOut.DayNumber - checkIn.DayNumber > MaxSearchNights)
            {
                throw ApiException.Validation(
                    "checkOutDate",
                    $"A search can span at most {MaxSearchNights} nights.",
                    ErrorCodes.StayTooLong);
            }
        }

        return new SearchCriteria(
            Query: query,
            CheckInDate: request.CheckInDate,
            CheckOutDate: request.CheckOutDate,
            GuestsCount: request.GuestsCount,
            PetsCount: request.PetsCount,
            MinPrice: request.MinPrice,
            MaxPrice: request.MaxPrice,
            MinRating: request.MinRating,
            MinBedrooms: request.MinBedrooms,
            MinBeds: request.MinBeds,
            MinBathrooms: request.MinBathrooms,
            SuperhostOnly: request.SuperhostOnly,
            InstantBookOnly: request.InstantBookOnly,
            NeighborhoodId: request.NeighborhoodId?.Trim(),
            HostId: request.HostId,
            Categories: categories,
            RequiredAmenities: amenities,
            Circle: circle,
            Polygon: polygon,
            SortBy: sortBy,
            Page: request.Page,
            PageSize: request.PageSize);
    }

    private sealed record SearchCriteria(
        string? Query,
        DateOnly? CheckInDate,
        DateOnly? CheckOutDate,
        int GuestsCount,
        int PetsCount,
        decimal? MinPrice,
        decimal? MaxPrice,
        double? MinRating,
        int? MinBedrooms,
        int? MinBeds,
        double? MinBathrooms,
        bool SuperhostOnly,
        bool InstantBookOnly,
        string? NeighborhoodId,
        Guid? HostId,
        List<string> Categories,
        List<string> RequiredAmenities,
        GeoCircleSearch? Circle,
        GeoPolygonSearch? Polygon,
        string SortBy,
        int Page,
        int PageSize);
}
