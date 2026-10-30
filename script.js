/* =========================================================
   AZoom Car Rental - Shared Core (script.js)
   All data is pre-stored in JavaScript arrays (no backend,
   per assignment). Bookings are persisted in localStorage so
   the five-step flow works across pages.
   ========================================================= */

/* ---------- Fleet Data ---------- */
var FLEET = [
    { id: "ev1", name: "Electric Sedan", image: "ev1.jpg", seats: 5, range: 480, motor: 150,
      daily: 85, weekly: 450, monthly: 1400,
      desc: "Comfortable 4-seater sedan, perfect for smooth city travel.",
      specs: ["5 Seats", "480 km Range", "150 kW Motor"] },
    { id: "ev2", name: "Electric SUV", image: "ev2.jpg", seats: 7, range: 420, motor: 220,
      daily: 110, weekly: 580, monthly: 1750,
      desc: "Spacious family-friendly SUV with generous boot space.",
      specs: ["7 Seats", "420 km Range", "220 kW Motor"] },
    { id: "ev3", name: "Compact EV", image: "ev3.jpg", seats: 4, range: 310, motor: 90,
      daily: 60, weekly: 320, monthly: 980,
      desc: "Budget-friendly compact car, ideal for city commuting.",
      specs: ["4 Seats", "310 km Range", "90 kW Motor"] },
    { id: "ev4", name: "Luxury EV", image: "ev4.jpg", seats: 2, range: 500, motor: 250,
      daily: 150, weekly: 800, monthly: 2400,
      desc: "Premium electric vehicle with luxury features and extended range.",
      specs: ["2 Seats", "500 km Range", "250 kW Motor"] },
    { id: "ev5", name: "Electric Crossover", image: "ev5.jpg", seats: 5, range: 450, motor: 180,
      daily: 95, weekly: 500, monthly: 1500,
      desc: "Versatile crossover with a balance of performance and efficiency.",
      specs: ["5 Seats", "450 km Range", "180 kW Motor"] }
];

/* ---------- Branch Offices & Car Parks ---------- */
var BRANCHES = [
    { id: "b1", name: "Tampines Branch Office", carpark: "Tampines Designated Car Park" },
    { id: "b2", name: "Changi Airport Branch Office", carpark: "Changi Airport Designated Car Park" },
    { id: "b3", name: "Woodlands Branch Office", carpark: "Woodlands Designated Car Park" }
];

/* ---------- Rental Plans ---------- */
var PLANS = {
    daily:   { label: "Daily Rental",   perDay: 1 },
    weekly:  { label: "Weekly Rental",  perDay: 7 },
    monthly: { label: "Monthly Rental", perDay: 30 }
};

/* ---------- Damage Catalogue (used by staff inspection) ---------- */
var DAMAGES = [
    { id: "scratch",  name: "Scratch on body panel",          charge: 150 },
    { id: "dent",     name: "Dent / body damage",             charge: 400 },
    { id: "bumper",   name: "Bumper damage",                  charge: 300 },
    { id: "glass",    name: "Cracked windscreen / window",    charge: 350 },
    { id: "wheel",    name: "Wheel / tyre damage",            charge: 180 },
    { id: "light",    name: "Broken headlight / taillight",   charge: 90 },
    { id: "interior", name: "Interior stain / damage",        charge: 120 },
    { id: "dirty",    name: "Excessive dirt / cleaning fee",  charge: 40 }
];

/* ---------- Staff Accounts (demo, pre-stored) ---------- */
var STAFF = [
    { username: "staff", password: "azoom123", name: "Ahmad", role: "Inspector" },
    { username: "admin", password: "admin123", name: "Sarah", role: "Manager" }
];

/* ---------- Booking status workflow ---------- */
var STATUS = {
    reserved:  { label: "Reserved",   color: "warn", desc: "Reservation confirmed with credit-card payment" },
    onrent:    { label: "On Rental",  color: "info", desc: "Car collected at the office branch, currently on rental" },
    returned:  { label: "Returned",   color: "busy", desc: "Car returned at the designated car park, awaiting inspection" },
    inspected: { label: "Inspected",  color: "navy", desc: "Staff inspection complete, final bill ready" },
    completed: { label: "Completed",  color: "ok",   desc: "Final bill paid, booking closed" }
};
var STATUS_ORDER = ["reserved", "onrent", "returned", "inspected", "completed"];

/* ---------- Storage helpers ---------- */
var BK_KEY = "azoomBookings";

