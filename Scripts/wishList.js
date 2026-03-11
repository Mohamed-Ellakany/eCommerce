/**
 * wishList.js  –  Wishlist page controller
 * Depends on: DB (db.js), Cart (cart.js), Bootstrap 5
 */

document.addEventListener("DOMContentLoaded", async () => {
  await initWishlistPage();
});

/* ══════════════════════════════════════════════
   Bootstrap
══════════════════════════════════════════════ */
async function initWishlistPage() {
  showSpinner(true);

  try {
    await renderWishlist();
  } catch (err) {
    console.error("Wishlist init error:", err);
    showToast("Failed to load wishlist. Please try again.", "danger");
  } finally {
    showSpinner(false);
  }

  // Clear wishlist button
  document
    .getElementById("clearWishlistBtn")
    ?.addEventListener("click", handleClearWishlist);
}

/* ══════════════════════════════════════════════
   Render
══════════════════════════════════════════════ */
async function renderWishlist() {
  const grid = document.getElementById("wishlistGrid");
  const emptyRow = document.getElementById("emptyWishlistRow");
  const countEl = document.getElementById("wishlistCount");

  if (!grid) return;

  grid.innerHTML = "";

  // Fetch products from wishlist
  const products = await DB.getWishlistProducts();

  // Update count label
  if (countEl) countEl.textContent = products.length;

  if (!products || products.length === 0) {
    emptyRow?.classList.remove("d-none");
    document.getElementById("clearWishlistBtn")?.classList.add("d-none");
    return;
  }

  emptyRow?.classList.add("d-none");
  document.getElementById("clearWishlistBtn")?.classList.remove("d-none");

  products.forEach((product) => {
    const col = document.createElement("div");
    col.className = "col-12 col-sm-6 col-md-4 col-lg-3";
    col.innerHTML = buildWishlistCard(product);
    grid.appendChild(col);
  });

  // Wire up card buttons after rendering
  wireCardButtons();
}

/* ══════════════════════════════════════════════
   Card HTML builder
══════════════════════════════════════════════ */
function buildWishlistCard(product) {
  const img =
    product.images?.[0] || "https://via.placeholder.com/300x200?text=No+Image";
  const price = parseFloat(product.price || 0).toFixed(2);
  const inStock = (product.stock || 0) > 0;
  const stockBadge = inStock
    ? `<span class="badge bg-success-subtle text-success">In Stock</span>`
    : `<span class="badge bg-danger-subtle text-danger">Out of Stock</span>`;

  return `
    <div class="card wishlist-card h-100 rounded-3 overflow-hidden"
         data-product-id="${product.id}"
         data-wishlist-item-id="${product.wishlistItemId || ""}">

      <!-- Remove from wishlist -->
      <button
        class="btn btn-sm btn-light position-absolute top-0 end-0 m-2 rounded-circle shadow-sm remove-wishlist-btn"
        title="Remove from wishlist"
        data-product-id="${product.id}"
        data-wishlist-item-id="${product.wishlistItemId || ""}"
        style="z-index:2;width:32px;height:32px;padding:0;">
        <i class="fa-solid fa-xmark text-danger"></i>
      </button>

      <!-- Image -->
      <div class="card-img-top-wrapper">
        <img src="${img}" alt="${product.name}" loading="lazy" />
      </div>

      <!-- Body -->
      <div class="card-body d-flex flex-column gap-2 p-3">
        <div class="d-flex justify-content-between align-items-start gap-2">
          <h6 class="card-title mb-0 fw-semibold product-name"
              style="font-size:.9rem;line-height:1.3;">
            ${product.name}
          </h6>
          ${stockBadge}
        </div>

        <p class="text-danger fw-bold mb-0 fs-6">$${price}</p>

        <!-- Move to cart -->
        <button
          class="btn btn-danger btn-sm mt-auto move-to-cart-btn"
          data-product-id="${product.id}"
          data-wishlist-item-id="${product.wishlistItemId || ""}"
          ${!inStock ? "disabled" : ""}>
          <i class="fa-solid fa-cart-plus me-1"></i>
          ${inStock ? "Add to Cart" : "Out of Stock"}
        </button>
      </div>
    </div>`;
}

