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
    private readonly TimeProvider _timeProvider;
    private readonly long _startedAt;

    public MockDataStore(TimeProvider? timeProvider = null)
    {
        _timeProvider = timeProvider ?? TimeProvider.System;
        ServerStartTimeUtc = _timeProvider.GetUtcNow().UtcDateTime;
        _startedAt = _timeProvider.GetTimestamp();
        Reset();
    }

    public DateTime ServerStartTimeUtc { get; }

    public List<ListingDetail> Listings { get; private set; } = [];

    public List<HostRecord> Hosts { get; private set; } = [];

    public List<Reservation> Reservations { get; private set; } = [];

    public List<Message> Messages { get; private set; } = [];

    public List<Review> Reviews { get; private set; } = [];

    public HashSet<Guid> FavoriteIds { get; private set; } = [];

    /// <summary>Whole seconds since store initialization, unaffected by clock changes or demo resets.</summary>
    public int UptimeSeconds => (int)Math.Clamp(
        _timeProvider.GetElapsedTime(_startedAt).TotalSeconds, 0, int.MaxValue);

    /// <summary>Replaces every collection with a fresh seed. Idempotent and lock protected.</summary>
    public void Reset()
    {
        lock (_lock)
        {
            var snapshot = SeedData.Build(_timeProvider.GetUtcNow().UtcDateTime);
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
