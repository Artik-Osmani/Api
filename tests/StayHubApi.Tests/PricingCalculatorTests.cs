using StayHubApi.Models;
using StayHubApi.Services;
using Xunit;

namespace StayHubApi.Tests;

/// <summary>
/// Unit tests for the money arithmetic. These do not need the host, which keeps rounding failures
/// fast to reproduce.
/// </summary>
public class PricingCalculatorTests
{
    private static readonly PricingCalculator Calculator = new();

    private static ListingDetail Listing(
        decimal rate = 100m,
        decimal cleaning = 20m,
        decimal service = 10m,
        decimal tax = 4m,
        decimal deposit = 150m,
        double weekly = 10,
        double monthly = 25,
        int minNights = 2)
        => new()
        {
            Id = Guid.NewGuid(),
            Title = "Test stay",
            Pricing = new PricingMatrix(
                "EUR", rate, cleaning, service, tax, deposit,
                new DynamicDiscounts(weekly, monthly), minNights)
        };

    [Theory]
    [InlineData(2.345, 2.35)]
    [InlineData(2.344, 2.34)]
    [InlineData(-2.345, -2.35)]
    [InlineData(0.005, 0.01)]
    public void Round_UsesAwayFromZero(decimal input, decimal expected)
        => Assert.Equal(expected, PricingCalculator.Round(input));

    [Fact]
    public void Quote_SixNights_HasNoDiscount()
    {
        var quote = Calculator.BuildQuote(
            Listing(),
            new DateOnly(2027, 3, 1),
            new DateOnly(2027, 3, 7),
            isAvailable: true,
            unavailableReason: null);

        Assert.Equal(6, quote.Nights);
        Assert.Equal(600m, quote.BasePrice);
        Assert.Equal(0m, quote.DiscountPercent);
        Assert.Equal(634m, quote.TotalAmount);
    }

    [Fact]
    public void Quote_SevenNights_AppliesWeeklyDiscount()
    {
        var quote = Calculator.BuildQuote(
            Listing(),
            new DateOnly(2027, 3, 1),
            new DateOnly(2027, 3, 8),
            isAvailable: true,
            unavailableReason: null);

        Assert.Equal(700m, quote.BasePrice);
        Assert.Equal(10m, quote.DiscountPercent);
        Assert.Equal(70m, quote.DiscountAmount);
        Assert.Equal(664m, quote.TotalAmount);
    }

    [Fact]
    public void Quote_ThirtyNights_MonthlyBeatsWeekly()
    {
        var quote = Calculator.BuildQuote(
            Listing(),
            new DateOnly(2027, 3, 1),
            new DateOnly(2027, 3, 31),
            isAvailable: true,
            unavailableReason: null);

        Assert.Equal(30, quote.Nights);
        Assert.Equal(25m, quote.DiscountPercent);
        Assert.Equal(750m, quote.DiscountAmount);
        Assert.Equal(2284m, quote.TotalAmount);
    }

    [Fact]
    public void Quote_DepositIsNeverPartOfTheTotal()
    {
        var withDeposit = Calculator.BuildQuote(
            Listing(deposit: 999m),
            new DateOnly(2027, 3, 1),
            new DateOnly(2027, 3, 3),
            isAvailable: true,
            unavailableReason: null);

        Assert.Equal(999m, withDeposit.SecurityDeposit);
        Assert.Equal(234m, withDeposit.TotalAmount);
    }

    [Fact]
    public void Quote_ItemsSumToTotal()
    {
        var quote = Calculator.BuildQuote(
            Listing(),
            new DateOnly(2027, 3, 1),
            new DateOnly(2027, 3, 8),
            isAvailable: true,
            unavailableReason: null);

        Assert.Equal(quote.TotalAmount, quote.Items.Sum(item => item.Amount));
    }

    [Fact]
    public void Quote_UnavailableReasonIsPassedThrough()
    {
        var quote = Calculator.BuildQuote(
            Listing(),
            new DateOnly(2027, 3, 1),
            new DateOnly(2027, 3, 4),
            isAvailable: false,
            unavailableReason: "booked");

        Assert.False(quote.IsAvailable);
        Assert.Equal("booked", quote.UnavailableReason);
    }
}
