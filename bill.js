/* =========================================================
   AZoom - Final Bill Page (bill.html)
   Customer pays the final bill: rental cost plus any damages
   found during staff inspection. On pay, status -> completed.
   ========================================================= */

function esc(s) {
    return String(s == null ? "" : s).replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function initBill() {
    var area = document.getElementById("billArea");
    if (!area) return;

    var params = new URLSearchParams(location.search);
    var id = params.get("id");
    var bk = findBooking(id);

    if (!bk) {
        area.innerHTML =
            '<div class="empty-state">' +
                '<h2>Bill not found</h2>' +
                '<p class="muted">No booking matches this reference.</p>' +
                '<a class="btn btn-accent" href="cars.html">Browse Cars</a>' +
            '</div>';
        return;
    }

    if (bk.status === "completed") {
        area.innerHTML =
            '<div class="success-card">' +
                '<div class="success-icon">&#10003;</div>' +
                '<h2>Final Bill Paid</h2>' +
                '<p>Booking <span class="ref">' + esc(bk.id) + '</span> is fully settled and closed.</p>' +
                '<a class="btn btn-outline" href="track.html?id=' + esc(bk.id) + '">View Booking Summary</a>' +
            '</div>';
        return;
    }

    if (bk.status !== "inspected") {
        area.innerHTML =
            '<div class="empty-state">' +
                '<h2>Final bill not ready</h2>' +
                '<p class="muted">Your booking is currently <b>' + STATUS[bk.status].label + '</b>. ' +
                    'The final bill is issued after staff inspection of the returned car.</p>' +
                '<a class="btn btn-outline" href="track.html?id=' + esc(bk.id) + '">Track My Booking</a>' +
            '</div>';
        return;
    }

    /* Build the final bill */
    var damagesRows = bk.damages && bk.damages.length
        ? bk.damages.map(function (d) {
            return '<div class="summary-row"><span>' + esc(d.name) + '</span><b style="color:#e1503f">' + money(d.charge) + '</b></div>';
          }).join("")
        : '<div class="summary-row"><span>Damages</span><b style="color:#0aa264">None — car returned in good condition</b></div>';

    area.innerHTML =
        '<div class="pay-flex">' +
            '<div class="summary-box">' +
                '<h2>Final Bill — ' + esc(bk.id) + '</h2>' +
                '<div class="summary-grid">' +
                    '<div class="summary-row"><span>Customer</span><b>' + esc(bk.customer.name) + '</b></div>' +
                    '<div class="summary-row"><span>Vehicle</span><b>' + esc(bk.carName) + '</b></div>' +
                    '<div class="summary-row"><span>Period</span><b>' + esc(bk.pickupDate) + ' → ' + esc(bk.returnDate) + '</b></div>' +
                    '<div class="summary-row"><span>Rental cost</span><b>' + money(bk.rentalCost) + '</b></div>' +
                    damagesRows +
                '</div>' +
                '<div class="summary-total">' +
                    '<span>Total due</span>' +
                    '<b>' + money(bk.rentalCost + bk.damageCharge) + '</b>' +
                '</div>' +
                (bk.inspectNote ? '<p class="small-text mt-16">Inspection note: ' + esc(bk.inspectNote) + '</p>' : '') +
            '</div>' +

            '<div class="payment-card">' +
                '<h2>Pay Final Bill</h2>' +
                '<p class="small-text">Please use a credit card to settle your final bill.</p>' +
                '<form id="billForm">' +
                    '<label class="form-label">Cardholder Full Name</label>' +
                    '<input type="text" id="billCardName" class="pay-input" placeholder="Enter name on card">' +
                    '<label class="form-label">Credit Card Number</label>' +
                    '<input type="text" id="billCardNum" class="pay-input" placeholder="XXXX-XXXX-XXXX-XXXX">' +
                    '<div class="grid-1fr-1fr">' +
                        '<div><label class="form-label">Expiry (MM/YY)</label>' +
                        '<input type="text" id="billExp" class="pay-input" placeholder="MM/YY"></div>' +
                        '<div><label class="form-label">CVV</label>' +
                        '<input type="text" id="billCvv" class="pay-input" placeholder="3 digits"></div>' +
                    '</div>' +
                    '<label class="check-row"><input type="checkbox" id="billTerms">' +
                        '<span>I authorise payment of <b>' + money(bk.rentalCost + bk.damageCharge) + '</b> to AZoom Car Rental.</span></label>' +
                    '<button type="submit" class="pay-submit-btn">Pay Final Bill — ' + money(bk.rentalCost + bk.damageCharge) + '</button>' +
                '</form>' +
            '</div>' +
        '</div>';

    document.getElementById("billForm").addEventListener("submit", function (e) {
        e.preventDefault();
        var name = document.getElementById("billCardName").value.trim();
        var num = document.getElementById("billCardNum").value.replace(/[^0-9]/g, "");
        var exp = document.getElementById("billExp").value.trim();
        var cvv = document.getElementById("billCvv").value.trim();

        if (!name) { alert("Please enter the cardholder name."); return; }
        if (!luhnCheck(num)) { alert("Please enter a valid credit card number."); return; }
        if (!validExpiry(exp)) { alert("Please enter a valid expiry date (MM/YY)."); return; }
        if (!/^[0-9]{3,4}$/.test(cvv)) { alert("Please enter a valid CVV."); return; }
        if (!document.getElementById("billTerms").checked) { alert("Please authorise the final payment."); return; }

        var list = loadBookings();
        var b = null;
        for (var i = 0; i < list.length; i++) if (list[i].id === bk.id) { b = list[i]; break; }
        if (!b) { alert("Booking no longer available."); return; }
        b.billPaidAt = new Date().toISOString();
        b.billTotal = bk.rentalCost + bk.damageCharge;
        b.status = "completed";
        saveBookings(list);

        area.innerHTML =
            '<div class="success-card">' +
                '<div class="success-icon">&#10003;</div>' +
                '<h2>Final Bill Paid — Rental Closed</h2>' +
                '<p>Booking <span class="ref">' + esc(b.id) + '</span> is now completed.</p>' +
                '<p>Total paid: <b>' + money(b.billTotal) + '</b> (rental ' + money(bk.rentalCost) +
                    (bk.damageCharge ? ' + damages ' + money(bk.damageCharge) : '') + ')</p>' +
                '<div class="btn-row">' +
                    '<a class="btn btn-accent" href="index.html">Return Home</a>' +
                    '<a class="btn btn-outline" href="track.html?id=' + esc(b.id) + '">View Booking Summary</a>' +
                '</div>' +
            '</div>';
    });
}

document.addEventListener("DOMContentLoaded", initBill);
