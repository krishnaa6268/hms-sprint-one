document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;

  const protectedAdminPages = [
    "admin-home",
    "admin-reservations",
    "admin-billing",
    "admin-history",
    "admin-room-status",
    "admin-bookings",
    "admin-support"
  ];

  if (protectedAdminPages.includes(page)) {
    requireRole("admin");
    setupAdminSidebar();
  }

  if (page === "admin-login") setupAdminLogin();
  if (page === "admin-home") loadAdminHome();
  if (page === "admin-reservations") loadAdminReservations();
  if (page === "admin-billing") setupAdminBilling();
  if (page === "admin-history") setupAdminHistory();
  if (page === "admin-room-status") setupRoomStatus();
  if (page === "admin-bookings") loadAdminBookings();
  if (page === "admin-support") setupAdminFeedback();
});

function setupAdminSidebar() {
  const sidebar = document.querySelector(".admin-sidebar");

  if (!sidebar) {
    return;
  }

  const currentPage = location.pathname.split("/").pop();
  sidebar.querySelectorAll("a").forEach((link) => {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("active");
    }
  });

  sidebar.addEventListener("click", (e) => {
    if (e.target.closest("a") && window.matchMedia("(max-width: 900px)").matches) {
      document.body.classList.remove("sidebar-open");
    }
  });
}

function toggleAdminSidebar() {
  if (window.matchMedia("(max-width: 900px)").matches) {
    document.body.classList.toggle("sidebar-open");
    return;
  }

  document.body.classList.toggle("sidebar-collapsed");
}

function setupAdminLogin() {
  document.getElementById("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();

    // if (
    //   loginUserId.value.trim() === ADMIN.userId &&
    //   loginPassword.value === ADMIN.password
    // ) {
      
    // } else {
    //   message("Invalid admin User ID or Password.", "error");
    // }

    setSession({
      role: "admin",
      userId: ADMIN.userId,
      name: ADMIN.name
    });

    location.href = "admin-home.html";
  });
}

function loadAdminHome() {
  const list = getReservations();

  const totalReservations = document.getElementById("totalReservations");
  const pendingReservations = document.getElementById("pendingReservations");
  const checkedIn = document.getElementById("checkedIn");
  const paidInvoices = document.getElementById("paidInvoices");

  const pendingList = list.filter((r) => r.status === "Pending");

  if (totalReservations) {
    totalReservations.textContent = list.length;
  }

  if (pendingReservations) {
    pendingReservations.textContent = pendingList.length;
  }

  if (checkedIn) {
    checkedIn.textContent = list.filter(
      (r) => r.checkInStatus === "Checked In"
    ).length;
  }

  if (paidInvoices) {
    paidInvoices.textContent = list.filter(
      (r) => r.paymentStatus === "Paid"
    ).length;
  }

  loadAdminNotifications(pendingList);
}

function loadAdminNotifications(pendingList) {
  const notificationCount = document.getElementById("notificationCount");
  const notificationList = document.getElementById("notificationList");
  const reservationMenuLink = document.getElementById("reservationMenuLink");

  if (!notificationCount || !notificationList) {
    return;
  }

  if (!pendingList.length) {
    notificationCount.style.display = "none";

    notificationList.innerHTML = `
      <div class="notification-empty">
        No new reservations.
      </div>
    `;

    if (reservationMenuLink) {
      reservationMenuLink.classList.remove("glow-reservation");
    }

    return;
  }

  notificationCount.textContent = pendingList.length;
  notificationCount.style.display = "flex";

  notificationList.innerHTML = pendingList
    .slice(0, 5)
    .map(
      (r) => `
        <div class="notification-item">
          <strong>New reservation has been made</strong><br>
          Reservation ID: ${r.bookingId}<br>
          UserID: ${r.customerUserId}<br>
          Check-in: ${r.checkIn}<br>
          Check-out: ${r.checkOut}<br>
          <a href="admin-reservations.html">
            Check the reservations menu
          </a>
        </div>
      `
    )
    .join("");

  if (reservationMenuLink) {
    reservationMenuLink.classList.add("glow-reservation");
  }
}

function toggleNotifications() {
  const panel = document.getElementById("notificationPanel");

  if (panel) {
    panel.classList.toggle("show");
  }
}

