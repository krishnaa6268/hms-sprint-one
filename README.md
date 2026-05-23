# Hotel Reservation System - Separated Customer and Admin Code

This version avoids one large clumsy script. Customer and Admin are separated and linked through normal HTML pages.

## Structure
- `index.html` - first/landing page with Customer and Admin route choices
- Customer pages: `customer-*.html`
- Admin pages: `admin-*.html`
- `style.css` - common styling
- `common.js` - shared helpers only, such as localStorage, bill calculation, logout, formatting
- `customer.js` - customer-only logic
- `admin.js` - admin-only logic

## Admin Login
User ID: `admin01`
Password: `Admin@123`

## Run
Open `index.html` in a browser.

Data is stored in browser localStorage.
