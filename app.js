/* ==========================================================================
   INAPVIBE LUXE HOMESTAYS - APPLICATION JS ENGINE
   ========================================================================== */

// --- INITIAL HOMESTAY SEED DATA ---
const INITIAL_HOMESTAYS = [
    {
        id: 'hs-1',
        title: 'Resort Bayu Laut Villa',
        category: 'villa',
        location: 'Port Dickson, N. Sembilan',
        image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
        price: 650,
        bedrooms: 4,
        bathrooms: 3,
        maxGuests: 10,
        rating: 4.9,
        reviewsCount: 52,
        tag: 'Superhost - Kolam Peribadi',
        amenities: ['Private Pool', 'BBQ Grill', 'Wi-Fi 500Mbps', 'Smart TV', 'Kawasan Berpagar']
    },
    {
        id: 'hs-2',
        title: 'Chalet Puncak Rimba',
        category: 'chalet',
        location: 'Cameron Highlands, Pahang',
        image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
        price: 420,
        bedrooms: 3,
        bathrooms: 2,
        maxGuests: 6,
        rating: 4.85,
        reviewsCount: 39,
        tag: 'Pemandangan Gunung',
        amenities: ['Pemandangan Awam', 'Pemanas Air', 'Unggun Api', 'Dapur Lengkap', 'Parkir']
    },
    {
        id: 'hs-3',
        title: 'The Urban Glass Loft',
        category: 'loft',
        location: 'KLCC Skyline, Kuala Lumpur',
        image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
        price: 350,
        bedrooms: 2,
        bathrooms: 2,
        maxGuests: 4,
        rating: 4.92,
        reviewsCount: 64,
        tag: 'Skyline View & Jacuzzi',
        amenities: ['Infinity Pool', 'Gym', 'Jacuzzi', 'Netflix 4K', 'LRT 500m']
    },
    {
        id: 'hs-4',
        title: "D'Villages Kampung Deluxe",
        category: 'traditional',
        location: 'Ayer Keroh, Melaka',
        image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80',
        price: 480,
        bedrooms: 3,
        bathrooms: 3,
        maxGuests: 8,
        rating: 4.88,
        reviewsCount: 45,
        tag: 'Taman Peribadi & Santai',
        amenities: ['Taman Buah', 'Dapur Tradisional', 'Aircond Penuh', 'Kawasan Barbeque']
    }
];

// Seed Bookings
const INITIAL_BOOKINGS = [
    {
        id: 'HSV-882103',
        homestayId: 'hs-1',
        customerName: 'Ahmad Zulkarnain',
        phone: '0123984712',
        email: 'zulkarnain@gmail.com',
        checkIn: '2026-08-12',
        checkOut: '2026-08-14',
        nights: 2,
        totalPrice: 1465,
        paymentMethod: 'FPX Online Banking',
        status: 'Confirmed',
        createdAt: '2026-08-01'
    },
    {
        id: 'HSV-554921',
        homestayId: 'hs-2',
        customerName: 'Siti Nurhaliza M.',
        phone: '0198823711',
        email: 'ctnur@yahoo.com',
        checkIn: '2026-08-18',
        checkOut: '2026-08-20',
        nights: 2,
        totalPrice: 982,
        paymentMethod: 'DuitNow QR Pay',
        status: 'Confirmed',
        createdAt: '2026-08-03'
    }
];

// Seed Manual Locks (Maintenance / Owner stay)
const INITIAL_MANUAL_LOCKS = [
    {
        id: 'lock-1',
        homestayId: 'hs-1',
        startDate: '2026-08-22',
        endDate: '2026-08-24',
        reason: 'Penyelenggaraan Kolam Renang'
    }
];


// --- STATE MANAGEMENT ---
let state = {
    homestays: JSON.parse(localStorage.getItem('inapvibe_homestays')) || INITIAL_HOMESTAYS,
    bookings: JSON.parse(localStorage.getItem('inapvibe_bookings')) || INITIAL_BOOKINGS,
    manualLocks: JSON.parse(localStorage.getItem('inapvibe_locks')) || INITIAL_MANUAL_LOCKS,
    activeCategory: 'all',
    selectedHomestayForBooking: null,
    selectedCheckIn: null,
    selectedCheckOut: null,
    isAdminLoggedIn: sessionStorage.getItem('inapvibe_admin') === 'true'
};

