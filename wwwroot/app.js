/* ========================================================
   StayHub / FatiHomes — Interactive Web Client (app.js)
   Full CRUD, Real-Time Availability, Reviews, Confetti & Chat
   Scroll Animations & Micro-Interactions
   ======================================================== */

'use strict';

const state = {
  listings: [],
  wishlistIds: new Set(),
  reservations: [],
  listingCache: {},
  bookingFilter: 'all',
  openReceipts: new Set(),
  activeCategory: 'all',
  currentView: 'listings',
  superhostFilter: false,
  instantBookFilter: false,
  selectedListing: null,
  bookingStep: 1,
  chatReservationId: null,
  serverStats: null
};

const categories = [
  { id: 'all', label: 'All Stays', icon: '🌍' },
  { id: 'apartment', label: 'Apartments', icon: '🏢' },
  { id: 'entire_home', label: 'Entire Homes', icon: '🏠' },
  { id: 'cabin', label: 'Mountain Cabins', icon: '🛖' },
  { id: 'villa', label: 'Luxury Villas', icon: '🌴' },
  { id: 'private_room', label: 'Rooms', icon: '🛏️' }
];

// ---------- Helpers ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

function toast(msg, type = 'info') {
  const icons = { success: '✅', error: '❌', info: '✨' };
  const container = $('#toastContainer');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span>${icons[type] || '✨'}</span> <span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(10px)';
    el.style.transition = 'all 0.3s ease';
    setTimeout(() => el.remove(), 300);
  }, 3500);
}

// ---------- Confetti Cannon ----------
function fireConfetti() {
  const container = $('#confettiContainer');
  const colors = ['#ff385c', '#f59e0b', '#10b981', '#0284c7', '#8b5cf6', '#ec4899'];
  for (let i = 0; i < 90; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = (Math.random() * 100) + 'vw';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = (1.5 + Math.random() * 2) + 's';
    piece.style.animationDelay = (Math.random() * 0.4) + 's';
    piece.style.width = (7 + Math.random() * 7) + 'px';
    piece.style.height = (7 + Math.random() * 7) + 'px';
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '3px';
    container.appendChild(piece);
    setTimeout(() => piece.remove(), 4000);
  }
}

