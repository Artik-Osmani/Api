# Vacation Rental & Booking API (Starter Project)

A complete, beginner-friendly starter API designed for school projects, combining features from **Airbnb** (home sharing, superhosts, custom amenities, host messaging) and **Booking.com** (real-time availability calendars, dynamic pricing matrices, occupancy taxes).
//artik
---

## 📁 Project Structure

```text
Api/
├── docs/
│   └── openapi.yaml               # Complete OpenAPI 3.0.3 YAML Specification
├── Controllers/
│   ├── ListingsController.cs       # Search, listing detail, and availability calendar endpoints
│   ├── HostsController.cs          # Host trust metrics and identity verification
│   └── ReservationsController.cs   # Booking execution and unified messaging
├── Models/
│   └── RentalModels.cs             # Strongly-typed C# domain models and DTOs
├── Services/
│   └── MockDataStore.cs            # In-memory database pre-seeded with sample listings and bookings
├── Program.cs                      # Application entry point with Swagger UI configuration
└── StayHubApi.csproj               # .NET 10 project definition
```

---

## 🚀 How to Run the Project

1. Open your terminal in this directory:
   ```bash
   dotnet run
   ```
2. Open your browser and navigate to:
   ```text
   http://localhost:5000/
   ```
   This opens the interactive **Swagger UI** where you can test all API endpoints live.

---

## 🔌 Core API Endpoints

| Method | Path | Description |
| :--- | :--- | :--- |
| `POST` | `/v1/listings/search` | Search listings with geospatial filters, amenities, and dates |
| `GET` | `/v1/listings/{id}` | Retrieve full property listing details and host stats |
| `GET` | `/v1/listings/{id}/availability` | Daily calendar availability, night rates, and minimum stays |
| `GET` | `/v1/hosts/{id}/verification` | Host trust metrics (identity, superhost status, response time) |
| `POST` | `/v1/reservations` | Create instant-book or request-to-book reservations |
| `GET` | `/v1/reservations/{id}` | Inspect reservation status and fee breakdowns |
| `POST` | `/v1/reservations/{id}/messages` | Send messages between guests and hosts |

---

## 📄 OpenAPI Specification File
The complete OpenAPI specification is located at:
- `docs/openapi.yaml`


## This project is made by Artik Osmani, Arber Miftari, Dalmat Ademi, Arber Beqiri, Jon Ferizi
