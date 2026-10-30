/* =========================================================
   AZoom - Collect Page (collect.html)
   Customer rents the car at the AZoom office branch.
   On confirm, booking status changes reserved -> onrent.
   ========================================================= */

function esc(s) {
    return String(s == null ? "" : s).replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderCollect(bk) {
    var area = document.getElementById("collectArea");
    area.innerHTML =
        '<div class="card">' +
            '<h2>Collect Your Car at the Office</h2>' +
            '<p class="small-text">Booking reference: <b>' + esc(bk.id) + '</b></p>' +
            '<div class="summary-grid mt-16">' +
                '<div class="summary-row"><span>Customer</span><b>' + esc(bk.customer.name) + '</b></div>' +
                '<div class="summary-row"><span>Vehicle</span><b>' + esc(bk.carName) + '</b></div>' +
                '<div class="summary-row"><span>Rental period</span><b>' + esc(bk.pickupDate) + ' → ' + esc(bk.returnDate) + ' (' + bk.days + ' days)</b></div>' +
                '<div class="summary-row"><span>Plan</span><b>' + esc(bk.planLabel) + '</b></div>' +
                '<div class="summary-row"><span>Collect at</span><b>' + esc(bk.branch) + '</b></div>' +
                '<div class="summary-row"><span>Return at</span><b>' + esc(bk.carpark) + '</b></div>' +
                '<div class="summary-row"><span>Rental cost</span><b>' + money(bk.rentalCost) + '</b></div>' +
            '</div>' +
            '<label class="check-row mt-16">' +
                '<input type="checkbox" id="agreeCollect">' +
                '<span>I confirm I am collecting this vehicle at <b>' + esc(bk.branch) + '</b> and agree to the AZoom rental agreement.</span>' +
            '</label>' +
            '<button class="btn-fullwidth" id="collectBtn">Collect Car &amp; Start Rental</button>' +
            '<div id="collectMsg" class="mt-8"></div>' +
        '</div>';

    document.getElementById("collectBtn").addEventListener("click", function () {
        var msg = document.getElementById("collectMsg");
        if (!document.getElementById("agreeCollect").checked) {
            msg.innerHTML = '<p class="small-text" style="color:#e1503f">Please confirm the collection first.</p>';
            return;
        }
        var list = loadBookings();
        var b = null;
        for (var i = 0; i < list.length; i++) if (list[i].id === bk.id) { b = list[i]; break; }
        if (!b) { alert("Booking no longer available."); return; }
        b.status = "onrent";
        b.collectedAt = new Date().toISOString();
        saveBookings(list);

        area.innerHTML =
            '<div class="success-card">' +
                '<div class="success-icon">&#128663;</div>' +
                '<h2>Car Collected &amp; On Rental</h2>' +
                '<p>Keys handed over at <b>' + esc(b.branch) + '</b>. Your rental has started.</p>' +
                '<p>Return the car at the designated car park: <b>' + esc(b.carpark) + '</b></p>' +
                '<p class="small-text">Reference: <b>' + esc(b.id) + '</b> · Due: ' + esc(b.returnDate) + '</p>' +
                '<div class="btn-row">' +
                    '<a class="btn btn-accent" href="return.html?id=' + esc(b.id) + '">Return Car at Car Park</a>' +
                    '<a class="btn btn-outline" href="track.html?id=' + esc(b.id) + '">Track My Booking</a>' +
                '</div>' +
            '</div>';
    });
}

function initCollect() {
    var area = document.getElementById("collectArea");
    if (!area) return;

    var params = new URLSearchParams(location.search);
    var id = params.get("id");
    var bk = id ? findBooking(id) : null;

    if (bk && bk.status === "reserved") { renderCollect(bk); return; }
    if (bk && bk.status !== "reserved") {
        area.innerHTML =
            '<div class="empty-state">' +
                '<h2>Not ready for collection</h2>' +
                '<p class="muted">Booking ' + esc(bk.id) + ' is currently <b>' + STATUS[bk.status].label + '</b>.</p>' +
                '<a class="btn btn-outline" href="track.html?id=' + esc(bk.id) + '">Track My Booking</a>' +
            '</div>';
        return;
    }

    /* No id given -> ask for a booking reference */
    area.innerHTML =
        '<div class="card center" style="max-width:520px;margin:0 auto">' +
            '<h2>Collect Your Car at the Office</h2>' +
            '<p class="muted">Enter your booking reference (e.g. AZ-1001) to collect your reserved car at the office.</p>' +
            '<input id="refInput" class="text-input" placeholder="Booking reference e.g. AZ-1001">' +
            '<button class="btn btn-accent btn-block" id="refBtn" style="margin-top:12px">Find My Booking</button>' +
            '<div id="refMsg" class="mt-8"></div>' +
        '</div>';

    document.getElementById("refBtn").addEventListener("click", function () {
        var b = findBooking(document.getElementById("refInput").value);
        var msg = document.getElementById("refMsg");
        if (!b) { msg.innerHTML = '<p class="small-text" style="color:#e1503f">No booking found with that reference.</p>'; return; }
        if (b.status !== "reserved") {
            msg.innerHTML = '<p class="small-text" style="color:#e1503f">This booking is not ready for collection (status: ' +
                STATUS[b.status].label + ').</p>';
            return;
        }
        renderCollect(b);
    });
}

document.addEventListener("DOMContentLoaded", initCollect);
