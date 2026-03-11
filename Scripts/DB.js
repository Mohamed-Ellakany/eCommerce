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

<<<<<<< HEAD
API_URL = "https://e-commerce-server-xi.vercel.app";
=======
 API_URL = "https://e-commerce-server-xi.vercel.app";
>>>>>>> 790b838bf55b81e73f5ed85197fd5233adfa4adc

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
      `${API_URL}/users?email=${encodeURIComponent(email.toLowerCase().trim())}`
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
    const url = userId
      ? `${API_URL}/cart?userId=${userId}`
      : `${API_URL}/cart`;
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
    const res = await fetch(`${API_URL}/cart/${cartItemId}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`removeFromCart failed: ${res.status}`);
    console.log("[DB] removeFromCart:", cartItemId);
    return true;
  },

  async clearCart(userId) {
    // Fetch all cart items for user then delete each one
    const items = await this.getCart(userId);
    console.log("[DB] clearCart — deleting", items.length, "items for userId:", userId);
    await Promise.all(items.map(item => this.removeFromCart(item.id)));
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
  },
  /**
   * Get raw wishlist items for the current user (no product details).
   * For guests → reads productIds from localStorage key "wishlist".
   * @returns {Promise<Array>}
   */
  async getWishlist() {
    const session = this.getSession();

    // ── Guest fallback ──
    if (!session || !session.id) {
      return JSON.parse(localStorage.getItem("wishlist") || "[]");
    }

    try {
      const res = await fetch(`${API_URL}/wishlist?userId=${session.id}`);
      if (!res.ok) return [];
      return await res.json();
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      return [];
    }
  },

  /**
   * Get wishlist items enriched with full product objects.
   * Returns an array of product objects, each extended with:
   *   { wishlistItemId, addedAt }
   * @returns {Promise<Array>}
   */
  async getWishlistProducts() {
    const session = this.getSession();
    const products = await this.getProducts();

    // ── Guest fallback ──
    if (!session || !session.id) {
      // localStorage stores an array of productId strings/numbers
      const wishlistIds = JSON.parse(
        localStorage.getItem("wishlist") || "[]"
      ).map(String);

      return products.filter((p) => wishlistIds.includes(String(p.id)));
    }

    try {
      const wishlistItems = await this.getWishlist();

      return wishlistItems
        .map((item) => {
          // Compare as strings to avoid type mismatch ("101" vs 101)
          const product = products.find(
            (p) => String(p.id) === String(item.productId)
          );
          if (!product) return null;
          return {
            ...product,
            wishlistItemId: item.id,
            addedAt: item.addedAt,
          };
        })
        .filter(Boolean); // drop entries whose product no longer exists
    } catch (error) {
      console.error("Error fetching wishlist products:", error);
      return [];
    }
  },

  async addToWishlist(productId) {
    const session = this.getSession();
    const pid = String(productId); // normalise to string

    // ── Guest fallback ──
    if (!session || !session.id) {
      let wishlist = JSON.parse(
        localStorage.getItem("wishlist") || "[]"
      ).map(String);

      if (!wishlist.includes(pid)) {
        wishlist.push(pid);
        localStorage.setItem("wishlist", JSON.stringify(wishlist));
      }
      return true;
    }

    try {
      // Check for existing entry (string comparison via URL param)
      const checkRes = await fetch(
        `${API_URL}/wishlist?userId=${session.id}&productId=${pid}`
      );
      const existing = await checkRes.json();

      if (existing.length > 0) return true; // already in wishlist

      // Use a unique ID that won't collide with product IDs
      const wishlistId = `wl_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 7)}`;

      const res = await fetch(`${API_URL}/wishlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: wishlistId,
          userId: session.id,
          productId: pid,
          addedAt: new Date().toISOString(),
        }),
      });

      if (!res.ok) throw new Error("Failed to add to wishlist");
      return true;
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      return false;
    }
  },

 
  async removeFromWishlist(productId) {
    const session = this.getSession();
    const pid = String(productId);

    // ── Guest fallback ──
    if (!session || !session.id) {
      let wishlist = JSON.parse(
        localStorage.getItem("wishlist") || "[]"
      ).map(String);
      wishlist = wishlist.filter((id) => id !== pid);
      localStorage.setItem("wishlist", JSON.stringify(wishlist));
      return true;
    }

    try {
      const res = await fetch(
        `${API_URL}/wishlist?userId=${session.id}&productId=${pid}`
      );
      const items = await res.json();

      if (items.length === 0) return true; // already not in wishlist

      const deleteRes = await fetch(`${API_URL}/wishlist/${items[0].id}`, {
        method: "DELETE",
      });

      if (!deleteRes.ok) throw new Error("Failed to remove from wishlist");
      return true;
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      return false;
    }
  },

  
  async removeWishlistItem(wishlistItemId) {
    const session = this.getSession();

    if (!session || !session.id) {
      return false;
    }

    try {
      const deleteRes = await fetch(
        `${API_URL}/wishlist/${wishlistItemId}`,
        { method: "DELETE" }
      );

      if (!deleteRes.ok) throw new Error("Failed to remove wishlist item");
      return true;
    } catch (error) {
      console.error("Error removing wishlist item:", error);
      return false;
    }
  },

 
  async isInWishlist(productId) {
    const session = this.getSession();
    const pid = String(productId); // normalise

    if (!session || !session.id) {
      const wishlist = JSON.parse(
        localStorage.getItem("wishlist") || "[]"
      ).map(String);
      return wishlist.includes(pid);
    }

    try {
      const res = await fetch(
        `${API_URL}/wishlist?userId=${session.id}&productId=${pid}`
      );
      const items = await res.json();
      return items.length > 0;
    } catch (error) {
      console.error("Error checking wishlist:", error);
      return false;
    }
  },

 
  async clearWishlist() {
    const session = this.getSession();

    // ── Guest fallback ──
    if (!session || !session.id) {
      localStorage.removeItem("wishlist");
      return true;
    }

    try {
      const res = await fetch(`${API_URL}/wishlist?userId=${session.id}`);
      const items = await res.json();

      if (items.length === 0) return true;

      const deletePromises = items.map((item) =>
        fetch(`${API_URL}/wishlist/${item.id}`, { method: "DELETE" })
      );

      const results = await Promise.all(deletePromises);
      const allOk = results.every((r) => r.ok);

      if (!allOk) throw new Error("Some wishlist items failed to delete");
      return true;
    } catch (error) {
      console.error("Error clearing wishlist:", error);
      return false;
    }
  },


  async moveToCart(productId, quantity = 1) {
    try {
      const products = await this.getProducts();
      const product = products.find(
        (p) => String(p.id) === String(productId)
      );

      if (!product) {
        console.error("moveToCart: product not found", productId);
        return false;
      }

      if (typeof Cart === "undefined") {
        console.error("moveToCart: Cart utility not loaded");
        return false;
      }

      Cart.add(product, quantity);
      await this.removeFromWishlist(productId);
      return true;
    } catch (error) {
      console.error("Error moving to cart:", error);
      return false;
    }
  },

 
  async getWishlistCount() {
    const session = this.getSession();

    if (!session || !session.id) {
      const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
      return wishlist.length;
    }

    try {
      const res = await fetch(`${API_URL}/wishlist?userId=${session.id}`);
      if (!res.ok) return 0;
      const items = await res.json();
      return items.length;
    } catch (error) {
      console.error("Error getting wishlist count:", error);
      return 0;
    }
  },
};