function saveState() {
    localStorage.setItem('inapvibe_homestays', JSON.stringify(state.homestays));
    localStorage.setItem('inapvibe_bookings', JSON.stringify(state.bookings));
    localStorage.setItem('inapvibe_locks', JSON.stringify(state.manualLocks));
}


// --- CORE DATE LOCK ENGINE ---

/**
 * Checks if a specific date (YYYY-MM-DD) is LOCKED for a homestay
 */
function isDateLocked(homestayId, dateStr) {
    const targetTime = new Date(dateStr).getTime();

    // 1. Check Confirmed or Pending Bookings
    const isBooked = state.bookings.some(b => {
        if (b.homestayId !== homestayId || b.status === 'Cancelled') return false;
        const start = new Date(b.checkIn).getTime();
        const end = new Date(b.checkOut).getTime();
        // Date is locked if it falls between checkIn (inclusive) and checkOut (exclusive)
        return targetTime >= start && targetTime < end;
    });

    if (isBooked) return true;

    // 2. Check Admin Manual Locks
    const isManuallyLocked = state.manualLocks.some(l => {
        if (l.homestayId !== homestayId) return false;
        const start = new Date(l.startDate).getTime();
        const end = new Date(l.endDate).getTime();
        return targetTime >= start && targetTime < end;
    });

    return isManuallyLocked;
}

/**
 * Checks if a date range overlaps with any existing locked date
 */
function isRangeOverlappingLocked(homestayId, checkInStr, checkOutStr) {
    let curr = new Date(checkInStr);
    const end = new Date(checkOutStr);

    while (curr < end) {
        const yyyy = curr.getFullYear();
        const mm = String(curr.getMonth() + 1).padStart(2, '0');
        const dd = String(curr.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;

        if (isDateLocked(homestayId, dateStr)) {
            return true;
        }
        curr.setDate(curr.getDate() + 1);
    }
    return false;
}


// --- DOM INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initFilters();
    renderHomestayGrid();
    initSearchBox();
    renderCalendarMockup();
    initAdminModal();
    initFAQ();
});


// --- NAVIGATION & DRAWER ---
function initNavigation() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const closeDrawerBtn = document.getElementById('closeDrawerBtn');
    const mobileDrawer = document.getElementById('mobileDrawer');
    const drawerOverlay = document.getElementById('drawerOverlay');

    function toggleDrawer(open) {
        if (open) {
            mobileDrawer.classList.add('open');
            drawerOverlay.classList.add('open');
        } else {
            mobileDrawer.classList.remove('open');
            drawerOverlay.classList.remove('open');
        }
    }

    if (hamburgerBtn) hamburgerBtn.addEventListener('click', () => toggleDrawer(true));
    if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', () => toggleDrawer(false));
    if (drawerOverlay) drawerOverlay.addEventListener('click', () => toggleDrawer(false));

    // Close drawer on link click
    document.querySelectorAll('.drawer-link').forEach(link => {
        link.addEventListener('click', () => toggleDrawer(false));
    });
}

function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
}


// --- HOMESTAY LISTINGS & FILTERING ---
function initFilters() {
    const container = document.getElementById('filterContainer');
    if (!container) return;

    container.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-filter')) {
            container.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            state.activeCategory = e.target.getAttribute('data-filter');
            renderHomestayGrid();
        }
    });
}

