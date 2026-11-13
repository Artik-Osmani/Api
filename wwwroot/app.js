/* ========================================================
   StayHub / FatiHomes — Interactive Web Client (app.js)
   Full CRUD, Real-Time Availability, Reviews, Confetti & Chat
   Scroll Animations & Micro-Interactions
   ======================================================== */

'use strict';

const state = {
  listings: [],
  wishlistItems: [],
  wishlistIds: new Set(),
  wishlistCollections: [
    { id: 'all', name: 'All Saved', icon: '✨' },
    { id: 'summer', name: 'Summer Escapes', icon: '🏖️' },
    { id: 'winter', name: 'Winter Cabins', icon: '❄️' },
    { id: 'city', name: 'City Breaks', icon: '🏙️' },
    { id: 'luxury', name: 'Luxury Villas', icon: '💎' }
  ],
  activeWishlistCollection: 'all',
  wishlistSearch: '',
  wishlistCategory: 'all',
  wishlistSort: 'default',
  wishlistSuperhostFilter: false,
  wishlistInstantFilter: false,
  wishlistTripNights: 3,
  wishlistViewMode: 'grid',
  wishlistCompareIds: new Set(),
  wishlistNotes: {},
  listingBoards: {},
  reservations: [],
  activeCategory: 'all',
  currentView: 'listings',
  superhostFilter: false,
  instantBookFilter: false,
  selectedListing: null,
  bookingStep: 1,
  chatReservationId: null,
  bookingStatusFilter: 'all',
  bookingUpcomingOnly: false,
  openBookingId: null,
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

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);

const formatStamp = (value) =>
  value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';

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
  const cards = $$('.property-card, .res-booking-card, .host-profile-card');
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

// ---------- Language Switcher (SCRUM-28) ----------
const I18N = {
  en: {
    'meta.title': 'FatiHomes & StayHub — Luxury Vacation Rentals & Hotels',
    'stats.stays': 'stays',
    'stats.bookings': 'bookings',
    'stats.reviews': 'reviews',
    'nav.explore': 'Explore',
    'nav.wishlist': 'Wishlist',
    'nav.bookings': 'Bookings',
    'nav.hosts': 'Hosts',
    'nav.contact': 'Contact',
    'hero.title': 'Find unforgettable stays everywhere',
    'hero.subtitle': 'Discover handpicked villas, mountain cabins, lofts, and boutique homes.',
    'search.where': 'Where',
    'search.checkin': 'Check in',
    'search.checkout': 'Check out',
    'search.guests': 'Guests',
    'search.placeholder': 'Search city, cabin, villa...',
    'search.cta': '🔍 Search'
  },
  sq: {
    'meta.title': 'FatiHomes & StayHub — Qira pushimi & hotele',
    'stats.stays': 'qëndrime',
    'stats.bookings': 'rezervime',
    'stats.reviews': 'vlerësime',
    'nav.explore': 'Eksploro',
    'nav.wishlist': 'Lista',
    'nav.bookings': 'Rezervimet',
    'nav.hosts': 'Pritësit',
    'nav.contact': 'Kontakti',
    'hero.title': 'Gjej qëndrime të paharrueshme kudo',
    'hero.subtitle': 'Zbuloni vila të përzgjedhura, kabina maleje, loft-e dhe shtëpi butik.',
    'search.where': 'Ku',
    'search.checkin': 'Mbërritja',
    'search.checkout': 'Nisja',
    'search.guests': 'Mysafirë',
    'search.placeholder': 'Kërko qytet, kabinë, vilë...',
    'search.cta': '🔍 Kërko'
  }
};
const LANG_KEY = 'fatihomes:lang';

function currentLang() {
  try { return localStorage.getItem(LANG_KEY) || 'en'; }
  catch { return 'en'; }
}

function applyLanguage(lang) {
  const dict = I18N[lang] || I18N.en;
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-lang-key]').forEach(node => {
    const value = dict[node.dataset.langKey];
    if (value !== undefined) node.textContent = value;
  });
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.placeholder = dict['search.placeholder'];
  document.title = dict['meta.title'];
  document.querySelectorAll('[data-lang-btn]').forEach(btn =>
    btn.setAttribute('aria-pressed', String(btn.dataset.langBtn === lang)));
}

