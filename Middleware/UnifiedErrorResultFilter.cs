using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using StayHubApi.Models;

namespace StayHubApi.Middleware;

/// <summary>
/// MVC produces a couple of errors outside the controller bodies, most notably 415 for an unsupported
/// content type. This filter rewrites any RFC 9110 <see cref="ProblemDetails"/> result into the single
/// <see cref="ApiError"/> envelope so the client only ever parses one shape.
/// </summary>
public sealed class UnifiedErrorResultFilter : IAlwaysRunResultFilter
{
    public void OnResultExecuting(ResultExecutingContext context)
    {
        if (context.Result is not ObjectResult { Value: ProblemDetails problem } result
            || result.StatusCode is null or < 400)
        {
            return;
        }

        var statusCode = result.StatusCode.Value;
        var error = new ApiError(
            CodeForStatus(statusCode),
            string.IsNullOrWhiteSpace(problem.Title) ? "The request could not be processed." : problem.Title,
            context.HttpContext.TraceIdentifier);

        context.Result = new ObjectResult(error)
        {
            StatusCode = statusCode,
            ContentTypes = { "application/json" }
        };
    }

    public void OnResultExecuted(ResultExecutedContext context)
    {
    }

    private static string CodeForStatus(int statusCode) => statusCode switch
    {
        StatusCodes.Status415UnsupportedMediaType => ErrorCodes.UnsupportedMediaType,
        StatusCodes.Status404NotFound => ErrorCodes.ResourceNotFound,
        StatusCodes.Status401Unauthorized or StatusCodes.Status403Forbidden => ErrorCodes.ValidationFailed,
        StatusCodes.Status500InternalServerError => ErrorCodes.InternalServerError,
        _ => ErrorCodes.ValidationFailed
    };
}