function renderHomestayGrid() {
    const grid = document.getElementById('homestayGrid');
    if (!grid) return;

    const filtered = state.activeCategory === 'all' 
        ? state.homestays 
        : state.homestays.filter(h => h.category === state.activeCategory);

    grid.innerHTML = filtered.map(h => `
        <div class="homestay-card">
            <div class="card-img-wrapper">
                <img src="${h.image}" alt="${h.title}" class="card-img">
                <span class="card-tag-badge">${h.tag}</span>
                <span class="card-rating-badge"><i class="fa-solid fa-star text-warning"></i> ${h.rating}</span>
            </div>
            <div class="card-body">
                <div class="card-location"><i class="fa-solid fa-location-dot"></i> ${h.location}</div>
                <h3 class="card-title">${h.title}</h3>

                <div class="card-specs-row">
                    <span><i class="fa-solid fa-bed"></i> ${h.bedrooms} Bilik</span>
                    <span><i class="fa-solid fa-bath"></i> ${h.bathrooms} Tandas</span>
                    <span><i class="fa-solid fa-users"></i> Maks ${h.maxGuests} Pax</span>
                </div>

                <div class="card-amenities-tags">
                    ${h.amenities.slice(0, 3).map(a => `<span class="amenity-chip"><i class="fa-solid fa-check"></i> ${a}</span>`).join('')}
                </div>

                <div class="card-footer">
                    <div class="card-price">
                        <span class="price-amount">RM ${h.price}</span>
                        <span class="price-unit">per malam</span>
                    </div>
                    <button class="btn-primary" onclick="openBookingModal('${h.id}')">
                        <i class="fa-solid fa-calendar-check"></i> Tempah Sekarang
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    // Populate search select box options
    const select = document.getElementById('searchPropertySelect');
    if (select) {
        select.innerHTML = '<option value="all">Semua Homestay</option>' + 
            state.homestays.map(h => `<option value="${h.id}">${h.title} (${h.location})</option>`).join('');
    }
}


// --- INTERACTIVE BOOKING MODAL & CALENDAR ---
function openBookingModal(homestayId) {
    const homestay = state.homestays.find(h => h.id === homestayId);
    if (!homestay) return;

    state.selectedHomestayForBooking = homestay;
    state.selectedCheckIn = null;
    state.selectedCheckOut = null;

    // Set modal headers
    document.getElementById('modalCategoryBadge').innerText = homestay.category.toUpperCase();
    document.getElementById('modalHomestayTitle').innerText = homestay.title;
    document.getElementById('modalHomestayLocation').innerText = homestay.location;
    document.getElementById('modalHomestayImg').src = homestay.image;
    document.getElementById('modalSpecBeds').innerText = `${homestay.bedrooms} Bilik Tidur`;
    document.getElementById('modalSpecBaths').innerText = `${homestay.bathrooms} Bilik Air`;
    document.getElementById('modalSpecGuests').innerText = `Maks ${homestay.maxGuests} Tetamu`;
    document.getElementById('modalSpecRating').innerText = `${homestay.rating} (${homestay.reviewsCount} Ulasan)`;
    document.getElementById('modalPricePerNight').innerText = homestay.price;
    document.getElementById('formHomestayId').value = homestay.id;

    // Reset inputs
    document.getElementById('formCheckIn').value = '';
    document.getElementById('formCheckOut').value = '';
    calculateBill();

    // Render calendar for current month
    renderInteractiveCalendar();

    // Open Modal
    document.getElementById('bookingModal').classList.add('active');
}

function renderInteractiveCalendar() {
    const calendarEl = document.getElementById('interactiveCalendar');
    if (!calendarEl || !state.selectedHomestayForBooking) return;

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed

    // Format Month Title
    const monthNames = ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"];
    document.getElementById('calendarMonthTitle').innerText = `${monthNames[currentMonth]} ${currentYear}`;

    // Days header
    let html = `
        <div class="cal-day-header">Ahd</div>
        <div class="cal-day-header">Isn</div>
        <div class="cal-day-header">Sel</div>
        <div class="cal-day-header">Rab</div>
        <div class="cal-day-header">Kha</div>
        <div class="cal-day-header">Jum</div>
        <div class="cal-day-header">Sab</div>
    `;

    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Empty lead cells
    for (let i = 0; i < firstDayIndex; i++) {
        html += `<div class="cal-empty-cell"></div>`;
    }

    // Days loop
    for (let day = 1; day <= totalDaysInMonth; day++) {
        const dateObj = new Date(currentYear, currentMonth, day);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;

        const isPast = dateObj.setHours(0,0,0,0) < new Date().setHours(0,0,0,0);
        const locked = isDateLocked(state.selectedHomestayForBooking.id, dateStr);

        let classList = ['cal-date-btn'];
        if (isPast || locked) classList.push('locked');
        if (state.selectedCheckIn === dateStr || state.selectedCheckOut === dateStr) classList.push('selected');

        html += `
            <button type="button" class="${classList.join(' ')}" 
                ${isPast || locked ? 'disabled' : ''} 
                onclick="onCalendarDateClick('${dateStr}')">
                <span>${day}</span>
            </button>
        `;
    }

    calendarEl.innerHTML = html;
}

function onCalendarDateClick(dateStr) {
    if (!state.selectedCheckIn || (state.selectedCheckIn && state.selectedCheckOut)) {
        // First selection (Check-in)
        state.selectedCheckIn = dateStr;
        state.selectedCheckOut = null;
        showToast('Check-In dipilih: ' + dateStr + '. Sila pilih tarikh Check-Out.', 'warning');
    } else if (state.selectedCheckIn && !state.selectedCheckOut) {
        // Second selection (Check-out)
        if (new Date(dateStr) <= new Date(state.selectedCheckIn)) {
            // Selected check-out is before check-in -> reset to new check-in
            state.selectedCheckIn = dateStr;
            showToast('Check-In dikemaskini: ' + dateStr, 'warning');
        } else {
            // Verify if any locked dates fall within this range
            if (isRangeOverlappingLocked(state.selectedHomestayForBooking.id, state.selectedCheckIn, dateStr)) {
                showToast('Maaf, julat tarikh yang dipilih mengandungi tarikh yang telah DIKUNCI/BOOKED!', 'danger');
                state.selectedCheckIn = null;
                state.selectedCheckOut = null;
            } else {
                state.selectedCheckOut = dateStr;
                showToast('Tarikh dipilih: ' + state.selectedCheckIn + ' hingga ' + state.selectedCheckOut, 'success');
            }
        }
    }

    document.getElementById('formCheckIn').value = state.selectedCheckIn || '';
    document.getElementById('formCheckOut').value = state.selectedCheckOut || '';
    
    renderInteractiveCalendar();
    calculateBill();
}

function calculateBill() {
    if (!state.selectedHomestayForBooking) return;

    const rate = state.selectedHomestayForBooking.price;
    let nights = 0;

    if (state.selectedCheckIn && state.selectedCheckOut) {
        const diffTime = Math.abs(new Date(state.selectedCheckOut) - new Date(state.selectedCheckIn));
        nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const subtotal = rate * nights;
    const tax = Math.round(subtotal * 0.05);
    const deposit = nights > 0 ? 100 : 0;
    const grandTotal = subtotal + tax + deposit;

    document.getElementById('billRate').innerText = rate;
    document.getElementById('billNights').innerText = nights;
    document.getElementById('billSubtotal').innerText = subtotal.toLocaleString();
    document.getElementById('billTax').innerText = tax.toLocaleString();
    document.getElementById('billDeposit').innerText = deposit;
    document.getElementById('billGrandTotal').innerText = grandTotal.toLocaleString();
}


// --- FORM SUBMISSION & REAL-TIME DATE LOCKING ---
document.getElementById('bookingSubmitForm')?.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!state.selectedCheckIn || !state.selectedCheckOut) {
        showToast('Sila pilih tarikh Check-In dan Check-Out pada kalendar!', 'danger');
        return;
    }

    const name = document.getElementById('formCustomerName').value;
    const phone = document.getElementById('formCustomerPhone').value;
    const email = document.getElementById('formCustomerEmail').value;
    const payment = document.getElementById('formPaymentMethod').value;

    const nights = Math.ceil(Math.abs(new Date(state.selectedCheckOut) - new Date(state.selectedCheckIn)) / (1000 * 60 * 60 * 24));
    const subtotal = state.selectedHomestayForBooking.price * nights;
    const grandTotal = subtotal + Math.round(subtotal * 0.05) + 100;

    // Generate Booking Ref ID
    const bookingCode = 'HSV-' + Math.floor(100000 + Math.random() * 900000);

    const newBooking = {
        id: bookingCode,
        homestayId: state.selectedHomestayForBooking.id,
        customerName: name,
        phone: phone,
        email: email,
        checkIn: state.selectedCheckIn,
        checkOut: state.selectedCheckOut,
        nights: nights,
        totalPrice: grandTotal,
        paymentMethod: payment,
        status: 'Confirmed',
        createdAt: new Date().toISOString().split('T')[0]
    };

    // Add to state & save
    state.bookings.unshift(newBooking);
    saveState();

    // Close booking modal
    closeModal('bookingModal');

    // Populate receipt modal
    document.getElementById('recBookingCode').innerText = bookingCode;
    document.getElementById('recHomestayName').innerText = state.selectedHomestayForBooking.title;
    document.getElementById('recCheckIn').innerText = state.selectedCheckIn;
    document.getElementById('recCheckOut').innerText = state.selectedCheckOut;
    document.getElementById('recGuestName').innerText = name;
    document.getElementById('recTotalAmount').innerText = `RM ${grandTotal.toLocaleString()}`;

    const waText = encodeURIComponent(`Halo Admin InapVibe! Saya telah membuat tempahan:\n\nKod Ref: ${bookingCode}\nHomestay: ${state.selectedHomestayForBooking.title}\nCheck-In: ${state.selectedCheckIn}\nCheck-Out: ${state.selectedCheckOut}\nNama: ${name}\nJumlah: RM ${grandTotal}`);
    document.getElementById('recWhatsappBtn').href = `https://wa.me/60123456789?text=${waText}`;

    // Open receipt modal
    document.getElementById('receiptModal').classList.add('active');

    // Re-render mockups & admin tables
    renderCalendarMockup();
    if (state.isAdminLoggedIn) renderAdminTables();

    showToast('Tempahan Berjaya! Tarikh telah dikunci secara automatik.', 'success');
});