/* ══════════════════════════════════════════════
   Button wiring
══════════════════════════════════════════════ */
function wireCardButtons() {
  // ── Remove buttons ──
  document.querySelectorAll(".remove-wishlist-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const productId = btn.dataset.productId;
      const wishlistItemId = btn.dataset.wishlistItemId;

      btn.disabled = true;
      btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span>`;

      const ok = wishlistItemId
        ? await DB.removeWishlistItem(wishlistItemId)
        : await DB.removeFromWishlist(productId);

      if (ok) {
        // Animate card out
        const card = btn.closest(".col-12, [class*='col-']");
        card?.classList.add("animate__animated", "animate__fadeOut");
        setTimeout(async () => {
          card?.remove();
          await updateCountLabel();
          checkEmpty();
        }, 400);
        showToast("Removed from wishlist.", "success");
      } else {
        showToast("Failed to remove item.", "danger");
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-xmark text-danger"></i>`;
      }
    });
  });

  // ── Move-to-cart buttons ──
  document.querySelectorAll(".move-to-cart-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const productId = btn.dataset.productId;
      const wishlistItemId = btn.dataset.wishlistItemId;

      btn.disabled = true;
      const originalHTML = btn.innerHTML;
      btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Adding…`;

      try {
        // Get full product object to pass to Cart.add()
        const products = await DB.getProducts();
        const product = products.find(
          (p) => String(p.id) === String(productId),
        );

        if (!product) throw new Error("Product not found");

        // Add to cart via Cart utility
        Cart.add(product, 1);

        // Remove from wishlist
        const removed = wishlistItemId
          ? await DB.removeWishlistItem(wishlistItemId)
          : await DB.removeFromWishlist(productId);

        if (removed) {
          const card = btn.closest(".col-12, [class*='col-']");
          card?.classList.add("animate__animated", "animate__fadeOut");
          setTimeout(async () => {
            card?.remove();
            await updateCountLabel();
            checkEmpty();
          }, 400);
        }

        showToast(`"${product.name}" added to cart!`, "success");
      } catch (err) {
        console.error("Move to cart error:", err);
        showToast("Failed to add to cart.", "danger");
        btn.disabled = false;
        btn.innerHTML = originalHTML;
      }
    });
  });
}

/* ══════════════════════════════════════════════
   Clear wishlist
══════════════════════════════════════════════ */
async function handleClearWishlist() {
  if (
    !confirm(
      "Are you sure you want to clear your entire wishlist? This cannot be undone.",
    )
  )
    return;

  const btn = document.getElementById("clearWishlistBtn");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Clearing…`;
  }

  const ok = await DB.clearWishlist();

  if (ok) {
    document.getElementById("wishlistGrid").innerHTML = "";
    checkEmpty();
    showToast("Wishlist cleared.", "success");
  } else {
    showToast("Failed to clear wishlist.", "danger");
  }

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-regular fa-trash-can me-1"></i>Clear wishlist`;
  }
}

/* ══════════════════════════════════════════════
   Helpers
══════════════════════════════════════════════ */
function checkEmpty() {
  const grid = document.getElementById("wishlistGrid");
  const emptyRow = document.getElementById("emptyWishlistRow");
  const clearBtn = document.getElementById("clearWishlistBtn");

  const isEmpty = !grid || grid.children.length === 0;
  emptyRow?.classList.toggle("d-none", !isEmpty);
  clearBtn?.classList.toggle("d-none", isEmpty);
}

async function updateCountLabel() {
  const countEl = document.getElementById("wishlistCount");
  if (!countEl) return;
  const count = await DB.getWishlistCount();
  countEl.textContent = count;
}

function showSpinner(visible) {
  const spinner = document.getElementById("loadingSpinner");
  const content = document.getElementById("wishlistContent");
  if (spinner) spinner.classList.toggle("d-none", !visible);
  if (content) content.classList.toggle("d-none", visible);
}

/* ── Toast helper (injects toast container if absent) ── */
function showToast(message, type = "success") {
  // Reuse cart success toast if available, else create our own
  let container = document.querySelector(".wishlist-toast-container");

  if (!container) {
    container = document.createElement("div");
    container.className =
      "wishlist-toast-container toast-container position-fixed bottom-0 end-0 p-3";
    container.style.zIndex = "9999";
    document.body.appendChild(container);
  }

  const id = "wl-toast-" + Date.now();
  const bgClass =
    type === "success"
      ? "bg-success"
      : type === "danger"
        ? "bg-danger"
        : "bg-secondary";

  container.insertAdjacentHTML(
    "beforeend",
    `<div id="${id}" class="toast align-items-center text-white ${bgClass} border-0" role="alert">
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>`,
  );

  const toastEl = document.getElementById(id);
  const toast = new bootstrap.Toast(toastEl, { delay: 2800 });
  toast.show();

  // Clean up DOM after hide
  toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
}
async function updateWishlistBadge() {
  try {
    const count = await DB.getWishlistCount();

    // Desktop badge
    const badge = document.getElementById("navWishlistCount");
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? "inline-block" : "none";
    }

    // Mobile menu badge
    const mobileBadge = document.getElementById("navWishlistCountMobile");
    if (mobileBadge) {
      mobileBadge.textContent = count;
      mobileBadge.style.display = count > 0 ? "inline-block" : "none";
    }
  } catch (err) {
    console.error("Failed to update wishlist badge:", err);
  }
}

// Run on every page load (DB must be loaded before this script)
document.addEventListener("DOMContentLoaded", updateWishlistBadge);