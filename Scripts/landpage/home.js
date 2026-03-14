const toggleBtn = document.getElementById("sidebarToggle");
const sidebarMenu = document.getElementById("sidebarMenu");
const closeBtn = document.getElementById("sidebarClose");

const overlay = document.createElement("div");
overlay.className = "sidebar-overlay";
document.body.appendChild(overlay);

toggleBtn?.addEventListener("click", () => {
  const isOpen = sidebarMenu.classList.toggle("open");
  toggleBtn.setAttribute("aria-expanded", isOpen);
  overlay.classList.toggle("active");
  document.body.style.overflow = isOpen ? "hidden" : "";
});

closeBtn?.addEventListener("click", () => {
  sidebarMenu.classList.remove("open");
  overlay.classList.remove("active");
  toggleBtn?.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
});

overlay.addEventListener("click", () => {
  sidebarMenu.classList.remove("open");
  overlay.classList.remove("active");
  toggleBtn?.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
});

document.querySelectorAll("aside ul li").forEach((li) => {
  li.addEventListener("click", () => {
    document
      .querySelectorAll("aside ul li")
      .forEach((el) => el.classList.remove("active"));
    li.classList.add("active");
  });
});

window.addEventListener("resize", () => {
  if (window.innerWidth >= 768) {
    sidebarMenu.classList.remove("open");
    overlay.classList.remove("active");
    document.body.style.overflow = "";
  }
});

const targetDate = new Date();
targetDate.setDate(targetDate.getDate() + 3);

function updateCountdown() {
  const now = new Date();
  const diff = targetDate - now;
  if (diff <= 0) return;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  document.getElementById("flash-days").textContent = String(days).padStart(
    2,
    "0",
  );
  document.getElementById("flash-hours").textContent = String(hours).padStart(
    2,
    "0",
  );
  document.getElementById("flash-minutes").textContent = String(
    minutes,
  ).padStart(2, "0");
  document.getElementById("flash-seconds").textContent = String(
    seconds,
  ).padStart(2, "0");
}
updateCountdown();
setInterval(updateCountdown, 1000);

function initializeSliders() {
  const sections = document.querySelectorAll(".flash-sales");

  sections.forEach((section) => {
    const track = section.querySelector(".flash-products");
    const prevBtn = section.querySelector(".flash-nav-btn:first-child");
    const nextBtn = section.querySelector(".flash-nav-btn:last-child");

    if (!track || !prevBtn || !nextBtn) return;

    const cardWidth = 270 + 16;
    let currentIndex = 0;

    function getVisibleCount() {
      return Math.floor(track.parentElement.offsetWidth / cardWidth);
    }

    function slideTo(index) {
      const cards = track.querySelectorAll(".flash-product-card");
      const maxIndex = Math.max(0, cards.length - getVisibleCount());
      currentIndex = Math.max(0, Math.min(index, maxIndex));
      track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
    }

    const newPrevBtn = prevBtn.cloneNode(true);
    const newNextBtn = nextBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);

    newNextBtn.addEventListener("click", () => slideTo(currentIndex + 1));
    newPrevBtn.addEventListener("click", () => slideTo(currentIndex - 1));
    window.addEventListener("resize", () => slideTo(currentIndex));
    slideTo(0);
  });
}