document.addEventListener("click", (e) => {
  const notificationBox = document.querySelector(".notification-box");
  const sidebar = document.querySelector(".admin-sidebar");
  const menuToggle = document.querySelector(".menu-toggle");

  if (
    document.body.classList.contains("sidebar-open") &&
    sidebar &&
    menuToggle &&
    !sidebar.contains(e.target) &&
    !menuToggle.contains(e.target)
  ) {
    document.body.classList.remove("sidebar-open");
  }

  if (!notificationBox) {
    return;
  }

  if (!notificationBox.contains(e.target)) {
    const panel = document.getElementById("notificationPanel");

    if (panel) {
      panel.classList.remove("show");
    }
  }
});

function requestedRoomType(reservation) {
  const preference = reservation.assignedRoomType || reservation.roomPreference || "";

  return Object.keys(ROOM_RATES).find((roomType) =>
    preference.startsWith(roomType)
  ) || preference;
}

function isRoomLocked(reservation) {
  return (
    reservation.status === "Approved" &&
    reservation.roomNumber &&
    reservation.roomNumber !== "Not Assigned"
  );
}

function getFilledRooms(currentBookingId = null) {
  return getReservations()
    .filter((r) =>
      r.status === "Approved" &&
      r.checkInStatus === "Checked In" &&
      !r.checkedOut &&
      r.roomNumber &&
      r.roomNumber !== "Not Assigned" &&
      r.bookingId !== currentBookingId
    )
    .map((r) => String(r.roomNumber));
}

function updateRoomCountSummary() {
  const filledRooms = getFilledRooms();
  const totalRooms = ROOM_NUMBERS.length;
  const filledRoomCount = filledRooms.length;
  const availableRoomCount = totalRooms - filledRoomCount;

  const totalRoomCountEl = document.getElementById("totalRoomCount");
  const availableRoomCountEl = document.getElementById("availableRoomCount");
  const filledRoomCountEl = document.getElementById("filledRoomCount");

  if (totalRoomCountEl) {
    totalRoomCountEl.textContent = totalRooms;
  }

  if (availableRoomCountEl) {
    availableRoomCountEl.textContent = availableRoomCount;
  }

  if (filledRoomCountEl) {
    filledRoomCountEl.textContent = filledRoomCount;
  }
}

function roomOptionsHtml(reservation) {
  const filledRooms = getFilledRooms(reservation.bookingId);
  const locked = isRoomLocked(reservation);

  return ROOM_NUMBERS.map((n) => {
    const isSelected = String(reservation.roomNumber) === String(n);
    const isFilled = filledRooms.includes(String(n));

    return `
      <option
        value="${n}"
        ${isSelected ? "selected" : ""}
        ${isFilled ? "disabled" : ""}
        class="${isFilled ? "room-option-filled" : "room-option-available"}"
      >
        ${n} - ${isFilled ? "Filled" : "Available"}
      </option>
    `;
  }).join("");
}

function selectedServicesHtml(reservation) {
  const services = reservation.services || [];

  if (!services.length) {
    return "None";
  }

  return services
    .map((service) => `${service} ${money(SERVICE_CHARGES[service] || 0)}`)
    .join("<br>");
}

