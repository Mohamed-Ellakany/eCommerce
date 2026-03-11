function logout() {
  localStorage.removeItem("shop_session");
  window.location.href = "../pages/Auth/login.html";
}

function updateNavBadge() {
  const count = Cart.totalQty();
  const badge = document.getElementById("navCartCount");
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? "flex" : "none";
  }
}


window.onload = function () {
  let userData = localStorage.getItem("shop_session");
  if (userData) {
    userData = JSON.parse(userData);
    const profileLink = document.getElementById("profileLink");
    profileLink.textContent = "Profile";
    profileLink.href = "../Profile.html";
    const signUpLink = document.getElementById("signUp");
    signUpLink.textContent = "";
    const logoutBtn = document.getElementById("logout");
    logoutBtn.classList.remove("d-none");
    console.log(logout);
    logoutBtn.addEventListener("click", logout);
  }
}




function updateCartBadge() {
  const count = Cart.totalQty();
  document.querySelectorAll(".cart-badge, #navCartCount").forEach((el) => {
    el.textContent = count;
    el.style.display = count > 0 ? "flex" : "none";
  });
}


async function updateWishlistBadge() {
  try {
    const count = await DB.getWishlistCount();
    // Desktop badge
    document
      .querySelectorAll(".wishlist-badge, #navWishlistCount")
      .forEach((el) => {
        el.textContent = count;
        el.style.display = count > 0 ? "inline-flex" : "none";
      });
    // Mobile menu badge
    const mob = document.getElementById("navWishlistCountMobile");
    if (mob) {
      mob.textContent = count;
      mob.style.display = count > 0 ? "inline-flex" : "none";
    }
  } catch (err) {
    console.error("updateWishlistBadge error:", err);
  }
}


async function toggleWishlist(btn, productId) {
  if (!btn || !productId) return;

  // Disable button during async op
  btn.disabled = true;
  const icon = btn.querySelector("i, .bi");

  const isWishlisted = btn.classList.contains("wishlisted");

  try {
    if (isWishlisted) {
      // ── Remove ──
      const ok = await DB.removeFromWishlist(productId);
      if (ok) {
        btn.classList.remove("wishlisted");
        if (icon) {
          icon.classList.remove("fa-solid", "bi-heart-fill");
          icon.classList.add("fa-regular", "bi-heart");
        }
        btn.setAttribute("title", "Add to wishlist");
        showWishlistToast("Removed from wishlist.", "remove");
      }
    } else {
      // ── Add ──
      const session = DB.getSession();
      if (!session) {
        // Not logged in → redirect to login
        showWishlistToast("Please log in to save items to your wishlist.", "warn");
        setTimeout(() => (window.location.href = "login.html"), 1500);
        btn.disabled = false;
        return;
      }

      const ok = await DB.addToWishlist(productId);
      if (ok) {
        btn.classList.add("wishlisted");
        if (icon) {
          icon.classList.remove("fa-regular", "bi-heart");
          icon.classList.add("fa-solid", "bi-heart-fill");
        }
        btn.setAttribute("title", "Remove from wishlist");
        showWishlistToast("Added to wishlist!", "add");
      }
    }

    // Refresh nav badge after every toggle
    await updateWishlistBadge();
  } catch (err) {
    console.error("toggleWishlist error:", err);
    showWishlistToast("Something went wrong. Please try again.", "warn");
  } finally {
    btn.disabled = false;
  }
}

async function wireWishlistBtn(btn, productId) {
  if (!btn || !productId) return;

  const inList = await DB.isInWishlist(productId);
  _applyWishlistState(btn, inList);

  const fresh = btn.cloneNode(true);
  btn.replaceWith(fresh);

  fresh.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(fresh, productId);
  });
}


async function initWishlistToggles() {
  const buttons = document.querySelectorAll(".wishlist-toggle-btn");
  await Promise.all(
    [...buttons].map((btn) => {
      const pid = btn.dataset.productId;
      return wireWishlistBtn(btn, pid);
    })
  );
}

