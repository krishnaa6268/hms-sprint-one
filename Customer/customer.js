document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;

  const protectedCustomerPages = [
    "customer-home",
    "customer-reservation",
    "customer-billing",
    "customer-payment",
    "customer-card",
    "customer-history",
    "customer-bookings",
    "customer-support",
    "customer-complaint"
  ];

  if (protectedCustomerPages.includes(page)) {
    requireRole("customer");
  }

  if (page === "customer-register") setupRegister();
  if (page === "customer-login") setupCustomerLogin();
  if (page === "customer-home") loadCustomerHome();
  if (page === "customer-reservation") setupReservation();
  if (page === "customer-billing") loadCustomerBilling();
  if (page === "customer-payment") loadPaymentPage();
  if (page === "customer-card") setupCardPayment();
  if (page === "customer-history") loadCustomerHistory();
  if (page === "customer-bookings") loadCustomerBookings();
  if (page === "customer-support") setupFeedback();
  if (page === "customer-complaint") setupComplaint();
});

function setupRegister() {
  document.getElementById("registerForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const customer = {
      generatedUserId: id("USR"),
      name: customerName.value.trim(),
      email: email.value.trim(),
      countryCode: countryCode.value,
      mobile: mobile.value.trim(),
      customerNumber: customerNumber.value.trim(),
      address: address.value.trim(),
      customerId: customerId.value.trim(),
      password: password.value
    };

    if (!USER_ID_REGEX.test(customer.customerId)) {
      return message("Customer ID must be 5 to 20 characters.", "error");
    }

    if (!/^\d{10}$/.test(customer.mobile)) {
      return message("Mobile number must contain exactly 10 digits.", "error");
    }

    if (!/^\d{13}$/.test(customer.customerNumber)) {
      return message("13 Digit Customer Number must contain exactly 13 digits.", "error");
    }

    if (!PASSWORD_REGEX.test(customer.password)) {
      return message(
        "Password must include uppercase, lowercase, special character and maximum 30 characters.",
        "error"
      );
    }

    if (customer.password !== confirmPassword.value) {
      return message("Password and Confirm Password must match.", "error");
    }

    const customers = getCustomers();

    const alreadyExists = customers.some(
      (c) =>
        c.customerId === customer.customerId ||
        c.customerNumber === customer.customerNumber
    );

    if (alreadyExists) {
      return message("Customer ID or 13 Digit Customer Number already exists.", "error");
    }

    customers.push(customer);
    saveCustomers(customers);

    localStorage.setItem("lastRegistered", JSON.stringify(customer));

    location.href = "customer-register-success.html";
  });
}

function setupCustomerLogin() {
  document.getElementById("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const userId = loginUserId.value.trim();
    const pass = loginPassword.value;

    // if (!USER_ID_REGEX.test(userId)) {
    //   return message("User ID must be 5 to 20 characters.", "error");
    // }

    // if (!PASSWORD_REGEX.test(pass)) {
    //   return message("Invalid password format.", "error");
    // }

    // const customer = getCustomers().find(
    //   (c) => c.customerId === userId && c.password === pass
    // );

    // if (!customer) {
    //   return message("Invalid customer User ID or Password.", "error");
    // }
const customer="abc";
    setSession({
      role: "customer",
      userId: customer.customerId,
      customerNumber: customer.customerNumber,
      name: customer.name
    });

    location.href = "customer-home.html";
  });
}

function loadCustomerHome() {
  const s = requireRole("customer");

  if (!s) return;

  const notification = localStorage.getItem(`checkoutNotification_${s.userId}`);

  if (notification) {
    alert(
      "Thankyou for choosing us a trusted hotel. For more details contact the customer support."
    );

    localStorage.removeItem(`checkoutNotification_${s.userId}`);

    document.getElementById("checkoutNotice").classList.remove("hidden");
  }

  const list = getReservations().filter(
    (r) => r.customerUserId === s.userId
  );

  document.getElementById("totalBookings").textContent = list.length;

  document.getElementById("approvedBookings").textContent = list.filter(
    (r) => r.status === "Approved"
  ).length;

  document.getElementById("pendingBookings").textContent = list.filter(
    (r) => r.status === "Pending"
  ).length;

  document.getElementById("paidBills").textContent = list.filter(
    (r) => r.paymentStatus === "Paid"
  ).length;
}

// function setupReservation() {
//   document.getElementById("reservationForm").addEventListener("submit", (e) => {
//     e.preventDefault();

//     const s = getSession();

//     if (new Date(checkOut.value) <= new Date(checkIn.value)) {
//       return message("Check-out date must be after check-in date.", "error");
//     }

