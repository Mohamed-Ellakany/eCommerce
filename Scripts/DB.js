// ══════════════════════════════════════════════════════════════════
//  db.js  —  API-backed "Database" using JSON Server
//
//  JSON Server running at https://e-commerce-server-xi.vercel.app (Deployed by Vercel)
//  Endpoints: /users, /products, /cart, /orders
//
//  shop_session → { id, name, email, role, address, createdAt }  (localStorage only, no password)
//
//  Roles: "admin" | "seller" | "customer"
// ══════════════════════════════════════════════════════════════════

API_URL = "https://json-server-for-ecomerce-app-cst.vercel.app";

const DB = {
  // ══════════════════════════════════════════════════════════════
  //  SESSION  (localStorage only)
  // ══════════════════════════════════════════════════════════════

  getSession() {
    return JSON.parse(localStorage.getItem("shop_session") || "null");
  },

  saveSession(user) {
    const { password, ...safe } = user;
    localStorage.setItem("shop_session", JSON.stringify(safe));
    console.log("[DB] saveSession:", safe);
  },

  clearSession() {
    localStorage.removeItem("shop_session");
    console.log("[DB] clearSession");
  },

  // ══════════════════════════════════════════════════════════════
  //  USERS
  // ══════════════════════════════════════════════════════════════

  async getUsers() {
    const res = await fetch(`${API_URL}/users`);
    if (!res.ok) throw new Error(`getUsers failed: ${res.status}`);
    const data = await res.json();
    console.log("[DB] getUsers:", data);
    return data;
  },

  async findByEmail(email) {
    const res = await fetch(
      `${API_URL}/users?email=${encodeURIComponent(email.toLowerCase().trim())}`,
    );
    if (!res.ok) throw new Error(`findByEmail failed: ${res.status}`);
    const users = await res.json();
    const found = users[0] || null;
    console.log("[DB] findByEmail:", email, "→", found);
    return found;
  },

  async findById(id) {
    const res = await fetch(`${API_URL}/users/${id}`);
    if (!res.ok) return null;
    const data = await res.json();
    console.log("[DB] findById:", id, "→", data);
    return data;
  },

  async addUser(user) {
    const res = await fetch(`${API_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });
    if (!res.ok) throw new Error(`addUser failed: ${res.status}`);
    const created = await res.json();
    console.log("[DB] addUser:", created);
    return created;
  },

  async updateUser(id, changes) {
    const res = await fetch(`${API_URL}/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    });
    if (!res.ok) throw new Error(`updateUser failed: ${res.status}`);
    const updated = await res.json();
    console.log("[DB] updateUser:", id, "→", updated);

    // Keep session in sync if it's the logged-in user
    const session = this.getSession();
    if (session && session.id === id) {
      const { password, ...safe } = { ...session, ...changes };
      this.saveSession(safe);
    }
    return updated;
  },

  async deleteUser(id) {
    const res = await fetch(`${API_URL}/users/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`deleteUser failed: ${res.status}`);
    console.log("[DB] deleteUser:", id);
    return true;
  },

  // ══════════════════════════════════════════════════════════════
  //  PRODUCTS
  // ══════════════════════════════════════════════════════════════

  async getProducts() {
    const res = await fetch(`${API_URL}/products`);
    if (!res.ok) throw new Error(`getProducts failed: ${res.status}`);
    const data = await res.json();
    console.log("[DB] getProducts:", data);
    return data;
  },

  async getProductById(id) {
    const res = await fetch(`${API_URL}/products/${id}`);
    if (!res.ok) {
      console.warn("[DB] getProductById: not found →", id);
      return null;
    }
    const data = await res.json();
    console.log("[DB] getProductById:", id, "→", data);
    return data;
  },

  async addProduct(product) {
    const res = await fetch(`${API_URL}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    if (!res.ok) throw new Error(`addProduct failed: ${res.status}`);
    const created = await res.json();
    console.log("[DB] addProduct:", created);
    return created;
  },

  async updateProduct(id, changes) {
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    });
    if (!res.ok) throw new Error(`updateProduct failed: ${res.status}`);
    const updated = await res.json();
    console.log("[DB] updateProduct:", id, changes, "→", updated);
    return updated;
  },

  async deleteProduct(id) {
    const res = await fetch(`${API_URL}/products/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`deleteProduct failed: ${res.status}`);
    console.log("[DB] deleteProduct:", id);
    return true;
  },

  // ══════════════════════════════════════════════════════════════
  //  CART
  //  Cart item shape: { id, userId, productId, quantity }
  // ══════════════════════════════════════════════════════════════

  async getCart(userId) {
    const url = userId ? `${API_URL}/cart?userId=${userId}` : `${API_URL}/cart`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`getCart failed: ${res.status}`);
    const data = await res.json();
    console.log("[DB] getCart (userId:", userId, "):", data);
    return data;
  },

  async addToCart(item) {
    // item: { id, userId, productId, quantity }
    const res = await fetch(`${API_URL}/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error(`addToCart failed: ${res.status}`);
    const created = await res.json();
    console.log("[DB] addToCart:", created);
    return created;
  },

  async updateCartItem(cartItemId, changes) {
    const res = await fetch(`${API_URL}/cart/${cartItemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    });
    if (!res.ok) throw new Error(`updateCartItem failed: ${res.status}`);
    const updated = await res.json();
    console.log("[DB] updateCartItem:", cartItemId, "→", updated);
    return updated;
  },

  async removeFromCart(cartItemId) {
    const res = await fetch(`${API_URL}/cart/${cartItemId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error(`removeFromCart failed: ${res.status}`);
    console.log("[DB] removeFromCart:", cartItemId);
    return true;
  },

  async clearCart(userId) {
    // Fetch all cart items for user then delete each one
    const items = await this.getCart(userId);
    console.log(
      "[DB] clearCart — deleting",
      items.length,
      "items for userId:",
      userId,
    );
    await Promise.all(items.map((item) => this.removeFromCart(item.id)));
    console.log("[DB] clearCart — done for userId:", userId);
  },

  // ══════════════════════════════════════════════════════════════
  //  ORDERS
  //  Order shape: { id, userId, items:[{productId, quantity}], total, status }
  // ══════════════════════════════════════════════════════════════

  async getOrders(userId) {
    const url = userId
      ? `${API_URL}/orders?userId=${userId}`
      : `${API_URL}/orders`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`getOrders failed: ${res.status}`);
    const data = await res.json();
    console.log("[DB] getOrders (userId:", userId, "):", data);
    return data;
  },

  async getOrderById(id) {
    const res = await fetch(`${API_URL}/orders/${id}`);
    if (!res.ok) return null;
    const data = await res.json();
    console.log("[DB] getOrderById:", id, "→", data);
    return data;
  },

  async placeOrder(orderData) {
    const order = {
      id: Date.now().toString(),
      status: "pending",
      createdAt: new Date().toISOString(),
      ...orderData,
    };
    console.log("[DB] placeOrder — submitting:", order);
    const res = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    });
    if (!res.ok) throw new Error(`placeOrder failed: ${res.status}`);
    const saved = await res.json();
    console.log("[DB] placeOrder — saved:", saved);
    return saved;
  },

  async updateOrderStatus(id, status) {
    const res = await fetch(`${API_URL}/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error(`updateOrderStatus failed: ${res.status}`);
    const updated = await res.json();
    console.log("[DB] updateOrderStatus:", id, "→", status);
    return updated;
  },

  async deleteOrder(id) {
    const res = await fetch(`${API_URL}/orders/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`deleteOrder failed: ${res.status}`);
    console.log("[DB] deleteOrder:", id);
    return true;

    return res.json();
  }
  ,
}