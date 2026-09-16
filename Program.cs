using StayHubApi.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSingleton<MockDataStore>();

var app = builder.Build();

// Enable static files (HTML, CSS, JS from wwwroot)
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Vacation Rental API v1");
    c.RoutePrefix = "swagger"; // Swagger is at /swagger, Beautiful UI is at /
});

app.UseAuthorization();
app.MapControllers();

app.Run();
