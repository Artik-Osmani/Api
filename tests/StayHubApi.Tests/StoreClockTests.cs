using StayHubApi.Services;
using Xunit;

namespace StayHubApi.Tests;

public class StoreClockTests
{
    [Fact]
    public void Uptime_UsesElapsedTimeWhenWallClockMovesBackwards()
    {
        var clock = new ManualClock();
        var store = new MockDataStore(clock);
        var startedAt = store.ServerStartTimeUtc;

        clock.Advance(TimeSpan.FromMilliseconds(2900));
        clock.UtcNow -= TimeSpan.FromHours(1);

        Assert.Equal(2, store.UptimeSeconds);
        Assert.Equal(startedAt, store.ServerStartTimeUtc);
    }

    [Fact]
    public void Reset_RestoresDataWithoutRestartingUptime()
    {
        var clock = new ManualClock();
        var store = new MockDataStore(clock);
        var startedAt = store.ServerStartTimeUtc;
        store.Modify(db => db.FavoriteIds.Clear());
        clock.Advance(TimeSpan.FromSeconds(12));

        store.Reset();

        Assert.Equal(12, store.UptimeSeconds);
        Assert.Equal(startedAt, store.ServerStartTimeUtc);
        Assert.Equal(2, store.Read(db => db.FavoriteIds.Count));
    }

    private sealed class ManualClock : TimeProvider
    {
        private long _timestamp;
        public DateTimeOffset UtcNow { get; set; } = new(2026, 11, 5, 12, 0, 0, TimeSpan.Zero);
        public override long TimestampFrequency => TimeSpan.TicksPerSecond;
        public override long GetTimestamp() => _timestamp;
        public override DateTimeOffset GetUtcNow() => UtcNow;

        public void Advance(TimeSpan elapsed)
        {
            _timestamp += elapsed.Ticks;
            UtcNow += elapsed;
        }
    }
}
