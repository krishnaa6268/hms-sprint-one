const ADMIN = {
  userId: "admin01",
  password: "Admin@123",
  name: "Admin"
};

const ROOM_RATES = {
  "Single Room": 3000,
  "Double Room": 5800,
  "Deluxe Room": 8300,
  "Suite": 12050
};

const SERVICE_CHARGES = {
  Laundry: 1400,
  Food: 1800,
  Spa: 3000,
  Transport: 2000
};

const ROOM_NUMBERS = [
  101, 102, 103, 104,
  201, 202, 203, 204,
  301, 302, 303, 304
];

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{1,30}$/;
const USER_ID_REGEX = /^.{5,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_REGEX = /^[A-Za-z][A-Za-z .'-]{1,49}$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;
const CUSTOMER_NUMBER_REGEX = /^\d{13}$/;
const CARD_NUMBER_REGEX = /^\d{16}$/;
const CVV_REGEX = /^\d{3}$/;

function getData(key) {
  return JSON.parse(localStorage.getItem(key) || "[]");
}

function setData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getCustomers() {
  return getData("customers");
}

function saveCustomers(customers) {
  setData("customers", customers);
}

function getReservations() {
  return getData("reservations");
}

function saveReservations(reservations) {
  setData("reservations", reservations);
}

function getSession() {
  return JSON.parse(localStorage.getItem("session") || "null");
}

function setSession(session) {
  localStorage.setItem("session", JSON.stringify(session));
}

function logout() {
  localStorage.removeItem("session");
  location.href = "../index.html";
}

// function id(prefix) {
//   return prefix + Math.floor(100000 + Math.random() * 900000);
// }

function id(prefix) {
  let counter = localStorage.getItem(prefix + "_counter");

  if (!counter) {
    counter = 1;
  } else {
    counter = parseInt(counter) + 1;
  }

  localStorage.setItem(prefix + "_counter", counter);

  return prefix + counter;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function money(amount) {
  return "₹" + Number(amount || 0).toLocaleString("en-IN");
}

function statusClass(status) {
  return String(status).toLowerCase().replaceAll(" ", "");
}

function statusBadge(status) {
  return `<span class="status ${statusClass(status)}">${status}</span>`;
}

function customerByUserId(userId) {
  return getCustomers().find((customer) => customer.customerId === userId);
}

function trimmedValue(elementOrId) {
  const element = typeof elementOrId === "string"
    ? document.getElementById(elementOrId)
    : elementOrId;

  return element ? element.value.trim() : "";
}

function isValidName(value) {
  return NAME_REGEX.test(value.trim());
}

function isValidEmail(value) {
  return EMAIL_REGEX.test(value.trim());
}

function isValidPlainText(value, min = 5, max = 250) {
  const text = value.trim();
  return text.length >= min && text.length <= max;
}

function isFutureCardExpiry(value) {
  const match = value.trim().match(/^(0[1-9]|1[0-2])\/(\d{2})$/);

  if (!match) {
    return false;
  }

  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  const expiryEnd = new Date(year, month, 0, 23, 59, 59);

  return expiryEnd >= new Date();
}

function requireRole(role) {
  const session = getSession();

  if (!session || session.role !== role) {
    location.href = role === "admin"
      ? "admin-login.html"
      : "customer-login.html";

    return null;
  }

  return session;
}

function showWelcome() {
  const session = getSession();
  const welcomeElement = document.getElementById("welcome");

  if (welcomeElement && session) {
    welcomeElement.textContent = `Welcome ${session.name || session.userId}`;
  }
}

function billOf(reservation) {
  const nights = Math.max(
    1,
    Math.ceil(
      (new Date(reservation.checkOut) - new Date(reservation.checkIn)) /
      86400000
    )
  );

  const roomType = reservation.assignedRoomType || reservation.roomPreference;
  const roomRate = ROOM_RATES[roomType] || 0;
  const roomCharges = nights * roomRate;

  const serviceCharges = (reservation.services || []).reduce(
    (sum, service) => sum + (SERVICE_CHARGES[service] || 0),
    0
  );

  return {
    nights,
    roomType,
    roomRate,
    roomCharges,
    serviceCharges,
    total: roomCharges + serviceCharges
  };
}

function message(text, type = "success") {
  const messageElement = document.getElementById("message");

  if (messageElement) {
    messageElement.innerHTML = `
      <div class="alert ${type}">
        ${text}
      </div>
    `;
  }
}

showWelcome();
