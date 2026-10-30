/* =========================================================
   AZoom - Staff Portal (employee.html)
   Staff log in (checked against the pre-stored STAFF array),
   view returned cars, inspect them, record any damages and
   update the status so the final bill can be issued.
   ========================================================= */

function esc(s) {
    return String(s == null ? "" : s).replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function statusBadge(key) {
    var st = STATUS[key];
    return '<span class="status-badge ' + st.color + '">' + st.label + '</span>';
}

function initEmployee() {
    var wrap = document.getElementById("empWrap");
    if (!wrap) return;
    if (sessionStorage.getItem("azoomStaff")) { showDashboard(); return; }
    showLogin();
}

function showLogin() {
    var wrap = document.getElementById("empWrap");
    wrap.innerHTML =
        '<div class="login-wrap" style="max-width:460px;margin:0 auto;padding:0">' +
            '<div class="login-card">' +
                '<h2 class="login-title">Staff Login</h2>' +
                '<p class="login-sub">Sign in to inspect returned vehicles</p>' +
                '<div class="login-form">' +
                    '<label>Username</label>' +
                    '<input type="text" id="empUser" class="login-input" placeholder="e.g. staff">' +
                    '<label>Password</label>' +
                    '<input type="password" id="empPass" class="login-input" placeholder="e.g. azoom123">' +
                    '<button id="empLoginBtn" class="login-btn">Log In</button>' +
                    '<div id="empLoginMsg" class="small-text mt-8" style="text-align:center"></div>' +
                    '<p class="small-text mt-16" style="text-align:center;color:#5b6b7b">Demo accounts — staff / azoom123</p>' +
                '</div>' +
            '</div>' +
        '</div>';

    function tryLogin() {
        var u = document.getElementById("empUser").value.trim();
        var p = document.getElementById("empPass").value.trim();
        var msg = document.getElementById("empLoginMsg");
        var staff = null;
        for (var i = 0; i < STAFF.length; i++) {
            if (STAFF[i].username === u && STAFF[i].password === p) { staff = STAFF[i]; break; }
        }
        if (!staff) { msg.innerHTML = '<span style="color:#e1503f">Invalid username or password.</span>'; return; }
        sessionStorage.setItem("azoomStaff", JSON.stringify(staff));
        showDashboard();
    }
    document.getElementById("empLoginBtn").addEventListener("click", tryLogin);
    document.getElementById("empPass").addEventListener("keydown", function (e) { if (e.key === "Enter") tryLogin(); });
}

function showDashboard() {
    var wrap = document.getElementById("empWrap");
    var staff = JSON.parse(sessionStorage.getItem("azoomStaff"));
    var bookings = loadBookings();
    var pending = bookings.filter(function (b) { return b.status === "returned"; });

    wrap.innerHTML =
        '<div class="emp-header">' +
            '<div><h2 style="margin-bottom:2px">Staff Dashboard</h2>' +
            '<p class="muted" style="margin:0">Signed in as <b>' + esc(staff.name) + '</b> (' + esc(staff.role) + ')</p></div>' +
            '<button class="btn btn-outline" id="logoutBtn">Log Out</button>' +
        '</div>' +
        '<div id="pendingSection"></div>' +
        '<div id="inspectSlot"></div>' +
        '<div id="allSection" class="mt-24"></div>';

    document.getElementById("logoutBtn").addEventListener("click", function () {
        sessionStorage.removeItem("azoomStaff");
        showLogin();
    });

    /* Pending inspections */
    var pend = document.getElementById("pendingSection");
    if (pending.length === 0) {
        pend.innerHTML =
            '<div class="empty-state">' +
                '<h2>No cars awaiting inspection</h2>' +
                '<p class="muted">Returned vehicles will appear here once customers hand them back.</p>' +
            '</div>';
    } else {
        var rows = pending.map(function (b) {
            return '<tr>' +
                '<td>' + esc(b.id) + '</td>' +
                '<td>' + esc(b.customer.name) + '</td>' +
                '<td>' + esc(b.carName) + '</td>' +
                '<td>' + esc(b.returnDate) + '</td>' +
                '<td>' + esc(b.carpark) + '</td>' +
                '<td><button class="btn btn-accent" data-inspect="' + esc(b.id) + '">Inspect</button></td>' +
            '</tr>';
        }).join("");
        pend.innerHTML =
            '<h3>Cars Awaiting Inspection (' + pending.length + ')</h3>' +
            '<table class="emp-table">' +
                '<thead><tr><th>Reference</th><th>Customer</th><th>Vehicle</th><th>Return Date</th><th>Car Park</th><th></th></tr></thead>' +
                '<tbody>' + rows + '</tbody>' +
            '</table>';
        [].forEach.call(pend.querySelectorAll("[data-inspect]"), function (btn) {
            btn.addEventListener("click", function () { openInspect(btn.getAttribute("data-inspect")); });
        });
    }

    /* All bookings table */
    var allSec = document.getElementById("allSection");
    if (bookings.length === 0) {
        allSec.innerHTML = '<p class="muted">No bookings in the system yet.</p>';
    } else {
        var allRows = bookings.map(function (b) {
            var charge = b.damageCharge ? '<span style="color:#e1503f">' + money(b.damageCharge) + '</span>' : '—';
            return '<tr>' +
                '<td>' + esc(b.id) + '</td>' +
                '<td>' + esc(b.customer.name) + '</td>' +
                '<td>' + esc(b.carName) + '</td>' +
                '<td>' + money(b.rentalCost) + '</td>' +
                '<td>' + charge + '</td>' +
                '<td>' + statusBadge(b.status) + '</td>' +
            '</tr>';
        }).join("");
        allSec.innerHTML =
            '<h3>All Bookings (' + bookings.length + ')</h3>' +
            '<table class="emp-table">' +
                '<thead><tr><th>Reference</th><th>Customer</th><th>Vehicle</th><th>Rental</th><th>Damages</th><th>Status</th></tr></thead>' +
                '<tbody>' + allRows + '</tbody>' +
            '</table>';
    }
}

function openInspect(id) {
    var bk = findBooking(id);
    var slot = document.getElementById("inspectSlot");
    if (!bk || !slot) return;

    var damageItems = DAMAGES.map(function (d) {
        return '<label class="damage-item">' +
            '<input type="checkbox" value="' + d.id + '" data-charge="' + d.charge + '">' +
            '<span>' + esc(d.name) + '</span>' +
            '<span class="d-charge">' + money(d.charge) + '</span>' +
        '</label>';
    }).join("");

    slot.innerHTML =
        '<div class="inspect-panel">' +
            '<div class="emp-header">' +
                '<h3 style="margin:0">Inspect Returned Car — ' + esc(bk.id) + '</h3>' +
                '<button class="btn btn-outline" id="closeInspect">Close</button>' +
            '</div>' +
            '<div class="summary-grid">' +
                '<div class="summary-row"><span>Vehicle</span><b>' + esc(bk.carName) + '</b></div>' +
                '<div class="summary-row"><span>Customer</span><b>' + esc(bk.customer.name) + '</b></div>' +
                '<div class="summary-row"><span>Returned at</span><b>' + esc(bk.carpark) + '</b></div>' +
                '<div class="summary-row"><span>Rental cost</span><b>' + money(bk.rentalCost) + '</b></div>' +
            '</div>' +
            '<h4 class="mt-16">Select any damages found</h4>' +
            '<ul class="damage-list">' + damageItems + '</ul>' +
            '<label class="form-label">Inspection notes</label>' +
            '<textarea id="inspectNote" class="textarea-input" rows="3" placeholder="e.g. No issues / scratch on rear bumper"></textarea>' +
            '<div class="damage-total">Total damage charges: <b id="damageTotal">' + money(0) + '</b></div>' +
            '<button class="btn-fullwidth mt-16" id="completeInspect">Complete Inspection &amp; Prepare Final Bill</button>' +
        '</div>';

    var checks = slot.querySelectorAll('.damage-item input');
    var totalEl = document.getElementById("damageTotal");
    function recompute() {
        var sum = 0;
        checks.forEach(function (c) { if (c.checked) sum += parseFloat(c.getAttribute("data-charge")) || 0; });
        totalEl.textContent = money(sum);
    }
    checks.forEach(function (c) { c.addEventListener("change", recompute); });

    document.getElementById("closeInspect").addEventListener("click", function () { slot.innerHTML = ""; });

    document.getElementById("completeInspect").addEventListener("click", function () {
        var list = loadBookings();
        var b = null;
        for (var i = 0; i < list.length; i++) if (list[i].id === bk.id) { b = list[i]; break; }
        if (!b) { alert("Booking no longer available."); return; }

        var damages = [];
        var sum = 0;
        checks.forEach(function (c) {
            if (c.checked) {
                var d = DAMAGES.filter(function (x) { return x.id === c.value; })[0];
                damages.push({ id: d.id, name: d.name, charge: d.charge });
                sum += d.charge;
            }
        });
        b.damages = damages;
        b.damageCharge = sum;
        b.inspectNote = document.getElementById("inspectNote").value.trim();
        b.inspectedAt = new Date().toISOString();
        b.status = "inspected";
        saveBookings(list);

        showDashboard();
        window.scrollTo({ top: 0, behavior: "smooth" });
        alert("Inspection complete. Damage charges: " + money(sum) + ". Final bill is now ready for the customer.");
    });
}

document.addEventListener("DOMContentLoaded", initEmployee);
