/* =========================================================
   AZoom - Payment / Confirmation Page (confirmation.html)
   Shows the reservation summary and a credit-card form.
   Validates the card (Luhn + expiry + CVV), then marks the
   booking as paid and confirmed (status: reserved).
   ========================================================= */

function esc(s) {
    return String(s == null ? "" : s).replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function initPayment() {
    var area = document.getElementById("payArea");
    if (!area) return;

    var params = new URLSearchParams(location.search);
    var id = params.get("id");
    var bk = findBooking(id);

    if (!bk) {
        area.innerHTML =
            '<div class="empty-state">' +
                '<h2>Booking not found</h2>' +
                '<p class="muted">No reservation matches this reference. Please start a new booking.</p>' +
                '<a class="btn btn-accent" href="cars.html">Browse Our Cars</a>' +
            '</div>';
        return;
    }

    if (bk.cardLast4) {
        // Already paid -> show success state directly
        showPaid(bk);
        return;
    }

    /* Fill the summary */
    document.getElementById("sumBooking").textContent = bk.id;
    document.getElementById("sumCar").textContent = bk.carName + " (" + bk.planLabel + ", " + bk.days + " day(s))";
    document.getElementById("sumDates").textContent = bk.pickupDate + "  →  " + bk.returnDate;
    document.getElementById("sumBranch").textContent = bk.branch;
    document.getElementById("sumCarpark").textContent = bk.carpark;
    document.getElementById("sumCost").textContent = money(bk.rentalCost);

    var form = document.getElementById("paymentForm");
    form.addEventListener("submit", function (e) {
        e.preventDefault();
        var cardName = form.cardname.value.trim();
        var cardNum = form.cardnum.value.replace(/[^0-9]/g, "");
        var exp = form.exp.value.trim();
        var cvv = form.cvv.value.trim();

        if (!cardName) { alert("Please enter the cardholder name."); return; }
        if (!luhnCheck(cardNum)) { alert("Please enter a valid 13–16 digit credit card number."); return; }
        if (!validExpiry(exp)) { alert("Please enter a valid expiry date in MM/YY format."); return; }
        if (!/^[0-9]{3,4}$/.test(cvv)) { alert("Please enter a valid CVV / security code."); return; }
        if (!form.terms.checked) { alert("Please accept the AZoom rental terms & conditions."); return; }

        var list = loadBookings();
        var b = null;
        for (var i = 0; i < list.length; i++) if (list[i].id === bk.id) { b = list[i]; break; }
        if (!b) { alert("Booking no longer available."); return; }
        b.cardLast4 = cardNum.slice(-4);
        b.paidAt = new Date().toISOString();
        b.status = "reserved";
        saveBookings(list);

        showPaid(b);
    });
}

function showPaid(bk) {
    var area = document.getElementById("payArea");
    if (!area) return;
    area.innerHTML =
        '<div class="success-card">' +
            '<div class="success-icon">&#10003;</div>' +
            '<h2>Payment Successful</h2>' +
            '<p class="muted">Your reservation has been confirmed with credit card ending in <b>•••• ' +
                esc(bk.cardLast4 || "0000") + '</b>.</p>' +
            '<p>Booking reference: <span class="ref">' + esc(bk.id) + '</span></p>' +
            '<p>Rental cost: <b>' + money(bk.rentalCost) + '</b><br>Collect at: <b>' + esc(bk.branch) + '</b></p>' +
            '<div class="btn-row">' +
                '<a class="btn btn-accent" href="collect.html?id=' + esc(bk.id) + '">Collect Car at Office</a>' +
                '<a class="btn btn-outline" href="track.html?id=' + esc(bk.id) + '">Track My Booking</a>' +
            '</div>' +
        '</div>';
}

document.addEventListener("DOMContentLoaded", initPayment);