function loadBookings() {
    try {
        var raw = localStorage.getItem(BK_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return [];
}
function saveBookings(list) {
    try { localStorage.setItem(BK_KEY, JSON.stringify(list)); }
    catch (e) { console.warn("Could not persist bookings:", e); }
}
function findBooking(id) {
    if (!id) return null;
    var list = loadBookings();
    for (var i = 0; i < list.length; i++) {
        if (String(list[i].id).toLowerCase() === String(id).trim().toLowerCase()) return list[i];
    }
    return null;
}
function activeBookingForCar(carId) {
    var list = loadBookings();
    for (var i = 0; i < list.length; i++) {
        var b = list[i];
        if (b.carId === carId && b.status !== "completed") return b;
    }
    return null;
}
function newBookingId() {
    var list = loadBookings();
    var n = 1000 + list.length + 1;
    var id;
    do { id = "AZ-" + n; n++; } while (findBooking(id));
    return id;
}

/* ---------- Money / Date helpers ---------- */
function money(n) {
    return "$" + Number(n || 0).toFixed(2);
}
function parseDate(s) {
    if (!s) return null;
    var parts = String(s).trim().split("/");
    if (parts.length !== 3) return null;
    var d = parseInt(parts[0], 10), m = parseInt(parts[1], 10), y = parseInt(parts[2], 10);
    if (!d || !m || !y) return null;
    return new Date(y, m - 1, d);
}
function daysBetween(a, b) {
    if (!a || !b) return 0;
    var ms = (b.getTime() - a.getTime());
    return Math.max(1, Math.round(ms / 86400000) + 1); // inclusive
}
function computeRentalCost(car, plan, days) {
    if (!car || !plan || !days) return 0;
    if (plan === "daily") return car.daily * days;
    if (plan === "weekly") return car.weekly * Math.max(1, Math.ceil(days / 7));
    if (plan === "monthly") return car.monthly * Math.max(1, Math.ceil(days / 30));
    return car.daily * days;
}

/* ---------- Credit card validation ---------- */
function luhnCheck(num) {
    if (!/^[0-9]{13,16}$/.test(num)) return false;
    var sum = 0, alt = false;
    for (var i = num.length - 1; i >= 0; i--) {
        var d = parseInt(num.charAt(i), 10);
        if (alt) { d *= 2; if (d > 9) d -= 9; }
        sum += d;
        alt = !alt;
    }
    return sum % 10 === 0;
}
function validExpiry(exp) {
    var m = /^(\d{2})\/(\d{2})$/.exec(String(exp || "").trim());
    if (!m) return false;
    var mm = parseInt(m[1], 10), yy = 2000 + parseInt(m[2], 10);
    if (mm < 1 || mm > 12) return false;
    var now = new Date();
    var firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    var lastOfExp = new Date(yy, mm, 0);
    return lastOfExp >= firstOfMonth;
}

/* ---------- Live Chat (open / close / canned reply) ---------- */
function autoReply(text) {
    var q = String(text || "").toLowerCase();
    if (q.indexOf("price") !== -1 || q.indexOf("cost") !== -1 || q.indexOf("rate") !== -1) {
        return "Our daily rates start from $60. Please visit the 'Our Cars' page for full pricing.";
    }
    if (q.indexOf("available") !== -1 || q.indexOf("availability") !== -1) {
        return "We currently have all three electric models available. Check the 'Our Cars' page for live availability.";
    }
    if (q.indexOf("branch") !== -1 || q.indexOf("location") !== -1 || q.indexOf("where") !== -1) {
        return "We have branches in Tampines, Changi Airport and Woodlands.";
    }
    if (q.indexOf("return") !== -1) {
        return "Please return the car at the designated car park of the branch you collected from.";
    }
    if (q.indexOf("payment") !== -1 || q.indexOf("card") !== -1 || q.indexOf("credit") !== -1) {
        return "All bookings require credit-card payment online. Your final bill includes the rental and any damages found at inspection.";
    }
    if (q.indexOf("damage") !== -1) {
        return "Any damage found during our inspection will be added to your final bill.";
    }
    if (q.indexOf("hello") !== -1 || q.indexOf("hi") !== -1 || q.indexOf("hey") !== -1) {
        return "Hi there! How can we help you with your rental today?";
    }
    return "Thank you for your message. Our team will get back to you shortly, or you may visit the About page to contact us.";
}
function initChat() {
    var btn = document.querySelector(".static-chat-button");
    var box = document.getElementById("chatWindow");
    var close = document.querySelector(".close-chat");
    var send = document.querySelector(".chat-send-btn");
    var input = document.querySelector(".chat-input");
    var msgs = document.querySelector(".static-chat-messages");
    if (!box || !msgs) return;
    if (btn) btn.addEventListener("click", function () { box.classList.add("open"); });
    if (close) close.addEventListener("click", function () { box.classList.remove("open"); });
    function postMessage(text, cls) {
        var p = document.createElement("p");
        if (cls) p.className = cls;
        p.textContent = text;
        msgs.appendChild(p);
        msgs.scrollTop = msgs.scrollHeight;
    }
    function onSend() {
        if (!input) return;
        var t = input.value.trim();
        if (!t) return;
        postMessage("You: " + t, "chat-you-message");
        postMessage("Support: " + autoReply(t));
        input.value = "";
    }
    if (send) send.addEventListener("click", onSend);
    if (input) input.addEventListener("keydown", function (e) { if (e.key === "Enter") onSend(); });
}

/* ---------- Home slideshow ---------- */
function initSlideshow() {
    var slides = document.querySelectorAll(".slide-image");
    if (slides.length < 2) return;
    var current = 0;
    setInterval(function () {
        slides[current].classList.remove("active");
        current = (current + 1) % slides.length;
        slides[current].classList.add("active");
    }, 5000);
}

/* ---------- Date fields (auto-format DD/MM/YYYY) ---------- */
function initDateFields() {
    [].forEach.call(document.querySelectorAll(".date-field"), function (input) {
        input.addEventListener("input", function () {
            var val = this.value.replace(/\D/g, "");
            if (val.length > 2) val = val.slice(0, 2) + "/" + val.slice(2);
            if (val.length > 5) val = val.slice(0, 5) + "/" + val.slice(5);
            if (val.length > 10) val = val.slice(0, 10);
            this.value = val;
        });
    });
}

/* ---------- Scroll reveal ---------- */
function initReveal() {
    var els = document.querySelectorAll(".fade-up");
    if (!("IntersectionObserver" in window) || els.length === 0) return;
    var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
            if (en.isIntersecting) { en.target.classList.add("visible"); obs.unobserve(en.target); }
        });
    }, { threshold: 0.12 });
    els.forEach(function (el) { obs.observe(el); });
}

/* ---------- Shared init ---------- */
document.addEventListener("DOMContentLoaded", function () {
    initChat();
    initSlideshow();
    initDateFields();
    initReveal();
});
