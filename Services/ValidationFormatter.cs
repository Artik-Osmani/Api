using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace StayHubApi.Services;

/// <summary>
/// Turns ASP.NET Core model state into the camelCase field map used by <see cref="Models.ApiError"/>.
/// The key path mirrors the JSON request, for example <c>primaryGuest.firstName</c>.
/// </summary>
public static class ValidationFormatter
{
    public static Dictionary<string, string[]> ToFieldErrors(ModelStateDictionary modelState)
    {
        var errors = new Dictionary<string, string[]>(StringComparer.Ordinal);

        foreach (var pair in modelState)
        {
            if (pair.Value is null || pair.Value.Errors.Count == 0)
            {
                continue;
            }

            var key = ToCamelCasePath(pair.Key);
            var messages = pair.Value.Errors
                .Select(error => string.IsNullOrWhiteSpace(error.ErrorMessage)
                    ? "The value is invalid."
                    : error.ErrorMessage)
                .Distinct(StringComparer.Ordinal)
                .ToArray();

            if (errors.TryGetValue(key, out var existing))
            {
                errors[key] = existing.Concat(messages).Distinct(StringComparer.Ordinal).ToArray();
            }
            else
            {
                errors[key] = messages;
            }
        }

        return errors;
    }

    public static string ToCamelCasePath(string key)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            return "request";
        }

        return string.Join('.', key.Split('.', StringSplitOptions.RemoveEmptyEntries)
            .Select(segment => char.ToLowerInvariant(segment[0]) + segment[1..]));
    }
}
