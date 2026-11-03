<?php
/**
 * FatiHomes Vacation Rental Platform - PHP Frontend / Proxy
 * Suitable for school projects using Apache / XAMPP / WAMP or PHP built-in server.
 */

$apiBaseUrl = "http://localhost:5047";

// Fetch listings from the backend REST API
$requestData = [
    "check_in_date" => $_GET['check_in'] ?? "2026-10-15",
    "check_out_date" => $_GET['check_out'] ?? "2026-10-20",
    "guests_count" => isset($_GET['guests']) ? (int)$_GET['guests'] : 2
];

$ch = curl_init("$apiBaseUrl/v1/listings/search");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($requestData));
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$listings = [];
if ($httpCode === 200 && $response) {
    $decoded = json_decode($response, true);
    $listings = $decoded['results'] ?? [];
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FatiHomes (PHP Edition) - Vacation Rentals & Hotels</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #ff385c;
      --primary-hover: #e00b41;
      --dark: #222222;
      --border: #e0e0e0;
      --gray-light: #f7f7f7;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
    body { background-color: #fafafa; color: var(--dark); }
    header {
      background: #fff;
      border-bottom: 1px solid var(--border);
      padding: 1rem 5%;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand { font-size: 1.4rem; font-weight: 800; color: var(--primary); text-decoration: none; }
    .hero {
      background: #003580;
      color: white;
      padding: 3rem 5%;
      text-align: center;
    }
    .hero h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    .search-form {
      max-width: 800px;
      margin: 1.5rem auto 0;
      background: white;
      padding: 1rem;
      border-radius: 30px;
      display: flex;
      gap: 10px;
    }
    .search-form input, .search-form select {
      flex: 1;
      padding: 10px;
      border: 1px solid var(--border);
      border-radius: 20px;
      outline: none;
    }
    .search-form button {
      background: var(--primary);
      color: white;
      border: none;
      padding: 10px 24px;
      border-radius: 20px;
      font-weight: 700;
      cursor: pointer;
    }
    .container { max-width: 1200px; margin: 2rem auto; padding: 0 1rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }
    .card { background: white; border-radius: 12px; border: 1px solid var(--border); overflow: hidden; }
    .card img { width: 100%; height: 200px; object-fit: cover; }
    .card-content { padding: 1.2rem; }
    .price { font-weight: 800; font-size: 1.2rem; margin-top: 10px; }
  </style>
</head>
<body>
  <header>
    <a href="#" class="brand">FatiHomes PHP</a>
    <a href="/swagger" target="_blank" style="text-decoration:none; color: #003580; font-weight: 600;">Swagger Docs</a>
  </header>

  <section class="hero">
    <h1>Find Your School Vacation Rental</h1>
    <p>PHP + HTML + CSS + JS Starter Frontend connected to REST API</p>

    <form method="GET" class="search-form">
      <input type="date" name="check_in" value="<?= htmlspecialchars($requestData['check_in_date']) ?>" />
      <input type="date" name="check_out" value="<?= htmlspecialchars($requestData['check_out_date']) ?>" />
      <select name="guests">
        <option value="1" <?= $requestData['guests_count'] === 1 ? 'selected' : '' ?>>1 Guest</option>
        <option value="2" <?= $requestData['guests_count'] === 2 ? 'selected' : '' ?>>2 Guests</option>
        <option value="4" <?= $requestData['guests_count'] === 4 ? 'selected' : '' ?>>4 Guests</option>
      </select>
      <button type="submit">Search</button>
    </form>
  </section>

  <div class="container">
    <h2>Available Listings (<?= count($listings) ?>)</h2>
    <div class="grid" style="margin-top: 1rem;">
      <?php if (!empty($listings)): ?>
        <?php foreach ($listings as $item): ?>
          <div class="card">
            <img src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80" alt="Listing" />
            <div class="card-content">
              <h3><?= htmlspecialchars($item['title']) ?></h3>
              <p style="color:#666; font-size:0.9rem;"><?= htmlspecialchars($item['address']['city']) ?>, <?= htmlspecialchars($item['address']['state']) ?></p>
              <div class="price">$<?= htmlspecialchars($item['pricing']['baseNightlyRate']) ?> <span style="font-size:0.85rem; font-weight:400; color:#888;">/ night</span></div>
            </div>
          </div>
        <?php endforeach; ?>
      <?php else: ?>
        <p>No listings returned from API.</p>
      <?php endif; ?>
    </div>
  </div>
</body>
</html>
