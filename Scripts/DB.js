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

 API_URL = "https://e-commerce-server-xi.vercel.app";

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
  async getProducts() {
    const res = await fetch(`${API_URL}/products`);
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
