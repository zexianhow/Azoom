/* =========================================================
   AZoom - Fleet Page (cars.html)
   Renders the car fleet from the FLEET array and shows live
   availability based on active bookings.
   ========================================================= */

function renderFleet() {
    var grid = document.getElementById("fleetGrid");
    if (!grid) return;
    grid.innerHTML = "";

    FLEET.forEach(function (car) {
        var active = activeBookingForCar(car.id);
        var available = !active;

        var cta = available
            ? '<a class="car-book-cta" href="booking.html?car=' + car.id + '">Book Now</a>'
            : '<button class="car-book-cta" disabled>Currently Rented</button>';

        var card = document.createElement("div");
        card.className = "car-card fade-up visible";
        card.innerHTML =
            '<img src="' + car.image + '" alt="' + car.name + '" class="car-card-img">' +
            '<div class="car-card-body">' +
                '<div class="car-card-top">' +
                    '<h3 class="car-card-title">' + car.name + '</h3>' +
                    '<span class="status-badge ' + (available ? 'ok' : 'busy') + '">' +
                        (available ? 'Available' : 'On Rental') + '</span>' +
                '</div>' +
                '<p>' + car.desc + '</p>' +
                '<ul class="car-specs">' +
                    car.specs.map(function (s) { return '<li>' + s + '</li>'; }).join("") +
                '</ul>' +
                '<p class="car-price">Daily <b>' + money(car.daily) + '</b>' +
                    ' &nbsp;·&nbsp; Weekly <b>' + money(car.weekly) + '</b>' +
                    ' &nbsp;·&nbsp; Monthly <b>' + money(car.monthly) + '</b></p>' +
                '<div class="car-book-btn">' + cta + '</div>' +
            '</div>';

        grid.appendChild(card);
    });
}

document.addEventListener("DOMContentLoaded", renderFleet);