function selectedServicesText(reservation) {
  const services = reservation.services || [];

  if (!services.length) {
    return "None";
  }

  return services
    .map((service) => `${service} ${money(SERVICE_CHARGES[service] || 0)}`)
    .join(", ");
}


 function loadAdminReservations() {
  const body = document.querySelector("table tbody");

  if (!body) {
    console.error("Reservation table tbody not found in admin-reservations.html");
    return;
  }

  const list = getReservations();

  updateRoomCountSummary();
  if (!list.length) {
    body.innerHTML = `
      <tr>
        <td colspan="7">No reservations found.</td>
      </tr>
    `;
    return;
  }

  body.innerHTML = list
    .map((r) => {
      const b = billOf(r);

      return `
        <tr>
          <td>
            ${r.bookingId}<br>
            <span class="small">${r.bookingDate}</span>
          </td>

          <td>
            ${r.guestName}<br>
            UserID: ${r.customerUserId}<br>
            Customer No: ${r.customerNumber}
          </td>

          <td>
            ${r.checkIn} to ${r.checkOut}
          </td>

          <td>
            ${r.roomNumber}<br>
            ${r.assignedRoomType || r.roomPreference}
          </td>

          <td>
            ${statusBadge(r.status)}<br>
            ${r.checkInStatus}<br>
            ${r.paymentStatus}
          </td>

         <td>
  <strong>${money(b.total)}</strong><br>
  <span class="small">Room: ${money(b.roomCharges)}</span><br>
  <span class="small">Services:</span><br>
  <span class="small">${selectedServicesHtml(r)}</span><br>
  <span class="small">Service Charges: ${money(b.serviceCharges)}</span>
</td>

          <td>
            <select id="status-${r.bookingId}">
              <option ${r.status === "Pending" ? "selected" : ""}>Pending</option>
              <option ${r.status === "Approved" ? "selected" : ""}>Approved</option>
              <option ${r.status === "Rejected" ? "selected" : ""}>Rejected</option>
            </select>

          <select id="type-${r.bookingId}" disabled>
  ${Object.keys(ROOM_RATES)
    .map(
      (x) => `
        <option ${(requestedRoomType(r) === x) ? "selected" : ""}>
          ${x}
        </option>
      `
    )
    .join("")}
</select>
<span class="small locked-note">Requested room type cannot be changed</span>

         <select id="room-${r.bookingId}" ${isRoomLocked(r) ? "disabled" : ""}>
  ${roomOptionsHtml(r)}
</select>
${isRoomLocked(r) ? `<span class="small locked-note">Room already allotted and locked</span>` : ""}

            <button onclick="updateReservation('${r.bookingId}')">
              Update
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

function updateReservation(bookingId) {
  const list = getReservations();
  const reservation = list.find((x) => x.bookingId === bookingId);

  reservation.status = document.getElementById(`status-${bookingId}`).value;

if (reservation.status === "Approved") {
  if (isRoomLocked(reservation)) {
    reservation.checkInStatus = reservation.checkedOut ? "Checked Out" : "Checked In";
  } else {
    const selectedRoom = document.getElementById(`room-${bookingId}`).value;
    const filledRooms = getFilledRooms(bookingId);

    if (filledRooms.includes(String(selectedRoom))) {
      alert("This room is already filled. Please select an available room.");
      return;
    }

    reservation.assignedRoomType = requestedRoomType(reservation);
    reservation.roomNumber = selectedRoom;
    reservation.checkInStatus = "Checked In";
    reservation.checkedOut = false;
  }
}

  if (reservation.status === "Rejected") {
    reservation.checkInStatus = "Not Checked In";
    reservation.roomNumber = "Not Assigned";
  }

  saveReservations(list);
  loadAdminReservations();
}

function setupAdminBilling() {
  document.getElementById("invoiceForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const userId = invoiceUserId.value.trim();
    const customer = customerByUserId(userId);
    const box = document.getElementById("invoiceResult");

    if (!customer) {
      box.innerHTML = `
        <div class="alert error">
          Invalid UserID. No customer found.
        </div>
      `;
      return;
    }

    const list = getReservations().filter(
      (r) => r.customerUserId === userId && r.status === "Approved"
    );

    if (!list.length) {
      box.innerHTML = `
        <div class="alert warning">
          No approved reservations found for this UserID.
        </div>
      `;
      return;
    }

    box.innerHTML =
      `
        <div class="alert success">
          Invoice details loaded for ${customer.name}.
        </div>
      ` +
      list
        .map(
          (r) => `
            ${adminInvoiceHtml(r)}
            <button onclick="finalizeInvoice('${r.bookingId}')">
              Finalize and Generate Invoice
            </button>
          `
        )
        .join("");
  });
}

function adminInvoiceHtml(reservation) {
  const bill = billOf(reservation);

  return `
    <div class="invoice">
      <h2>Invoice</h2>

     <p>
  <strong>Additional Services Opted:</strong><br>
  ${selectedServicesHtml(reservation)}
</p>

<p>
  <strong>Additional Service Charges:</strong>
  ${money(b.serviceCharges)}
</p>

      <p>
        <strong>User Details:</strong>
        ${reservation.customerName} (${reservation.customerUserId})
      </p>

      <p>
        <strong>Room:</strong>
        ${reservation.roomNumber} - ${bill.roomType}
      </p>

      <p>
        <strong>Room Charges:</strong>
        ${money(bill.roomCharges)}
      </p>

      <p>
        <strong>Additional Service Charges:</strong>
        ${money(bill.serviceCharges)}
      </p>

      <p>
        <strong>Total:</strong>
        ${money(bill.total)}
      </p>

      <p>
        <strong>Payment Status:</strong>
        ${reservation.paymentStatus}
      </p>
    </div>
  `;
}

function finalizeInvoice(bookingId) {
  const list = getReservations();
  const reservation = list.find((x) => x.bookingId === bookingId);

  reservation.invoiceFinalized = true;

  saveReservations(list);

  alert(`Invoice finalized for Reservation ID ${bookingId}`);
}

function setupAdminHistory() {
  document.getElementById("historyForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const userId = historyUserId.value.trim();
    const customer = customerByUserId(userId);
    const body = document.querySelector("tbody");

    if (!customer) {
      message("Invalid UserID. No customer found.", "error");
      body.innerHTML = "";
      return;
    }

    const list = getReservations().filter(
      (r) => r.customerUserId === userId
    );

    message(`Booking history loaded for ${customer.name}.`);

    if (!list.length) {
      body.innerHTML = `
        <tr>
          <td colspan="6">No booking history found.</td>
        </tr>
      `;
      return;
    }

    body.innerHTML = list
      .map(
        (r) => `
          <tr>
            <td>${r.bookingId}</td>
            <td>${r.checkIn}</td>
            <td>${r.checkOut}</td>
            <td>${r.roomNumber}</td>
            <td>${money(billOf(r).total)}</td>
            <td>${r.bookingDate}</td>
          </tr>
        `
      )
      .join("");
  });
}

function setupRoomStatus() {
  document.getElementById("roomStatusForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const custNo = roomCustomerId.value.trim();

    if (!/^\d{13}$/.test(custNo)) {
      return message("Customer ID must be a 13 digit number.", "error");
    }

    const booked = getReservations()
      .filter((r) => r.customerNumber === custNo && r.status === "Approved")
      .map((r) => String(r.roomNumber));

    const body = document.querySelector("tbody");

    body.innerHTML = ROOM_NUMBERS.map((roomNumber) => {
      const type =
        roomNumber < 200
          ? "Single Room"
          : roomNumber < 300
          ? "Double Room"
          : roomNumber < 304
          ? "Deluxe Room"
          : "Suite";

      const status = booked.includes(String(roomNumber))
        ? "Booked"
        : "Vacant";

      return `
        <tr>
          <td>Floor ${String(roomNumber)[0]}</td>
          <td>${roomNumber}</td>
          <td>${statusBadge(status)}</td>
          <td>${type} - ${money(ROOM_RATES[type])}</td>
        </tr>
      `;
    }).join("");
  });
}

function loadAdminBookings() {
  const todayDate = today();

  const list = getReservations().filter(
    (r) => new Date(r.checkIn) >= new Date(todayDate) && r.status !== "Rejected"
  );

  const body = document.querySelector("tbody");

  if (!list.length) {
    body.innerHTML = `
      <tr>
        <td colspan="6">No upcoming bookings found.</td>
      </tr>
    `;
    return;
  }

  body.innerHTML = list
    .map(
      (r) => `
        <tr>
          <td>${r.bookingId}</td>
          <td>${r.customerUserId}</td>
          <td>${r.checkIn}</td>
          <td>${r.checkOut}</td>
          <td>${r.roomNumber}</td>
          <td>${statusBadge(r.status)}</td>
        </tr>
      `
    )
    .join("");
}

function setupAdminFeedback() {
  document.getElementById("feedbackForm").addEventListener("submit", (e) => {
    e.preventDefault();

    message("Feedback/support note submitted successfully.");

    e.target.reset();
  });
}

window.addEventListener("storage", (e) => {
  if (e.key !== "reservations") {
    return;
  }

  const page = document.body.dataset.page;

  if (page === "admin-reservations") {
    loadAdminReservations();
  }

  if (page === "admin-bookings") {
    loadAdminBookings();
  }
});
