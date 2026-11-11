using Microsoft.AspNetCore.Mvc;
using StayHubApi.Models;
using StayHubApi.Services;

namespace StayHubApi.Controllers;

[ApiController]
[Route("v1/system")]
[Produces("application/json")]
public class SystemController : ControllerBase
{
    private readonly MockDataStore _dataStore;

    public SystemController(MockDataStore dataStore)
    {
        _dataStore = dataStore;
    }

    [HttpGet("health")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult GetHealth()
    {
        return Ok(new
        {
            status = "Healthy",
            service = "StayHub Vacation Rental API",
            timestamp = DateTime.UtcNow
        });
    }

    [HttpGet("stats")]
    [ProducesResponseType(typeof(SystemStatsResponse), StatusCodes.Status200OK)]
    public ActionResult<SystemStatsResponse> GetStats()
    {
        var stats = _dataStore.Read(db => new SystemStatsResponse(
            TotalListings: db.Listings.Count,
            TotalReservations: db.Reservations.Count,
            TotalReviews: db.Reviews.Count,
            TotalFavorites: db.FavoriteIds.Count,
            SystemVersion: "2.0.0",
            ServerTimeUtc: DateTime.UtcNow,
            Uptime: DateTime.UtcNow - db.ServerStartTimeUtc
        ));

        return Ok(stats);
    }
}
