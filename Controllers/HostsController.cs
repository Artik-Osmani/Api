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

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(HostProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult<HostProfileResponse> GetHostProfile(Guid id)
    {
        var hostListings = _dataStore.Read(db => db.Listings.Where(l => l.Host.HostId == id).ToList());
        if (hostListings.Count == 0)
        {
            return NotFound(new { code = "RESOURCE_NOT_FOUND", message = $"Host {id} not found." });
        }

        var sample = hostListings.First().Host;
        var totalReviews = hostListings.Sum(l => l.ReviewCount);
        var avgRating = Math.Round(hostListings.Average(l => l.StarRating), 2);

        return Ok(new HostProfileResponse(
            HostId: id,
            Name: sample.Name,
            ProfilePhotoUrl: sample.ProfilePhotoUrl,
            ResponseRate: sample.ResponseRate,
            ResponseTimeMinutes: sample.ResponseTimeMinutes,
            SuperhostStatus: sample.SuperhostStatus,
            VerifiedIdentity: sample.VerifiedIdentity,
            TotalProperties: hostListings.Count,
            AggregateRating: avgRating,
            TotalReviewsReceived: totalReviews
        ));
    }

    [HttpGet("{id:guid}/listings")]
    [ProducesResponseType(typeof(List<ListingDetail>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult<List<ListingDetail>> GetHostListings(Guid id)
    {
        var listings = _dataStore.Read(db => db.Listings.Where(l => l.Host.HostId == id).ToList());
        if (listings.Count == 0)
        {
            return NotFound(new { code = "RESOURCE_NOT_FOUND", message = $"Host {id} not found." });
        }

        return Ok(listings);
    }

    [HttpGet("{id:guid}/verification")]
    [ProducesResponseType(typeof(HostVerificationDetail), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult<HostVerificationDetail> GetHostVerification(Guid id)
    {
        var hostListings = _dataStore.Read(db => db.Listings.Where(l => l.Host.HostId == id).ToList());
        if (hostListings.Count == 0)
        {
            return NotFound(new { code = "RESOURCE_NOT_FOUND", message = $"Host {id} not found." });
        }

        var listing = hostListings.First();
        var totalReviews = hostListings.Sum(l => l.ReviewCount);
        var avgRating = Math.Round(hostListings.Average(l => l.StarRating), 2);

        return Ok(new HostVerificationDetail(
            HostId: id,
            IdentityStatus: listing.Host.VerifiedIdentity ? "verified" : "pending",
            PhoneVerified: true,
            EmailVerified: true,
            GovernmentIdVerified: listing.Host.VerifiedIdentity,
            BackgroundCheckCleared: listing.Host.SuperhostStatus,
            ReviewCount: totalReviews,
            AggregateRating: avgRating
        ));
    }
}
