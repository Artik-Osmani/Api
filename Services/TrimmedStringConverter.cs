using System.Text.Json;
using System.Text.Json.Serialization;

namespace StayHubApi.Services;

/// <summary>Trims JSON strings before model validation, including nested guest and address fields.</summary>
public sealed class TrimmedStringConverter : JsonConverter<string>
{
    /// <inheritdoc />
    public override string? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        => reader.GetString()?.Trim();

    /// <inheritdoc />
    public override void Write(Utf8JsonWriter writer, string value, JsonSerializerOptions options)
        => writer.WriteStringValue(value);
}
