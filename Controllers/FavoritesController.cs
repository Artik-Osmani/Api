using Microsoft.AspNetCore.Mvc;
using StayHubApi.Models;
using StayHubApi.Services;

namespace StayHubApi.Controllers;

[ApiController]
[Route("v1/favorites")]
[Produces("application/json")]
public class FavoritesController : ControllerBase
{
    private readonly MockDataStore _store;
    public FavoritesController(MockDataStore store) => _store = store;

    [HttpGet]
    [ProducesResponseType(typeof(List<ListingDetail>), StatusCodes.Status200OK)]
    public ActionResult<List<ListingDetail>> GetFavorites()
    {
        var favs = _store.Read(db => db.Listings.Where(l => db.FavoriteIds.Contains(l.Id)).ToList());
        return Ok(favs);
    }

    [HttpPost("{listingId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult ToggleFavorite(Guid listingId)
    {
        var exists = _store.Read(db => db.Listings.Any(l => l.Id == listingId));
        if (!exists)
            return NotFound(new { code = "RESOURCE_NOT_FOUND", message = "Listing not found" });

        bool isFav = _store.Modify(db =>
        {
            if (db.FavoriteIds.Contains(listingId))
            {
                db.FavoriteIds.Remove(listingId);
                return false;
            }
            else
            {
                db.FavoriteIds.Add(listingId);
                return true;
            }
        });

        return Ok(new { listingId, favorited = isFav });
    }
}

