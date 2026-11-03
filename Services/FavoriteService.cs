using StayHubApi.Models;

namespace StayHubApi.Services;

/// <summary>
/// Saved stays. The existence check and the toggle run inside a single store lock, which removes the
/// read-then-write race in the prototype. The response is always 200 for both add and remove.
/// </summary>
public sealed class FavoriteService
{
    private readonly MockDataStore _store;

    public FavoriteService(MockDataStore store)
    {
        _store = store;
    }

    /// <summary>Saved stays as full listings, ordered by title.</summary>
    public List<ListingDetail> GetAll()
        => _store.Read(db => db.Listings
            .Where(l => db.FavoriteIds.Contains(l.Id))
            .OrderBy(l => l.Title, StringComparer.OrdinalIgnoreCase)
            .ToList());

    public FavoriteToggleResponse Toggle(Guid listingId)
        => _store.Modify(db =>
        {
            if (!db.Listings.Any(l => l.Id == listingId))
            {
                throw ApiException.NotFound($"Stay {listingId} was not found.");
            }

            var favorited = !db.FavoriteIds.Remove(listingId);
            if (favorited)
            {
                db.FavoriteIds.Add(listingId);
            }

            return new FavoriteToggleResponse(listingId, favorited);
        });
}
