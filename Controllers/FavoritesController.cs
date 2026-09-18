using Microsoft.AspNetCore.Mvc;
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
    public ActionResult<IEnumerable<object>> GetFavorites()
    {
        var favs = _store.Listings.Where(l => _store.FavoriteIds.Contains(l.Id)).ToList();
        return Ok(favs);
    }

    [HttpPost("{listingId:guid}")]
    public ActionResult ToggleFavorite(Guid listingId)
    {
        if (!_store.Listings.Any(l => l.Id == listingId))
            return NotFound(new { code = "NOT_FOUND", message = "Listing not found" });

        bool isFav;
        if (_store.FavoriteIds.Contains(listingId))
        {
            _store.FavoriteIds.Remove(listingId);
            isFav = false;
        }
        else
        {
            _store.FavoriteIds.Add(listingId);
            isFav = true;
        }
        return Ok(new { listingId, favorited = isFav });
    }
}
