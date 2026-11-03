using System.Reflection;

namespace StayHubApi.Services;

/// <summary>
/// Single source of truth for the assembly version shown in the health check, the stats payload
/// and the Swagger document. It comes from the assembly informational version, not a literal.
/// </summary>
public static class AppInfo
{
    public static string Version { get; } = Resolve();

    private static string Resolve()
    {
        var assembly = typeof(AppInfo).Assembly;
        var informational = assembly.GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion;
        var version = string.IsNullOrWhiteSpace(informational)
            ? assembly.GetName().Version?.ToString(3)
            : informational.Split('+')[0];
        return string.IsNullOrWhiteSpace(version) ? "0.0.0" : version;
    }
}
