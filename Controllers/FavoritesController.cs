using Microsoft.AspNetCore.Mvc;
using StayHubApi.Models;
using StayHubApi.Services;

namespace StayHubApi.Controllers;

/// <summary>
/// Saved stays. The list is independent of the current search: it returns full listings ordered by
/// title, and the toggle is atomic.
/// </summary>
[ApiController]
[Route("v1/favorites")]
[Produces("application/json")]
public class FavoritesController : ControllerBase
{
    private readonly FavoriteService _favorites;

    public FavoritesController(FavoriteService favorites)
    {
        _favorites = favorites;
    }

    /// <summary>Saved stays as full listings, ordered by title.</summary>
    /// <response code="200">The saved stays.</response>
    [HttpGet]
    [ProducesResponseType(typeof(List<ListingDetail>), StatusCodes.Status200OK)]
    public ActionResult<List<ListingDetail>> GetAll()
        => Ok(_favorites.GetAll());

    /// <summary>Toggles one stay. Adding and removing both return 200 with the new state.</summary>
    /// <param name="listingId">Listing GUID.</param>
    /// <response code="200">The new state.</response>
    /// <response code="404">No stay has that id.</response>
    [HttpPost("{listingId:guid}")]
    [ProducesResponseType(typeof(FavoriteToggleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiError), StatusCodes.Status404NotFound)]
    public ActionResult<FavoriteToggleResponse> Toggle(Guid listingId)
        => Ok(_favorites.Toggle(listingId));
}
