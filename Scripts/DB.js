// ══════════════════════════════════════════════════════════════════
//  db.js  —  API-backed "Database" using JSON Server
//
//  JSON Server running at http://localhost:3000
//  Endpoints: /users, /products, /cart, /orders
//
//  shop_session → { id, name, email, role, address, createdAt }  (localStorage only, no password)
//
//  Roles: "admin" | "seller" | "customer"
// ══════════════════════════════════════════════════════════════════

const API_URL = "http://localhost:3000";

const DB = {
  // ── Session (localStorage only — sessions are client-side) ────
  getSession() {
    return JSON.parse(localStorage.getItem("shop_session") || "null");
  },
  saveSession(user) {
    localStorage.setItem("shop_session", JSON.stringify(user));
  },
  clearSession() {
    localStorage.removeItem("shop_session");
  },

  // ── Core user fetches ─────────────────────────────────────────
  async getUsers() {
    const res = await fetch(`${API_URL}/users`);
    return res.json();
  },

  async findByEmail(email) {
    const res = await fetch(
      `${API_URL}/users?email=${encodeURIComponent(email.toLowerCase().trim())}`,
    );
    const users = await res.json();
    return users[0] || null;
  },

  async findById(id) {
    const res = await fetch(`${API_URL}/users/${id}`);
    if (!res.ok) return null;
    return res.json();
  },

  // ── User mutations ────────────────────────────────────────────
  async addUser(user) {
    const res = await fetch(`${API_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });
    if (!res.ok) throw new Error("Failed to add user");
    return res.json();
  },

  async updateUser(id, changes) {
    const res = await fetch(`${API_URL}/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    });
    if (!res.ok) throw new Error("Failed to update user");
    const updated = await res.json();

    // Refresh session if it's the same user
    const session = this.getSession();
    if (session && session.id === id) {
      const { password, ...safe } = { ...session, ...changes };
      this.saveSession(safe);
    }
    return updated;
  },

  async deleteUser(id) {
    const res = await fetch(`${API_URL}/users/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete user");
    return true;
  },
};
