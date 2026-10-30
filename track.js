/* =========================================================
   AZoom - Track Page (track.html)
   Displays the booking status as a stepper timeline and
   offers the relevant next action.
   ========================================================= */

function esc(s) {
    return String(s == null ? "" : s).replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderTrack(bk) {
    var area = document.getElementById("trackArea");
    if (!bk) {
        area.innerHTML =
            '<div class="empty-state">' +
                '<h2>Booking not found</h2>' +
                '<p class="muted">No reservation matches this reference.</p>' +
                '<a class="btn btn-accent" href="cars.html">Browse Cars</a>' +
            '</div>';
        return;
    }

    var curIdx = STATUS_ORDER.indexOf(bk.status);
    var stepsHtml = "";
    STATUS_ORDER.forEach(function (key, i) {
        var cls = i < curIdx ? "done" : (i === curIdx ? "current" : "todo");
        stepsHtml +=
            '<div class="step ' + cls + '">' +
                '<div class="step-dot">' + (i < curIdx ? '&#10003;' : (i + 1)) + '</div>' +
                '<div class="step-label">' + STATUS[key].label + '</div>' +
            '</div>';
        if (i < STATUS_ORDER.length - 1) {
            stepsHtml += '<div class="step-link ' + (i < curIdx ? 'done' : '') + '"></div>';
        }
    });

    var st = STATUS[bk.status];
    var nextAction = "";
    if (bk.status === "reserved") {
        nextAction = '<a class="btn btn-accent" href="collect.html?id=' + esc(bk.id) + '">Collect Car at Office</a>';
    } else if (bk.status === "onrent") {
        nextAction = '<a class="btn btn-accent" href="return.html?id=' + esc(bk.id) + '">Return Car at Car Park</a>';
    } else if (bk.status === "inspected") {
        nextAction = '<a class="btn btn-accent" href="bill.html?id=' + esc(bk.id) + '">Pay Final Bill — ' + money(bk.rentalCost + bk.damageCharge) + '</a>';
    } else if (bk.status === "completed") {
        nextAction = '<a class="btn btn-outline" href="bill.html?id=' + esc(bk.id) + '">View Final Bill</a>';
    }

    var damageLine = bk.status === "inspected" || bk.status === "completed"
        ? '<div class="summary-row"><span>Damage charges</span><b style="color:#e1503f">' + money(bk.damageCharge) + '</b></div>'
        : '';

    area.innerHTML =
        '<div class="track-card">' +
            '<div class="emp-header">' +
                '<div><h2 style="margin-bottom:2px">Track My Booking</h2>' +
                '<p class="muted" style="margin:0">Reference: <b>' + esc(bk.id) + '</b></p></div>' +
                '<span class="status-badge ' + st.color + '">' + st.label + '</span>' +
            '</div>' +

            '<div class="stepper">' + stepsHtml + '</div>' +

            '<div class="summary-grid">' +
                '<div class="summary-row"><span>Customer</span><b>' + esc(bk.customer.name) + '</b></div>' +
                '<div class="summary-row"><span>Vehicle</span><b>' + esc(bk.carName) + '</b></div>' +
                '<div class="summary-row"><span>Period</span><b>' + esc(bk.pickupDate) + ' → ' + esc(bk.returnDate) + ' (' + bk.days + ' days, ' + esc(bk.planLabel) + ')</b></div>' +
                '<div class="summary-row"><span>Collect at</span><b>' + esc(bk.branch) + '</b></div>' +
                '<div class="summary-row"><span>Return at</span><b>' + esc(bk.carpark) + '</b></div>' +
                '<div class="summary-row"><span>Rental cost</span><b>' + money(bk.rentalCost) + '</b></div>' +
                damageLine +
            '</div>' +

            '<div class="mt-16" style="background:var(--bg);border:1px solid var(--line);border-radius:9px;padding:14px 16px">' +
                '<p style="margin:0;font-size:14.5px"><b>Current status:</b> ' + st.desc + '</p>' +
            '</div>' +

            '<div class="btn-row" style="display:flex;gap:12px;flex-wrap:wrap;margin-top:20px">' +
                nextAction +
                (bk.status === "returned"
                    ? '<p class="small-text" style="margin:0;align-self:center;color:#5b6b7b">Waiting for staff inspection…</p>'
                    : '') +
            '</div>' +
        '</div>';
}

function initTrack() {
    var area = document.getElementById("trackArea");
    if (!area) return;

    var params = new URLSearchParams(location.search);
    var id = params.get("id");
    var bk = id ? findBooking(id) : null;

    if (bk) { renderTrack(bk); return; }

    area.innerHTML =
        '<div class="card center" style="max-width:520px;margin:0 auto">' +
            '<h2>Track My Booking</h2>' +
            '<p class="muted">Enter your booking reference (e.g. AZ-1001) to see its live status.</p>' +
            '<input id="refInput" class="text-input" placeholder="Booking reference e.g. AZ-1001">' +
            '<button class="btn btn-accent btn-block" id="refBtn" style="margin-top:12px">Track Booking</button>' +
            '<div id="refMsg" class="mt-8"></div>' +
        '</div>';

    document.getElementById("refBtn").addEventListener("click", function () {
        var b = findBooking(document.getElementById("refInput").value);
        if (!b) { document.getElementById("refMsg").innerHTML = '<p class="small-text" style="color:#e1503f">No booking found with that reference.</p>'; return; }
        renderTrack(b);
    });
}

document.addEventListener("DOMContentLoaded", initTrack);
