using Microsoft.AspNetCore.Mvc;
using StayHubApi.Models;
using StayHubApi.Services;

namespace StayHubApi.Controllers;

/// <summary>
/// Manages user favorites and wishlist items.
/// </summary>
[ApiController]
[Route("v1/favorites")]
[Produces("application/json")]
public class FavoritesController : ControllerBase
{
    private readonly MockDataStore _store;
    public FavoritesController(MockDataStore store) => _store = store;

    /// <summary>
    /// Retrieves all listings currently saved in the user's wishlist.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<ListingDetail>), StatusCodes.Status200OK)]
    public ActionResult<List<ListingDetail>> GetFavorites()
    {
        var favs = _store.Read(db => db.Listings.Where(l => db.FavoriteIds.Contains(l.Id)).ToList());
        return Ok(favs);
    }

    /// <summary>
    /// Toggles favorite status for a given listing.
    /// </summary>
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

    /// <summary>
    /// Explicitly removes a listing from the user's wishlist.
    /// </summary>
    [HttpDelete("{listingId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public ActionResult RemoveFavorite(Guid listingId)
    {
        var exists = _store.Read(db => db.FavoriteIds.Contains(listingId));
        if (!exists)
            return NotFound(new { code = "RESOURCE_NOT_FOUND", message = "Listing not found in favorites" });

        _store.Modify(db => db.FavoriteIds.Remove(listingId));
        return Ok(new { listingId, favorited = false, message = "Removed from wishlist" });
    }

    /// <summary>
    /// Clears all listings from the user's wishlist.
    /// </summary>
    [HttpDelete]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public ActionResult ClearFavorites()
    {
        var count = _store.Modify(db =>
        {
            var c = db.FavoriteIds.Count;
            db.FavoriteIds.Clear();
            return c;
        });

        return Ok(new { clearedCount = count, message = "All favorites cleared successfully" });
    }
}