// --- ADMIN AUTHENTICATION & PORTAL ---
function initAdminModal() {
    const btnOpenTop = document.getElementById('btnOpenAdminLogin');
    const btnOpenMobile = document.getElementById('btnOpenAdminLoginMobile');
    const btnOpenFooter = document.getElementById('btnOpenAdminLoginFooter');
    const formLogin = document.getElementById('adminLoginForm');
    const btnLogout = document.getElementById('btnAdminLogout');

    function openAdmin() {
        if (state.isAdminLoggedIn) {
            openAdminDashboard();
        } else {
            document.getElementById('adminLoginModal').classList.add('active');
        }
    }

    if (btnOpenTop) btnOpenTop.addEventListener('click', openAdmin);
    if (btnOpenMobile) btnOpenMobile.addEventListener('click', openAdmin);
    if (btnOpenFooter) btnOpenFooter.addEventListener('click', openAdmin);

    if (formLogin) {
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('adminUsername').value;
            const pass = document.getElementById('adminPassword').value;

            if (user === 'admin' && pass === 'admin123') {
                state.isAdminLoggedIn = true;
                sessionStorage.setItem('inapvibe_admin', 'true');
                closeModal('adminLoginModal');
                openAdminDashboard();
                showToast('Selamat Datang Admin! Log Masuk Berjaya.', 'success');
            } else {
                showToast('ID atau Katalaluan Salah!', 'danger');
            }
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            state.isAdminLoggedIn = false;
            sessionStorage.removeItem('inapvibe_admin');
            closeModal('adminDashboardModal');
            showToast('Log Keluar Admin Berjaya.', 'warning');
        });
    }

    // Tab switching inside admin workspace
    document.querySelectorAll('.admin-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.admin-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content .tab-pane').forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(tabId)?.classList.add('active');
        });
    });

    // Manual date lock submit form
    document.getElementById('adminManualLockForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const propId = document.getElementById('lockPropertySelect').value;
        const startDate = document.getElementById('lockStartDate').value;
        const endDate = document.getElementById('lockEndDate').value;
        const reason = document.getElementById('lockReason').value;

        if (new Date(endDate) <= new Date(startDate)) {
            showToast('Tarikh tamat mesti selepas tarikh mula!', 'danger');
            return;
        }

        const newLock = {
            id: 'lock-' + Date.now(),
            homestayId: propId,
            startDate: startDate,
            endDate: endDate,
            reason: reason
        };

        state.manualLocks.push(newLock);
        saveState();
        renderAdminTables();
        renderCalendarMockup();
        showToast('Tarikh Berjaya Dikunci Khas!', 'success');

        // reset form
        document.getElementById('adminManualLockForm').reset();
    });

    // Admin search & filter inputs
    document.getElementById('adminSearchBooking')?.addEventListener('input', renderAdminTables);
    document.getElementById('adminStatusFilter')?.addEventListener('change', renderAdminTables);
}

