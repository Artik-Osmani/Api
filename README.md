# Vacation Rental & Booking API (StayHub / FatiHomes)

An enterprise-grade, high-performance REST API combining key features from **Airbnb** (home sharing, host messaging, user reviews, dynamic amenities) and **Booking.com** (real-time booked date conflict checking, daily calendar availability matrices, length-of-stay discounts, occupancy taxes).

---

## 📁 Project Structure

```text
Api/
├── Controllers/
│   ├── ListingsController.cs       # Search, CRUD, reviews, and reservation-aware availability
│   ├── HostsController.cs          # Host profiles, host properties, and trust verification
│   ├── ReservationsController.cs   # Booking execution, conflict detection, discounts, cancellations
│   ├── FavoritesController.cs      # User wishlist and favorite property toggles
│   └── SystemController.cs         # System health check, platform stats, and uptime
├── Middleware/
│   ├── ExceptionHandlingMiddleware.cs # RFC 7807 standardized error handling
│   ├── RateLimitMiddleware.cs         # IP sliding window rate limiting
│   └── SecurityHeadersMiddleware.cs   # OWASP secure headers (CSP, HSTS, frame protection)
├── Models/
│   └── RentalModels.cs             # Strongly-typed domain models, requests, and DTOs
├── Services/
│   └── MockDataStore.cs            # Thread-safe in-memory database with pre-seeded listings, reviews & bookings
├── wwwroot/                        # Integrated web application frontend & Swagger assets
├── Program.cs                      # Application pipeline, SwaggerGen, and middleware
└── StayHubApi.csproj               # .NET 10 project definition with XML docs enabled
```

---

## 🚀 How to Run the Project

1. Open your terminal in this directory:
   ```bash
   dotnet run
   ```
2. Open your browser and navigate to:
   ```text
   http://localhost:5000/swagger
   ```
   This opens the interactive **Swagger UI** with live testing and XML documentation for all endpoints.

---

## 🔌 Core API Endpoints

### 🏡 Listings
| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/v1/listings` | Fetch all properties (supports `limit`) |
| `POST` | `/v1/listings/search` | Search with text query, price range, bedrooms/baths, amenities, sorting, and pagination |
| `GET` | `/v1/listings/{id}` | Retrieve property details |
| `POST` | `/v1/listings` | Create a new property listing |
| `PUT` | `/v1/listings/{id}` | Update an existing property |
| `DELETE` | `/v1/listings/{id}` | Delete a listing |
| `GET` | `/v1/listings/{id}/availability` | Real-time calendar availability (calculates active booking blocks) |
| `GET` | `/v1/listings/{id}/reviews` | Fetch reviews and overall listing ratings |
| `POST` | `/v1/listings/{id}/reviews` | Post a review (automatically updates property star rating & review count) |

### 📅 Reservations & Bookings
| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/v1/reservations` | List all bookings (optional `?status=` filter) |
| `POST` | `/v1/reservations` | Create booking (enforces double-booking prevention, calculates stay discounts) |
| `GET` | `/v1/reservations/{id}` | Inspect reservation and fee breakdown |
| `PATCH` | `/v1/reservations/{id}/status` | Update reservation state (`confirmed`, `checked_in`, `completed`, `cancelled`) |
| `POST` | `/v1/reservations/{id}/cancel` | Cancel an existing reservation with optional reason |
| `GET` | `/v1/reservations/{id}/messages` | Get guest/host conversation thread |
| `POST` | `/v1/reservations/{id}/messages` | Send message in booking thread |

### 👤 Hosts & Favorites
| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/v1/hosts/{id}` | Host profile, total properties, and aggregate host rating |
| `GET` | `/v1/hosts/{id}/listings` | List all properties managed by this host |
| `GET` | `/v1/hosts/{id}/verification` | Verification status (ID, background check, response rate) |
| `GET` | `/v1/favorites` | Get saved favorite properties |
| `POST` | `/v1/favorites/{id}` | Toggle property favorite on/off |

### ⚙️ System
| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/v1/system/health` | Health check endpoint |
| `GET` | `/v1/system/stats` | Platform statistics (total listings, bookings, reviews, uptime) |

