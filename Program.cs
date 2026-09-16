using StayHubApi.Services;

var builder = WebApplication.CreateBuilder(args);

var stageName = builder.Configuration.GetValue<string>("StageConfig:StageName") 
                ?? (builder.Environment.IsDevelopment() ? "DEV" : "PROD");

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddSingleton<MockDataStore>();

var app = builder.Build();

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

app.MapGet("/v1/system/stage", (IConfiguration config, IWebHostEnvironment env) =>
{
    return Results.Ok(new
    {
        stage = stageName,
        environment = env.EnvironmentName,
        isDevelopment = env.IsDevelopment(),
        isProduction = env.IsProduction(),
        timestamp = DateTime.UtcNow
    });
});

app.UseAuthorization();
app.MapControllers();

app.Run();
