/* =============================================
   FatiHomes — app.js
   Full client-side module
   ============================================= */

'use strict';

// ─── State ───────────────────────────────────
const state = {
  listings: [],
  favorites: new Set(),
  reservations: [],
  currentView: 'listings',
  activeCategory: 'all',
  bookingListingId: null,
  bookingStep: 1,
  chatReservationId: null,
};

// ─── DOM Helpers ──────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

// ─── AMENITY ICONS ───────────────────────────
const amenityIcons = {
  wifi: '📶', pool: '🏊', hot_tub: '♨️', ev_charger: '⚡',
  workspace: '💼', pet_friendly: '🐾', self_check_in: '🔑', air_conditioning: '❄️',
};

// ─── CATEGORY CONFIG ─────────────────────────
const categories = [
  { id: 'all', label: 'All', icon: '🌍' },
  { id: 'apartment', label: 'Apartments', icon: '🏢' },
  { id: 'entire_home', label: 'Entire Homes', icon: '🏠' },
  { id: 'cabin', label: 'Cabins', icon: '🛖' },
  { id: 'villa', label: 'Villas', icon: '🌴' },
  { id: 'private_room', label: 'Rooms', icon: '🛏️' },
];

// ─── Toast Notifications ─────────────────────
function toast(msg, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const container = $('#toastContainer');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add('removing');
    el.addEventListener('animationend', () => el.remove());
  }, 3500);
}

// ─── Confetti ────────────────────────────────
function launchConfetti() {
  const colors = ['#ff385c', '#f59e0b', '#10b981', '#0284c7', '#8b5cf6', '#ec4899'];
  const container = $('#confettiContainer');
  for (let i = 0; i < 80; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.cssText = `
      left: ${Math.random() * 100}vw;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      animation-duration: ${1.5 + Math.random() * 2}s;
      animation-delay: ${Math.random() * 0.6}s;
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      width: ${6 + Math.random() * 8}px;
      height: ${6 + Math.random() * 8}px;
    `;
    container.appendChild(p);
    p.addEventListener('animationend', () => p.remove());
  }
}

// ─── Dark Mode ───────────────────────────────
function initDarkMode() {
  const saved = localStorage.getItem('fh-theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  $('#themeToggle').textContent = saved === 'dark' ? '☀️' : '🌙';
}
function toggleDarkMode() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('fh-theme', next);
  $('#themeToggle').textContent = next === 'dark' ? '☀️' : '🌙';
}

// ─── Navbar scroll shadow ─────────────────────
function initScrollWatcher() {
  const nav = $('#navbar');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });
}

// ─── Stage badge ─────────────────────────────
async function loadStageBadge() {
  try {
    const r = await fetch('/v1/system/stage');
    const d = await r.json();
    const badge = $('#stageBadge');
    badge.textContent = d.stage;
    badge.className = 'brand-stage ' + (d.stage === 'PROD' ? 'prod' : '');
  } catch {}
}

// ─── NAVIGATION ──────────────────────────────
function switchView(view) {
  state.currentView = view;
  $$('.view-section').forEach(el => el.classList.remove('active'));
  $$('.nav-pill').forEach(el => el.classList.remove('active'));
  $(`#view-${view}`).classList.add('active');
  $(`#pill-${view}`).classList.add('active');
  if (view === 'reservations') loadReservations();
}

// ─── CATEGORY FILTER ──────────────────────────
function buildCategories() {
  const strip = $('#categoryStrip');
  strip.innerHTML = categories.map(c => `
    <button class="cat-pill ${c.id === 'all' ? 'active' : ''}" 
      data-cat="${c.id}" onclick="setCategory('${c.id}')">
      <span class="cat-icon">${c.icon}</span>
      ${c.label}
    </button>
  `).join('');
}
function setCategory(id) {
  state.activeCategory = id;
  $$('.cat-pill').forEach(el => el.classList.toggle('active', el.dataset.cat === id));
  renderListings();
}

// ─── LISTINGS ────────────────────────────────
async function loadListings() {
  showSkeletons();
  try {
    const payload = {
      check_in_date: $('#checkIn').value,
      check_out_date: $('#checkOut').value,
      guests_count: parseInt($('#guestsCount').value),
    };
    const r = await fetch('/v1/listings/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error('Search failed');
    const data = await r.json();
    state.listings = data.results || [];
    renderListings();
    toast(`Found ${state.listings.length} properties`, 'info');
  } catch {
    toast('Could not load listings. API may be starting up.', 'error');
    $('#listingsGrid').innerHTML = '<div class="empty-state"><div class="empty-icon">🔌</div><h3>Connection Error</h3><p>Could not reach the API server. Try searching again.</p></div>';
    $('#resultsCount').textContent = '0 properties';
  }
}

function renderListings() {
  const grid = $('#listingsGrid');
  let filtered = state.listings;
  if (state.activeCategory !== 'all') {
    filtered = filtered.filter(l => l.category === state.activeCategory);
  }
  $('#resultsCount').textContent = `${filtered.length} properties found`;
  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🔍</div><h3>No properties found</h3><p>Try a different category or broader search dates.</p></div>';
    return;
  }
  grid.innerHTML = filtered.map(l => renderListingCard(l)).join('');
}

