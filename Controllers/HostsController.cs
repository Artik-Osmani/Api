using Microsoft.AspNetCore.Mvc;
using StayHubApi.Models;
using StayHubApi.Services;

namespace StayHubApi.Controllers;

[ApiController]
[Route("v1/hosts")]
[Produces("application/json")]
public class HostsController : ControllerBase
{
    private readonly MockDataStore _dataStore;

    public HostsController(MockDataStore dataStore)
    {
        _dataStore = dataStore;
    }

    [HttpGet("{id:guid}/verification")]
    public ActionResult<HostVerificationDetail> GetHostVerification(Guid id)
    {
        var listing = _dataStore.Listings.FirstOrDefault(l => l.Host.HostId == id);
        if (listing == null)
        {
            return NotFound(new { code = "RESOURCE_NOT_FOUND", message = $"Host {id} not found." });
        }

        return Ok(new HostVerificationDetail(
            HostId: id,
            IdentityStatus: listing.Host.VerifiedIdentity ? "verified" : "pending",
            PhoneVerified: true,
            EmailVerified: true,
            GovernmentIdVerified: listing.Host.VerifiedIdentity,
            BackgroundCheckCleared: listing.Host.SuperhostStatus,
            ReviewCount: listing.ReviewCount,
            AggregateRating: listing.StarRating
        ));
    }
}
