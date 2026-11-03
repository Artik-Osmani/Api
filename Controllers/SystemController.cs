using Microsoft.AspNetCore.Mvc;
using StayHubApi.Models;
using StayHubApi.Services;

namespace StayHubApi.Controllers;

/// <summary>
/// Operational endpoints. Every route that used to live in <c>Program.cs</c> is here, so the whole API
/// surface is discoverable in the controllers folder and in Swagger.
/// </summary>
[ApiController]
[Route("v1/system")]
[Produces("application/json")]
public class SystemController : ControllerBase
{
    private readonly MockDataStore _store;
    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _configuration;

    public SystemController(
        MockDataStore store,
        IWebHostEnvironment environment,
        IConfiguration configuration)
    {
        _store = store;
        _environment = environment;
        _configuration = configuration;
    }

    /// <summary>
    /// Health check with a real store probe, the assembly version, uptime in seconds and the
    /// environment name. The response is never cached.
    /// </summary>
    /// <response code="200">Status, checks, version, uptime and environment.</response>
    [HttpGet("health")]
    [ProducesResponseType(typeof(HealthResponse), StatusCodes.Status200OK)]
    public ActionResult<HealthResponse> Health()
    {
        Response.Headers.CacheControl = "no-store";

        var checks = new Dictionary<string, string>(StringComparer.Ordinal);
        var healthy = true;
        try
        {
            var storeOk = _store.Read(db => db.Listings.Count > 0 && db.Hosts.Count > 0);
            checks["store"] = storeOk ? "ok" : "empty";
            healthy &= storeOk;
        }
        catch (Exception)
        {
            checks["store"] = "unavailable";
            healthy = false;
        }

        checks["api"] = "ok";

        return Ok(new HealthResponse(
            Status: healthy ? "healthy" : "degraded",
            Checks: checks,
            Version: AppInfo.Version,
            UptimeSeconds: _store.UptimeSeconds,
            Environment: _environment.EnvironmentName));
    }

    /// <summary>Platform counters, the assembly version, uptime and paid totals grouped by currency.</summary>
    /// <response code="200">The counters.</response>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(SystemStatsResponse), StatusCodes.Status200OK)]
    public ActionResult<SystemStatsResponse> Stats()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var stats = _store.Read(db =>
        {
            var paidByCurrency = db.Reservations
                .Where(r => ReservationRules.Normalise(r.Status) != ReservationRules.Cancelled)
                .GroupBy(r => r.PricingSummary.Currency)
                .ToDictionary(
                    group => group.Key,
                    group => PricingCalculator.Round(group.Sum(r => r.PricingSummary.TotalAmount)),
                    StringComparer.Ordinal);

            var upcoming = db.Reservations.Count(r =>
                ReservationRules.IsActive(r.Status) && r.CheckInDate >= today);

            var averageRate = db.Listings.Count == 0
                ? 0
                : PricingCalculator.Round(db.Listings.Average(l => l.Pricing.BaseNightlyRate));

            return new SystemStatsResponse(
                TotalListings: db.Listings.Count,
                TotalReservations: db.Reservations.Count,
                TotalReviews: db.Reviews.Count,
                TotalFavorites: db.FavoriteIds.Count,
                SystemVersion: AppInfo.Version,
                ServerTimeUtc: DateTime.UtcNow,
                UptimeSeconds: db.UptimeSeconds,
                TotalPaidByCurrency: paidByCurrency,
                UpcomingReservations: upcoming,
                AverageNightlyRate: averageRate);
        });

        return Ok(stats);
    }

    /// <summary>The configured stage name and the ASP.NET Core environment.</summary>
    /// <response code="200">Stage, environment, version and timestamp.</response>
    [HttpGet("stage")]
    [ProducesResponseType(typeof(StageResponse), StatusCodes.Status200OK)]
    public ActionResult<StageResponse> Stage()
    {
        var stageName = _configuration.GetValue<string>("StageConfig:StageName")
                        ?? _environment.EnvironmentName.ToUpperInvariant();

        return Ok(new StageResponse(
            Stage: stageName,
            Environment: _environment.EnvironmentName,
            IsDevelopment: _environment.IsDevelopment(),
            IsProduction: _environment.IsProduction(),
            Version: AppInfo.Version,
            Timestamp: DateTime.UtcNow));
    }

    /// <summary>
    /// Restores the seeded catalogue. Available in Development, or when
    /// <c>DemoMode:ResetOnStart</c> is true; otherwise the route pretends not to exist.
    /// </summary>
    /// <response code="200">The reset succeeded and the new counts.</response>
    /// <response code="404">Reset is disabled in this environment.</response>
    [HttpPost("reset")]
    [ProducesResponseType(typeof(ResetResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    public ActionResult<ResetResponse> Reset()
    {
        var allowed = _environment.IsDevelopment()
                      || _configuration.GetValue("DemoMode:ResetOnStart", false);

        if (!allowed)
        {
            throw ApiException.NotFound("The reset endpoint is disabled in this environment.");
        }

        _store.Reset();

        var response = _store.Read(db => new ResetResponse(
            Reset: true,
            Listings: db.Listings.Count,
            Reservations: db.Reservations.Count,
            Reviews: db.Reviews.Count,
            Favorites: db.FavoriteIds.Count,
            Timestamp: DateTime.UtcNow));

        return Ok(response);
    }
}