function openAdminDashboard() {
    renderAdminTables();
    document.getElementById('adminDashboardModal').classList.add('active');
}

function renderAdminTables() {
    // 1. KPI Stats
    const totalRev = state.bookings
        .filter(b => b.status === 'Confirmed')
        .reduce((sum, b) => sum + b.totalPrice, 0);

    document.getElementById('adminStatRevenue').innerText = `RM ${totalRev.toLocaleString()}`;
    document.getElementById('adminStatTotalBookings').innerText = state.bookings.length;
    document.getElementById('adminStatLockedDates').innerText = `${state.bookings.length * 2 + state.manualLocks.length * 3} Hari`;

    // 2. Bookings Table
    const tbody = document.getElementById('adminBookingsTableBody');
    const searchVal = document.getElementById('adminSearchBooking')?.value.toLowerCase() || '';
    const statusVal = document.getElementById('adminStatusFilter')?.value || 'all';

    const filteredBookings = state.bookings.filter(b => {
        const matchesSearch = b.id.toLowerCase().includes(searchVal) || 
                              b.customerName.toLowerCase().includes(searchVal) || 
                              b.phone.includes(searchVal);
        const matchesStatus = statusVal === 'all' || b.status === statusVal;
        return matchesSearch && matchesStatus;
    });

    if (tbody) {
        tbody.innerHTML = filteredBookings.map(b => {
            const hs = state.homestays.find(h => h.id === b.homestayId);
            return `
                <tr>
                    <td><strong class="receipt-code">${b.id}</strong></td>
                    <td>
                        <strong>${b.customerName}</strong><br>
                        <small class="text-muted"><i class="fa-solid fa-phone"></i> ${b.phone}</small>
                    </td>
                    <td>${hs ? hs.title : 'Homestay'}</td>
                    <td>${b.checkIn} &rarr; ${b.checkOut}</td>
                    <td>${b.nights} Malam</td>
                    <td><strong>RM ${b.totalPrice.toLocaleString()}</strong></td>
                    <td><small>${b.paymentMethod}</small></td>
                    <td><span class="badge-status ${b.status}">${b.status}</span></td>
                    <td>
                        ${b.status === 'Confirmed' ? `
                            <button class="btn-secondary" style="padding: 4px 8px; font-size: 0.75rem;" onclick="updateBookingStatus('${b.id}', 'Cancelled')">
                                <i class="fa-solid fa-ban"></i> Batal
                            </button>
                        ` : `
                            <button class="btn-primary" style="padding: 4px 8px; font-size: 0.75rem;" onclick="updateBookingStatus('${b.id}', 'Confirmed')">
                                <i class="fa-solid fa-check"></i> Sahkan
                            </button>
                        `}
                        <button class="btn-danger-sm" style="padding: 4px 8px;" onclick="deleteBooking('${b.id}')"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // 3. Manual Locks Table & Property Dropdown
    const lockSelect = document.getElementById('lockPropertySelect');
    if (lockSelect) {
        lockSelect.innerHTML = state.homestays.map(h => `<option value="${h.id}">${h.title}</option>`).join('');
    }

    const locksTable = document.getElementById('adminLockedDatesTableBody');
    if (locksTable) {
        locksTable.innerHTML = state.manualLocks.map(l => {
            const hs = state.homestays.find(h => h.id === l.homestayId);
            return `
                <tr>
                    <td><strong>${hs ? hs.title : 'Homestay'}</strong></td>
                    <td><span class="badge-status Cancelled">${l.startDate}</span></td>
                    <td><span class="badge-status Cancelled">${l.endDate}</span></td>
                    <td>${l.reason}</td>
                    <td>
                        <button class="btn-secondary" style="padding: 4px 8px; font-size: 0.75rem;" onclick="removeManualLock('${l.id}')">
                            <i class="fa-solid fa-unlock"></i> Buka Kunci (Unlock)
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // 4. Properties Table
    const propsTable = document.getElementById('adminPropertiesTableBody');
    if (propsTable) {
        propsTable.innerHTML = state.homestays.map(h => `
            <tr>
                <td><img src="${h.image}" style="width: 50px; height: 35px; object-fit: cover; border-radius: 4px;"></td>
                <td><strong>${h.title}</strong></td>
                <td><span class="badge-accent">${h.category}</span></td>
                <td>${h.location}</td>
                <td>
                    <input type="number" value="${h.price}" class="form-input" style="width: 100px; padding: 4px 8px;" id="priceInput-${h.id}">
                </td>
                <td>Maks ${h.maxGuests} Pax</td>
                <td><span class="badge-status Confirmed">Aktif</span></td>
                <td>
                    <button class="btn-primary" style="padding: 4px 10px; font-size: 0.75rem;" onclick="savePropertyPrice('${h.id}')">
                        <i class="fa-solid fa-floppy-disk"></i> Simpan
                    </button>
                </td>
            </tr>
        `).join('');
    }
}

function updateBookingStatus(bookingId, newStatus) {
    const b = state.bookings.find(item => item.id === bookingId);
    if (b) {
        b.status = newStatus;
        saveState();
        renderAdminTables();
        renderCalendarMockup();
        showToast(`Status booking ${bookingId} ditukar ke ${newStatus}`, 'warning');
    }
}

function deleteBooking(bookingId) {
    if (confirm(`Adakah anda pasti mahu memadam rekod booking ${bookingId}?`)) {
        state.bookings = state.bookings.filter(b => b.id !== bookingId);
        saveState();
        renderAdminTables();
        renderCalendarMockup();
        showToast('Rekod booking dipadam & tarikh dibuka semula!', 'success');
    }
}

function removeManualLock(lockId) {
    state.manualLocks = state.manualLocks.filter(l => l.id !== lockId);
    saveState();
    renderAdminTables();
    renderCalendarMockup();
    showToast('Sekatan tarikh berjaya dibuang!', 'success');
}

function savePropertyPrice(homestayId) {
    const input = document.getElementById(`priceInput-${homestayId}`);
    if (input) {
        const newPrice = parseInt(input.value);
        const hs = state.homestays.find(h => h.id === homestayId);
        if (hs && newPrice > 0) {
            hs.price = newPrice;
            saveState();
            renderHomestayGrid();
            renderAdminTables();
            showToast(`Harga ${hs.title} dikemaskini ke RM ${newPrice}!`, 'success');
        }
    }
}


// --- LIVE SIMULATED CALENDAR MOCKUP ON LANDING PAGE ---
function renderCalendarMockup() {
    const mockup = document.getElementById('calendarMockupBody');
    if (!mockup) return;

    let daysHtml = `
        <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; text-align: center; color: white;">
            <div style="font-weight: bold; font-size: 0.75rem; color: #94a3b8;">Ahd</div>
            <div style="font-weight: bold; font-size: 0.75rem; color: #94a3b8;">Isn</div>
            <div style="font-weight: bold; font-size: 0.75rem; color: #94a3b8;">Sel</div>
            <div style="font-weight: bold; font-size: 0.75rem; color: #94a3b8;">Rab</div>
            <div style="font-weight: bold; font-size: 0.75rem; color: #94a3b8;">Kha</div>
            <div style="font-weight: bold; font-size: 0.75rem; color: #94a3b8;">Jum</div>
            <div style="font-weight: bold; font-size: 0.75rem; color: #94a3b8;">Sab</div>
    `;

    const samplePropertyId = 'hs-1';
    for (let day = 1; day <= 28; day++) {
        const dayStr = day < 10 ? `0${day}` : `${day}`;
        const fullDate = `2026-08-${dayStr}`;
        const locked = isDateLocked(samplePropertyId, fullDate);

        let bg = 'rgba(16, 185, 129, 0.2)';
        let border = '#10b981';
        let statusText = 'OK';

        if (locked) {
            bg = 'rgba(239, 68, 68, 0.25)';
            border = '#ef4444';
            statusText = 'LOCK';
        }

        daysHtml += `
            <div style="background: ${bg}; border: 1px solid ${border}; padding: 8px 4px; border-radius: 6px; font-size: 0.8rem; font-weight: bold;">
                <div>${day}</div>
                <div style="font-size: 0.55rem; opacity: 0.8;">${statusText}</div>
            </div>
        `;
    }

    daysHtml += `</div>`;
    mockup.innerHTML = daysHtml;
}


// --- SEARCH BOX HANDLER ---
function initSearchBox() {
    const form = document.getElementById('quickSearchForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const propId = document.getElementById('searchPropertySelect').value;
        const cin = document.getElementById('searchCheckIn').value;
        const cout = document.getElementById('searchCheckOut').value;

        if (propId !== 'all') {
            openBookingModal(propId);
            if (cin) {
                state.selectedCheckIn = cin;
                document.getElementById('formCheckIn').value = cin;
            }
            if (cout) {
                state.selectedCheckOut = cout;
                document.getElementById('formCheckOut').value = cout;
            }
            renderInteractiveCalendar();
            calculateBill();
        } else {
            scrollToSection('homestays');
            showToast('Sila pilih homestay untuk membuat semakan tarikh.', 'warning');
        }
    });
}


// --- FAQ ACCORDION ---
function initFAQ() {
    document.querySelectorAll('.faq-question').forEach(q => {
        q.addEventListener('click', () => {
            const item = q.parentElement;
            item.classList.toggle('active');
        });
    });
}


// --- UTILITY MODAL & TOAST HELPERS ---
function closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('active');
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fa-circle-check';
    if (type === 'warning') icon = 'fa-triangle-exclamation';
    if (type === 'danger') icon = 'fa-circle-xmark';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 4000);
}