//     const services = [...document.querySelectorAll(".service:checked")].map(
//       (x) => x.value
//     );

//     const bookingId = id("BKG");
//     const reservations = getReservations();

//     reservations.push({
//       bookingId,
//       customerUserId: s.userId,
//       customerNumber: s.customerNumber,
//       customerName: s.name,
//       bookingDate: today(),
//       checkIn: checkIn.value,
//       checkOut: checkOut.value,
//       guests: Number(guests.value),
//       roomPreference: roomPreference.value,
//       services,
//       guestName: guestName.value.trim(),
//       contact: contact.value.trim(),
//       status: "Pending",
//       checkInStatus: "Not Checked In",
//       assignedRoomType: "",
//       roomNumber: "Not Assigned",
//       paymentStatus: "Unpaid",
//       checkedOut: false,
//       invoiceFinalized: false
//     });

//     saveReservations(reservations);

//     message(`Reservation Successful. Booking ID: ${bookingId}`);

//     e.target.reset();
//   });
// }

// KRISHNA
function setupReservation() {
  const checkInInput = document.getElementById("checkIn");
  const checkOutInput = document.getElementById("checkOut");

  const todayDate = new Date().toISOString().split("T")[0];
  checkInInput.min = todayDate;

  checkInInput.addEventListener("change", () => {
    checkOutInput.value = "";
    checkOutInput.min = checkInInput.value;
  });

  document.getElementById("reservationForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const s = getSession();


    const checkInDate = new Date(checkInInput.value);
    const checkOutDate = new Date(checkOutInput.value);

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    if (checkInDate < currentDate) {
      return message("Check-in date cannot be in the past.", "error");
    }


    if (checkOutDate <= checkInDate) {
      return message("Check-out date must be after check-in date.", "error");
    }

    const services = [...document.querySelectorAll(".service:checked")].map(
      (x) => x.value
    );

    const bookingId = id("BKG");
    const reservations = getReservations();

    reservations.push({
      bookingId,
      customerUserId: s.userId,
      customerNumber: s.customerNumber,
      customerName: s.name,
      bookingDate: today(),
      checkIn: checkInInput.value,
      checkOut: checkOutInput.value,
      guests: Number(guests.value),
      roomPreference: roomPreference.value,
      services,
      guestName: guestName.value.trim(),
      contact: contact.value.trim(),
      status: "Pending",
      checkInStatus: "Not Checked In",
      assignedRoomType: "",
      roomNumber: "Not Assigned",
      paymentStatus: "Unpaid",
      checkedOut: false,
      invoiceFinalized: false
    });

    saveReservations(reservations);

    message(`Reservation Successful. Booking ID: ${bookingId}`);
    e.target.reset();
  });
}

function customerSelectedServicesText(reservation) {
  const services = reservation.services || [];

  if (!services.length) {
    return "None";
  }

  return services
    .map((service) => `${service} ${money(SERVICE_CHARGES[service] || 0)}`)
    .join(", ");
}


function loadCustomerBilling() {
  const s = getSession();
  const body = document.querySelector("tbody");

  const list = getReservations().filter(
    (r) => r.customerUserId === s.userId && r.status === "Approved"
  );

  if (!list.length) {
    body.innerHTML = `
      <tr>
        <td colspan="5">No approved booking available for billing.</td>
      </tr>
    `;
    return;
  }

  body.innerHTML = list
    .map((r) => {
      const b = billOf(r);

      const paymentAction =
        r.paymentStatus === "Paid"
          ? `
            ${statusBadge("Paid")}
            <br>
            <button onclick="checkout('${r.bookingId}')">Checkout</button>
          `
          : `
            <a class="btn" href="customer-payment.html?bookingId=${r.bookingId}">
              Pay Bill
            </a>
          `;

      return `
        <tr>
          <td>${r.bookingId}</td>

          <td>
            Room ${r.roomNumber}<br>
            ${b.roomType}<br>
            ${b.nights} night(s)
          </td>

          <td>
            Room Charges: ${money(b.roomCharges)}<br>
          Services: ${customerSelectedServicesText(r)}<br>
Service Charges
          </td>

          <td>
            <strong>${money(b.total)}</strong>
          </td>

          <td>
            ${paymentAction}
          </td>
        </tr>
      `;
    })
    .join("");
}

