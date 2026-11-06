using StayHubApi.Models;

namespace StayHubApi.Services;

/// <summary>
/// The host directory. Hosts exist independently of listings, so a host with zero stays still
/// resolves. The aggregate rating is weighted by review count, never a simple average of listing
/// averages, and the verification flags come from the stored <see cref="HostVerification"/> record.
/// </summary>
public sealed class HostService
{
    private readonly MockDataStore _store;

    public HostService(MockDataStore store)
    {
        _store = store;
    }

    public IReadOnlyList<HostProfileResponse> GetAll()
        => _store.Read(db => db.Hosts
            .OrderBy(h => h.Details.Name, StringComparer.OrdinalIgnoreCase)
            .Select(h => BuildProfile(db, h))
            .ToList());

    public HostProfileResponse Get(Guid id)
        => _store.Read(db => BuildProfile(db, FindHost(db, id)));

    public IReadOnlyList<ListingDetail> GetListings(Guid id)
        => _store.Read(db =>
        {
            _ = FindHost(db, id);
            return db.Listings
                .Where(l => l.Host.HostId == id)
                .OrderBy(l => l.Title, StringComparer.OrdinalIgnoreCase)
                .ToList();
        });

    public HostVerificationDetail GetVerification(Guid id)
        => _store.Read(db =>
        {
            var host = FindHost(db, id);
            var listings = db.Listings.Where(l => l.Host.HostId == id).ToList();
            var (rating, reviews) = Aggregate(listings);

            return new HostVerificationDetail(
                HostId: id,
                IdentityStatus: host.Verification.GovernmentIdVerified ? "verified" : "pending",
                PhoneVerified: host.Verification.PhoneVerified,
                EmailVerified: host.Verification.EmailVerified,
                GovernmentIdVerified: host.Verification.GovernmentIdVerified,
                BackgroundCheckCleared: host.Verification.BackgroundCheckCleared,
                ReviewCount: reviews,
                AggregateRating: rating);
        });

    private static HostRecord FindHost(MockDataStore db, Guid id)
        => db.Hosts.FirstOrDefault(h => h.Details.HostId == id)
           ?? throw ApiException.NotFound($"Host {id} was not found.");

    private static HostProfileResponse BuildProfile(MockDataStore db, HostRecord host)
    {
        var listings = db.Listings.Where(l => l.Host.HostId == host.Details.HostId).ToList();
        var (rating, reviews) = Aggregate(listings);
        var details = host.Details;

        return new HostProfileResponse(
            HostId: details.HostId,
            Name: details.Name,
            ProfilePhotoUrl: details.ProfilePhotoUrl,
            ResponseRate: details.ResponseRate,
            ResponseTimeMinutes: details.ResponseTimeMinutes,
            SuperhostStatus: details.SuperhostStatus,
            VerifiedIdentity: details.VerifiedIdentity,
            TotalProperties: listings.Count,
            AggregateRating: rating,
            TotalReviewsReceived: reviews,
            Bio: host.Bio,
            JoinedYear: host.JoinedYear);
    }

    private static (double Rating, int Reviews) Aggregate(IReadOnlyCollection<ListingDetail> listings)
    {
        var reviews = listings.Sum(l => l.ReviewCount);
        if (reviews == 0)
        {
            return (0, 0);
        }

        var weighted = listings.Sum(l => l.StarRating * l.ReviewCount) / reviews;
        return (Math.Round(weighted, 2, MidpointRounding.AwayFromZero), reviews);
    }
}