// --- PWA SERVICE WORKER REGISTRATION & INSTALL PROMPT ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('ServiceWorker registered with scope:', reg.scope))
            .catch(err => console.log('ServiceWorker registration failed:', err));
    });
}

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show PWA floating banner & header button
    const banner = document.getElementById('pwaFloatingBanner');
    if (banner) banner.classList.add('active');

    const headerBtn = document.getElementById('btnPwaHeaderInstall');
    if (headerBtn) headerBtn.style.display = 'inline-flex';
});

function triggerPwaInstallPrompt() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                showToast('Terima kasih! Aplikasi InapVibe Berjaya Dipasang.', 'success');
                const banner = document.getElementById('pwaFloatingBanner');
                if (banner) banner.classList.remove('active');
                const headerBtn = document.getElementById('btnPwaHeaderInstall');
                if (headerBtn) headerBtn.style.display = 'none';
            }
            deferredPrompt = null;
        });
    } else {
        showToast('Sila gunakan butang Install di address bar browser anda.', 'warning');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnPwaBannerInstall')?.addEventListener('click', triggerPwaInstallPrompt);
    document.getElementById('btnPwaHeaderInstall')?.addEventListener('click', triggerPwaInstallPrompt);
    document.getElementById('btnPwaBannerClose')?.addEventListener('click', () => {
        document.getElementById('pwaFloatingBanner')?.classList.remove('active');
    });
});


