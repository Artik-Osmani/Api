using StayHubApi.Models;

namespace StayHubApi.Services;

/// <summary>
/// The in-memory database. All reads and writes go through the same lock, so the seeded data and
/// every mutation are thread safe. <see cref="Reset"/> rebuilds the catalogue from
/// <see cref="SeedData"/>; <c>POST /v1/system/reset</c> and the test fixture use it.
/// </summary>
public class MockDataStore
{
    private readonly object _lock = new();

    public MockDataStore()
    {
        Reset();
    }

    public DateTime ServerStartTimeUtc { get; } = DateTime.UtcNow;

    public List<ListingDetail> Listings { get; private set; } = [];

    public List<HostRecord> Hosts { get; private set; } = [];

    public List<Reservation> Reservations { get; private set; } = [];

    public List<Message> Messages { get; private set; } = [];

    public List<Review> Reviews { get; private set; } = [];

    public HashSet<Guid> FavoriteIds { get; private set; } = [];

    /// <summary>Whole seconds since the process (not the last reset) started.</summary>
    public int UptimeSeconds => (int)Math.Max(0, (DateTime.UtcNow - ServerStartTimeUtc).TotalSeconds);

    /// <summary>Replaces every collection with a fresh seed. Idempotent and lock protected.</summary>
    public void Reset()
    {
        lock (_lock)
        {
            var snapshot = SeedData.Build(DateTime.UtcNow);
            Listings = snapshot.Listings;
            Hosts = snapshot.Hosts;
            Reservations = snapshot.Reservations;
            Reviews = snapshot.Reviews;
            Messages = snapshot.Messages;
            FavoriteIds = snapshot.FavoriteIds;
        }
    }

    /// <summary>Runs a read-only function under the store lock.</summary>
    public T Read<T>(Func<MockDataStore, T> action)
    {
        lock (_lock)
        {
            return action(this);
        }
    }

    /// <summary>Runs a mutation under the store lock.</summary>
    public void Modify(Action<MockDataStore> action)
    {
        lock (_lock)
        {
            action(this);
        }
    }

    /// <summary>Runs a mutation and returns its result under the same lock.</summary>
    public T Modify<T>(Func<MockDataStore, T> action)
    {
        lock (_lock)
        {
            return action(this);
        }
    }
}
