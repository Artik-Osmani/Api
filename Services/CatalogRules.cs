using StayHubApi.Models;

namespace StayHubApi.Services;

/// <summary>
/// Shared validation and geometry helpers for the catalogue. Kept separate so the search service and
/// the listing controller apply exactly the same rules for categories, coordinates and pricing.
/// </summary>
public static class CatalogRules
{
    public static readonly string[] AllowedCategories =
        Enum.GetNames<PropertyCategory>();

    /// <summary>
    /// Parses a category name case-insensitively. Numeric strings are rejected because
    /// <see cref="Enum.TryParse{TEnum}(string, bool, out TEnum)"/> would otherwise accept "1".
    /// </summary>
    public static bool TryNormaliseCategory(string? value, out string category)
    {
        category = string.Empty;
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        var trimmed = value.Trim();
        if (trimmed.All(char.IsDigit))
        {
            return false;
        }

        if (Enum.TryParse<PropertyCategory>(trimmed, ignoreCase: true, out var parsed)
            && Enum.IsDefined(parsed))
        {
            category = parsed.ToString();
            return true;
        }

        return false;
    }

    public static string NormaliseAmenity(string value)
        => value.Trim().ToLowerInvariant().Replace(' ', '_');

    public static bool IsFinite(double value) => !double.IsNaN(value) && !double.IsInfinity(value);

    public static bool IsValidCoordinate(CoordinatePair? point)
        => point is not null
           && IsFinite(point.Latitude)
           && IsFinite(point.Longitude)
           && point.Latitude is >= -90 and <= 90
           && point.Longitude is >= -180 and <= 180;

    /// <summary>Great-circle distance in metres.</summary>
    public static double HaversineMeters(CoordinatePair from, CoordinatePair to)
    {
        const double earthRadiusMeters = 6_371_000;
        var lat1 = from.Latitude * Math.PI / 180;
        var lat2 = to.Latitude * Math.PI / 180;
        var deltaLat = (to.Latitude - from.Latitude) * Math.PI / 180;
        var deltaLon = (to.Longitude - from.Longitude) * Math.PI / 180;

        var a = Math.Sin(deltaLat / 2) * Math.Sin(deltaLat / 2)
                + Math.Cos(lat1) * Math.Cos(lat2)
                * Math.Sin(deltaLon / 2) * Math.Sin(deltaLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return earthRadiusMeters * c;
    }

    /// <summary>Ray casting point-in-polygon test used by the polygon search filter.</summary>
    public static bool PointInPolygon(CoordinatePair point, IReadOnlyList<CoordinatePair> boundary)
    {
        if (boundary.Count < 3)
        {
            return false;
        }

        var inside = false;
        for (int i = 0, j = boundary.Count - 1; i < boundary.Count; j = i++)
        {
            var xi = boundary[i].Longitude;
            var yi = boundary[i].Latitude;
            var xj = boundary[j].Longitude;
            var yj = boundary[j].Latitude;

            var intersects = ((yi > point.Latitude) != (yj > point.Latitude))
                             && (point.Longitude < (xj - xi) * (point.Latitude - yi) / (yj - yi) + xi);
            if (intersects)
            {
                inside = !inside;
            }
        }

        return inside;
    }

    /// <summary>Validates a pricing matrix and returns camelCase field errors.</summary>
    public static Dictionary<string, string[]> ValidatePricing(PricingMatrix? pricing)
    {
        var errors = new Dictionary<string, string[]>();

        if (pricing is null)
        {
            errors["pricing"] = ["Pricing is required."];
            return errors;
        }

        if (!string.Equals(pricing.Currency, "EUR", StringComparison.OrdinalIgnoreCase))
        {
            errors["pricing.currency"] = ["The catalogue is EUR only."];
        }

        if (pricing.BaseNightlyRate <= 0 || pricing.BaseNightlyRate > 100_000)
        {
            errors["pricing.baseNightlyRate"] = ["Nightly rate must be greater than 0 and at most 100000."];
        }

        if (pricing.CleaningFee is < 0 or > 100_000 || pricing.ServiceFee is < 0 or > 100_000
            || pricing.LocalOccupancyTax is < 0 or > 100_000 || pricing.SecurityDeposit is < 0 or > 100_000)
        {
            errors["pricing.cleaningFee"] = ["Fees and the deposit must be between 0 and 100000."];
        }

        if (pricing.Discounts is null)
        {
            errors["pricing.discounts"] = ["Discounts are required. Use zeros when there is no discount."];
        }
        else if (pricing.Discounts.WeeklyDiscountPercent is < 0 or > 100
                 || pricing.Discounts.MonthlyDiscountPercent is < 0 or > 100
                 || !IsFinite(pricing.Discounts.WeeklyDiscountPercent)
                 || !IsFinite(pricing.Discounts.MonthlyDiscountPercent))
        {
            errors["pricing.discounts"] = ["Discount percentages must be between 0 and 100."];
        }

        if (pricing.MinNights is < 1 or > 30)
        {
            errors["pricing.minNights"] = ["Minimum stay must be between 1 and 30 nights."];
        }

        return errors;
    }

    public static Dictionary<string, string[]> ValidateCapacity(CapacityBreakdown? capacity)
    {
        var errors = new Dictionary<string, string[]>();
        if (capacity is null)
        {
            errors["capacity"] = ["Capacity is required."];
            return errors;
        }

        if (capacity.MaxGuests is < 1 or > 30)
        {
            errors["capacity.maxGuests"] = ["Max guests must be between 1 and 30."];
        }

        if (capacity.Bedrooms is < 0 or > 30)
        {
            errors["capacity.bedrooms"] = ["Bedrooms must be between 0 and 30."];
        }

        if (capacity.Beds is < 1 or > 50)
        {
            errors["capacity.beds"] = ["Beds must be between 1 and 50."];
        }

        if (!IsFinite(capacity.Bathrooms) || capacity.Bathrooms is < 0 or > 20)
        {
            errors["capacity.bathrooms"] = ["Bathrooms must be between 0 and 20."];
        }

        return errors;
    }

    public static Dictionary<string, string[]> ValidateAddress(Address? address)
    {
        var errors = new Dictionary<string, string[]>();
        if (address is null)
        {
            errors["address"] = ["Address is required."];
            return errors;
        }

        if (string.IsNullOrWhiteSpace(address.City) || address.City.Trim().Length < 2)
        {
            errors["address.city"] = ["City is required."];
        }

        if (string.IsNullOrWhiteSpace(address.CountryCode) || address.CountryCode.Trim().Length != 2)
        {
            errors["address.countryCode"] = ["Country code must be two letters, for example XK or AL."];
        }

        if (string.IsNullOrWhiteSpace(address.NeighborhoodId))
        {
            errors["address.neighborhoodId"] = ["Neighbourhood id is required."];
        }

        return errors;
    }

    /// <summary>Only same-origin image paths are accepted, so the app never hotlinks a photo.</summary>
    public static bool IsLocalImagePath(string? path)
    {
        if (string.IsNullOrWhiteSpace(path))
        {
            return true;
        }

        var trimmed = path.Trim();
        return trimmed.StartsWith('/')
               && !trimmed.StartsWith("//", StringComparison.Ordinal)
               && !trimmed.Contains("://", StringComparison.Ordinal)
               && !trimmed.Contains('\\')
               && !trimmed.Any(char.IsControl)
               && trimmed.Length <= 300;
    }
}
