/* =========================================================
   AZoom - Return Page (return.html)
   Customer returns the car at the designated car park.
   On confirm, booking status changes onrent -> returned
   (pending staff inspection).
   ========================================================= */

function esc(s) {
    return String(s == null ? "" : s).replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderReturn(bk) {
    var area = document.getElementById("returnArea");
    area.innerHTML =
        '<div class="card">' +
            '<h2>Return Your Car at the Car Park</h2>' +
            '<p class="small-text">Booking reference: <b>' + esc(bk.id) + '</b></p>' +
            '<div class="summary-grid mt-16">' +
                '<div class="summary-row"><span>Customer</span><b>' + esc(bk.customer.name) + '</b></div>' +
                '<div class="summary-row"><span>Vehicle</span><b>' + esc(bk.carName) + '</b></div>' +
                '<div class="summary-row"><span>Rental period</span><b>' + esc(bk.pickupDate) + ' → ' + esc(bk.returnDate) + '</b></div>' +
                '<div class="summary-row"><span>Return location</span><b>' + esc(bk.carpark) + '</b></div>' +
            '</div>' +
            '<label class="check-row mt-16">' +
                '<input type="checkbox" id="agreeReturn">' +
                '<span>I confirm I have returned this vehicle at <b>' + esc(bk.carpark) + '</b> and left it locked with the keys in the drop-box.</span>' +
            '</label>' +
            '<button class="btn-fullwidth" id="returnBtn">Confirm Return</button>' +
            '<div id="returnMsg" class="mt-8"></div>' +
        '</div>';

    document.getElementById("returnBtn").addEventListener("click", function () {
        var msg = document.getElementById("returnMsg");
        if (!document.getElementById("agreeReturn").checked) {
            msg.innerHTML = '<p class="small-text" style="color:#e1503f">Please confirm the return first.</p>';
            return;
        }
        var list = loadBookings();
        var b = null;
        for (var i = 0; i < list.length; i++) if (list[i].id === bk.id) { b = list[i]; break; }
        if (!b) { alert("Booking no longer available."); return; }
        b.status = "returned";
        b.returnedAt = new Date().toISOString();
        saveBookings(list);

        area.innerHTML =
            '<div class="success-card">' +
                '<div class="success-icon">&#128230;</div>' +
                '<h2>Car Returned</h2>' +
                '<p>Your vehicle has been logged as returned at <b>' + esc(b.carpark) + '</b>.</p>' +
                '<p class="muted">It will now be inspected by our staff for any damages. You will receive your final bill afterwards.</p>' +
                '<div class="btn-row">' +
                    '<a class="btn btn-accent" href="track.html?id=' + esc(b.id) + '">Track My Booking</a>' +
                '</div>' +
            '</div>';
    });
}

function initReturn() {
    var area = document.getElementById("returnArea");
    if (!area) return;

    var params = new URLSearchParams(location.search);
    var id = params.get("id");
    var bk = id ? findBooking(id) : null;

    if (bk && bk.status === "onrent") { renderReturn(bk); return; }
    if (bk && bk.status !== "onrent") {
        area.innerHTML =
            '<div class="empty-state">' +
                '<h2>Not ready for return</h2>' +
                '<p class="muted">Booking ' + esc(bk.id) + ' is currently <b>' + STATUS[bk.status].label + '</b>.</p>' +
                '<a class="btn btn-outline" href="track.html?id=' + esc(bk.id) + '">Track My Booking</a>' +
            '</div>';
        return;
    }

    area.innerHTML =
        '<div class="card center" style="max-width:520px;margin:0 auto">' +
            '<h2>Return Your Car</h2>' +
            '<p class="muted">Enter your booking reference to return the car at its designated car park.</p>' +
            '<input id="refInput" class="text-input" placeholder="Booking reference e.g. AZ-1001">' +
            '<button class="btn btn-accent btn-block" id="refBtn" style="margin-top:12px">Find My Booking</button>' +
            '<div id="refMsg" class="mt-8"></div>' +
        '</div>';

    document.getElementById("refBtn").addEventListener("click", function () {
        var b = findBooking(document.getElementById("refInput").value);
        var msg = document.getElementById("refMsg");
        if (!b) { msg.innerHTML = '<p class="small-text" style="color:#e1503f">No booking found with that reference.</p>'; return; }
        if (b.status !== "onrent") {
            msg.innerHTML = '<p class="small-text" style="color:#e1503f">This car cannot be returned yet (status: ' +
                STATUS[b.status].label + ').</p>';
            return;
        }
        renderReturn(b);
    });
}

document.addEventListener("DOMContentLoaded", initReturn);