function _applyWishlistState(btn, isWishlisted) {
  const icon = btn.querySelector("i, .bi");

  if (isWishlisted) {
    btn.classList.add("wishlisted");
    if (icon) {
      icon.classList.remove("fa-regular", "bi-heart");
      icon.classList.add("fa-solid", "bi-heart-fill");
    }
    btn.setAttribute("title", "Remove from wishlist");
  } else {
    btn.classList.remove("wishlisted");
    if (icon) {
      icon.classList.remove("fa-solid", "bi-heart-fill");
      icon.classList.add("fa-regular", "bi-heart");
    }
    btn.setAttribute("title", "Add to wishlist");
  }
}


function showWishlistToast(message, type = "add") {
  const bgMap = {
    add: "bg-danger",
    remove: "bg-secondary",
    warn: "bg-warning text-dark",
  };
  const bg = bgMap[type] || "bg-secondary";

  let container = document.getElementById("wishlistToastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "wishlistToastContainer";
    container.className = "toast-container position-fixed bottom-0 end-0 p-3";
    container.style.zIndex = "10000";
    document.body.appendChild(container);
  }

  const id = "wl-toast-" + Date.now();
  container.insertAdjacentHTML(
    "beforeend",
    `<div id="${id}" class="toast align-items-center text-white ${bg} border-0" role="alert" aria-live="assertive">
      <div class="d-flex">
        <div class="toast-body fw-semibold">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>`
  );

  const el = document.getElementById(id);
  new bootstrap.Toast(el, { delay: 2500 }).show();
  el.addEventListener("hidden.bs.toast", () => el.remove());
}