function renderListingCard(l) {
  const isFav = state.favorites.has(l.id);
  const amenityChips = (l.amenities || []).slice(0, 4).map(a =>
    `<span class="amenity-chip">${amenityIcons[a] || '•'} ${a.replace(/_/g, ' ')}</span>`
  ).join('');
  return `
    <article class="listing-card" onclick="openBookingModal('${l.id}')">
      <div class="card-img">
        <img src="${l.imageUrl || 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80'}" 
             alt="${l.title}" loading="lazy" />
        <div class="card-badges">
          ${l.host.superhostStatus ? '<span class="card-badge superhost">⭐ Superhost</span>' : ''}
          ${l.instantBookEnabled ? '<span class="card-badge instant">⚡ Instant Book</span>' : ''}
        </div>
        <button class="heart-btn ${isFav ? 'favorited' : ''}" 
          onclick="event.stopPropagation(); toggleFavorite('${l.id}', this)"
          title="${isFav ? 'Remove from wishlist' : 'Add to wishlist'}">
          ${isFav ? '❤️' : '🤍'}
        </button>
      </div>
      <div class="card-body">
        <div class="card-header">
          <h3 class="card-title">${l.title}</h3>
          <div class="card-rating"><span class="star">★</span> ${l.starRating.toFixed(2)}</div>
        </div>
        <div class="card-location">📍 ${l.address.city}, ${l.address.state}</div>
        <div class="card-capacity">👥 ${l.capacity.maxGuests} guests · 🛏️ ${l.capacity.bedrooms} bed · 🚿 ${l.capacity.bathrooms} bath</div>
        <div class="card-amenities">${amenityChips}</div>
        <div class="card-footer">
          <div class="card-price">$${l.pricing.baseNightlyRate} <span>/ night</span></div>
          <button class="btn-book" onclick="event.stopPropagation(); openBookingModal('${l.id}')">Reserve</button>
        </div>
      </div>
    </article>
  `;
}

function showSkeletons() {
  $('#listingsGrid').innerHTML = Array(6).fill(0).map(() => `
    <div class="skeleton-card">
      <div class="skeleton-img"></div>
      <div class="skeleton-body">
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
        <div class="skeleton-line xshort"></div>
      </div>
    </div>
  `).join('');
}

// ─── FAVORITES ───────────────────────────────
async function toggleFavorite(id, btn) {
  try {
    const r = await fetch(`/v1/favorites/${id}`, { method: 'POST' });
    const d = await r.json();
    if (d.favorited) {
      state.favorites.add(id);
      btn.textContent = '❤️';
      btn.classList.add('favorited');
      toast('Added to wishlist!', 'success');
    } else {
      state.favorites.delete(id);
      btn.textContent = '🤍';
      btn.classList.remove('favorited');
      toast('Removed from wishlist', 'info');
    }
    updateFavCount();
  } catch {
    toast('Could not update wishlist', 'error');
  }
}
function updateFavCount() {
  $('#favBtn').setAttribute('data-count', state.favorites.size);
}

// ─── BOOKING MODAL ───────────────────────────
function openBookingModal(id) {
  const listing = state.listings.find(l => l.id === id);
  if (!listing) return;
  state.bookingListingId = id;
  state.bookingStep = 1;
  $('#bookModalTitle').textContent = listing.title;
  $('#bookModalSub').textContent = `${listing.address.city}, ${listing.address.state} · ${listing.category}`;
  updateBookingStep();
  updatePriceSummary(listing);
  $('#bookingModal').classList.add('open');
}

function updateBookingStep() {
  $$('.step').forEach((s, i) => {
    s.classList.toggle('active', i + 1 === state.bookingStep);
    s.classList.toggle('done', i + 1 < state.bookingStep);
  });
  $$('.step-panel').forEach((p, i) => {
    p.style.display = i + 1 === state.bookingStep ? 'block' : 'none';
  });
}

function nextStep() {
  if (state.bookingStep < 3) {
    state.bookingStep++;
    updateBookingStep();
  }
}
function prevStep() {
  if (state.bookingStep > 1) {
    state.bookingStep--;
    updateBookingStep();
  }
}

