/* =========================================================
   AZoom - Booking Page (booking.html)
   Reservation form. On submit, creates a booking object in
   localStorage (status: reserved) and goes to payment.
   ========================================================= */

function initBooking() {
    var form = document.getElementById("bookingForm");
    if (!form) return;

    var carSel = document.getElementById("car");
    var planSel = document.getElementById("rentalplan");
    var pickupDate = document.getElementById("pickup-date");
    var returnDate = document.getElementById("return-date");
    var quote = document.getElementById("quotePanel");

    /* Populate the car dropdown from FLEET */
    FLEET.forEach(function (c) {
        var o = document.createElement("option");
        o.value = c.id;
        o.textContent = c.name + "  (" + money(c.daily) + "/day)";
        carSel.appendChild(o);
    });

    /* Pre-select the car passed via ?car=evX (from Our Cars page) */
    var params = new URLSearchParams(location.search);
    var presel = params.get("car");
    if (presel && FLEET.some(function (c) { return c.id === presel; })) {
        carSel.value = presel;
    }

    /* Live rental quote */
    function updateQuote() {
        var car = null;
        for (var i = 0; i < FLEET.length; i++) if (FLEET[i].id === carSel.value) car = FLEET[i];
        var pd = parseDate(pickupDate.value);
        var rd = parseDate(returnDate.value);
        if (car && planSel.value && pd && rd && rd >= pd) {
            var days = daysBetween(pd, rd);
            var cost = computeRentalCost(car, planSel.value, days);
            quote.style.display = "block";
            quote.innerHTML =
                '<p><strong>' + car.name + '</strong> &middot; ' + PLANS[planSel.value].label +
                ' &middot; ' + days + ' day(s)</p>' +
                '<p class="quote-total">Estimated rental: <b>' + money(cost) + '</b></p>';
        } else {
            quote.style.display = "none";
        }
    }

    carSel.addEventListener("change", updateQuote);
    planSel.addEventListener("change", updateQuote);
    pickupDate.addEventListener("input", updateQuote);
    returnDate.addEventListener("input", updateQuote);
    updateQuote();

    /* Car specification panel */
    var specPanel = document.getElementById("specPanel");
    var specContent = document.getElementById("specContent");
    function showSpec() {
        var car = null;
        for (var i = 0; i < FLEET.length; i++) if (FLEET[i].id === carSel.value) car = FLEET[i];
        if (!car || !specPanel || !specContent) return;
        specPanel.style.display = "block";
        specContent.innerHTML =
            '<ul class="spec-list">' +
                '<li><b>Seats:</b> ' + car.seats + '</li>' +
                '<li><b>Driving range:</b> ' + car.range + ' km per full charge</li>' +
                '<li><b>Motor capacity:</b> ' + car.motor + ' kW</li>' +
            '</ul>';
    }
    carSel.addEventListener("change", showSpec);
    if (carSel.value) showSpec();

    /* On submit: validate and store the reservation */
    form.addEventListener("submit", function (e) {
        e.preventDefault();

        var car = null;
        for (var i = 0; i < FLEET.length; i++) if (FLEET[i].id === carSel.value) car = FLEET[i];
        var branch = null;
        for (var i = 0; i < BRANCHES.length; i++) if (BRANCHES[i].id === form["pickup-location"].value) branch = BRANCHES[i];
        var carparkBranch = null;
        for (var i = 0; i < BRANCHES.length; i++) if (BRANCHES[i].id === form["return-location"].value) carparkBranch = BRANCHES[i];

        var name = form.name.value.trim();
        var email = form.email.value.trim();
        var phone = form.phone.value.trim();
        var pd = parseDate(pickupDate.value);
        var rd = parseDate(returnDate.value);

        if (!car) { alert("Please choose a car."); return; }
        if (!branch) { alert("Please choose a pick-up branch office."); return; }
        if (!carparkBranch) { alert("Please choose a return car park."); return; }
        if (!pd || !rd) { alert("Please enter valid pick-up and return dates (DD/MM/YYYY)."); return; }
        if (rd < pd) { alert("Return date must be on or after the pick-up date."); return; }
        if (activeBookingForCar(car.id)) { alert("Sorry, this car is currently rented out."); return; }

        var days = daysBetween(pd, rd);
        var cost = computeRentalCost(car, planSel.value, days);

        var booking = {
            id: newBookingId(),
            customer: { name: name, email: email, phone: phone },
            carId: car.id,
            carName: car.name,
            branch: branch.name,
            carpark: carparkBranch.carpark,
            plan: planSel.value,
            planLabel: PLANS[planSel.value].label,
            pickupDate: pickupDate.value,
            returnDate: returnDate.value,
            days: days,
            rentalCost: cost,
            status: "reserved",
            damages: [],
            damageCharge: 0,
            createdAt: new Date().toISOString()
        };

        var list = loadBookings();
        list.push(booking);
        saveBookings(list);

        location.href = "confirmation.html?id=" + booking.id;
    });
}

document.addEventListener("DOMContentLoaded", initBooking);
