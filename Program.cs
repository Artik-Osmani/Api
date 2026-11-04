using System.IO.Compression;
using System.Reflection;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi;
using StayHubApi.Middleware;
using StayHubApi.Models;
using StayHubApi.Services;

var builder = WebApplication.CreateBuilder(args);

var stageName = builder.Configuration.GetValue<string>("StageConfig:StageName")
                ?? (builder.Environment.IsDevelopment() ? "DEV" : "PROD");

builder.Services
    .AddControllers(options =>
    {
        // Rewrites any MVC-generated ProblemDetails into the single ApiError envelope.
        options.Filters.Add<UnifiedErrorResultFilter>();
    })
    .AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new TrimmedStringConverter()))
    .ConfigureApiBehaviorOptions(options =>
    {
        // Model binding and DataAnnotations failures use the same envelope as every other error.
        options.InvalidModelStateResponseFactory = context =>
        {
            var error = new ApiError(
                ErrorCodes.ValidationFailed,
                "One or more fields are invalid.",
                context.HttpContext.TraceIdentifier,
                ValidationFormatter.ToFieldErrors(context.ModelState));

            return new ObjectResult(error)
            {
                StatusCode = StatusCodes.Status400BadRequest,
                ContentTypes = { "application/json" }
            };
        };
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "FatiHomes API",
        Version = AppInfo.Version,
        Description =
            "REST API for eighteen stays across Kosovo, Albania and the coast. Quote and create share " +
            "one pricing calculator, every error uses one envelope, and the catalogue is EUR only.",
        Contact = new OpenApiContact
        {
            Name = "FatiHomes",
            Email = "hello@fatihomes.example",
            Url = new Uri("https://fatihomes.example.com")
        },
        License = new OpenApiLicense
        {
            Name = "MIT",
            Url = new Uri("https://opensource.org/licenses/MIT")
        }
    });

    var xmlPath = Path.Combine(
        AppContext.BaseDirectory,
        $"{Assembly.GetExecutingAssembly().GetName().Name}.xml");
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath, includeControllerXmlComments: true);
    }
});

builder.Services.AddSingleton<MockDataStore>();
builder.Services.AddSingleton<PricingCalculator>();
builder.Services.AddSingleton<CatalogService>();
builder.Services.AddSingleton<ListingSearchService>();
builder.Services.AddSingleton<ReservationService>();
builder.Services.AddSingleton<HostService>();
builder.Services.AddSingleton<FavoriteService>();

builder.Services.Configure<RateLimitOptions>(
    builder.Configuration.GetSection(RateLimitOptions.SectionName));

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options =>
{
    options.AddPolicy("AppPolicy", policy =>
    {
        if (allowedOrigins.Length == 0)
        {
            policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
            return;
        }

        policy.WithOrigins(allowedOrigins).AllowAnyMethod().AllowAnyHeader();
    });
});

builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
    options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(
    [
        "application/json",
        "application/manifest+json",
        "image/svg+xml",
        "text/markdown"
    ]);
});

builder.Services.Configure<BrotliCompressionProviderOptions>(
    options => options.Level = CompressionLevel.Fastest);
builder.Services.Configure<GzipCompressionProviderOptions>(
    options => options.Level = CompressionLevel.Fastest);

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Configuration.GetValue("ReverseProxy:Enabled", false))
{
    app.UseForwardedHeaders(new ForwardedHeadersOptions
    {
        ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
    });
}

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();

    // No certificate is provisioned for the course demo, so the redirect is opt-in.
    if (app.Configuration.GetValue("Https:Redirect", false))
    {
        app.UseHttpsRedirection();
    }
}

app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseResponseCompression();

app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = context =>
    {
        var extension = Path.GetExtension(context.File.Name).ToLowerInvariant();
        var headers = context.Context.Response.Headers;

        headers.CacheControl = extension switch
        {
            ".woff2" or ".webp" or ".png" or ".ico" => "public, max-age=2592000",
            ".css" or ".js" or ".svg" => "public, max-age=3600",
            _ => "no-cache"
        };
    }
});

// Static files are served above this line, so they never consume the API budget.
app.UseMiddleware<RateLimitMiddleware>();
app.UseCors("AppPolicy");

// Routing failures (including 404 and 405) must use the same envelope as controller errors.
app.UseStatusCodePages(async statusContext =>
{
    var context = statusContext.HttpContext;
    if (!context.Request.Path.StartsWithSegments("/v1"))
    {
        return;
    }

    var status = context.Response.StatusCode;
    context.Response.Headers.CacheControl = "no-store";
    await context.Response.WriteAsJsonAsync(new ApiError(
        status == 404 ? ErrorCodes.ResourceNotFound : ErrorCodes.ValidationFailed,
        status == 404 ? "This API resource does not exist." : "This request is not supported by this resource.",
        context.TraceIdentifier));
});

app.UseSwagger(options =>
{
    options.RouteTemplate = "swagger/{documentName}/swagger.json";
});
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", $"FatiHomes API v{AppInfo.Version} ({stageName})");
    options.RoutePrefix = "swagger";
    options.DocumentTitle = "FatiHomes API documentation";
    options.InjectStylesheet("/swagger-custom.css?v=5");
    options.DefaultModelsExpandDepth(-1);
    options.DocExpansion(Swashbuckle.AspNetCore.SwaggerUI.DocExpansion.List);
    options.EnableDeepLinking();
    options.ShowExtensions();
    options.DisplayRequestDuration();
});

app.MapControllers();

app.Run();

/// <summary>Entry point marker used by <c>WebApplicationFactory&lt;Program&gt;</c> in the test project.</summary>
public partial class Program
{
}