function updatePriceSummary(listing) {
  const inDate = new Date($('#checkIn').value);
  const outDate = new Date($('#checkOut').value);
  const nights = Math.max(1, Math.round((outDate - inDate) / 86400000));
  const base = listing.pricing.baseNightlyRate * nights;
  const clean = listing.pricing.cleaningFee;
  const service = listing.pricing.serviceFee;
  const tax = listing.pricing.localOccupancyTax;
  const total = base + clean + service + tax;

  ['#pNights', '#pBase'].forEach(s => $(s) && ($(s).textContent = ''));
  if ($('#pNightsLabel')) $('#pNightsLabel').textContent = `${nights} night${nights > 1 ? 's' : ''} × $${listing.pricing.baseNightlyRate}`;
  if ($('#pBase')) $('#pBase').textContent = `$${base.toFixed(2)}`;
  if ($('#pClean')) $('#pClean').textContent = `$${clean.toFixed(2)}`;
  if ($('#pService')) $('#pService').textContent = `$${service.toFixed(2)}`;
  if ($('#pTax')) $('#pTax').textContent = `$${tax.toFixed(2)}`;
  if ($('#pTotal')) $('#pTotal').textContent = `$${total.toFixed(2)}`;
}

async function submitReservation() {
  const btn = $('#confirmBtn');
  const listing = state.listings.find(l => l.id === state.bookingListingId);
  btn.disabled = true;
  btn.innerHTML = '⏳ Processing...';

  const payload = {
    listing_id: state.bookingListingId,
    check_in_date: $('#checkIn').value,
    check_out_date: $('#checkOut').value,
    guests_count: parseInt($('#guestsCount').value),
    booking_flow: $('#bookingFlow').value,
    payment_authorization_token: 'tok_visa_4242_mock',
    primary_guest: {
      first_name: $('#gFirst').value,
      last_name: $('#gLast').value,
      email: $('#gEmail').value,
      phone_number: $('#gPhone').value || '+10000000000',
    },
  };

  try {
    const r = await fetch('/v1/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error('Booking failed');
    const booking = await r.json();
    closeModal('bookingModal');
    launchConfetti();
    toast(`🎉 Booking confirmed! ID: ${booking.id.substring(0, 8)}…`, 'success');
    setTimeout(() => switchView('reservations'), 1200);
  } catch {
    toast('Booking failed. Please check your details.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🔒 Confirm & Pay Securely';
  }
}

// ─── RESERVATIONS ────────────────────────────
async function loadReservations() {
  try {
    const r = await fetch('/v1/reservations');
    if (!r.ok) throw new Error();
    state.reservations = await r.json();
    renderReservations();
  } catch {
    toast('Could not load reservations', 'error');
  }
}

function renderReservations() {
  const groups = { pending_approval: [], confirmed: [], completed: [] };
  state.reservations.forEach(r => {
    const g = groups[r.status] || groups.confirmed;
    g.push(r);
  });

  const colLabels = [
    { key: 'pending_approval', label: '⏳ Pending Approval', cls: 'pending' },
    { key: 'confirmed', label: '✅ Confirmed', cls: 'confirmed' },
    { key: 'completed', label: '🏁 Completed', cls: 'completed' },
  ];

  $('#resKanban').innerHTML = colLabels.map(col => `
    <div class="kanban-col">
      <div class="kanban-header ${col.cls}">${col.label} <span style="font-size:0.8rem;">(${groups[col.key].length})</span></div>
      ${groups[col.key].length === 0
        ? `<div style="color:var(--muted); font-size:0.85rem; padding: 12px;">No reservations here</div>`
        : groups[col.key].map(r => renderResCard(r)).join('')
      }
    </div>
  `).join('');

  if (state.reservations.length === 0) {
    $('#resKanban').innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">🗓️</div>
        <h3>No bookings yet</h3>
        <p>Go to <strong>Listings</strong> and book your first stay!</p>
      </div>`;
  }
}

function renderResCard(r) {
  const listing = state.listings.find(l => l.id === r.listingId);
  const title = listing ? listing.title : 'FatiHomes Property';
  return `
    <div class="res-card">
      <div class="res-card-title">${title}</div>
      <div class="res-card-meta">
        👤 ${r.primaryGuest.firstName} ${r.primaryGuest.lastName}<br>
        📅 ${r.checkInDate} → ${r.checkOutDate} · ${r.guestsCount} guest${r.guestsCount > 1 ? 's' : ''}
      </div>
      <div class="res-card-price">$${r.pricingSummary.totalAmount.toFixed(2)} <span>total</span></div>
      <span class="status-chip ${r.status}">● ${r.status.replace('_', ' ')}</span>
      <button class="btn-chat" onclick="openChat('${r.id}')">💬 Message Host</button>
    </div>
  `;
}

// ─── CHAT ────────────────────────────────────
async function openChat(resId) {
  state.chatReservationId = resId;
  $('#chatModal').classList.add('open');
  $('#chatMessages').innerHTML = '<div style="color:var(--muted);text-align:center;padding:1rem;">Loading messages…</div>';
  try {
    const r = await fetch(`/v1/reservations/${resId}/messages`);
    const msgs = await r.json();
    renderChat(msgs);
  } catch { toast('Could not load messages', 'error'); }
}

function renderChat(msgs) {
  if (!msgs.length) {
    $('#chatMessages').innerHTML = '<div style="color:var(--muted);text-align:center;padding:1rem;">No messages yet. Say hello! 👋</div>';
    return;
  }
  $('#chatMessages').innerHTML = msgs.map(m => `
    <div class="chat-bubble ${m.senderRole}">
      <div class="bubble-role">${m.senderRole}</div>
      ${m.messageBody}
    </div>
  `).join('');
  $('#chatMessages').scrollTop = $('#chatMessages').scrollHeight;
}

async function sendMessage(e) {
  e.preventDefault();
  const input = $('#chatInput');
  const body = input.value.trim();
  if (!body) return;
  input.value = '';
  try {
    await fetch(`/v1/reservations/${state.chatReservationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId: '18b76c8d-2917-4861-b9cb-1718bf14bb44', senderRole: 'guest', messageBody: body }),
    });
    const r = await fetch(`/v1/reservations/${state.chatReservationId}/messages`);
    renderChat(await r.json());
  } catch { toast('Message failed to send', 'error'); }
}

