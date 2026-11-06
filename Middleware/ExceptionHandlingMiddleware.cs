using Microsoft.AspNetCore.Mvc.ModelBinding;
using System.Text.Json;
using StayHubApi.Models;
using StayHubApi.Services;

namespace StayHubApi.Middleware;

/// <summary>
/// The last line of defence. Deliberate <see cref="ApiException"/> failures keep their status and
/// stable code; model binding and malformed JSON failures become <c>VALIDATION_FAILED</c>; anything
/// else becomes a 500 with a generic sentence and the trace id. Stack traces are never returned.
/// </summary>
public class ExceptionHandlingMiddleware
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _configuration;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger,
        IWebHostEnvironment environment,
        IConfiguration configuration)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
        _configuration = configuration;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ApiException exception)
        {
            if (exception.StatusCode >= 500)
            {
                _logger.LogError(exception, "API failure {Code} on {Method} {Path}",
                    exception.Code, context.Request.Method, context.Request.Path);
            }

            await WriteAsync(
                context,
                exception.StatusCode,
                new ApiError(
                    exception.Code,
                    exception.Message,
                    context.TraceIdentifier,
                    exception.FieldErrors,
                    exception.Details));
        }
        catch (UnsupportedContentTypeException)
        {
            await WriteAsync(
                context,
                StatusCodes.Status415UnsupportedMediaType,
                new ApiError(
                    ErrorCodes.UnsupportedMediaType,
                    "Send the request body as application/json.",
                    context.TraceIdentifier));
        }
        catch (BadHttpRequestException)
        {
            await WriteAsync(
                context,
                StatusCodes.Status400BadRequest,
                new ApiError(
                    ErrorCodes.ValidationFailed,
                    "The request body could not be read. Check the JSON and try again.",
                    context.TraceIdentifier));
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Unhandled exception on {Method} {Path}",
                context.Request.Method, context.Request.Path);

            var detailed = _environment.IsDevelopment()
                           && _configuration.GetValue("StageConfig:EnableDetailedErrors", false);

            await WriteAsync(
                context,
                StatusCodes.Status500InternalServerError,
                new ApiError(
                    ErrorCodes.InternalServerError,
                    "Something went wrong on our side. Try again, and quote the trace id if it keeps happening.",
                    context.TraceIdentifier,
                    Details: detailed ? new { exception = exception.Message } : null));
        }
    }

    private static async Task WriteAsync(HttpContext context, int statusCode, ApiError error)
    {
        if (context.Response.HasStarted)
        {
            return;
        }

        context.Response.Clear();
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json; charset=utf-8";
        context.Response.Headers.CacheControl = "no-store";

        await context.Response.WriteAsync(JsonSerializer.Serialize(error, JsonOptions));
    }
}