window.addEventListener("DOMContentLoaded", async () => {
  const userData = DB.getSession();

  if (userData) {
    const profileLink = document.getElementById("profileLink");
    if (profileLink) {
      profileLink.textContent = "Profile";
<<<<<<< HEAD
      profileLink.href = "Profile.html";
    }

    const signUpLink = document.getElementById("signUp");
    if (signUpLink) signUpLink.textContent = "";

    const logoutBtn = document.getElementById("logout");
    if (logoutBtn) {
=======
      profileLink.href = "../pages/landpage/Profile.html";
      const signUpLink = document.getElementById("signUp");
      signUpLink.textContent = "";
      const logoutBtn = document.getElementById("logout");
>>>>>>> 790b838bf55b81e73f5ed85197fd5233adfa4adc
      logoutBtn.classList.remove("d-none");
      logoutBtn.addEventListener("click", logout);
    }
  }

  // ── 2. Sync cart badge ──
  updateCartBadge();

  // ── 3.  wishlist badge ──
  await updateWishlistBadge();
  await initWishlistToggles();
});
// ══════════════════════════════════════════════════════════════════
//  home.js  —  Homepage dynamic product rendering
//  Depends on: DB (DB.js), Cart (cart.js), script.js
//  (script.js must load AFTER DB.js and cart.js — fix your HTML order)
//
//  Required IDs in your HTML:
//    #flashProductsTrack   (first one)  → Flash Sales slider
//    #bestSellingGrid                   → Best Selling row  ← ADD THIS
//    #flashProductsTrack   (last one)   → Explore Products grid
// ══════════════════════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", async function () {

  // ── Target containers ──────────────────────────────────────────
  const allTracks    = document.querySelectorAll("#flashProductsTrack");
  const flashTrack   = allTracks[0] || null;
  const exploreTrack = allTracks[allTracks.length - 1] || null;
  const bestSellingGrid = document.getElementById("bestSellingGrid"); // ← new

  let allProducts = [];

  // ── 1. Fetch all products ──────────────────────────────────────
  try {
    allProducts = await DB.getProducts();
  } catch (err) {
    console.error("Failed to load products:", err);
    [flashTrack, exploreTrack, bestSellingGrid].forEach(t => {
      if (t) t.innerHTML = `<p class="text-danger w-100 text-center">Failed to load products.</p>`;
    });
    return;
  }

  // ── 2. Render sections ─────────────────────────────────────────
  if (flashTrack)      renderFlashSales(flashTrack,     allProducts.slice(0, 6));
  if (bestSellingGrid) renderBestSelling(bestSellingGrid, allProducts.slice(0, 4));
  if (exploreTrack)    renderExploreProducts(exploreTrack, allProducts);

  // Wire wishlist toggles for all newly added buttons
  if (typeof initWishlistToggles === "function") {
    await initWishlistToggles();
  }

  // ── 3. Search (wires ALL search inputs on the page) ───────────
  document.querySelectorAll("input[type='search']").forEach(input => {
    input.addEventListener("input", function () {
      const q = this.value.toLowerCase().trim();
      const filtered = q
        ? allProducts.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
        : allProducts;

      if (exploreTrack) renderExploreProducts(exploreTrack, filtered);

      // Re-wire wishlist after re-render
      if (typeof initWishlistToggles === "function") initWishlistToggles();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  //  RENDER HELPERS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Flash Sales slider — horizontal scroll cards with discount badge
   */
  function renderFlashSales(container, products) {
    container.innerHTML = "";

    if (!products.length) {
      container.innerHTML = `<p class="text-center text-muted w-100">No products available.</p>`;
      return;
    }

    products.forEach(product => {
      const card = document.createElement("div");
      card.className = "flash-product-card flex-shrink-0";
      card.innerHTML = buildProductCard(product, { showDiscount: true, showAddToCart: true });
      container.appendChild(card);
    });
  }

  /**
   * Best Selling — Bootstrap responsive grid (col-12/sm-6/md-4/lg-3)
   * No discount badge, no Add To Cart button on the card image overlay
   */
  function renderBestSelling(container, products) {
    container.innerHTML = "";

    if (!products.length) {
      container.innerHTML = `<p class="text-center text-muted w-100">No products available.</p>`;
      return;
    }

    products.forEach(product => {
      const col = document.createElement("div");
      col.className = "col-12 col-sm-6 col-md-4 col-lg-3 d-flex justify-content-md-start justify-content-xl-start justify-content-center";

      const card = document.createElement("div");
      card.className = "flash-product-card";
      card.innerHTML = buildProductCard(product, { showDiscount: false, showAddToCart: false });

      col.appendChild(card);
      container.appendChild(col);
    });
  }

  /**
   * Explore Products grid — wrapping flex layout
   */
  function renderExploreProducts(container, products) {
    container.innerHTML = "";

    if (!products.length) {
      container.innerHTML = `<h4 class="text-center alert alert-danger w-100">No Products Found</h4>`;
      return;
    }

    products.forEach(product => {
      const card = document.createElement("div");
      card.className = "flash-product-card";
      card.innerHTML = buildProductCard(product, { showDiscount: true, showAddToCart: true });
      container.appendChild(card);
    });
  }

  /**
   * Shared card HTML builder
   * @param {Object}  product
   * @param {Object}  opts
   * @param {boolean} opts.showDiscount   - show the -X% badge
   * @param {boolean} opts.showAddToCart  - show "Add To Cart" footer button
   */
  function buildProductCard(product, opts = {}) {
    const { showDiscount = true, showAddToCart = true } = opts;

    const img      = product.images?.[0] || "https://via.placeholder.com/300x200?text=No+Image";
    const price    = parseFloat(product.price || 0);
    const oldPrice = (price * 1.3).toFixed(2);   // synthetic "original" price
    const discount = 30;                           // displayed discount %
    const stars    = buildStars(4);
    const inStock  = (product.stock || 0) > 0;

    const discountBadge = showDiscount
      ? `<span class="discount-badge">-${discount}%</span>` : "";

    const addToCartBtn = showAddToCart
      ? `<button
            class="add-to-cart-btn w-100"
            data-id="${product.id}"
            ${!inStock ? "disabled" : ""}
            style="${!inStock ? "opacity:.5;cursor:not-allowed;" : ""}">
            ${inStock ? "Add To Cart" : "Out of Stock"}
         </button>` : "";

    return `
      <div class="product-img-wrap position-relative">
        ${discountBadge}

        <img src="${img}" alt="${product.name}" class="w-100" loading="lazy"
             onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">

        <div class="product-actions position-absolute d-flex flex-column gap-2">

          <!-- Wishlist toggle -->
          <button
            class="wishlist-toggle-btn action-btn border-none d-flex justify-content-center align-items-center"
            aria-label="Add to wishlist"
            title="Add to wishlist"
            data-product-id="${product.id}">
            <i class="fa-regular fa-heart"></i>
          </button>

          <!-- Quick view -->
          <button
            class="action-btn border-none d-flex justify-content-center align-items-center quick-view-btn"
            aria-label="Quick view"
            data-product-id="${product.id}">
            <i class="fa-regular fa-eye"></i>
          </button>

        </div>

        ${addToCartBtn}
      </div>

      <div class="pt-2">
        <p class="product-name mb-1">${product.name}</p>

        <div class="d-flex gap-2 align-items-center mb-1">
          <span class="price-new">$${price.toFixed(2)}</span>
          <span class="price-old">$${oldPrice}</span>
        </div>

        <div class="d-flex align-items-center gap-1">
          <div class="stars" style="color:#FFAD33;">${stars}</div>
          <span class="review-count">(${product.stock || 0})</span>
        </div>
      </div>`;
  }

  /** Generate star icons for a given rating (0–5) */
  function buildStars(rating = 4) {
    let html = "";
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating))       html += `<i class="fas fa-star"></i>`;
      else if (i === Math.ceil(rating) && rating % 1 !== 0)
                                          html += `<i class="fas fa-star-half-alt"></i>`;
      else                               html += `<i class="far fa-star"></i>`;
    }
    return html;
  }


  document.addEventListener("click", async function (e) {
    const btn = e.target.closest(".add-to-cart-btn");
    if (!btn || btn.disabled) return;

    const productId = btn.dataset.id;
    if (!productId) return;

    const product = allProducts.find(p => String(p.id) === String(productId));
    if (!product) return;

    // Use the shared Cart utility (cart.js)
    Cart.add(product, 1);

    // Visual feedback on button
    const original = btn.innerHTML;
    btn.innerHTML = `<i class="fas fa-check me-1"></i> Added!`;
    btn.disabled  = true;
    setTimeout(() => {
      btn.innerHTML = original;
      btn.disabled  = false;
    }, 1200);
  });

  document.addEventListener("click", function (e) {
    const btn = e.target.closest(".quick-view-btn");
    if (!btn) return;

    const productId = btn.dataset.productId;
    const product   = allProducts.find(p => String(p.id) === String(productId));
    if (!product) return;

    openQuickViewModal(product);
  });

  function openQuickViewModal(product) {
    // Remove existing modal if any
    document.getElementById("quickViewModal")?.remove();

    const img = product.images?.[0] || "https://via.placeholder.com/400";

    document.body.insertAdjacentHTML("beforeend", `
      <div class="modal fade" id="quickViewModal" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content">

            <div class="modal-header border-0">
              <h5 class="modal-title fw-bold">${product.name}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>

            <div class="modal-body">
              <div class="row g-3 align-items-center">

                <div class="col-12 col-md-5 text-center bg-light rounded p-3">
                  <img src="${img}" alt="${product.name}"
                       class="img-fluid" style="max-height:260px;object-fit:contain;">
                </div>

                <div class="col-12 col-md-7">
                  <span class="badge bg-secondary mb-2">${product.category}</span>
                  <h4 class="fw-bold">$${parseFloat(product.price).toFixed(2)}</h4>
                  <p class="text-muted small mb-3">
                    ${product.stock > 0
                      ? `<span class="text-success fw-semibold">In Stock</span> — ${product.stock} left`
                      : `<span class="text-danger fw-semibold">Out of Stock</span>`}
                  </p>

                  <ul class="list-unstyled mb-3">
                    ${(product.details || []).map(d => `<li class="mb-1"><i class="fas fa-check text-success me-2"></i>${d}</li>`).join("")}
                  </ul>

                  <div class="d-flex gap-2 flex-wrap">
                    <button
                      class="btn btn-danger px-4 add-to-cart-btn"
                      data-id="${product.id}"
                      ${product.stock < 1 ? "disabled" : ""}>
                      <i class="fas fa-cart-plus me-2"></i>Add to Cart
                    </button>

                    <button
                      class="btn btn-outline-danger wishlist-toggle-btn"
                      data-product-id="${product.id}"
                      title="Add to wishlist">
                      <i class="fa-regular fa-heart me-1"></i>Wishlist
                    </button>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>`);

    const modal = new bootstrap.Modal(document.getElementById("quickViewModal"));
    modal.show();

    // Wire the wishlist button inside the modal
    const wlBtn = document.querySelector("#quickViewModal .wishlist-toggle-btn");
    if (wlBtn && typeof wireWishlistBtn === "function") {
      wireWishlistBtn(wlBtn, product.id);
    }
  }

});