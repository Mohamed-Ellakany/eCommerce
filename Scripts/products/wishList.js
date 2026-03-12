/**
 * wishlist.js — Complete Wishlist System
 * Works on: Home page (dynamic cards) + Wishlist page
 *
 * Session key : "shop_session"
 * API         : https://e-commerce-server-xi.vercel.app
 * Dependencies: Bootstrap 5, Font Awesome
 */

const WL = (() => {
  const API_URL = "https://e-commerce-server-xi.vercel.app";
  const SESSION_KEY = "shop_session";

  /* ─────────────────────────────────────────
     Session
  ───────────────────────────────────────── */
  function getSession() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
    } catch {
      return null;
    }
  }

  /* ─────────────────────────────────────────
     API
  ───────────────────────────────────────── */
  // Fetch ALL wishlist items then filter client-side
  // (json-server on Vercel ignores query params for filtering)
  async function fetchItems() {
    const session = getSession();
    if (!session?.id) return [];
    try {
      const res = await fetch(`${API_URL}/wishlist`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const all = await res.json();
      // ✅ Filter by current user client-side
      return all.filter((item) => String(item.userId) === String(session.id));
    } catch (err) {
      console.error("[WL] fetchItems:", err);
      return [];
    }
  }

  async function isInWishlist(productId) {
    const items = await fetchItems(); // already filtered by userId
    return items.some((item) => String(item.productId) === String(productId));
  }

  async function addItem(productId) {
    const session = getSession();
    if (!session?.id) return { ok: false, reason: "not_logged_in" };
    const pid = String(productId);
    try {
      const existing = await fetchItems(); // already filtered by userId
      if (existing.some((i) => String(i.productId) === pid)) {
        return { ok: true, reason: "already_exists" };
      }

      const res = await fetch(`${API_URL}/wishlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: `wl_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
          userId: session.id,
          productId: pid,
          addedAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { ok: true, reason: "added" };
    } catch (err) {
      console.error("[WL] addItem:", err);
      return { ok: false, reason: "error" };
    }
  }

  async function removeItem(productId) {
    const session = getSession();
    if (!session?.id) return false;
    const pid = String(productId);
    try {
      // fetchItems() already filters by userId — safe, never touches other users
      const items = await fetchItems();
      const target = items.find((i) => String(i.productId) === pid);
      if (!target) return true; // already gone

      const del = await fetch(`${API_URL}/wishlist/${target.id}`, {
        method: "DELETE",
      });
      return del.ok;
    } catch (err) {
      console.error("[WL] removeItem:", err);
      return false;
    }
  }

  async function removeItemById(wishlistItemId) {
    try {
      const res = await fetch(`${API_URL}/wishlist/${wishlistItemId}`, {
        method: "DELETE",
      });
      return res.ok;
    } catch (err) {
      console.error("[WL] removeItemById:", err);
      return false;
    }
  }

  async function getCount() {
    const items = await fetchItems(); // already filtered by userId
    return items.length;
  }

  /* ─────────────────────────────────────────
     UI — Badge
  ───────────────────────────────────────── */
  async function updateBadge() {
    const count = await getCount();
    document
      .querySelectorAll(
        ".wishlist-badge, #navWishlistCount, #navWishlistCountMobile",
      )
      .forEach((el) => {
        el.textContent = count;
        el.style.display = count > 0 ? "inline-flex" : "none";
      });
  }

  /* ─────────────────────────────────────────
     UI — Button state
  ───────────────────────────────────────── */
  function applyBtnState(btn, isWishlisted) {
    if (!btn) return;
    const icon = btn.querySelector("i");
    if (isWishlisted) {
      btn.classList.add("wishlisted");
      btn.setAttribute("title", "Remove from wishlist");
      btn.setAttribute("aria-pressed", "true");
      if (icon) icon.className = "fa-solid fa-heart text-danger";
    } else {
      btn.classList.remove("wishlisted");
      btn.setAttribute("title", "Add to wishlist");
      btn.setAttribute("aria-pressed", "false");
      if (icon) icon.className = "fa-regular fa-heart";
    }
  }

  /* ─────────────────────────────────────────
     UI — Toast
  ───────────────────────────────────────── */
  function showToast(message, type = "add") {
    const bgMap = {
      add: "bg-danger",
      remove: "bg-secondary",
      warn: "bg-warning text-dark",
      error: "bg-danger",
    };

    let container = document.getElementById("wl-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "wl-toast-container";
      container.className = "toast-container position-fixed bottom-0 end-0 p-3";
      container.style.zIndex = "99999";
      document.body.appendChild(container);
    }

    const id = `wl-t-${Date.now()}`;
    container.insertAdjacentHTML(
      "beforeend",
      `<div id="${id}" class="toast align-items-center text-white ${bgMap[type] || "bg-secondary"} border-0"
            role="alert" aria-live="assertive" aria-atomic="true">
         <div class="d-flex">
           <div class="toast-body fw-semibold">${message}</div>
           <button type="button" class="btn-close btn-close-white me-2 m-auto"
                   data-bs-dismiss="toast" aria-label="Close"></button>
         </div>
       </div>`,
    );

    const el = document.getElementById(id);
    new bootstrap.Toast(el, { delay: 2500 }).show();
    el.addEventListener("hidden.bs.toast", () => el.remove());
  }

  /* ─────────────────────────────────────────
     Toggle (heart button click)
  ───────────────────────────────────────── */
  async function toggle(btn, productId) {
    if (!btn || !productId) return;

    const session = getSession();
    if (!session?.id) {
      showToast("Please log in to save items to your wishlist.", "warn");
      setTimeout(() => (window.location.href = "login.html"), 1500);
      return;
    }

    btn.disabled = true;
    const wasWishlisted = btn.classList.contains("wishlisted");

    try {
      if (wasWishlisted) {
        const ok = await removeItem(productId);
        if (ok) {
          applyBtnState(btn, false);
          showToast("Removed from wishlist.", "remove");
        } else {
          showToast("Could not remove. Try again.", "error");
        }
      } else {
        const result = await addItem(productId);
        if (result.ok) {
          applyBtnState(btn, true);
          showToast("Added to wishlist!", "add");
        } else if (result.reason === "not_logged_in") {
          showToast("Please log in to save items.", "warn");
          setTimeout(() => (window.location.href = "login.html"), 1500);
        } else {
          showToast("Could not add. Try again.", "error");
        }
      }
      await updateBadge();
    } catch (err) {
      console.error("[WL] toggle:", err);
      showToast("Something went wrong.", "error");
    } finally {
      btn.disabled = false;
    }
  }

  /* ─────────────────────────────────────────
     Init toggle buttons
     *** Call this AFTER dynamic cards render ***
  ───────────────────────────────────────── */
  async function initButtons(container = document) {
    const buttons = container.querySelectorAll(
      ".wishlist-toggle-btn[data-product-id]",
    );
    if (!buttons.length) return;

    // ONE request for all buttons — no N+1
    const items = await fetchItems();
    const wishlistedIds = new Set(items.map((i) => String(i.productId)));

    buttons.forEach((btn) => {
      const pid = String(btn.dataset.productId);
      applyBtnState(btn, wishlistedIds.has(pid));

      // Clone to wipe stale listeners
      const fresh = btn.cloneNode(true);
      btn.replaceWith(fresh);

      fresh.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(fresh, pid);
      });
    });

    await updateBadge();
  }

  /* ─────────────────────────────────────────
     WISHLIST PAGE — Render
  ───────────────────────────────────────── */
  async function renderPage() {
    const grid = document.getElementById("wishlistGrid");
    const emptyRow = document.getElementById("emptyWishlistRow");
    const countEl = document.getElementById("wishlistCount");
    const spinner = document.getElementById("loadingSpinner");
    const content = document.getElementById("wishlistContent");

    if (!grid) return;

    spinner?.classList.remove("d-none");
    content?.classList.add("d-none");

    try {
      const session = getSession();

      if (!session?.id) {
        grid.innerHTML = "";
        if (countEl) countEl.textContent = "0";
        emptyRow?.classList.remove("d-none");
        return;
      }

      const [wishlistItems, productsRes] = await Promise.all([
        fetchItems(),
        fetch(`${API_URL}/products`),
      ]);

      const allProducts = productsRes.ok ? await productsRes.json() : [];

      const wishlistProducts = wishlistItems
        .map((item) => {
          const product = allProducts.find(
            (p) => String(p.id) === String(item.productId),
          );
          if (!product) return null;
          return { ...product, wishlistItemId: item.id };
        })
        .filter(Boolean);

      if (countEl) countEl.textContent = wishlistProducts.length;
      grid.innerHTML = "";

      if (wishlistProducts.length === 0) {
        emptyRow?.classList.remove("d-none");
        return;
      }

      emptyRow?.classList.add("d-none");
      wishlistProducts.forEach((product) => {
        const col = document.createElement("div");
        col.className = "col-12 col-sm-6 col-md-4 col-lg-3";
        col.innerHTML = buildCard(product);
        grid.appendChild(col);
      });

      wirePageButtons();
      await updateBadge();
    } catch (err) {
      console.error("[WL] renderPage:", err);
      showToast("Failed to load wishlist.", "error");
    } finally {
      spinner?.classList.add("d-none");
      content?.classList.remove("d-none");
    }
  }

  /* ─────────────────────────────────────────
     WISHLIST PAGE — Card HTML
  ───────────────────────────────────────── */
  function buildCard(product) {
    const img =
      product.images?.[0] ||
      "https://via.placeholder.com/300x200?text=No+Image";
    const price = parseFloat(product.price || 0).toFixed(2);
    const inStock = (product.stock || 0) > 0;
    const stockBadge = inStock
      ? `<span class="badge bg-success-subtle text-success">In Stock</span>`
      : `<span class="badge bg-danger-subtle text-danger">Out of Stock</span>`;

    return `
      <div class="card wishlist-card h-100 rounded-3 overflow-hidden position-relative"
           data-product-id="${product.id}"
           data-wishlist-item-id="${product.wishlistItemId}">

        <button class="btn btn-sm btn-light position-absolute top-0 end-0 m-2
                        rounded-circle shadow-sm wl-remove-btn"
                data-product-id="${product.id}"
                data-wishlist-item-id="${product.wishlistItemId}"
                title="Remove from wishlist"
                style="z-index:2;width:32px;height:32px;padding:0;">
          <i class="fa-solid fa-xmark text-danger"></i>
        </button>

        <div style="height:200px;overflow:hidden;background:#f8f8f8;">
          <img src="${img}" alt="${product.name}" loading="lazy"
               style="width:100%;height:100%;object-fit:contain;"
               onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'" />
        </div>

        <div class="card-body d-flex flex-column gap-2 p-3">
          <div class="d-flex justify-content-between align-items-start gap-2">
            <h6 class="card-title mb-0 fw-semibold" style="font-size:.9rem;line-height:1.3;">
              ${product.name}
            </h6>
            ${stockBadge}
          </div>
          <p class="text-danger fw-bold mb-0 fs-6">$${price}</p>
          <button class="btn btn-danger btn-sm mt-auto wl-add-cart-btn"
                  data-product-id="${product.id}"
                  data-wishlist-item-id="${product.wishlistItemId}"
                  ${!inStock ? "disabled" : ""}>
            <i class="fa-solid fa-cart-plus me-1"></i>
            ${inStock ? "Add to Cart" : "Out of Stock"}
          </button>
        </div>
      </div>`;
  }

  /* ─────────────────────────────────────────
     WISHLIST PAGE — Wire buttons
  ───────────────────────────────────────── */
  function wirePageButtons() {
    document.querySelectorAll(".wl-remove-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const { wishlistItemId } = btn.dataset;
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span>`;

        const ok = await removeItemById(wishlistItemId);
        if (ok) {
          animateRemove(btn, async () => {
            await updatePageCount();
            checkPageEmpty();
            await updateBadge();
          });
          showToast("Removed from wishlist.", "remove");
        } else {
          showToast("Failed to remove item.", "error");
          btn.disabled = false;
          btn.innerHTML = `<i class="fa-solid fa-xmark text-danger"></i>`;
        }
      });
    });

    document.querySelectorAll(".wl-add-cart-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const { productId, wishlistItemId } = btn.dataset;
        const originalHTML = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Adding…`;

        try {
          const res = await fetch(`${API_URL}/products/${productId}`);
          if (!res.ok) throw new Error("Product not found");
          const product = await res.json();

          if (typeof Cart !== "undefined") {
            Cart.add(product, 1);
          } else {
            console.warn("[WL] Cart utility not loaded");
          }

          const ok = await removeItemById(wishlistItemId);
          if (ok) {
            animateRemove(btn, async () => {
              await updatePageCount();
              checkPageEmpty();
              await updateBadge();
            });
          }
          showToast(`"${product.name}" added to cart!`, "add");
        } catch (err) {
          console.error("[WL] add to cart:", err);
          showToast("Failed to add to cart.", "error");
          btn.disabled = false;
          btn.innerHTML = originalHTML;
        }
      });
    });
  }

  /* ─────────────────────────────────────────
     WISHLIST PAGE — Helpers
  ───────────────────────────────────────── */
  function animateRemove(btn, callback) {
    const card =
      btn.closest("[data-wishlist-item-id]")?.closest("[class*='col-']") ||
      btn.closest("[class*='col-']");
    if (card) {
      card.style.transition = "opacity .35s, transform .35s";
      card.style.opacity = "0";
      card.style.transform = "scale(.95)";
      setTimeout(() => {
        card.remove();
        callback();
      }, 370);
    } else {
      callback();
    }
  }

  async function updatePageCount() {
    const countEl = document.getElementById("wishlistCount");
    if (!countEl) return;
    countEl.textContent = await getCount();
  }

  function checkPageEmpty() {
    const grid = document.getElementById("wishlistGrid");
    const emptyRow = document.getElementById("emptyWishlistRow");
    emptyRow?.classList.toggle(
      "d-none",
      !(!grid || grid.children.length === 0),
    );
  }

  /* ─────────────────────────────────────────
     Public API
  ───────────────────────────────────────── */
  return {
    initButtons, // call after rendering dynamic cards on home page
    renderPage, // call on wishlist page
    updateBadge, // refresh nav badge
    showToast, // reusable toast
    toggle, // for quick-view modal
    applyBtnState, // for quick-view modal
    isInWishlist, // for quick-view modal
  };
})();

/* ═══════════════════════════════════════════
   AUTO-INIT
═══════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", async () => {
  await WL.updateBadge();

  // Wishlist page only
  if (document.getElementById("wishlistGrid")) {
    await WL.renderPage();
  }
  // Home page: WL.initButtons() is called by home.js after cards render
});

document.addEventListener("visibilitychange", async () => {
  if (!document.hidden) {
    await WL.updateBadge();
    if (document.querySelector(".wishlist-toggle-btn")) {
      await WL.initButtons();
    }
  }
});