function loadPaymentPage() {
  const r = selectedCustomerReservation();

  if (!r) return;

  const b = billOf(r);

  document.getElementById("bookingId").textContent = r.bookingId;
  document.getElementById("billAmount").value = money(b.total);

  document.getElementById("payNow").href =
    `customer-card-payment.html?bookingId=${r.bookingId}`;
}
// krishna
function setupCardPayment() {
  const r = selectedCustomerReservation();

  if (!r) return;

  document.getElementById("amount").textContent = money(billOf(r).total);

  document.getElementById("cardForm").addEventListener("submit", (e) => {
    e.preventDefault();

    if (!/^\d{16,}$/.test(cardNo.value)) {
      return message("Card number must contain minimum 16 digits.", "error");
    }

    if (cardHolder.value.trim().length < 10) {
      return message("Card holder name must be minimum 10 characters.", "error");
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry.value.trim())) {
      return message("Expiry Date must be in MM/YY format.", "error");
    }

    if (!/^\d{3,}$/.test(cvv.value)) {
      return message("CVV must contain minimum 3 digits.", "error");
    }

    const reservations = getReservations();
    const item = reservations.find((x) => x.bookingId === r.bookingId);
    const txn = id("TXN");

    item.paymentStatus = "Paid";
    item.transactionId = txn;
    item.paidDate = today();

    saveReservations(reservations);

    document.getElementById("paymentResult").innerHTML = `
      <div class="alert success">
        Payment Successful. Transaction ID: ${txn}
      </div>

      ${invoiceHtml(item)}

      <button onclick="checkout('${item.bookingId}')">Checkout</button>

      <a class="btn btn-secondary" href="customer-home.html">
        Back to Home
      </a>
    `;

    e.target.style.display = "none";
  });
}
//
function selectedCustomerReservation() {
  const s = getSession();

  const bookingId = new URLSearchParams(location.search).get("bookingId");

  const r = getReservations().find(
    (x) => x.bookingId === bookingId && x.customerUserId === s.userId
  );

  if (!r) {
    location.href = "customer-billing.html";
    return null;
  }

  return r;
}

function invoiceHtml(r) {
  const b = billOf(r);

  return `
    <div class="invoice">
      <h2>Invoice</h2>

      <p>
        <strong>Reservation ID:</strong>
        ${r.bookingId}
      </p>

      <p>
        <strong>User:</strong>
        ${r.customerName} (${r.customerUserId})
      </p>

      <p>
        <strong>Room:</strong>
        ${r.roomNumber} - ${b.roomType}
      </p>

     <p>
  <strong>Additional Services Opted:</strong>
  ${customerSelectedServicesText(r)}
</p>

<p>
  <strong>Additional Service Charges:</strong>
  ${money(b.serviceCharges)}
</p>

      <p>
        <strong>Total Bill:</strong>
        ${money(b.total)}
      </p>

      <p>
        <strong>Payment Status:</strong>
        ${r.paymentStatus}
      </p>

      ${
        r.transactionId
          ? `
            <p>
              <strong>Transaction ID:</strong>
              ${r.transactionId}
            </p>
          `
          : ""
      }
    </div>
  `;
}

function checkout(bookingId) {
  const s = getSession();
  const reservations = getReservations();

  const r = reservations.find(
    (x) => x.bookingId === bookingId && x.customerUserId === s.userId
  );

  if (r) {
    r.checkedOut = true;
    r.checkInStatus = "Checked Out";

    saveReservations(reservations);

    localStorage.setItem(`checkoutNotification_${s.userId}`, "yes");
  }

  location.href = "customer-home.html";
}

function loadCustomerHistory() {
  const list = getReservations().filter(
    (r) => r.customerUserId === getSession().userId
  );

  fillHistory(list);
}

function fillHistory(list) {
  const body = document.querySelector("tbody");

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
}

function loadCustomerBookings() {
  const todayDate = today();

  const list = getReservations().filter(
    (r) =>
      r.customerUserId === getSession().userId &&
      new Date(r.checkIn) >= new Date(todayDate) &&
      r.status !== "Rejected"
  );

  const body = document.querySelector("tbody");

  if (!list.length) {
    body.innerHTML = `
      <tr>
        <td colspan="5">No upcoming bookings found.</td>
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
          <td>${statusBadge(r.status)}</td>
        </tr>
      `
    )
    .join("");
}

function setupFeedback() {
  document.getElementById("feedbackForm").addEventListener("submit", (e) => {
    e.preventDefault();

    message("Thank you. Your feedback has been submitted successfully.");

    e.target.reset();
  });
}

function setupComplaint() {
  document.getElementById("customerId").value = getSession().userId;

  document.getElementById("complaintForm").addEventListener("submit", (e) => {
    e.preventDefault();

    message("Complaint registered successfully. Our support team will contact you.");

    e.target.reset();

    document.getElementById("customerId").value = getSession().userId;
  });
}