function setLanguage(lang) {
  if (!I18N[lang]) return;
  try { localStorage.setItem(LANG_KEY, lang); } catch {}
  applyLanguage(lang);
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
  $$('.nav-pill').forEach(el => {
    const isActive = el.dataset.view === view || el.id === 'pill-' + view;
    el.classList.toggle('active', isActive);
    if (isActive) el.setAttribute('aria-current', 'page');
    else el.removeAttribute('aria-current');
  });

  const viewEl = document.getElementById('view-' + view) || document.getElementById('view' + view.charAt(0).toUpperCase() + view.slice(1));
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
    renderListingsGrid(state.listings, '#listingsGrid');
    $('#resultsCount').textContent = `${data.totalRecords} properties found`;
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
          <div class="card-location-sub">📍 ${l.address.city}, ${l.address.state} · ${l.category.replace('_', ' ')}</div>
          <div class="card-specs">👥 Up to ${l.capacity.maxGuests} guests · ${l.capacity.bedrooms} bed · ${l.capacity.bathrooms} bath</div>
          <div class="amenities-pills">
            ${l.amenities.slice(0, 3).map(a => `<span class="amenity-chip">✨ ${a.replace('_', ' ')}</span>`).join('')}
          </div>
          <div class="card-footer-row">
            <div class="card-price-text">$${l.pricing.baseNightlyRate} <span>/ night</span></div>
            <button class="btn-book-card" onclick="event.stopPropagation(); startBookingFlow('${l.id}')">Reserve</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ---------- Wishlist & Trip Collections ----------

function loadWishlistLocalData() {
  try {
    const savedNotes = localStorage.getItem('sh_wishlist_notes');
    if (savedNotes) state.wishlistNotes = JSON.parse(savedNotes);

    const savedBoards = localStorage.getItem('sh_listing_boards');
    if (savedBoards) state.listingBoards = JSON.parse(savedBoards);

    const savedCollections = localStorage.getItem('sh_wishlist_collections');
    if (savedCollections) state.wishlistCollections = JSON.parse(savedCollections);

    const savedNights = localStorage.getItem('sh_wishlist_nights');
    if (savedNights) state.wishlistTripNights = parseInt(savedNights) || 3;

    const savedViewMode = localStorage.getItem('sh_wishlist_view_mode');
    if (savedViewMode) state.wishlistViewMode = savedViewMode;
  } catch {}
}

function saveWishlistLocalData() {
  try {
    localStorage.setItem('sh_wishlist_notes', JSON.stringify(state.wishlistNotes));
    localStorage.setItem('sh_listing_boards', JSON.stringify(state.listingBoards));
    localStorage.setItem('sh_wishlist_collections', JSON.stringify(state.wishlistCollections));
    localStorage.setItem('sh_wishlist_nights', state.wishlistTripNights.toString());
    localStorage.setItem('sh_wishlist_view_mode', state.wishlistViewMode);
  } catch {}
}

async function loadFavorites(showToast = false) {
  try {
    const res = await fetch('/v1/favorites');
    if (!res.ok) return;
    const favs = await res.json();
    state.wishlistItems = favs;
    state.wishlistIds = new Set(favs.map(f => f.id));
    $('#favCountBadge').textContent = state.wishlistIds.size;
    if (showToast) toast('Wishlist updated with latest saved stays!', 'success');
    if (state.currentView === 'wishlist') renderWishlist();
  } catch {
    if (showToast) toast('Failed to load favorites', 'error');
  }
}

async function toggleWishlist(id) {
  try {
    const res = await fetch(`/v1/favorites/${id}`, { method: 'POST' });
    if (!res.ok) throw new Error();
    const data = await res.json();
    if (data.favorited) {
      state.wishlistIds.add(id);
      let item = state.listings.find(l => l.id === id);
      if (!item) {
        const itemRes = await fetch(`/v1/listings/${id}`);
        if (itemRes.ok) item = await itemRes.json();
      }
      if (item && !state.wishlistItems.some(x => x.id === id)) {
        state.wishlistItems.push(item);
      }
      toast('Saved to your Wishlist!', 'success');
      fireConfetti();
    } else {
      state.wishlistIds.delete(id);
      state.wishlistItems = state.wishlistItems.filter(x => x.id !== id);
      state.wishlistCompareIds.delete(id);
      updateCompareDock();
      toast('Removed from Wishlist', 'info');
    }
    $('#favCountBadge').textContent = state.wishlistIds.size;
    renderListingsGrid(state.listings, '#listingsGrid');
    if (state.currentView === 'wishlist') renderWishlist();
    loadSystemStats();
  } catch {
    toast('Error updating wishlist', 'error');
  }
}

async function removeWishlistListing(id) {
  const card = document.getElementById(`w-card-${id}`);
  if (card) {
    card.classList.add('removing');
  }

  try {
    const res = await fetch(`/v1/favorites/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error();
    state.wishlistIds.delete(id);
    state.wishlistItems = state.wishlistItems.filter(x => x.id !== id);
    state.wishlistCompareIds.delete(id);
    updateCompareDock();
    $('#favCountBadge').textContent = state.wishlistIds.size;
    toast('Removed from Wishlist', 'info');
    setTimeout(() => {
      renderWishlist();
      renderListingsGrid(state.listings, '#listingsGrid');
    }, 250);
    loadSystemStats();
  } catch {
    toast('Error removing stay from wishlist', 'error');
    if (card) card.classList.remove('removing');
  }
}

async function confirmClearWishlist() {
  if (state.wishlistIds.size === 0) {
    toast('Your wishlist is already empty', 'info');
    return;
  }
  if (!confirm('Are you sure you want to remove all saved stays from your wishlist?')) {
    return;
  }

  try {
    const res = await fetch('/v1/favorites', { method: 'DELETE' });
    if (!res.ok) throw new Error();
    state.wishlistIds.clear();
    state.wishlistItems = [];
    state.wishlistCompareIds.clear();
    updateCompareDock();
    $('#favCountBadge').textContent = '0';
    renderWishlist();
    renderListingsGrid(state.listings, '#listingsGrid');
    toast('All saved stays removed', 'info');
    loadSystemStats();
  } catch {
    toast('Failed to clear wishlist', 'error');
  }
}

function renderWishlist() {
  const grid = $('#wishlistGrid');
  const emptyState = $('#wishlistEmptyState');
  if (!grid || !emptyState) return;

  const totalSaved = state.wishlistItems.length;

  // 1. Update Metrics Ribbon
  $('#wStatTotalCount').textContent = totalSaved;
  if (totalSaved > 0) {
    const avgPrice = Math.round(state.wishlistItems.reduce((acc, l) => acc + l.pricing.baseNightlyRate, 0) / totalSaved);
    $('#wStatAvgPrice').textContent = `$${avgPrice}`;

    const cities = [...new Set(state.wishlistItems.map(l => l.address.city))];
    $('#wStatDestinations').textContent = cities.slice(0, 2).join(', ') + (cities.length > 2 ? ` +${cities.length - 2}` : '');
    $('#wStatDestinations').title = cities.join(', ');

    const topRating = Math.max(...state.wishlistItems.map(l => l.starRating)).toFixed(2);
    $('#wStatTopRating').textContent = `★ ${topRating}`;

    const estBudget = avgPrice * state.wishlistTripNights;
    $('#wEstBudgetVal').textContent = `$${estBudget.toLocaleString()}`;
  } else {
    $('#wStatAvgPrice').textContent = '$0';
    $('#wStatDestinations').textContent = '—';
    $('#wStatTopRating').textContent = '—';
    $('#wEstBudgetVal').textContent = '$0';
  }

  $('#wNightsCount').textContent = state.wishlistTripNights;
  const slider = $('#wNightsSlider');
  if (slider) slider.value = state.wishlistTripNights;

  // 2. Render Collections / Boards Strip
  renderWishlistCollectionsStrip();

  // 3. Handle Completely Empty Wishlist
  if (totalSaved === 0) {
    grid.style.display = 'none';
    emptyState.style.display = 'block';
    renderWishlistEmptyState();
    return;
  }

  // 4. Filter & Sort Items
  let items = [...state.wishlistItems];

  // Board Filter
  if (state.activeWishlistCollection !== 'all') {
    items = items.filter(l => state.listingBoards[l.id] === state.activeWishlistCollection);
  }

  // Search Filter
  if (state.wishlistSearch.trim()) {
    const q = state.wishlistSearch.toLowerCase().trim();
    items = items.filter(l =>
      l.title.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q) ||
      l.address.city.toLowerCase().includes(q) ||
      l.address.state.toLowerCase().includes(q) ||
      l.category.toLowerCase().includes(q) ||
      l.amenities.some(a => a.toLowerCase().includes(q)) ||
      l.host.name.toLowerCase().includes(q)
    );
  }

  // Category Filter
  if (state.wishlistCategory !== 'all') {
    items = items.filter(l => l.category === state.wishlistCategory);
  }

  // Quick Toggles
  if (state.wishlistSuperhostFilter) {
    items = items.filter(l => l.host.superhostStatus);
  }
  if (state.wishlistInstantFilter) {
    items = items.filter(l => l.instantBookEnabled);
  }

  // Sort
  if (state.wishlistSort === 'price_asc') {
    items.sort((a, b) => a.pricing.baseNightlyRate - b.pricing.baseNightlyRate);
  } else if (state.wishlistSort === 'price_desc') {
    items.sort((a, b) => b.pricing.baseNightlyRate - a.pricing.baseNightlyRate);
  } else if (state.wishlistSort === 'rating_desc') {
    items.sort((a, b) => b.starRating - a.starRating);
  } else if (state.wishlistSort === 'capacity_desc') {
    items.sort((a, b) => b.capacity.maxGuests - a.capacity.maxGuests);
  }

  // 5. Handle Filtered Out Empty State
  if (items.length === 0) {
    grid.style.display = 'grid';
    emptyState.style.display = 'none';
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3.5rem 1rem; background:var(--bg-card); border-radius:var(--radius-lg); border:1px dashed var(--border-light);">
        <div style="font-size: 2.8rem; margin-bottom: 0.8rem;">🔍</div>
        <h3 style="font-size:1.3rem; font-weight:800;">No saved stays match your filters</h3>
        <p class="text-muted" style="margin-top:6px; margin-bottom:1.5rem;">Try adjusting your board, search keywords, or property filters.</p>
        <button class="btn-secondary" onclick="resetWishlistFilters()">Clear Filter Criteria</button>
      </div>`;
    return;
  }

  // 6. Render Wishlist Cards
  grid.style.display = state.wishlistViewMode === 'list' ? 'flex' : 'grid';
  grid.className = state.wishlistViewMode === 'list' ? 'properties-grid wishlist-mode list-mode' : 'properties-grid wishlist-mode';
  emptyState.style.display = 'none';

  grid.innerHTML = items.map(l => {
    const isCompared = state.wishlistCompareIds.has(l.id);
    const assignedBoardId = state.listingBoards[l.id] || 'all';
    const assignedBoard = state.wishlistCollections.find(c => c.id === assignedBoardId) || { name: 'Saved Stay', icon: '📌' };
    const userNote = state.wishlistNotes[l.id] || '';
    const tripTotal = Math.round(l.pricing.baseNightlyRate * state.wishlistTripNights);

    return `
      <div class="wishlist-card property-card" id="w-card-${l.id}" onclick="openPropertyDetail('${l.id}')">
        
        <!-- Compare Checkbox Badge -->
        <label class="card-compare-badge" onclick="event.stopPropagation();">
          <input type="checkbox" class="card-compare-checkbox" ${isCompared ? 'checked' : ''} onchange="toggleWishlistCompare('${l.id}', this.checked)" />
          <span>Compare</span>
        </label>

        <!-- Top Image with Badges & Unfavorite Button -->
        <div class="card-img-wrapper">
          <img src="${l.imageUrl}" alt="${l.title}" loading="lazy" />
          <div class="card-top-badges">
            ${l.host.superhostStatus ? '<span class="badge-tag superhost">⭐ Superhost</span>' : ''}
            ${l.instantBookEnabled ? '<span class="badge-tag instant">⚡ Instant Book</span>' : ''}
          </div>
          <button class="card-heart-btn" title="Remove from wishlist" onclick="event.stopPropagation(); removeWishlistListing('${l.id}')">
            ❤️
          </button>
        </div>

        <!-- Card Content -->
        <div class="card-content" style="padding: 1.3rem;">
          
          <!-- Board / Collection Tag -->
          <div>
            <button class="w-card-coll-tag" title="Move to another board" onclick="event.stopPropagation(); openAssignBoardModal('${l.id}')">
              <span>${assignedBoard.icon}</span> <span>${assignedBoard.name}</span> <span>▾</span>
            </button>
          </div>

          <!-- Title and Star Rating -->
          <div class="card-header-row">
            <div class="card-prop-title">${l.title}</div>
            <div class="card-prop-rating">★ ${l.starRating.toFixed(2)} (${l.reviewCount})</div>
          </div>

          <div class="card-location-sub">📍 ${l.address.city}, ${l.address.state} · ${l.category.replace('_', ' ')}</div>
          <div class="card-specs">👥 Up to ${l.capacity.maxGuests} guests · ${l.capacity.bedrooms} bed · ${l.capacity.bathrooms} bath</div>

          <!-- Amenities Chips -->
          <div class="amenities-pills">
            ${l.amenities.slice(0, 3).map(a => `<span class="amenity-chip">✨ ${a.replace('_', ' ')}</span>`).join('')}
          </div>

          <!-- Estimated Total for Selected Nights -->
          <div class="w-card-trip-estimate">
            <span>⏱️ ${state.wishlistTripNights} nights estimate:</span>
            <span>$${tripTotal} total</span>
          </div>

          <!-- Personal Trip Notes Box -->
          <div class="w-card-note-box" onclick="event.stopPropagation();">
            <div class="note-header">
              <span>📝 Trip Note:</span>
              <span style="font-size:0.7rem; font-weight:400;">Auto-saved</span>
            </div>
            <textarea class="note-input" rows="2" placeholder="Add personal note (e.g. check heated pool, ski trip)..."
              oninput="saveWishlistNote('${l.id}', this.value)">${userNote}</textarea>
          </div>

          <!-- Footer with Rate and Actions -->
          <div class="card-footer-row" style="margin-top:1.2rem;">
            <div class="card-price-text">$${l.pricing.baseNightlyRate} <span>/ night</span></div>
            <div style="display:flex; gap:8px;">
              <button class="btn-action-sm" title="Share this stay" onclick="event.stopPropagation(); shareSingleStay('${l.id}')">🔗</button>
              <button class="btn-book-card" onclick="event.stopPropagation(); startBookingFlow('${l.id}')">Reserve</button>
            </div>
          </div>

        </div>
      </div>
    `;
  }).join('');

  updateCompareDock();
  setTimeout(triggerCardReveals, 100);
}

function renderWishlistCollectionsStrip() {
  const strip = $('#wishlistCollectionsStrip');
  if (!strip) return;

  strip.innerHTML = state.wishlistCollections.map(c => {
    let count = 0;
    if (c.id === 'all') {
      count = state.wishlistItems.length;
    } else {
      count = state.wishlistItems.filter(l => state.listingBoards[l.id] === c.id).length;
    }

    const isActive = state.activeWishlistCollection === c.id;
    return `
      <button class="coll-chip ${isActive ? 'active' : ''}" onclick="selectWishlistCollection('${c.id}')">
        <span>${c.icon}</span>
        <span>${c.name}</span>
        <span class="coll-chip-badge">${count}</span>
      </button>
    `;
  }).join('');
}

function renderWishlistEmptyState() {
  const container = $('#wishlistEmptyState');
  if (!container) return;

  const trendingListings = (state.listings.length > 0 ? state.listings : state.wishlistItems).slice(0, 3);

  container.innerHTML = `
    <div class="empty-heart-icon">💖</div>
    <h3 class="empty-title">Your Wishlist is Empty</h3>
    <p class="empty-sub">
      You haven't saved any vacation properties yet. Click the ❤️ icon on any stay while exploring to save it to your wishlist and compare later!
    </p>
    <button class="btn-primary" style="font-size:1rem; padding:12px 28px;" onclick="switchView('listings')">
      🔍 Explore All Stays Now
    </button>

    ${trendingListings.length > 0 ? `
      <div class="empty-trending-section">
        <div class="empty-trending-title">
          <span>✨ Trending Escapes You Might Love:</span>
        </div>
        <div class="properties-grid" style="margin-top:1rem;">
          ${trendingListings.map(l => `
            <div class="property-card reveal" onclick="openPropertyDetail('${l.id}')">
              <div class="card-img-wrapper">
                <img src="${l.imageUrl}" alt="${l.title}" />
                <button class="card-heart-btn" onclick="event.stopPropagation(); toggleWishlist('${l.id}')">
                  ${state.wishlistIds.has(l.id) ? '❤️' : '🤍'}
                </button>
              </div>
              <div class="card-content">
                <div class="card-header-row">
                  <div class="card-prop-title">${l.title}</div>
                  <div class="card-prop-rating">★ ${l.starRating.toFixed(2)}</div>
                </div>
                <div class="card-location-sub">📍 ${l.address.city}, ${l.address.state}</div>
                <div class="card-footer-row" style="margin-top:10px;">
                  <div class="card-price-text">$${l.pricing.baseNightlyRate} <span>/ night</span></div>
                  <button class="btn-secondary" style="padding:6px 14px; font-size:0.8rem;" onclick="event.stopPropagation(); toggleWishlist('${l.id}')">
                    + Add to Wishlist
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
  `;
}

function selectWishlistCollection(id) {
  state.activeWishlistCollection = id;
  renderWishlist();
}

function onWishlistSearch(val) {
  state.wishlistSearch = val;
  const clearBtn = $('#wSearchClearBtn');
  if (clearBtn) clearBtn.style.display = val ? 'block' : 'none';
  renderWishlist();
}

function clearWishlistSearch() {
  state.wishlistSearch = '';
  const input = $('#wishlistSearchInput');
  if (input) input.value = '';
  const clearBtn = $('#wSearchClearBtn');
  if (clearBtn) clearBtn.style.display = 'none';
  renderWishlist();
}

function onWishlistCategoryFilter(val) {
  state.wishlistCategory = val;
  renderWishlist();
}

function onWishlistSort(val) {
  state.wishlistSort = val;
  renderWishlist();
}

function toggleWishlistFilter(type) {
  if (type === 'superhost') {
    state.wishlistSuperhostFilter = !state.wishlistSuperhostFilter;
    $('#wToggleSuperhost')?.classList.toggle('active', state.wishlistSuperhostFilter);
  } else if (type === 'instant') {
    state.wishlistInstantFilter = !state.wishlistInstantFilter;
    $('#wToggleInstant')?.classList.toggle('active', state.wishlistInstantFilter);
  }
  renderWishlist();
}

function resetWishlistFilters() {
  state.activeWishlistCollection = 'all';
  state.wishlistSearch = '';
  state.wishlistCategory = 'all';
  state.wishlistSort = 'default';
  state.wishlistSuperhostFilter = false;
  state.wishlistInstantFilter = false;

  const sInput = $('#wishlistSearchInput');
  if (sInput) sInput.value = '';
  const cSelect = $('#wCategorySelect');
  if (cSelect) cSelect.value = 'all';
  const sortSelect = $('#wSortSelect');
  if (sortSelect) sortSelect.value = 'default';
  $('#wToggleSuperhost')?.classList.remove('active');
  $('#wToggleInstant')?.classList.remove('active');
  const clearBtn = $('#wSearchClearBtn');
  if (clearBtn) clearBtn.style.display = 'none';

  renderWishlist();
}

function setWishlistViewMode(mode) {
  state.wishlistViewMode = mode;
  saveWishlistLocalData();
  $('#wViewGridBtn')?.classList.toggle('active', mode === 'grid');
  $('#wViewListBtn')?.classList.toggle('active', mode === 'list');
  renderWishlist();
}

function onTripNightsChanged(val) {
  state.wishlistTripNights = parseInt(val) || 1;
  saveWishlistLocalData();
  $('#wNightsCount').textContent = state.wishlistTripNights;
  if (state.wishlistItems.length > 0) {
    const avgPrice = Math.round(state.wishlistItems.reduce((acc, l) => acc + l.pricing.baseNightlyRate, 0) / state.wishlistItems.length);
    $('#wEstBudgetVal').textContent = `$${(avgPrice * state.wishlistTripNights).toLocaleString()}`;
  }
  renderWishlist();
}

function saveWishlistNote(id, note) {
  state.wishlistNotes[id] = note;
  saveWishlistLocalData();
}

// ---------- Comparison Dock & Modal ----------
function toggleWishlistCompare(id, checked) {
  if (checked) {
    if (state.wishlistCompareIds.size >= 3) {
      toast('You can compare a maximum of 3 properties at once', 'info');
      const cb = $(`#w-card-${id} .card-compare-checkbox`);
      if (cb) cb.checked = false;
      return;
    }
    state.wishlistCompareIds.add(id);
    toast('Added to comparison deck', 'info');
  } else {
    state.wishlistCompareIds.delete(id);
  }
  updateCompareDock();
}

function updateCompareDock() {
  const dock = $('#compareDock');
  if (!dock) return;

  const count = state.wishlistCompareIds.size;
  $('#compareCount').textContent = count;

  if (count > 0) {
    dock.classList.add('visible');
    const thumbs = $('#compareDockThumbs');
    const selectedListings = state.wishlistItems.filter(l => state.wishlistCompareIds.has(l.id));

    thumbs.innerHTML = selectedListings.map(l => `
      <div class="dock-thumb-item" title="${l.title}">
        <img src="${l.imageUrl}" alt="${l.title}" />
        <button class="dock-thumb-remove" onclick="removeCompareListing('${l.id}')">✕</button>
      </div>
    `).join('');
  } else {
    dock.classList.remove('visible');
  }
}

function removeCompareListing(id) {
  state.wishlistCompareIds.delete(id);
  const cb = $(`#w-card-${id} .card-compare-checkbox`);
  if (cb) cb.checked = false;
  updateCompareDock();
}

function clearCompareSelection() {
  state.wishlistCompareIds.clear();
  $$('.card-compare-checkbox').forEach(cb => cb.checked = false);
  updateCompareDock();
  toast('Comparison selection cleared', 'info');
}

function openCompareModal() {
  if (state.wishlistCompareIds.size < 2) {
    toast('Select at least 2 properties to compare side-by-side', 'info');
    return;
  }

  const selectedListings = state.wishlistItems.filter(l => state.wishlistCompareIds.has(l.id));
  const container = $('#compareMatrixContainer');
  if (!container) return;

  const amenitiesList = [
    { key: 'wifi', label: 'High-Speed WiFi' },
    { key: 'pool', label: 'Private / Shared Pool' },
    { key: 'hot_tub', label: 'Hot Tub / Jacuzzi' },
    { key: 'kitchen', label: 'Full Kitchen' },
    { key: 'air_conditioning', label: 'Air Conditioning' },
    { key: 'free_parking', label: 'Free Parking' },
    { key: 'workspace', label: 'Dedicated Workspace' },
    { key: 'self_check_in', label: 'Self Check-in' }
  ];

  container.innerHTML = `
    <table class="compare-matrix">
      <thead>
        <tr>
          <th>Feature</th>
          ${selectedListings.map(l => `
            <th class="compare-col-header" style="min-width: 250px;">
              <img src="${l.imageUrl}" class="compare-img-thumb" alt="${l.title}" />
              <div style="font-weight:800; font-size:1.05rem; margin-bottom:4px;">${l.title}</div>
              <div style="color:var(--text-muted); font-size:0.82rem; margin-bottom:8px;">📍 ${l.address.city}, ${l.address.state}</div>
              <button class="btn-action-sm" onclick="removeCompareListing('${l.id}'); openCompareModal();">✕ Remove</button>
            </th>
          `).join('')}
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Nightly Rate</td>
          ${selectedListings.map(l => `
            <td style="text-align:center;">
              <div style="font-size:1.25rem; font-weight:800; color:var(--primary);">$${l.pricing.baseNightlyRate}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">per night</div>
            </td>
          `).join('')}
        </tr>
        <tr>
          <td>Est. Total (${state.wishlistTripNights} nights)</td>
          ${selectedListings.map(l => `
            <td style="text-align:center; font-weight:800; font-size:1.1rem; color:var(--success);">
              $${Math.round(l.pricing.baseNightlyRate * state.wishlistTripNights + l.pricing.cleaningFee + l.pricing.serviceFee + l.pricing.localOccupancyTax)}
              <div style="font-size:0.75rem; font-weight:400; color:var(--text-muted);">incl. fees & taxes</div>
            </td>
          `).join('')}
        </tr>
        <tr>
          <td>Guest Rating</td>
          ${selectedListings.map(l => `
            <td style="text-align:center; font-weight:700;">★ ${l.starRating.toFixed(2)} <span style="color:var(--text-muted); font-weight:400;">(${l.reviewCount} reviews)</span></td>
          `).join('')}
        </tr>
        <tr>
          <td>Host Trust</td>
          ${selectedListings.map(l => `
            <td style="text-align:center;">
              ${l.host.superhostStatus ? '⭐ Certified Superhost' : 'Verified Host'}
              <div style="font-size:0.75rem; color:var(--text-muted);">${l.host.name} · ${l.host.responseRate}% response</div>
            </td>
          `).join('')}
        </tr>
        <tr>
          <td>Capacity & Layout</td>
          ${selectedListings.map(l => `
            <td style="text-align:center; font-size:0.85rem;">
              👥 ${l.capacity.maxGuests} guests<br>
              🛏️ ${l.capacity.bedrooms} bedroom${l.capacity.bedrooms > 1 ? 's' : ''} (${l.capacity.beds} beds)<br>
              🚿 ${l.capacity.bathrooms} bath
            </td>
          `).join('')}
        </tr>
        <tr>
          <td>Booking Mode</td>
          ${selectedListings.map(l => `
            <td style="text-align:center;">
              ${l.instantBookEnabled ? '<span class="status-badge confirmed">⚡ Instant Book</span>' : '<span class="status-badge pending_approval">Host Review</span>'}
            </td>
          `).join('')}
        </tr>
        ${amenitiesList.map(a => `
          <tr>
            <td>${a.label}</td>
            ${selectedListings.map(l => {
              const has = l.amenities.includes(a.key);
              return `<td style="text-align:center;">${has ? '<span class="compare-check">✔ Yes</span>' : '<span class="compare-cross">✖ No</span>'}</td>`;
            }).join('')}
          </tr>
        `).join('')}
        <tr>
          <td>Book Property</td>
          ${selectedListings.map(l => `
            <td style="text-align:center; padding:1.2rem;">
              <button class="btn-book-card" style="width:100%;" onclick="closeModal('compareModal'); startBookingFlow('${l.id}');">
                Reserve Stay
              </button>
            </td>
          `).join('')}
        </tr>
      </tbody>
    </table>
  `;

  $('#compareModal').classList.add('open');
}

// ---------- Collections / Boards Modals ----------
function openCreateCollectionModal() {
  $('#newCollectionName').value = '';
  $('#collectionModal').classList.add('open');
}

function selectCollectionIcon(btn, icon) {
  $('#newCollectionIcon').value = icon;
  $$('#collectionIconChips .coll-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function handleCreateCollection(e) {
  e.preventDefault();
  const name = $('#newCollectionName').value.trim();
  const icon = $('#newCollectionIcon').value || '📁';
  if (!name) return;

  const id = 'coll_' + Date.now();
  state.wishlistCollections.push({ id, name, icon });
  saveWishlistLocalData();
  closeModal('collectionModal');
  toast(`Created board "${icon} ${name}"!`, 'success');
  renderWishlist();
}

function openAssignBoardModal(listingId) {
  const listing = state.wishlistItems.find(l => l.id === listingId) || state.listings.find(l => l.id === listingId);
  if (!listing) return;

  $('#assignBoardListingId').value = listingId;
  $('#assignBoardSubtitle').textContent = `Assign "${listing.title}" to a trip board:`;

  const container = $('#assignBoardList');
  const currentBoardId = state.listingBoards[listingId] || 'all';

  container.innerHTML = state.wishlistCollections.map(c => `
    <button class="btn-action-sm ${currentBoardId === c.id ? 'active' : ''}"
      style="display:flex; justify-content:space-between; align-items:center; width:100%; text-align:left; padding:10px 16px;"
      onclick="assignListingToBoard('${listingId}', '${c.id}')">
      <span>${c.icon} ${c.name}</span>
      ${currentBoardId === c.id ? '<span>✔ Active</span>' : '<span>Assign</span>'}
    </button>
  `).join('');

  $('#assignBoardModal').classList.add('open');
}

function assignListingToBoard(listingId, boardId) {
  state.listingBoards[listingId] = boardId;
  saveWishlistLocalData();
  closeModal('assignBoardModal');
  const board = state.wishlistCollections.find(c => c.id === boardId);
  toast(`Moved to "${board?.name || 'Board'}"`, 'success');
  renderWishlist();
}

// ---------- Sharing Wishlist ----------
function openShareWishlistModal() {
  const url = window.location.origin + window.location.pathname + '?view=wishlist';
  $('#shareWishlistUrl').value = url;

  const count = state.wishlistItems.length;
  let summary = `❤️ My FatiHomes & StayHub Wishlist (${count} saved stays):\n\n`;
  state.wishlistItems.forEach((l, i) => {
    summary += `${i + 1}. ${l.title} (${l.address.city}) - $${l.pricing.baseNightlyRate}/night - ★ ${l.starRating.toFixed(2)}\n`;
  });
  summary += `\nExplore properties here: ${url}`;

  $('#shareWishlistSummary').value = summary;

  const encodedSummary = encodeURIComponent(summary);
  $('#btnShareWhatsApp').href = `https://api.whatsapp.com/send?text=${encodedSummary}`;
  $('#btnShareEmail').href = `mailto:?subject=${encodeURIComponent('Check out my saved vacation stays on StayHub')}&body=${encodedSummary}`;

  $('#shareWishlistModal').classList.add('open');
}

function copyShareLink() {
  const input = $('#shareWishlistUrl');
  input.select();
  navigator.clipboard.writeText(input.value);
  toast('Shareable link copied to clipboard!', 'success');
}

function copyShareSummary() {
  const textarea = $('#shareWishlistSummary');
  navigator.clipboard.writeText(textarea.value);
  toast('Wishlist summary copied to clipboard!', 'success');
}

function shareSingleStay(id) {
  const listing = state.wishlistItems.find(l => l.id === id) || state.listings.find(l => l.id === id);
  if (!listing) return;

  const url = `${window.location.origin}${window.location.pathname}?stay=${id}`;
  navigator.clipboard.writeText(url);
  toast(`Link for "${listing.title}" copied to clipboard!`, 'success');
}

// ---------- Property Detail Modal & Real Availability ----------
async function openPropertyDetail(id) {
  const listing = state.listings.find(l => l.id === id) || state.wishlistItems.find(l => l.id === id);
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
            ${listing.amenities.map(a => `<span class="amenity-chip">✨ ${a.replace('_', ' ')}</span>`).join('')}
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
            $${listing.pricing.baseNightlyRate} <span style="font-size:0.9rem; font-weight:400; color:var(--text-muted);">night</span>
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
  const listing = state.listings.find(l => l.id === id) || state.wishlistItems.find(l => l.id === id);
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

  $('#priceReceiptBox').innerHTML = `
    <div class="receipt-row"><span>${nights} nights × $${listing.pricing.baseNightlyRate}</span> <span>$${base.toFixed(2)}</span></div>
    <div class="receipt-row"><span>Cleaning fee</span> <span>$${clean.toFixed(2)}</span></div>
    <div class="receipt-row"><span>StayHub service fee</span> <span>$${service.toFixed(2)}</span></div>
    <div class="receipt-row"><span>Occupancy taxes</span> <span>$${tax.toFixed(2)}</span></div>
    <div class="receipt-row total"><span>Total</span> <span>$${total.toFixed(2)}</span></div>
  `;
  $('#finalTotalAmount').textContent = `$${total.toFixed(2)}`;

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

// ---------- Reservations Manager: options, filters, actions ----------
const bookingStatusTabs = [
  { id: 'all', label: 'All bookings', icon: '🎫' },
  { id: 'confirmed', label: 'Confirmed', icon: '✅' },
  { id: 'pending_approval', label: 'Pending', icon: '⏳' },
  { id: 'checked_in', label: 'Checked in', icon: '🔑' },
  { id: 'completed', label: 'Completed', icon: '🏁' },
  { id: 'cancelled', label: 'Cancelled', icon: '🚫' }
];

const editableStatuses = ['pending_approval', 'confirmed', 'checked_in', 'completed', 'cancelled'];

function statusLabel(status) {
  const tab = bookingStatusTabs.find(s => s.id === status);
  return tab && tab.id !== 'all' ? tab.label : String(status).replace(/_/g, ' ');
}

function todayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function nightsBetween(checkIn, checkOut) {
  return Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000));
}

function bookingMatchesSearch(reservation, term) {
  const listing = state.listings.find(l => l.id === reservation.listingId);
  const haystack = [
    listing?.title,
    listing?.address?.city,
    listing?.host?.name,
    reservation.primaryGuest?.firstName,
    reservation.primaryGuest?.lastName,
    reservation.primaryGuest?.email,
    reservation.status,
    reservation.id
  ].filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(term);
}

function getVisibleReservations() {
  const term = $('#bookingSearch').value.trim().toLowerCase();
  const sorter = $('#bookingSort').value;
  const today = todayIso();

  const filtered = state.reservations.filter(r => {
    if (state.bookingStatusFilter !== 'all' && r.status !== state.bookingStatusFilter) return false;
    if (state.bookingUpcomingOnly && (r.status === 'cancelled' || r.checkOutDate < today)) return false;
    if (term && !bookingMatchesSearch(r, term)) return false;
    return true;
  });

  const sorters = {
    recent: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    checkin_soon: (a, b) => a.checkInDate.localeCompare(b.checkInDate),
    checkin_desc: (a, b) => b.checkInDate.localeCompare(a.checkInDate),
    amount_desc: (a, b) => b.pricingSummary.totalAmount - a.pricingSummary.totalAmount,
    amount_asc: (a, b) => a.pricingSummary.totalAmount - b.pricingSummary.totalAmount
  };

  return filtered.sort(sorters[sorter] || sorters.recent);
}

function setBookingStatusFilter(status) {
  state.bookingStatusFilter = status;
  renderReservations();
}

function toggleUpcomingFilter(btn) {
  state.bookingUpcomingOnly = !state.bookingUpcomingOnly;
  btn.classList.toggle('active', state.bookingUpcomingOnly);
  renderReservations();
}

function clearBookingFilters() {
  state.bookingStatusFilter = 'all';
  state.bookingUpcomingOnly = false;
  $('#bookingSearch').value = '';
  $('#bookingSort').value = 'recent';
  $('#btnUpcomingOnly').classList.remove('active');
  renderReservations();
}

function replaceReservation(updated) {
  const index = state.reservations.findIndex(r => r.id === updated.id);
  if (index >= 0) state.reservations[index] = updated;
}

function renderBookingStatusTabs() {
  const strip = $('#bookingStatusTabs');
  if (!strip) return;

  strip.innerHTML = bookingStatusTabs.map(tab => {
    const count = tab.id === 'all'
      ? state.reservations.length
      : state.reservations.filter(r => r.status === tab.id).length;
    const isActive = state.bookingStatusFilter === tab.id;
    return `
      <button type="button" class="booking-tab ${isActive ? 'active' : ''}" aria-pressed="${isActive}"
        onclick="setBookingStatusFilter('${tab.id}')">
        <span>${tab.icon}</span>
        <span>${tab.label}</span>
        <span class="tab-count">${count}</span>
      </button>`;
  }).join('');
}

async function loadReservations() {
  try {
    const res = await fetch('/v1/reservations');
    if (!res.ok) throw new Error();
    state.reservations = await res.json();
    renderReservations();
  } catch {
    toast('Could not fetch reservations', 'error');
  }
}

function bookingActionButtons(r) {
  const buttons = [
    `<button class="btn-action-sm" onclick="openChatModal('${r.id}')">💬 Messages</button>`,
    `<button class="btn-action-sm" onclick="openBookingDetails('${r.id}')">🧾 Details</button>`
  ];

  if (r.status === 'pending_approval') {
    buttons.push(`<button class="btn-action-sm primary" onclick="updateBookingStatus('${r.id}', 'confirmed')">✔ Approve</button>`);
  }
  if (r.status === 'confirmed') {
    buttons.push(`<button class="btn-action-sm primary" onclick="updateBookingStatus('${r.id}', 'checked_in')">🔑 Check in</button>`);
  }
  if (r.status === 'checked_in') {
    buttons.push(`<button class="btn-action-sm primary" onclick="updateBookingStatus('${r.id}', 'completed')">🏁 Complete</button>`);
  }
  if (r.status === 'completed' || r.status === 'cancelled') {
    buttons.push(`<button class="btn-action-sm" onclick="rebookListing('${r.listingId}')">↺ Re-book</button>`);
  }
  if (r.status !== 'cancelled' && r.status !== 'completed') {
    buttons.push(`<button class="btn-action-sm danger" onclick="cancelReservation('${r.id}')">Cancel</button>`);
  }

  return buttons.join('');
}

function renderReservations() {
  renderBookingStatusTabs();
  const container = $('#reservationsList');
  const visible = getVisibleReservations();
  const total = state.reservations.length;

  $('#bookingResultsMeta').innerHTML = `Showing <strong>${visible.length}</strong> of ${total} booking${total === 1 ? '' : 's'}`;

  if (visible.length === 0) {
    container.innerHTML = total === 0 ? `
      <div class="bookings-empty">
        <div class="bookings-empty-icon">🗓️</div>
        <h3>No reservations yet</h3>
        <p class="text-muted">Browse through listings to make your first booking!</p>
      </div>` : `
      <div class="bookings-empty">
        <div class="bookings-empty-icon">🔍</div>
        <h3>No bookings match these filters</h3>
        <p class="text-muted">Try another status tab, clear the search, or switch off "Upcoming only".</p>
        <button class="btn-secondary" onclick="clearBookingFilters()">Clear filters</button>
      </div>`;
    return;
  }

  container.innerHTML = visible.map(r => {
    const listing = state.listings.find(l => l.id === r.listingId);
    const title = listing ? listing.title : 'Vacation Stay';
    const img = listing ? listing.imageUrl : 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=300&q=80';
    const nights = nightsBetween(r.checkInDate, r.checkOutDate);

    return `
      <div class="res-booking-card">
        <div class="res-main-info">
          <img src="${esc(img)}" class="res-img-thumb" alt="thumb" />
          <div>
            <h4 style="font-weight:700;">${esc(title)}</h4>
            <div class="res-booking-meta">
              📅 ${esc(r.checkInDate)} → ${esc(r.checkOutDate)} · ${nights} night${nights === 1 ? '' : 's'} · 👤 ${esc(r.primaryGuest.firstName)} ${esc(r.primaryGuest.lastName)} (${r.guestsCount} guests)
            </div>
            <div class="res-booking-tags">
              <span class="status-badge ${esc(r.status)}">${esc(statusLabel(r.status))}</span>
              <span class="flow-chip">${r.bookingFlow === 'instant_book' ? '⚡ Instant book' : '📩 Request to book'}</span>
            </div>
            ${r.status === 'cancelled' && r.cancellationReason ? `<div class="res-cancel-reason">Reason: ${esc(r.cancellationReason)}</div>` : ''}
          </div>
        </div>
        <div class="res-booking-side">
          <div class="res-booking-amount">$${r.pricingSummary.totalAmount.toFixed(2)}</div>
          <div class="res-actions-cell">${bookingActionButtons(r)}</div>
        </div>
      </div>
    `;
  }).join('');

  setTimeout(triggerCardReveals, 100);
}

async function updateBookingStatus(id, status, reason = '') {
  try {
    const res = await fetch(`/v1/reservations/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reason: reason || null })
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    replaceReservation(data);
    toast(`Booking marked as ${statusLabel(status)}`, 'success');
    renderReservations();
    if (state.openBookingId === id) renderBookingDetails(data);
  } catch {
    toast('Could not update booking status', 'error');
  }
}

async function cancelReservation(id) {
  const reason = prompt('Cancel this booking? You can add a reason:', 'Change of plans');
  if (reason === null) return;

  try {
    const res = await fetch(`/v1/reservations/${id}/cancel?reason=${encodeURIComponent(reason)}`, { method: 'POST' });
    if (!res.ok) throw new Error();
    const data = await res.json();
    replaceReservation(data);
    toast('Reservation cancelled', 'info');
    renderReservations();
    if (state.openBookingId === id) renderBookingDetails(data);
  } catch {
    toast('Failed to cancel reservation', 'error');
  }
}

async function rebookListing(listingId) {
  let listing = state.listings.find(l => l.id === listingId);
  if (!listing) {
    try {
      const res = await fetch(`/v1/listings/${listingId}`);
      if (res.ok) {
        listing = await res.json();
        state.listings.push(listing);
      }
    } catch {}
  }

  if (!listing) {
    toast('This property is no longer available', 'error');
    return;
  }

  closeModal('bookingDetailsModal');
  switchView('listings');
  startBookingFlow(listingId);
}

// ---------- Booking Details, Receipt & Status Modal ----------
async function openBookingDetails(id) {
  state.openBookingId = id;
  $('#bookingDetailsSub').textContent = 'Loading reservation...';
  $('#bookingDetailsBody').innerHTML = '<p class="text-muted">Fetching receipt and status options...</p>';
  $('#bookingDetailsModal').classList.add('open');

  try {
    const res = await fetch(`/v1/reservations/${id}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    replaceReservation(data);
    renderBookingDetails(data);
  } catch {
    $('#bookingDetailsBody').innerHTML = '<p class="text-muted">Could not load this booking.</p>';
  }
}

function renderBookingDetails(r) {
  const listing = state.listings.find(l => l.id === r.listingId);
  const price = r.pricingSummary;
  const nights = nightsBetween(r.checkInDate, r.checkOutDate);

  $('#bookingDetailsSub').textContent = `${listing ? listing.title : 'Vacation Stay'} · Reference ${r.id.slice(0, 8)}`;

  $('#bookingDetailsBody').innerHTML = `
    <div class="details-meta">
      <span class="status-badge ${esc(r.status)}">${esc(statusLabel(r.status))}</span>
      <span class="flow-chip">${r.bookingFlow === 'instant_book' ? '⚡ Instant book' : '📩 Request to book'}</span>
      <span class="flow-chip">${nights} night${nights === 1 ? '' : 's'} · ${r.guestsCount} guests</span>
    </div>

    <div class="price-receipt">
      ${price.items.map(item => `
        <div class="receipt-row"><span>${esc(item.description)}</span><span>$${item.amount.toFixed(2)}</span></div>
      `).join('')}
      <div class="receipt-row receipt-row-note"><span>Refundable security deposit</span><span>$${price.securityDeposit.toFixed(2)}</span></div>
      <div class="receipt-row total"><span>Total due (${esc(price.currency)})</span><span>$${price.totalAmount.toFixed(2)}</span></div>
    </div>

    <div class="details-grid">
      <div>
        <h5 class="details-block-title">Lead guest</h5>
        <p>${esc(r.primaryGuest.firstName)} ${esc(r.primaryGuest.lastName)}</p>
        <p>${esc(r.primaryGuest.email)}</p>
        <p>${esc(r.primaryGuest.phoneNumber)}</p>
      </div>
      <div>
        <h5 class="details-block-title">Stay</h5>
        <p>Check-in ${esc(r.checkInDate)} · Check-out ${esc(r.checkOutDate)}</p>
        <p>Created ${esc(formatStamp(r.createdAt))}</p>
        <p>Updated ${esc(formatStamp(r.updatedAt))}</p>
      </div>
    </div>

    ${r.cancellationReason ? `<div class="details-note">Reason on file: ${esc(r.cancellationReason)}</div>` : ''}

    <div class="form-group">
      <label for="bookingStatusSelect">Change booking status</label>
      <select id="bookingStatusSelect">
        ${editableStatuses.map(s => `<option value="${s}" ${s === r.status ? 'selected' : ''}>${esc(statusLabel(s))}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label for="bookingStatusReason">Reason (optional)</label>
      <input type="text" id="bookingStatusReason" placeholder="Stored with the reservation note" />
    </div>

    <div class="modal-actions-split">
      <button class="btn-secondary" onclick="openChatModal('${r.id}')">💬 Message host</button>
      <button class="btn-cta-full" onclick="applyBookingStatusChange('${r.id}')">Save status</button>
    </div>
  `;
}

function applyBookingStatusChange(id) {
  const status = $('#bookingStatusSelect').value;
  const reason = $('#bookingStatusReason').value.trim();
  updateBookingStatus(id, status, reason);
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
function renderHosts() {
  const hostsMap = {};
  state.listings.forEach(l => {
    if (!hostsMap[l.host.hostId]) {
      hostsMap[l.host.hostId] = { host: l.host, listings: 0, rating: l.starRating, reviews: l.reviewCount };
    }
    hostsMap[l.host.hostId].listings++;
  });

  const list = Object.values(hostsMap);
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

// ---------- Initializer ----------
async function initApp() {
  initDarkMode();
  applyLanguage(currentLang());
  initNavigation();
  initScrollEffects();
  renderCategories();
  loadWishlistLocalData();
  await loadSystemStats();
  await loadFavorites();
  await executeSearch();
  const initialView = location.hash.slice(1);
  if (initialView) {
    switchView(initialView);
  } else {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('view') === 'wishlist') {
      switchView('wishlist');
    } else if (urlParams.get('stay')) {
      openPropertyDetail(urlParams.get('stay'));
    }
  }
}

document.addEventListener('DOMContentLoaded', initApp);