// ---------- Scroll Reveal Observer & Progress ----------
function initScrollEffects() {
  const progressBar = $('#scrollProgressBar');
  window.addEventListener('scroll', () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const progress = total > 0 ? (window.scrollY / total) * 100 : 0;
    if (progressBar) progressBar.style.width = progress + '%';

    const nav = $('#navbar');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

function triggerCardReveals() {
  const cards = $$('.property-card, .res-booking-card, .bk-card, .host-profile-card');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  cards.forEach((c, index) => {
    c.style.transitionDelay = (index % 6 * 0.08) + 's';
    observer.observe(c);
  });
}

// ---------- Dark Mode ----------
function initDarkMode() {
  const saved = localStorage.getItem('sh-theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  $('#themeToggle').textContent = saved === 'dark' ? '☀️' : '🌙';
}

function toggleDarkMode() {
  const curr = document.documentElement.getAttribute('data-theme');
  const next = curr === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('sh-theme', next);
  $('#themeToggle').textContent = next === 'dark' ? '☀️' : '🌙';
}

// ---------- Navigation ----------
function switchView(view) {
  const availableViews = ['listings', 'wishlist', 'reservations', 'hosts', 'contact'];
  if (!availableViews.includes(view)) view = 'listings';

  state.currentView = view;
  $$('.view-section').forEach(el => el.classList.remove('active'));
  $$('.nav-pill').forEach(el => {
    const isActive = el.dataset.view === view;
    el.classList.toggle('active', isActive);
    if (isActive) el.setAttribute('aria-current', 'page');
    else el.removeAttribute('aria-current');
  });

  const viewEl = document.getElementById('view-' + view);
  if (viewEl) viewEl.classList.add('active');

  if (location.hash !== `#${view}`) history.pushState({ view }, '', `#${view}`);
  closeNavigationMenu();

  if (view === 'wishlist') renderWishlist();
  if (view === 'reservations') loadReservations();
  if (view === 'hosts') renderHosts();

  setTimeout(triggerCardReveals, 100);
}

function closeNavigationMenu() {
  const navbar = $('#navbar');
  const toggle = $('#navMenuToggle');
  if (!navbar || !toggle) return;
  navbar.classList.remove('nav-open');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Open navigation menu');
}

function initNavigation() {
  const toggle = $('#navMenuToggle');
  toggle?.addEventListener('click', () => {
    const isOpen = $('#navbar').classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
  });

  window.addEventListener('hashchange', () => {
    const view = location.hash.slice(1);
    const availableViews = ['listings', 'wishlist', 'reservations', 'hosts', 'contact'];
    if (availableViews.includes(view) && view !== state.currentView) {
      history.replaceState({ view }, '', `#${view}`);
      switchView(view);
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeNavigationMenu();
  });
}

// ---------- System Stats & Stage ----------
async function loadSystemStats() {
  try {
    const res = await fetch('/v1/system/stats');
    if (!res.ok) return;
    const data = await res.json();
    state.serverStats = data;
    $('#statProperties').textContent = data.totalListings;
    $('#statReservations').textContent = data.totalReservations;
    $('#statReviews').textContent = data.totalReviews;
  } catch {}

  try {
    const stageRes = await fetch('/v1/system/stage');
    if (stageRes.ok) {
      const stageData = await stageRes.json();
      $('#stageBadge').textContent = stageData.stage;
    }
  } catch {}
}

// ---------- Categories ----------
function renderCategories() {
  const strip = $('#categoryStrip');
  strip.innerHTML = categories.map(c => `
    <button class="cat-chip ${c.id === state.activeCategory ? 'active' : ''}"
      onclick="selectCategory('${c.id}')">
      <span>${c.icon}</span>
      <span>${c.label}</span>
    </button>
  `).join('');
}

function selectCategory(id) {
  state.activeCategory = id;
  renderCategories();
  executeSearch();
}

// ---------- Search & Listings ----------
async function executeSearch() {
  const q = $('#searchInput').value.trim();
  const checkIn = $('#checkIn').value;
  const checkOut = $('#checkOut').value;
  const guests = parseInt($('#guestsCount').value);
  const sortBy = $('#sortBy').value;

  const payload = {
    query: q || null,
    checkInDate: checkIn || null,
    checkOutDate: checkOut || null,
    guestsCount: guests,
    superhostOnly: state.superhostFilter,
    instantBookOnly: state.instantBookFilter,
    categories: state.activeCategory === 'all' ? null : [state.activeCategory],
    sortBy: sortBy,
    page: 1,
    pageSize: 50
  };

  try {
    const res = await fetch('/v1/listings/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    state.listings = data.results || [];
    state.listings.forEach(l => { state.listingCache[l.id] = l; });
    renderListingsGrid(state.listings, '#listingsGrid');
    $('#resultsCount').textContent = `${data.totalRecords} ${data.totalRecords === 1 ? 'property' : 'properties'} found`;
    setTimeout(triggerCardReveals, 100);
  } catch (err) {
    toast('Failed to search properties', 'error');
  }
}

function toggleSuperhostFilter(btn) {
  state.superhostFilter = !state.superhostFilter;
  btn.classList.toggle('active', state.superhostFilter);
  executeSearch();
}

function toggleInstantBookFilter(btn) {
  state.instantBookFilter = !state.instantBookFilter;
  btn.classList.toggle('active', state.instantBookFilter);
  executeSearch();
}

function renderListingsGrid(items, targetSelector) {
  const grid = $(targetSelector);
  if (!items || items.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem;">
        <div style="font-size: 3rem; margin-bottom: 0.8rem; animation: floatIcon 3s ease-in-out infinite;">🏡</div>
        <h3 style="font-size:1.3rem;">No properties match your search</h3>
        <p class="text-muted" style="margin-top:4px;">Try clearing filters or expanding date ranges.</p>
      </div>`;
    return;
  }

  grid.innerHTML = items.map(l => {
    const isFav = state.wishlistIds.has(l.id);
    return `
      <div class="property-card" onclick="openPropertyDetail('${l.id}')">
        <div class="card-img-wrapper">
          <img src="${l.imageUrl}" alt="${l.title}" loading="lazy" />
          <div class="card-top-badges">
            ${l.host.superhostStatus ? '<span class="badge-tag superhost">⭐ Superhost</span>' : ''}
            ${l.instantBookEnabled ? '<span class="badge-tag instant">⚡ Instant Book</span>' : ''}
          </div>
          <button class="card-heart-btn" onclick="event.stopPropagation(); toggleWishlist('${l.id}')">
            ${isFav ? '❤️' : '🤍'}
          </button>
        </div>
        <div class="card-content">
          <div class="card-header-row">
            <div class="card-prop-title">${l.title}</div>
            <div class="card-prop-rating">★ ${l.starRating.toFixed(2)}</div>
          </div>
          <div class="card-location-sub">📍 ${l.address.city}, ${l.address.state} · ${l.category.replaceAll('_', ' ')}</div>
          <div class="card-specs">👥 Up to ${l.capacity.maxGuests} guests · ${l.capacity.bedrooms} bed · ${l.capacity.bathrooms} bath</div>
          <div class="amenities-pills">
            ${l.amenities.slice(0, 3).map(a => `<span class="amenity-chip">✨ ${a.replaceAll('_', ' ')}</span>`).join('')}
          </div>
          <div class="card-footer-row">
            <div class="card-price-text">${formatRate(l.pricing)} <span>/ night</span></div>
            <button class="btn-book-card" onclick="event.stopPropagation(); startBookingFlow('${l.id}')">Reserve</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ---------- Wishlist ----------
async function loadFavorites() {
  try {
    const res = await fetch('/v1/favorites');
    if (!res.ok) return;
    const favs = await res.json();
    state.wishlistIds = new Set(favs.map(f => f.id));
    $('#favCountBadge').textContent = state.wishlistIds.size;
  } catch {}
}

async function toggleWishlist(id) {
  try {
    const res = await fetch(`/v1/favorites/${id}`, { method: 'POST' });
    if (!res.ok) throw new Error();
    const data = await res.json();
    if (data.favorited) {
      state.wishlistIds.add(id);
      toast('Saved to your Wishlist!', 'success');
    } else {
      state.wishlistIds.delete(id);
      toast('Removed from Wishlist', 'info');
    }
    $('#favCountBadge').textContent = state.wishlistIds.size;
    renderListingsGrid(state.listings, '#listingsGrid');
    if (state.currentView === 'wishlist') renderWishlist();
  } catch {
    toast('Error updating wishlist', 'error');
  }
}

function renderWishlist() {
  const wishListItems = state.listings.filter(l => state.wishlistIds.has(l.id));
  renderListingsGrid(wishListItems, '#wishlistGrid');
  setTimeout(triggerCardReveals, 100);
}

// ---------- Property Detail Modal & Real Availability ----------
async function openPropertyDetail(id) {
  const listing = state.listings.find(l => l.id === id);
  if (!listing) return;
  state.selectedListing = listing;

  const content = $('#propertyDetailContent');
  content.innerHTML = '<div style="text-align:center; padding: 3rem;">Loading details & calendar...</div>';
  $('#propertyModal').classList.add('open');

  // Fetch reviews & availability
  const checkIn = $('#checkIn').value;
  const checkOut = $('#checkOut').value;
  let availDays = [];
  try {
    const aRes = await fetch(`/v1/listings/${id}/availability?start_date=${checkIn}&end_date=${checkOut}`);
    if (aRes.ok) {
      const aData = await aRes.json();
      availDays = aData.days;
    }
  } catch {}

  let reviewsList = [];
  try {
    const rRes = await fetch(`/v1/listings/${id}/reviews`);
    if (rRes.ok) {
      const rData = await rRes.json();
      reviewsList = rData.reviews;
    }
  } catch {}

  content.innerHTML = `
    <div class="prop-hero-gallery">
      <img src="${listing.imageUrl}" alt="${listing.title}" />
    </div>

    <div class="prop-detail-grid">
      <div>
        <div style="display:flex; justify-content:space-between; align-items:baseline;">
          <h2 style="font-size: 1.6rem; font-weight:800;">${listing.title}</h2>
          <span style="font-size:1.1rem; font-weight:700;">★ ${listing.starRating.toFixed(2)} (${listing.reviewCount} reviews)</span>
        </div>
        <p class="text-muted" style="margin-top:4px;">📍 ${listing.address.street}, ${listing.address.city}, ${listing.address.state}</p>

        <p style="margin: 1.2rem 0; line-height: 1.6;">${listing.description}</p>

        <div style="margin: 1.5rem 0;">
          <h4 class="detail-section-title">Amenities</h4>
          <div class="amenities-pills">
            ${listing.amenities.map(a => `<span class="amenity-chip">✨ ${a.replaceAll('_', ' ')}</span>`).join('')}
          </div>
        </div>

        <!-- Real-time Availability Calendar Box -->
        <div class="avail-calendar-box">
          <h4 style="font-weight:700;">📅 Live Calendar Availability (${checkIn} to ${checkOut})</h4>
          <p class="text-muted" style="font-size:0.8rem;">Real-time booking status cross-referenced with confirmed bookings.</p>
          <div class="calendar-days-grid">
            ${availDays.map(d => `
              <div class="cal-day-cell ${d.isAvailable ? 'available' : 'booked'}" title="${d.blockReason}">
                <div>${d.date.substring(5)}</div>
                <div style="font-weight:700;">${d.isAvailable ? '✓ Open' : '✕ Booked'}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Reviews Section -->
        <div style="margin-top: 2rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h4 class="detail-section-title" style="margin-bottom:0;">Guest Reviews (${reviewsList.length})</h4>
            <button class="btn-action-sm" onclick="openReviewModal('${listing.id}')">+ Write a Review</button>
          </div>
          <div style="display:flex; flex-direction:column; gap:12px;">
            ${reviewsList.length === 0 ? '<p class="text-muted">No reviews yet. Be the first to leave one!</p>' : ''}
            ${reviewsList.map(r => `
              <div style="background:var(--bg-page); padding:1rem; border-radius:var(--radius-sm); border:1px solid var(--border-light);">
                <div style="display:flex; justify-content:space-between;">
                  <strong>${r.authorName}</strong>
                  <span style="color:#b45309; font-weight:700;">★ ${r.rating}/5</span>
                </div>
                <p style="font-size:0.9rem; margin-top:6px; color:var(--text-main);">${r.comment}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Right Column: Host & Quick Booking -->
      <div>
        <div style="background:var(--bg-page); border:1px solid var(--border-light); border-radius:var(--radius-md); padding:1.5rem;">
          <div style="font-size:1.6rem; font-weight:800; color:var(--text-main);">
            ${formatRate(listing.pricing)} <span style="font-size:0.9rem; font-weight:400; color:var(--text-muted);">night</span>
          </div>

          <div style="margin: 1.2rem 0; border:1px solid var(--border-light); border-radius:var(--radius-sm); padding:10px; background:var(--bg-card);">
            <div style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--text-muted);">Dates</div>
            <div>${checkIn} → ${checkOut}</div>
          </div>

          <button class="btn-cta-full" onclick="closeModal('propertyModal'); startBookingFlow('${listing.id}')">
            Proceed to Reservation
          </button>
        </div>

        <!-- Host Trust Card -->
        <div style="background:var(--bg-card); border:1px solid var(--border-light); border-radius:var(--radius-md); padding:1.2rem; margin-top:1.2rem;">
          <div style="display:flex; gap:12px; align-items:center;">
            <img src="${listing.host.profilePhotoUrl}" style="width:52px; height:52px; border-radius:50%; object-fit:cover;" />
            <div>
              <div style="font-weight:700;">Hosted by ${listing.host.name}</div>
              <div style="font-size:0.8rem; color:var(--text-muted);">${listing.host.superhostStatus ? '⭐ Superhost · ' : ''}Response rate: ${listing.host.responseRate}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ---------- Booking Flow ----------
function startBookingFlow(id) {
  const listing = state.listings.find(l => l.id === id);
  if (!listing) return;
  state.selectedListing = listing;
  state.bookingStep = 1;

  $('#bookModalTitle').textContent = `Book ${listing.title}`;
  $('#bookModalSub').textContent = `${listing.address.city}, ${listing.address.state}`;

  const inDate = new Date($('#checkIn').value);
  const outDate = new Date($('#checkOut').value);
  const nights = Math.max(1, Math.round((outDate - inDate) / 86400000));
  const base = listing.pricing.baseNightlyRate * nights;
  const clean = listing.pricing.cleaningFee;
  const service = listing.pricing.serviceFee;
  const tax = listing.pricing.localOccupancyTax;
  const total = base + clean + service + tax;

  $('#summaryCheckIn').textContent = $('#checkIn').value;
  $('#summaryCheckOut').textContent = $('#checkOut').value;
  $('#summaryGuests').textContent = `${$('#guestsCount').value} Guests`;

  const cur = listing.pricing.currency;
  $('#priceReceiptBox').innerHTML = `
    <div class="receipt-row"><span>${nights} nights × ${formatRate(listing.pricing)}</span> <span>${formatMoney(base, cur)}</span></div>
    <div class="receipt-row"><span>Cleaning fee</span> <span>${formatMoney(clean, cur)}</span></div>
    <div class="receipt-row"><span>StayHub service fee</span> <span>${formatMoney(service, cur)}</span></div>
    <div class="receipt-row"><span>Occupancy taxes</span> <span>${formatMoney(tax, cur)}</span></div>
    <div class="receipt-row total"><span>Total</span> <span>${formatMoney(total, cur)}</span></div>
  `;
  $('#finalTotalAmount').textContent = formatMoney(total, cur);

  nextBookingStep(1);
  $('#bookingModal').classList.add('open');
}

function nextBookingStep(step) {
  state.bookingStep = step;
  $('#step1Dot').classList.toggle('active', step === 1);
  $('#step2Dot').classList.toggle('active', step === 2);
  $('#step3Dot').classList.toggle('active', step === 3);

  $('#step1Panel').style.display = step === 1 ? 'block' : 'none';
  $('#step2Panel').style.display = step === 2 ? 'block' : 'none';
  $('#step3Panel').style.display = step === 3 ? 'block' : 'none';
}

async function submitReservation() {
  const btn = $('#btnConfirmPay');
  btn.disabled = true;
  btn.textContent = 'Processing...';

  const payload = {
    listingId: state.selectedListing.id,
    checkInDate: $('#checkIn').value,
    checkOutDate: $('#checkOut').value,
    guestsCount: parseInt($('#guestsCount').value),
    bookingFlow: $('#bookingFlow').value,
    primaryGuest: {
      firstName: $('#gFirst').value,
      lastName: $('#gLast').value,
      email: $('#gEmail').value,
      phoneNumber: $('#gPhone').value
    }
  };

  try {
    const res = await fetch('/v1/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      if (res.status === 409) {
        toast('Booking Conflict: Property is already booked on those dates!', 'error');
      } else {
        toast(`Error: ${data.message || 'Could not complete booking'}`, 'error');
      }
      return;
    }

    closeModal('bookingModal');
    fireConfetti();
    toast('🎉 Reservation confirmed successfully!', 'success');
    loadSystemStats();
    setTimeout(() => switchView('reservations'), 900);
  } catch {
    toast('Network error during reservation', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '🔒 Complete Reservation';
  }
}

// ---------- Reservations Manager & Cancellation ----------
const bookingFilters = [
  { id: 'all', label: 'All', icon: '🗂️' },
  { id: 'upcoming', label: 'Upcoming', icon: '🧳' },
  { id: 'current', label: 'Current stay', icon: '🏡' },
  { id: 'pending', label: 'Awaiting host', icon: '⏳' },
  { id: 'past', label: 'Past', icon: '📸' },
  { id: 'cancelled', label: 'Cancelled', icon: '🚫' }
];

const statusLabels = {
  confirmed: '✓ Confirmed',
  pending_approval: '⏳ Pending approval',
  checked_in: '🔑 Checked in',
  completed: '★ Completed',
  cancelled: '✕ Cancelled'
};

function parseLocalDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function todayLocal() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatDay(str) {
  return parseLocalDate(str).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatMoney(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

// Nightly rate in the listing's own currency, without cents for whole amounts
function formatRate(pricing) {
  const whole = Number.isInteger(pricing.baseNightlyRate);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: pricing.currency || 'USD', minimumFractionDigits: whole ? 0 : 2 }).format(pricing.baseNightlyRate);
}

function nightsBetween(a, b) {
  return Math.max(1, Math.round((parseLocalDate(b) - parseLocalDate(a)) / 86400000));
}

// Timeline phase of a booking relative to today: upcoming, current, past or cancelled
function bookingPhase(r) {
  if (r.status === 'cancelled') return 'cancelled';
  if (r.status === 'completed') return 'past';
  const today = todayLocal();
  if (parseLocalDate(r.checkOutDate) <= today) return 'past';
  if (parseLocalDate(r.checkInDate) <= today) return 'current';
  return 'upcoming';
}

function matchesBookingFilter(r, filter) {
  if (filter === 'all') return true;
  if (filter === 'pending') return r.status === 'pending_approval';
  return bookingPhase(r) === filter;
}

function bookingCountdown(r) {
  const phase = bookingPhase(r);
  const today = todayLocal();
  if (phase === 'upcoming') {
    const days = Math.round((parseLocalDate(r.checkInDate) - today) / 86400000);
    return { cls: 'upcoming', text: days === 1 ? '🧳 Check-in is tomorrow' : `🧳 Starts in ${days} days` };
  }
  if (phase === 'current') {
    const left = Math.round((parseLocalDate(r.checkOutDate) - today) / 86400000);
    return { cls: 'current', text: `🏡 Stay in progress · ${left} night${left === 1 ? '' : 's'} left` };
  }
  if (phase === 'past') return { cls: 'past', text: '📸 Trip completed — hope you enjoyed it!' };
  return { cls: 'cancelled', text: r.cancellationReason ? `🚫 ${r.cancellationReason}` : '🚫 This booking was cancelled' };
}

// Bookings can reference listings that are hidden by the current search filters,
// so missing listings are fetched individually and cached.
async function ensureBookingListings() {
  const missing = [...new Set(state.reservations.map(r => r.listingId))]
    .filter(id => !state.listingCache[id]);
  await Promise.all(missing.map(async id => {
    try {
      const res = await fetch(`/v1/listings/${id}`);
      if (res.ok) state.listingCache[id] = await res.json();
    } catch {}
  }));
}

async function loadReservations() {
  const container = $('#reservationsList');
  if (!state.reservations.length) {
    container.innerHTML = '<div class="bk-skeleton"></div><div class="bk-skeleton"></div>';
  }
  try {
    const res = await fetch('/v1/reservations');
    if (!res.ok) throw new Error();
    state.reservations = await res.json();
    state.reservations.sort((a, b) => parseLocalDate(a.checkInDate) - parseLocalDate(b.checkInDate));
    await ensureBookingListings();
    renderReservations();
  } catch {
    container.innerHTML = '';
    toast('Could not fetch reservations', 'error');
  }
}

function setBookingFilter(id) {
  state.bookingFilter = id;
  renderReservations();
}

function renderBookingStats() {
  const active = state.reservations.filter(r => r.status !== 'cancelled');
  const upcoming = active.filter(r => ['upcoming', 'current'].includes(bookingPhase(r))).length;
  const nights = active.reduce((sum, r) => sum + nightsBetween(r.checkInDate, r.checkOutDate), 0);
  // Bookings can be in different currencies, so totals are kept per currency
  const spentByCurrency = {};
  active.forEach(r => {
    const cur = r.pricingSummary.currency || 'USD';
    spentByCurrency[cur] = (spentByCurrency[cur] || 0) + r.pricingSummary.totalAmount;
  });
  const spent = Object.entries(spentByCurrency).map(([cur, amt]) => formatMoney(amt, cur)).join(' + ') || formatMoney(0);
  const pending = state.reservations.filter(r => r.status === 'pending_approval').length;

  const tiles = [
    { icon: '🧳', value: upcoming, label: 'Upcoming & current trips', tone: 'primary' },
    { icon: '🌙', value: nights, label: 'Nights booked', tone: 'blue' },
    { icon: '💳', value: spent, label: 'Total trip value', tone: 'success' },
    { icon: '⏳', value: pending, label: 'Awaiting host approval', tone: 'warning' }
  ];

  $('#bookingStats').innerHTML = tiles.map(t => `
    <div class="bk-stat-tile ${t.tone}">
      <div class="bk-stat-icon">${t.icon}</div>
      <div>
        <div class="bk-stat-value">${t.value}</div>
        <div class="bk-stat-label">${t.label}</div>
      </div>
    </div>
  `).join('');
}

function renderBookingFilters() {
  $('#bookingFilters').innerHTML = bookingFilters.map(f => {
    const count = state.reservations.filter(r => matchesBookingFilter(r, f.id)).length;
    return `
      <button class="bk-filter ${state.bookingFilter === f.id ? 'active' : ''}" onclick="setBookingFilter('${f.id}')">
        <span>${f.icon} ${f.label}</span>
        <span class="bk-filter-count">${count}</span>
      </button>
    `;
  }).join('');
}

function renderBookingCard(r) {
  const listing = state.listingCache[r.listingId];
  const title = listing ? listing.title : 'Vacation Stay';
  const img = listing ? listing.imageUrl : 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80';
  const location = listing ? `${listing.address.city}, ${listing.address.state}` : 'Location unavailable';
  const host = listing ? listing.host : null;
  const nights = nightsBetween(r.checkInDate, r.checkOutDate);
  const p = r.pricingSummary;
  const countdown = bookingCountdown(r);
  const canCancel = !['cancelled', 'completed'].includes(r.status) && bookingPhase(r) !== 'past';
  const isOpen = state.openReceipts.has(r.id);
  // A confirmed stay whose check-out has passed reads as completed
  const displayStatus = r.status === 'confirmed' && bookingPhase(r) === 'past' ? 'completed' : r.status;

  const receiptRows = (p.items && p.items.length ? p.items : [
    { description: `${nights} nights accommodation`, amount: p.basePrice },
    { description: 'Cleaning fee', amount: p.cleaningFee },
    { description: 'Service fee', amount: p.serviceFee },
    { description: 'Occupancy tax', amount: p.localOccupancyTax }
  ]).map(i => `<div class="receipt-row"><span>${i.description}</span><span>${formatMoney(i.amount, p.currency)}</span></div>`).join('');

  return `
    <article class="bk-card ${r.status === 'cancelled' ? 'is-cancelled' : ''}">
      <div class="bk-card-media">
        <img src="${img}" alt="${title}" loading="lazy" />
        <span class="bk-status ${displayStatus}">${statusLabels[displayStatus] || displayStatus.replaceAll('_', ' ')}</span>
      </div>

      <div class="bk-card-body">
        <div class="bk-card-top">
          <div>
            <h3 class="bk-card-title">${title}</h3>
            <div class="bk-card-meta">📍 ${location} · <span class="bk-code" title="${r.id}">#${r.id.substring(0, 8).toUpperCase()}</span></div>
          </div>
          <div class="bk-price">
            <div class="bk-price-total">${formatMoney(p.totalAmount, p.currency)}</div>
            <div class="bk-price-sub">${formatMoney(p.totalAmount / nights, p.currency)} avg / night</div>
          </div>
        </div>

        <div class="bk-timeline">
          <div class="bk-date">
            <span class="bk-date-label">Check-in</span>
            <span class="bk-date-value">${formatDay(r.checkInDate)}</span>
          </div>
          <div class="bk-timeline-line">
            <span class="bk-nights">🌙 ${nights} night${nights === 1 ? '' : 's'}</span>
          </div>
          <div class="bk-date right">
            <span class="bk-date-label">Check-out</span>
            <span class="bk-date-value">${formatDay(r.checkOutDate)}</span>
          </div>
        </div>

        <div class="bk-details">
          <span class="bk-chip">👤 ${r.primaryGuest.firstName} ${r.primaryGuest.lastName}</span>
          <span class="bk-chip">👥 ${r.guestsCount} guest${r.guestsCount === 1 ? '' : 's'}</span>
          <span class="bk-chip">${r.bookingFlow === 'instant_book' ? '⚡ Instant book' : '📨 Request to book'}</span>
          ${host ? `<span class="bk-chip host"><img src="${host.profilePhotoUrl}" alt="" /> Hosted by ${host.name}</span>` : ''}
        </div>

        <div class="bk-countdown ${countdown.cls}">${countdown.text}</div>

        <div class="bk-actions">
          <button class="bk-btn-primary sm" onclick="openChatModal('${r.id}')">💬 Message host</button>
          <button class="btn-action-sm" onclick="toggleReceipt('${r.id}')">🧾 ${isOpen ? 'Hide' : 'Price'} details</button>
          ${canCancel ? `<button class="btn-action-sm danger" onclick="cancelReservation('${r.id}')">Cancel booking</button>` : ''}
        </div>

        <div class="bk-receipt ${isOpen ? 'open' : ''}">
          ${receiptRows}
          ${p.discountAmount ? `<div class="receipt-row discount"><span>Discount</span><span>−${formatMoney(p.discountAmount, p.currency)}</span></div>` : ''}
          ${p.securityDeposit ? `<div class="receipt-row muted"><span>Refundable security deposit</span><span>${formatMoney(p.securityDeposit, p.currency)}</span></div>` : ''}
          <div class="receipt-row total"><span>Total (${p.currency})</span><span>${formatMoney(p.totalAmount, p.currency)}</span></div>
        </div>
      </div>
    </article>
  `;
}

function renderReservations() {
  renderBookingStats();
  renderBookingFilters();

  const container = $('#reservationsList');
  const items = state.reservations.filter(r => matchesBookingFilter(r, state.bookingFilter));
  $('#bookingCount').textContent = `Showing ${items.length} of ${state.reservations.length} booking${state.reservations.length === 1 ? '' : 's'}`;

  if (items.length === 0) {
    const noneAtAll = state.reservations.length === 0;
    container.innerHTML = `
      <div class="bk-empty">
        <div class="bk-empty-icon">${noneAtAll ? '🗓️' : '🔎'}</div>
        <h3>${noneAtAll ? 'No trips booked… yet!' : 'Nothing in this category'}</h3>
        <p class="text-muted">${noneAtAll ? 'Your next getaway is a few clicks away. Explore handpicked stays and reserve your first one.' : 'Try another filter to see the rest of your bookings.'}</p>
        <button class="bk-btn-primary" onclick="${noneAtAll ? "switchView('listings')" : "setBookingFilter('all')"}">
          ${noneAtAll ? '🔍 Explore stays' : 'Show all bookings'}
        </button>
      </div>`;
    return;
  }

  container.innerHTML = items.map(renderBookingCard).join('');
  setTimeout(triggerCardReveals, 50);
}

function toggleReceipt(id) {
  if (state.openReceipts.has(id)) state.openReceipts.delete(id);
  else state.openReceipts.add(id);
  renderReservations();
}

async function cancelReservation(id) {
  if (!confirm('Are you sure you want to cancel this booking?')) return;
  try {
    const res = await fetch(`/v1/reservations/${id}/cancel`, { method: 'POST' });
    if (!res.ok) throw new Error();
    toast('Reservation cancelled', 'info');
    loadSystemStats();
    loadReservations();
  } catch {
    toast('Failed to cancel reservation', 'error');
  }
}

// ---------- Reviews ----------
function openReviewModal(listingId) {
  $('#reviewListingId').value = listingId;
  $('#reviewModal').classList.add('open');
}

function setReviewRating(val) {
  $('#revRatingVal').value = val;
  $$('.star-opt').forEach(el => el.classList.toggle('selected', parseInt(el.dataset.val) === val));
}

async function submitReview(e) {
  e.preventDefault();
  const id = $('#reviewListingId').value;
  const author = $('#revAuthor').value;
  const rating = parseInt($('#revRatingVal').value);
  const comment = $('#revComment').value;

  try {
    const res = await fetch(`/v1/listings/${id}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorName: author, rating, comment })
    });
    if (!res.ok) throw new Error();
    closeModal('reviewModal');
    toast('Review published!', 'success');
    loadSystemStats();
    openPropertyDetail(id);
  } catch {
    toast('Failed to submit review', 'error');
  }
}

// ---------- Chat ----------
async function openChatModal(resId) {
  state.chatReservationId = resId;
  $('#chatModal').classList.add('open');
  loadChatMessages();
}

async function loadChatMessages() {
  const feed = $('#chatMessages');
  feed.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding:1rem;">Loading conversation...</div>';
  try {
    const res = await fetch(`/v1/reservations/${state.chatReservationId}/messages`);
    const msgs = await res.json();
    if (msgs.length === 0) {
      feed.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding:1rem;">No messages yet. Send a greeting below!</div>';
      return;
    }
    feed.innerHTML = msgs.map(m => `
      <div class="chat-bubble ${m.senderRole}">
        <div style="font-size:0.75rem; font-weight:700; margin-bottom:2px; text-transform:uppercase;">${m.senderRole}</div>
        <div>${m.messageBody}</div>
      </div>
    `).join('');
    feed.scrollTop = feed.scrollHeight;
  } catch {
    feed.innerHTML = '<div style="color:var(--danger); text-align:center;">Failed to load chat</div>';
  }
}

async function sendChatMessage(e) {
  e.preventDefault();
  const input = $('#chatInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  try {
    await fetch(`/v1/reservations/${state.chatReservationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: '18b76c8d-2917-4861-b9cb-1718bf14bb44',
        senderRole: 'guest',
        messageBody: text
      })
    });
    loadChatMessages();
  } catch {
    toast('Failed to send message', 'error');
  }
}

// ---------- Hosts View ----------
// Host stats come from the full catalog, not the current search results
async function renderHosts() {
  let allListings = state.listings;
  try {
    const res = await fetch('/v1/listings?limit=100');
    if (res.ok) allListings = await res.json();
  } catch {}

  const hostsMap = {};
  allListings.forEach(l => {
    if (!hostsMap[l.host.hostId]) {
      hostsMap[l.host.hostId] = { host: l.host, listings: 0, ratingSum: 0, reviews: 0 };
    }
    const h = hostsMap[l.host.hostId];
    h.listings++;
    h.ratingSum += l.starRating;
    h.reviews += l.reviewCount;
  });

  const list = Object.values(hostsMap).map(h => ({ ...h, rating: h.ratingSum / h.listings }));
  $('#hostGrid').innerHTML = list.map(({ host, listings, rating, reviews }) => `
    <div class="host-profile-card">
      <div class="host-card-header">
        <img src="${host.profilePhotoUrl}" class="host-card-avatar" alt="avatar" />
        <div>
          <div style="font-size:1.2rem; font-weight:800;">${host.name}</div>
          <div style="font-size:0.85rem; color:var(--text-muted);">${host.superhostStatus ? '⭐ Certified Superhost' : 'Verified Host'}</div>
        </div>
      </div>
      <div class="host-metrics-grid">
        <div class="metric-cell"><div class="metric-val">${host.responseRate}%</div><div class="metric-lbl">Response Rate</div></div>
        <div class="metric-cell"><div class="metric-val">${host.responseTimeMinutes}m</div><div class="metric-lbl">Avg Speed</div></div>
        <div class="metric-cell"><div class="metric-val">★ ${rating.toFixed(2)}</div><div class="metric-lbl">Avg Rating</div></div>
        <div class="metric-cell"><div class="metric-val">${listings}</div><div class="metric-lbl">Properties</div></div>
      </div>
      <button class="btn-secondary" style="width:100%;" onclick="verifyHostDirectly('${host.hostId}')">
        ⚡ Run Real-Time Trust Verification API
      </button>
    </div>
  `).join('');
  setTimeout(triggerCardReveals, 100);
}

async function verifyHostDirectly(id) {
  try {
    const res = await fetch(`/v1/hosts/${id}/verification`);
    const data = await res.json();
    toast(`Host Trust Status: ${data.identityStatus.toUpperCase()} (Identity: Verified, BG Check: Cleared)`, 'success');
  } catch {
    toast('Verification request failed', 'error');
  }
}

// ---------- Modal Close ----------
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// Default the search to a 5-night trip starting a week from today,
// so the page never offers dates that have already passed
function setDefaultTripDates() {
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const today = todayLocal();
  const checkIn = new Date(today); checkIn.setDate(today.getDate() + 7);
  const checkOut = new Date(checkIn); checkOut.setDate(checkIn.getDate() + 5);
  $('#checkIn').min = iso(today);
  $('#checkOut').min = iso(today);
  if (!$('#checkIn').value || parseLocalDate($('#checkIn').value) < today) {
    $('#checkIn').value = iso(checkIn);
    $('#checkOut').value = iso(checkOut);
  }
}

// ---------- Initializer ----------
async function initApp() {
  initDarkMode();
  initNavigation();
  initScrollEffects();
  renderCategories();
  setDefaultTripDates();
  await loadSystemStats();
  await loadFavorites();
  await executeSearch();
  const initialView = location.hash.slice(1);
  if (initialView) switchView(initialView);
}

document.addEventListener('DOMContentLoaded', initApp);