document.addEventListener("DOMContentLoaded", async function () {
  const flashTrack = document.getElementById("flashProductsTrack");
  const exploreTrack = document.getElementById("exploreProductsTrack");
  const bestSellingGrid = document.getElementById("bestSellingGrid");

  let allProducts = [];

  showLoadingStates();

  try {
    allProducts = await DB.getProducts();
  } catch (err) {
    console.error("Failed to load products:", err);
    showErrorMessage("Failed to load products. Please refresh the page.");
    return;
  }

  if (flashTrack) renderFlashSales(flashTrack, allProducts.slice(0, 6));
  if (bestSellingGrid)
    renderBestSelling(bestSellingGrid, allProducts.slice(0, 4));
  if (exploreTrack) renderExploreProducts(exploreTrack, allProducts);

  await WL.initButtons();

  initializeSliders();
  initializeSearch(allProducts, exploreTrack);

  function renderFlashSales(container, products) {
    container.innerHTML = "";
    if (!products.length) {
      container.innerHTML = `<p class="text-center text-muted w-100">No products available.</p>`;
      return;
    }
    products.forEach((product) => {
      container.appendChild(
        createProductCard(product, { showDiscount: true, showAddToCart: true }),
      );
    });
  }

  function renderBestSelling(container, products) {
    container.innerHTML = "";
    if (!products.length) {
      container.innerHTML = `<p class="text-center text-muted w-100">No products available.</p>`;
      return;
    }
    products.forEach((product) => {
      const col = document.createElement("div");
      col.className =
        "col-12 col-sm-6 col-md-4 col-lg-3 d-flex justify-content-center";
      col.appendChild(
        createProductCard(product, {
          showDiscount: false,
          showAddToCart: false,
        }),
      );
      container.appendChild(col);
    });
  }

  function renderExploreProducts(container, products) {
    container.innerHTML = "";
    if (!products.length) {
      container.innerHTML = `<h4 class="text-center alert alert-danger w-100">No Products Found</h4>`;
      return;
    }
    products.forEach((product) => {
      container.appendChild(
        createProductCard(product, { showDiscount: true, showAddToCart: true }),
      );
    });
  }

  function createProductCard(product, opts = {}) {
    const { showDiscount = true, showAddToCart = true } = opts;
    const card = document.createElement("div");
    card.className = "flash-product-card";
    card.dataset.productId = product.id;

    const img =
      product.images?.[0] ||
      "https://via.placeholder.com/300x200?text=No+Image";
    const price = parseFloat(product.price || 0);
    const oldPrice = (price * 1.3).toFixed(2);
    const stars = buildStars(4);
    const inStock = (product.stock || 0) > 0;

    const discountBadge = showDiscount
      ? `<span class="discount-badge">-30%</span>`
      : "";
    const addToCartBtn = showAddToCart
      ? `<button class="add-to-cart-btn w-100" data-id="${product.id}" 
                data-stock="${product.stock}"
                data-name="${product.name}"
                data-price="${product.price}"
                data-image="${product.images[0]}"
                data-category="${product.category}"
                data-sellerId="${product.sellerId}" ${!inStock ? "disabled" : ""}
               style="${!inStock ? "opacity:.5;cursor:not-allowed;" : ""}">
               ${inStock ? "Add To Cart" : "Out of Stock"}
             </button>`
      : "";

    const detailsUrl = `${getRootPath()}pages/products/productDetails.html?id=${product.id}`;

    card.innerHTML = `
      <div class="product-img-wrap position-relative">
        ${discountBadge}

        <a href="${detailsUrl}">
          <img src="${img}" alt="${product.name}" class="w-100" loading="lazy"
               onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
        </a>

        <div class="product-actions position-absolute d-flex flex-column gap-2">
          <button class="wishlist-toggle-btn action-btn border-none d-flex justify-content-center align-items-center"
                  aria-label="Add to wishlist" title="Add to wishlist"
                  data-product-id="${product.id}">
            <i class="fa-regular fa-heart"></i>
          </button>
          <button class="action-btn border-none d-flex justify-content-center align-items-center quick-view-btn"
                  aria-label="Quick view" title="Quick view"
                  data-product-id="${product.id}">
            <i class="fa-regular fa-eye"></i>
          </button>
        </div>
        ${addToCartBtn}
      </div>

      <div class="pt-2">
        <a href="${detailsUrl}" class="text-decoration-none text-black">
          <p class="product-name mb-1">${product.name}</p>
        </a>
        <div class="d-flex gap-2 align-items-center mb-1">
          <span class="price-new">$${price.toFixed(2)}</span>
          ${showDiscount ? `<span class="price-old">$${oldPrice}</span>` : ""}
        </div>
        <div class="d-flex align-items-center gap-1">
          <div class="stars" style="color:#FFAD33;">${stars}</div>
          <span class="review-count">(${product.stock || 0})</span>
        </div>
      </div>`;

    return card;
  }

  function buildStars(rating = 4) {
    let html = "";
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) html += `<i class="fas fa-star"></i>`;
      else if (i === Math.ceil(rating) && rating % 1 !== 0)
        html += `<i class="fas fa-star-half-alt"></i>`;
      else html += `<i class="far fa-star"></i>`;
    }
    return html;
  }

  document.addEventListener("click", function (e) {
    const btn = e.target.closest(".quick-view-btn");
    if (!btn) return;
    const product = allProducts.find(
      (p) => String(p.id) === String(btn.dataset.productId),
    );
    if (product) openQuickViewModal(product);
  });

  async function openQuickViewModal(product) {
    document.getElementById("quickViewModal")?.remove();

    const images = product.images?.length
      ? product.images
      : ["https://via.placeholder.com/500?text=No+Image"];
    const inStock = (product.stock || 0) > 0;
    const price = parseFloat(product.price || 0);
    const oldPrice = (price * 1.3).toFixed(2);
    const stars = buildStars(4);

    const thumbs =
      images.length > 1
        ? images
            .map(
              (src, i) => `
          <img src="${src}" 
               class="qv-thumb rounded border ${i === 0 ? "border-danger" : "border-transparent"}"
               data-index="${i}"
               style="width:56px;height:56px;object-fit:contain;cursor:pointer;background:#f8f8f8;padding:4px;"
               onerror="this.src='https://via.placeholder.com/56?text=?'" />`,
            )
            .join("")
        : "";

    document.body.insertAdjacentHTML(
      "beforeend",
      `<div class="modal fade" id="quickViewModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-centered">
          <div class="modal-content border-0 shadow-lg overflow-hidden" style="border-radius:16px;">

            <!-- Close button floating -->
            <button type="button" class="btn-close position-absolute top-0 end-0 m-3"
                    data-bs-dismiss="modal" aria-label="Close"
                    style="z-index:10;background-color:rgba(0,0,0,.08);border-radius:50%;padding:10px;"></button>

            <div class="modal-body p-0">
              <div class="row g-0" style="min-height:480px;">

                <!-- LEFT — Image panel -->
                <div class="col-12 col-md-5 d-flex flex-column align-items-center justify-content-center gap-3 p-4"
                     style="background:#f6f6f6;">
                  <div class="w-100 d-flex align-items-center justify-content-center"
                       style="height:300px;">
                    <img id="qvMainImg"
                         src="${images[0]}"
                         alt="${product.name}"
                         class="img-fluid"
                         style="max-height:300px;max-width:100%;object-fit:contain;transition:opacity .2s;"
                         onerror="this.src='https://via.placeholder.com/500?text=No+Image'" />
                  </div>
                  ${thumbs ? `<div class="d-flex gap-2 flex-wrap justify-content-center">${thumbs}</div>` : ""}
                </div>

                <!-- RIGHT — Details panel -->
                <div class="col-12 col-md-7 d-flex flex-column justify-content-center p-4 p-md-5 gap-3">

                  <!-- Category + Name -->
                  <div>
                    <span class="badge rounded-pill mb-2"
                          style="background:#fff0f0;color:#DB4444;font-size:.75rem;">
                      ${product.category || "Uncategorized"}
                    </span>
                    <h3 class="fw-bold mb-0" style="line-height:1.3;">${product.name}</h3>
                  </div>

                  <!-- Stars + stock -->
                  <div class="d-flex align-items-center gap-3 flex-wrap">
                    <div class="d-flex gap-1" style="color:#FFAD33;">${stars}</div>
                    <span class="text-muted small">(${product.stock || 0} reviews)</span>
                    <span class="vr"></span>
                    ${
                      inStock
                        ? `<span class="text-success fw-semibold small"><i class="fas fa-circle-check me-1"></i>In Stock (${product.stock} left)</span>`
                        : `<span class="text-danger fw-semibold small"><i class="fas fa-circle-xmark me-1"></i>Out of Stock</span>`
                    }
                  </div>

                  <!-- Price -->
                  <div class="d-flex align-items-baseline gap-3">
                    <span class="fw-bold fs-3" style="color:#DB4444;">$${price.toFixed(2)}</span>
                    <span class="text-decoration-line-through text-muted fs-6">$${oldPrice}</span>
                    <span class="badge rounded-pill" style="background:#fff0f0;color:#DB4444;">-30%</span>
                  </div>

                  <!-- Description -->
                  ${
                    product.description
                      ? `<p class="text-muted small mb-0" style="line-height:1.7;max-height:80px;overflow:hidden;">${product.description}</p>`
                      : ""
                  }

                  <hr class="my-1" />

                  <div class="d-flex align-items-center gap-3 flex-wrap">
                    

                    <!-- Add to cart -->
                    <button class="btn btn-danger flex-grow-1 py-2 add-to-cart-btn fw-semibold"
                            data-id="${product.id}" ${!inStock ? "disabled" : ""}>
                      <i class="fas fa-cart-plus me-2"></i>Add to Cart
                    </button>

                    <!-- Wishlist -->
                    <button class="btn btn-outline-danger px-3 py-2 wishlist-toggle-btn"
                            data-product-id="${product.id}"
                            title="Add to wishlist"
                            style="border-radius:8px;">
                      <i class="fa-regular fa-heart fs-5"></i>
                    </button>
                  </div>

                  <!-- View Full Details link -->
                  <a href="${getRootPath()}pages/products/productDetails.html?id=${product.id}"
                     class="d-flex align-items-center gap-2 text-decoration-none mt-1"
                     style="color:#DB4444;font-size:0.9rem;font-weight:600;">
                    View Full Details
                    <i class="fas fa-arrow-right" style="font-size:0.8rem;"></i>
                  </a>

                </div>
              </div>
            </div>

          </div>
        </div>
      </div>`,
    );

    const modal = new bootstrap.Modal(
      document.getElementById("quickViewModal"),
    );
    modal.show();

    document.querySelectorAll("#quickViewModal .qv-thumb").forEach((thumb) => {
      thumb.addEventListener("click", () => {
        const mainImg = document.getElementById("qvMainImg");
        mainImg.style.opacity = "0";
        setTimeout(() => {
          mainImg.src = thumb.src;
          mainImg.style.opacity = "1";
        }, 150);
        document.querySelectorAll("#quickViewModal .qv-thumb").forEach((t) => {
          t.classList.remove("border-danger");
          t.classList.add("border-transparent");
        });
        thumb.classList.add("border-danger");
        thumb.classList.remove("border-transparent");
      });
    });

    let qty = 1;
    document.querySelectorAll("#quickViewModal .qv-qty-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.dataset.action === "plus")
          qty = Math.min(qty + 1, product.stock || 99);
        if (btn.dataset.action === "minus") qty = Math.max(qty - 1, 1);
        document.querySelector("#quickViewModal .qv-qty-val").textContent = qty;
      });
    });

    const cartBtn = document.querySelector("#quickViewModal .add-to-cart-btn");
    if (cartBtn) {
      cartBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        Cart.add(product, qty);
        const orig = cartBtn.innerHTML;
        cartBtn.innerHTML = `<i class="fas fa-check me-2"></i>Added!`;
        cartBtn.disabled = true;
        setTimeout(() => {
          cartBtn.innerHTML = orig;
          cartBtn.disabled = false;
        }, 1200);
        showToast(`"${product.name}" added to cart!`, "success");
      });
    }

    const wlBtn = document.querySelector(
      "#quickViewModal .wishlist-toggle-btn",
    );
    if (wlBtn) {
      const inWishlist = await WL.isInWishlist(product.id);
      WL.applyBtnState(wlBtn, inWishlist);

      wlBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await WL.toggle(wlBtn, product.id);

        document
          .querySelectorAll(
            `.wishlist-toggle-btn[data-product-id="${product.id}"]:not(#quickViewModal *)`,
          )
          .forEach((pageBtn) => {
            WL.applyBtnState(pageBtn, wlBtn.classList.contains("wishlisted"));
          });
      });
    }
  }

  function initializeSearch(products, exploreTrack) {
    document.querySelectorAll("input[type='search']").forEach((input) => {
      input.addEventListener(
        "input",
        debounce(async function () {
          const q = this.value.toLowerCase().trim();
          const filtered = q
            ? products.filter(
                (p) =>
                  p.name.toLowerCase().includes(q) ||
                  (p.category && p.category.toLowerCase().includes(q)) ||
                  (p.description && p.description.toLowerCase().includes(q)),
              )
            : products;

          if (exploreTrack) {
            renderExploreProducts(exploreTrack, filtered);

            await WL.initButtons();

            const noResults = document.getElementById("noSearchResults");
            if (filtered.length === 0) {
              if (!noResults) {
                const msg = document.createElement("div");
                msg.id = "noSearchResults";
                msg.className = "text-center py-4 w-100";
                msg.innerHTML = `
                  <i class="fas fa-search fs-1 text-muted mb-2"></i>
                  <p class="text-muted">No products found matching "${q}"</p>`;
                exploreTrack.parentElement.appendChild(msg);
              }
            } else {
              noResults?.remove();
            }
          }
        }, 300),
      );
    });
  }

  function showLoadingStates() {
    [flashTrack, exploreTrack, bestSellingGrid].filter(Boolean).forEach((c) => {
      c.innerHTML = `
        <div class="text-center py-5 w-100">
          <div class="spinner-border text-danger" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2 text-muted">Loading products...</p>
        </div>`;
    });
  }

  function showErrorMessage(message) {
    [flashTrack, exploreTrack, bestSellingGrid].filter(Boolean).forEach((c) => {
      c.innerHTML = `
        <div class="text-center py-5 w-100">
          <i class="fas fa-exclamation-circle text-danger fs-1 mb-3"></i>
          <p class="text-danger">${message}</p>
          <button class="btn btn-outline-danger mt-2" onclick="location.reload()">
            <i class="fas fa-redo me-2"></i>Refresh Page
          </button>
        </div>`;
    });
  }

  function showToast(message, type = "success") {
    const typeMap = { success: "add", danger: "error" };
    WL.showToast(message, typeMap[type] || type);
  }

  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }
});

document.addEventListener("DOMContentLoaded", initializeSliders);
