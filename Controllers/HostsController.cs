using Microsoft.AspNetCore.Mvc;
using StayHubApi.Models;
using StayHubApi.Services;

namespace StayHubApi.Controllers;

/// <summary>
/// The host directory. Unlike the prototype, hosts are served from their own store, so the client no
/// longer derives them from whatever the last search returned.
/// </summary>
[ApiController]
[Route("v1/hosts")]
[Produces("application/json")]
public class HostsController : ControllerBase
{
    private readonly HostService _hosts;

    public HostsController(HostService hosts)
    {
        _hosts = hosts;
    }

    /// <summary>All hosts, sorted by name, with weighted ratings and property counts.</summary>
    /// <response code="200">The host directory.</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<HostProfileResponse>), StatusCodes.Status200OK)]
    public ActionResult<List<HostProfileResponse>> GetAll()
        => Ok(_hosts.GetAll().ToList());

    /// <summary>One host profile.</summary>
    /// <param name="id">Host GUID.</param>
    /// <response code="200">The host.</response>
    /// <response code="404">No host has that id.</response>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(HostProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    public ActionResult<HostProfileResponse> GetById(Guid id)
        => Ok(_hosts.Get(id));

    /// <summary>Every stay managed by a host. An empty array is valid for a host with no stays.</summary>
    /// <param name="id">Host GUID.</param>
    /// <response code="200">The host's stays.</response>
    /// <response code="404">No host has that id.</response>
    [HttpGet("{id:guid}/listings")]
    [ProducesResponseType(typeof(List<ListingDetail>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    public ActionResult<List<ListingDetail>> GetListings(Guid id)
        => Ok(_hosts.GetListings(id).ToList());

    /// <summary>Stored verification flags, read from the host record rather than inferred.</summary>
    /// <param name="id">Host GUID.</param>
    /// <response code="200">Verification flags and the host's review aggregate.</response>
    /// <response code="404">No host has that id.</response>
    [HttpGet("{id:guid}/verification")]
    [ProducesResponseType(typeof(HostVerificationDetail), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    public ActionResult<HostVerificationDetail> GetVerification(Guid id)
        => Ok(_hosts.GetVerification(id));
}
