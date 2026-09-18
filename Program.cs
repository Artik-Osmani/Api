using StayHubApi.Middleware;
using StayHubApi.Services;

var builder = WebApplication.CreateBuilder(args);

var stageName = builder.Configuration.GetValue<string>("StageConfig:StageName")
                ?? (builder.Environment.IsDevelopment() ? "DEV" : "PROD");

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSingleton<MockDataStore>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("DevPolicy", p => p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
    options.AddPolicy("ProdPolicy", p => p.WithOrigins("https://fatihomes.example.com").AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();

app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseMiddleware<RateLimitMiddleware>();

if (app.Environment.IsDevelopment())
    app.UseCors("DevPolicy");
else
    app.UseCors("ProdPolicy");

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", $"FatiHomes API ({stageName})");
    c.RoutePrefix = "swagger";
    c.DocumentTitle = $"FatiHomes [{stageName}] - API Docs";
    c.InjectStylesheet("/swagger-custom.css");
    c.DefaultModelsExpandDepth(-1);
    c.DocExpansion(Swashbuckle.AspNetCore.SwaggerUI.DocExpansion.List);
});

app.MapGet("/v1/system/stage", (IWebHostEnvironment env) => Results.Ok(new
{
    stage = stageName,
    environment = env.EnvironmentName,
    isDevelopment = env.IsDevelopment(),
    isProduction = env.IsProduction(),
    timestamp = DateTime.UtcNow
}));

app.UseAuthorization();
app.MapControllers();
app.Run();
