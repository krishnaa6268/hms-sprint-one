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


// ESU US-1 registerForm ----
function setupRegister() {
  document.getElementById("registerForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const customers = getCustomers();

    const customer = {
      generatedUserId: id("USR"),
      name: trimmedValue(customerName),
      email: trimmedValue(email),
      countryCode: countryCode.value,
      mobile: trimmedValue(mobile),
      customerNumber: generateCustomerNumber(customers),
      address: trimmedValue(address),
      customerId: trimmedValue(customerId),
      password: password.value
    };

    if (!isValidName(customer.name)) {
      return message("Customer name must be 2 to 50 letters.", "error");
    }

    if (!isValidEmail(customer.email)) {
      return message("Enter a valid email address.", "error");
    }

    if (!USER_ID_REGEX.test(customer.customerId)) {
      return message("Customer ID must be 5 to 20 characters.", "error");
    }

    if (!PHONE_REGEX.test(customer.mobile)) {
      return message("Mobile number must contain exactly 10 digits and should be in proper format.", "error");
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

    const alreadyExists = customers.some(
      (c) => c.customerId === customer.customerId
    );

    if (alreadyExists) {
      return message("Customer ID already exists.", "error");
    }

    customers.push(customer);
    saveCustomers(customers);

    localStorage.setItem("lastRegistered", JSON.stringify(customer));

    location.href = "customer-register-success.html";
  });
}

function generateCustomerNumber(customers) {
  let customerNumber;

  do {
    customerNumber = String(Date.now() + Math.floor(Math.random() * 1000))
      .slice(-13)
      .padStart(13, "0");
  } while (customers.some((c) => c.customerNumber === customerNumber));

  return customerNumber;
}

//  <!-- ESU US-2  C LOGIN-->
function setupCustomerLogin() {
  document.getElementById("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const userId = trimmedValue(loginUserId);
    const pass = loginPassword.value;

    if (!USER_ID_REGEX.test(userId)) {
      return message("User ID must be 5 to 20 characters.", "error");
    }

    if (!pass) {
      return message("Password is required.", "error");
    }

    const customer = getCustomers().find(
      (c) => c.customerId === userId && c.password === pass
    );

    if (!customer) {
      return message("Invalid customer User ID or Password.", "error");
    }

    setSession({
      role: "customer",
      userId: customer.customerId,
      customerNumber: customer.customerNumber,
      name: customer.name
    });

    location.href = "customer-home.html";
  });
}
// KARTIK -C14 CUSTOMER NOTIFI
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
  // C4 CUSTOMER HOME SRAVYA
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

// C6 CUSTOMER RESERVATIO SRAVYA
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
    const guestCount = Number(guests.value);
    const guest = trimmedValue(guestName);
    const contactNumber = trimmedValue(contact);


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

    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 10) {
      return message("Number of guests must be between 1 and 10.", "error");
    }

    if (!roomPreference.value) {
      return message("Please select a room preference.", "error");
    }

    if (!isValidName(guest)) {
      return message("Guest name must be 2 to 50 letters.", "error");
    }

    if (!PHONE_REGEX.test(contactNumber)) {
      return message("Contact number must contain exactly 10 digits.", "error");
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
      guests: guestCount,
      roomPreference: roomPreference.value,
      services,
      guestName: guest,
      contact: contactNumber,
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

// KARTIK PAYMENT BOOKING SERVICE C15
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
// KARTIK
function loadPaymentPage() {
  const r = selectedCustomerReservation();

  if (!r) return;

  const b = billOf(r);

  document.getElementById("bookingId").textContent = r.bookingId;
  document.getElementById("billAmount").value = money(b.total);

  document.getElementById("payNow").href =
    `customer-card-payment.html?bookingId=${r.bookingId}`;
}
// KARTIK C15 CARD 
function setupCardPayment() {
  const r = selectedCustomerReservation();

  if (!r) return;

  document.getElementById("amount").textContent = money(billOf(r).total);

  document.getElementById("cardForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const cardNumber = trimmedValue(cardNo).replaceAll(" ", "");
    const holderName = trimmedValue(cardHolder);
    const expiryDate = trimmedValue(expiry);
    const cvvNumber = trimmedValue(cvv);

    if (!CARD_NUMBER_REGEX.test(cardNumber)) {
      return message("Card number must contain exactly 16 digits.", "error");
    }

    if (!isValidName(holderName) || holderName.length < 3) {
      return message("Card holder name must contain only letters and spaces.", "error");
    }

    if (!isFutureCardExpiry(expiryDate)) {
      return message("Expiry date must be a valid future date in MM/YY format.", "error");
    }

    if (!CVV_REGEX.test(cvvNumber)) {
      return message("CVV must contain exactly 3 digits.", "error");
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

      ${r.transactionId
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

// Krishna us-10
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

// C15 KARTIK UPCOMING BOOKING
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
    const fields = e.target.querySelectorAll("input, select, textarea");
    const name = trimmedValue(fields[0]);
    const emailAddress = trimmedValue(fields[1]);
    const rating = trimmedValue(fields[2]);
    const feedback = trimmedValue(fields[3]);

    if (!isValidName(name)) {
      return message("Name must be 2 to 50 letters.", "error");
    }

    if (!isValidEmail(emailAddress)) {
      return message("Enter a valid email address.", "error");
    }

    if (!rating) {
      return message("Please select a rating.", "error");
    }

    if (!isValidPlainText(feedback, 10, 500)) {
      return message("Feedback must be 10 to 500 characters.", "error");
    }

    message("Thank you. Your feedback has been submitted successfully.");

    e.target.reset();
  });
}

function setupComplaint() {
  document.getElementById("customerId").value = getSession().userId;

  document.getElementById("complaintForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const fields = e.target.querySelectorAll("select, input, textarea");
    const complaintType = trimmedValue(fields[0]);
    const roomNumber = trimmedValue(fields[1]);
    const contactNumber = trimmedValue(fields[2]);
    const customerUserId = trimmedValue(fields[3]);
    const complaint = trimmedValue(fields[4]);

    if (!complaintType) {
      return message("Please select a complaint type.", "error");
    }

    if (!ROOM_NUMBERS.includes(Number(roomNumber))) {
      return message("Enter a valid room number.", "error");
    }

    if (!PHONE_REGEX.test(contactNumber)) {
      return message("Contact number must contain exactly 10 digits.", "error");
    }

    if (customerUserId !== getSession().userId) {
      return message("Customer ID must match your logged in account.", "error");
    }

    if (!isValidPlainText(complaint, 10, 500)) {
      return message("Complaint details must be 10 to 500 characters.", "error");
    }

    message("Complaint registered successfully. Our support team will contact you.");

    e.target.reset();

    document.getElementById("customerId").value = getSession().userId;
  });
}
