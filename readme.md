# E-Commerce Platform Frontend

Welcome to the **E-Commerce Platform Frontend** repository! This project is a feature-rich, fully responsive e-commerce application built strictly on the frontend side. It leverages vanilla web technologies combined with Bootstrap for styling, while a mocked backend serves the required data from a structured `db.json` file.

## 🚀 Live Demo & API Resources

- **JSON Server Deployment:** [https://e-commerce-server-xi.vercel.app/](https://e-commerce-server-xi.vercel.app/)
- **Server Application Repo:** [GitHub - E-commerce_Server](https://github.com/rawda2/E-commerce_Server)

---

## Technology Stack

This project was built without any backend framework. The application purely utilizes:

- **HTML5**: Semantic and accessible markup.
- **CSS3**: Custom styling alongside comprehensive layouts.
- **Bootstrap**: For rapid UI development, robust components, and responsive grid alignment.
- **Vanilla JavaScript (ES6+)**: To handle DOM manipulation, fetching data, user authentication flow, and feature logic.
- **Local Storage / Session Storage**: Managing user sessions, shopping cart state, and local caching.
- **JSON Server (Hosted)**: Simulates a REST API to fetch users, products, and handle mock orders.

---

## Core Features

1. **User Authentication**: Secure Login and Registration system supporting different roles (`admin`, `seller`, `customer`).
2. **Home Page**: Dynamic landing page showcasing featured products, categories, and promotions.
3. **Product Catalog**: A comprehensive catalog to browse all available products.
4. **Product Details Page**: Detailed view of each item, complete with product specifications, high-quality images, and "Add to Cart" functionality.
5. **Shopping Cart**: Fully functional cart system allowing users to add, edit, or remove quantities of items before checking out.
6. **Checkout Flow**: Simple checkout process simulating successful purchase order placements.
7. **Seller Dashboard**: A dedicated interface for sellers to manage their store stock, add new products, and view current listings.
8. **Admin Panel**: For administrative oversight, managing users across the platform, determining roles, and tracking orders.
9. **Fully Responsive Design**: Fluid UI that perfectly conforms to desktops, tablets, and mobile devices natively using media queries and Bootstrap layouts.

---

## Project Structure

```text
📦 eCommerce
 ┣ 📂 Imgs             # Static image assets used throughout the platform
 ┣ 📂 pages            # HTML views categorized by domain
 ┃ ┣ 📂 admin          # Admin panels (dashboard, analytics, orders, user management)
 ┃ ┣ 📂 Auth           # Login and Registration pages
 ┃ ┣ 📂 landpage       # Static informational pages (About, Contact, FAQ, etc.)
 ┃ ┣ 📂 products       # Catalog, Details, Cart, Checkout, and Wishlist pages
 ┃ ┗ 📂 seller         # Seller analytics and order management
 ┣ 📂 Scripts          # JavaScript files handling page-specific logic
 ┃ ┣ 📜 DB.js          # Core API fetch logic and LocalStorage interface
 ┃ ┣ 📜 script.js      # Global utilities
 ┃ ┣ 📂 admin          # JS for Admin dashboard charts and data tables
 ┃ ┣ 📂 Auth           # Auth validation and login logic
 ┃ ┣ 📂 landpage       # Profile and Home page dynamic content
 ┃ ┣ 📂 products       # Cart calculations, checkout flow, product rendering
 ┃ ┗ 📂 seller         # Seller dashboard data aggregations
 ┣ 📂 Styles           # CSS stylesheets governing the visual feel of the app
 ┃ ┣ 📜 style.css      # Base/Global styles
 ┃ ┣ 📜 Home.css       # Landing page styling
 ┃ ┣ 📜 media.css      # Global responsive media queries
 ┃ ┗ 📜 ...            # Component-specific styles (cart, products, admin)
 ┣ 📜 index.html       # Application Entry Point (Home functionality)
 ┣ 📜 seller_dashboard.html # Main dashboard entry for sellers
 ┗ 📜 README.md        # Project documentation
```

---

## Database Structure (`db.json`)

The application relies on mocked JSON data acting as a database. Below are the key endpoints and data schemas:

### 1. **Users (`/users`)**

Supports multiple account roles (`admin`, `customer`, `seller`).

```json
[
  {
    "id": "1741123456789",
    "name": "rawda2",
    "email": "rawda2@gmail.com",
    "password": "Rawda@1234",
    "role": "seller",
    "address": "Tanta Railway Station",
    "createdAt": "2026-03-04T18:25:00.025Z",
    "updatedAt": "2026-03-05T09:48:56.599Z"
  }
]
```

### 2. **Products (`/products`)**

Details products showcased inside the catalog and their seller's relation.

```json
[
  {
    "id": "101",
    "name": "iPhone 15 Pro",
    "category": "Electronics",
    "stock": 25,
    "images": ["https://images.unsplash.com/photo-1580910051074..."],
    "details": [
      "6.1-inch Super Retina XDR display",
      "A17 Pro chip with 6-core GPU"
    ],
    "price": 1199.99,
    "sellerId": "2"
  }
]
```

### 3. **Orders (`/orders`)**

Keeps track of customer purchases and total financial overviews.

```json
[
  {
    "id": "5001",
    "date": "2024-03-15T10:30:00Z",
    "customer": {
      "userId": "4",
      "name": "Ahmed Hassan",
      "email": "ahmed@example.com",
      "address": "15 Nile Street, Cairo, Egypt"
    },
    "products": [
      {
        "productId": "101",
        "name": "iPhone 15 Pro",
        "price": 1199.99,
        "quantity": 1
      }
    ],
    "paymentMethod": "Visa ending in 4242",
    "totalPrice": 1549.98,
    "status": "delivered"
  }
]
```

---

## Getting Started

To run this project locally, simply clone the repository and open `index.html` in your favorite browser. No complex local server configuration or build tool is strictly required since it is a static frontend.

1. **Clone the repo:**
   ```bash
   git clone https://github.com/Mohamed-Ellakany/eCommerce.git
   ```
2. **Navigate into the directory:**
   ```bash
   cd eCommerce
   ```
3. **Open the project:**
   Open `index.html` via Live Server in VSCode or by dragging it into your browser.

> **Note:** Make sure you have an active internet connection so the frontend can properly fetch data from the mocked Vercel backend.