// ─── HOSTS VIEW ──────────────────────────────
function renderHostsView() {
  const hostsById = {};
  state.listings.forEach(l => {
    if (!hostsById[l.host.hostId]) hostsById[l.host.hostId] = { host: l.host, listings: 0, rating: l.starRating, reviews: l.reviewCount };
    hostsById[l.host.hostId].listings++;
  });

  const hosts = Object.values(hostsById);
  if (hosts.length === 0) {
    $('#hostGrid').innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🔌</div><h3>Load listings first</h3><p>Search for listings to see host profiles.</p></div>';
    return;
  }
  $('#hostGrid').innerHTML = hosts.map(({ host, listings, rating, reviews }) => `
    <div class="host-card">
      <div class="host-card-top">
        <img class="host-avatar" src="${host.profilePhotoUrl}" alt="${host.name}" />
        <div>
          <div class="host-name">${host.name}</div>
          ${host.superhostStatus ? '<div class="host-superhost">⭐ Superhost</div>' : ''}
        </div>
      </div>
      <div class="host-stats">
        <div class="host-stat"><div class="host-stat-val">${host.responseRate}%</div><div class="host-stat-label">Response Rate</div></div>
        <div class="host-stat"><div class="host-stat-val">${host.responseTimeMinutes}m</div><div class="host-stat-label">Avg Response Time</div></div>
        <div class="host-stat"><div class="host-stat-val">★ ${rating.toFixed(2)}</div><div class="host-stat-label">Avg Rating</div></div>
        <div class="host-stat"><div class="host-stat-val">${reviews}</div><div class="host-stat-label">Total Reviews</div></div>
      </div>
      <div class="trust-checks">
        ${[
          ['🪪 Government ID', host.verifiedIdentity],
          ['📧 Email', true],
          ['📱 Phone', true],
          ['🛡️ Background Check', host.superhostStatus],
        ].map(([label, ok]) => `
          <div class="trust-row">
            <span class="trust-label">${label}</span>
            <span class="trust-val ${ok ? 'ok' : 'no'}">${ok ? '✓ Verified' : '✗ Pending'}</span>
          </div>
        `).join('')}
      </div>
      <button class="btn-verify-api" onclick="verifyHostApi('${host.hostId}')">⚡ Re-verify via API</button>
    </div>
  `).join('');
}

async function verifyHostApi(id) {
  try {
    const r = await fetch(`/v1/hosts/${id}/verification`);
    const d = await r.json();
    toast(`Host is ${d.identityStatus.toUpperCase()} · Rating: ${d.aggregateRating} ⭐`, 'success');
  } catch { toast('Could not reach verification API', 'error'); }
}

// ─── MODAL HELPERS ────────────────────────────
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// ─── INIT ────────────────────────────────────
async function init() {
  initDarkMode();
  initScrollWatcher();
  buildCategories();
  loadStageBadge();
  await loadListings();
  renderHostsView();
}

document.addEventListener('DOMContentLoaded', init);
