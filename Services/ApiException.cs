namespace StayHubApi.Services;

using StayHubApi.Models;

/// <summary>
/// A deliberate, mapped failure. Controllers and services throw this instead of building
/// anonymous error bodies, and the exception middleware turns it into an <see cref="ApiError"/>.
/// </summary>
public sealed class ApiException : Exception
{
    public ApiException(
        int statusCode,
        string code,
        string message,
        IReadOnlyDictionary<string, string[]>? fieldErrors = null,
        object? details = null)
        : base(message)
    {
        StatusCode = statusCode;
        Code = code;
        FieldErrors = fieldErrors;
        Details = details;
    }

    public int StatusCode { get; }
    public string Code { get; }
    public IReadOnlyDictionary<string, string[]>? FieldErrors { get; }
    public object? Details { get; }

    public static ApiException NotFound(string message)
        => new(StatusCodes.Status404NotFound, ErrorCodes.ResourceNotFound, message);

    public static ApiException BadRequest(string message)
        => new(StatusCodes.Status400BadRequest, ErrorCodes.ValidationFailed, message);

    public static ApiException Validation(
        string field,
        string message,
        string code = ErrorCodes.ValidationFailed)
        => new(
            StatusCodes.Status422UnprocessableEntity,
            code,
            message,
            new Dictionary<string, string[]> { [field] = [message] });

    public static ApiException Validation(
        IReadOnlyDictionary<string, string[]> fieldErrors,
        string message = "One or more fields are invalid.",
        string code = ErrorCodes.ValidationFailed)
        => new(StatusCodes.Status422UnprocessableEntity, code, message, fieldErrors);

    public static ApiException Conflict(string code, string message, object? details = null)
        => new(StatusCodes.Status409Conflict, code, message, details: details);

    public static ApiException Unprocessable(string code, string message, object? details = null)
        => new(StatusCodes.Status422UnprocessableEntity, code, message, details: details);
}
