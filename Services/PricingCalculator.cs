using System.Globalization;
using StayHubApi.Models;

namespace StayHubApi.Services;

/// <summary>
/// The only place reservation money is calculated. The quote endpoint, the create endpoint and the
/// seed data all call <see cref="BuildQuote"/>, so the displayed receipt and the stored reservation
/// can never disagree.
/// </summary>
public sealed class PricingCalculator
{
    /// <summary>Hard upper bound for a single stay, shared with search validation.</summary>
    public const int MaxNights = 365;

    /// <summary>Nights from which the weekly discount applies.</summary>
    public const int WeeklyDiscountThreshold = 7;

    /// <summary>Nights from which the monthly discount applies. Monthly wins over weekly.</summary>
    public const int MonthlyDiscountThreshold = 30;

    /// <summary>
    /// Builds the price breakdown for a stay. Availability is supplied by the caller because it needs
    /// the reservation store; pricing itself is pure.
    /// </summary>
    public ReservationQuote BuildQuote(
        ListingDetail listing,
        DateOnly checkIn,
        DateOnly checkOut,
        bool isAvailable,
        string? unavailableReason)
    {
        ArgumentNullException.ThrowIfNull(listing);

        var pricing = listing.Pricing;
        var nights = Math.Max(0, checkOut.DayNumber - checkIn.DayNumber);
        var nightlyRate = Round(pricing.BaseNightlyRate);
        var basePrice = Round(nightlyRate * nights);

        decimal discountPercent = 0m;
        string? discountLabel = null;
        if (nights >= MonthlyDiscountThreshold && pricing.Discounts.MonthlyDiscountPercent > 0)
        {
            discountPercent = Round((decimal)pricing.Discounts.MonthlyDiscountPercent);
            discountLabel = "Monthly discount";
        }
        else if (nights >= WeeklyDiscountThreshold && pricing.Discounts.WeeklyDiscountPercent > 0)
        {
            discountPercent = Round((decimal)pricing.Discounts.WeeklyDiscountPercent);
            discountLabel = "Weekly discount";
        }

        var discountAmount = Round(basePrice * discountPercent / 100m);
        var cleaningFee = Round(pricing.CleaningFee);
        var serviceFee = Round(pricing.ServiceFee);
        var occupancyTax = Round(pricing.LocalOccupancyTax);
        var securityDeposit = Round(pricing.SecurityDeposit);
        var totalAmount = Round(basePrice - discountAmount + cleaningFee + serviceFee + occupancyTax);

        var items = new List<PriceBreakdownItem>
        {
            new(
                string.Create(
                    CultureInfo.InvariantCulture,
                    $"{nights} {(nights == 1 ? "night" : "nights")} at {nightlyRate:0.00}"),
                basePrice)
        };

        if (discountAmount > 0 && discountLabel is not null)
        {
            items.Add(new PriceBreakdownItem(
                string.Create(CultureInfo.InvariantCulture, $"{discountLabel} ({discountPercent:0.##}%)"),
                -discountAmount));
        }

        items.Add(new PriceBreakdownItem("Cleaning fee", cleaningFee));
        items.Add(new PriceBreakdownItem("Service fee", serviceFee));
        items.Add(new PriceBreakdownItem("Occupancy tax", occupancyTax));

        return new ReservationQuote(
            ListingId: listing.Id,
            Currency: pricing.Currency,
            Nights: nights,
            NightlyRate: nightlyRate,
            BasePrice: basePrice,
            DiscountPercent: discountPercent,
            DiscountAmount: discountAmount,
            CleaningFee: cleaningFee,
            ServiceFee: serviceFee,
            OccupancyTax: occupancyTax,
            SecurityDeposit: securityDeposit,
            TotalAmount: totalAmount,
            MinimumStayNights: pricing.MinNights,
            IsAvailable: isAvailable,
            UnavailableReason: unavailableReason,
            Items: items);
    }

    /// <summary>Rounds money to two decimals, away from zero, for every code path.</summary>
    public static decimal Round(decimal value)
        => decimal.Round(value, 2, MidpointRounding.AwayFromZero);

    /// <summary>
    /// Translates a quote into the summary stored on the reservation. The total is copied, never
    /// recalculated, which is what makes quote and create byte-for-byte consistent.
    /// </summary>
    public static ReservationPricingSummary ToSummary(ReservationQuote quote)
        => new(
            Currency: quote.Currency,
            BasePrice: quote.BasePrice,
            CleaningFee: quote.CleaningFee,
            ServiceFee: quote.ServiceFee,
            LocalOccupancyTax: quote.OccupancyTax,
            SecurityDeposit: quote.SecurityDeposit,
            DiscountAmount: quote.DiscountAmount,
            TotalAmount: quote.TotalAmount,
            Items: quote.Items.ToList());
}
