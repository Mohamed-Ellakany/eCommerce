const Cart = (() => {
  const KEY = "user_cart";

  function getAll() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch {
      return [];
    }
  }

  function save(cart) {
    localStorage.setItem(KEY, JSON.stringify(cart));
  }

  function getItem(id) {
    return getAll().find((i) => String(i.id) === String(id)) || null;
  }

  /**
   * Add a product to the cart.
   * @param {Object} product
   * @param {number} qty
   */
  function add(product, qty = 1) {
    const stock = parseInt(product.stock) || 0;
    if (stock <= 0) {
      console.warn(`[Cart] add — "${product.name}" is out of stock. Blocked.`);
      return;
    }

    const cart = getAll();
    const idx = cart.findIndex((item) => item.id === product.id);

    if (idx !== -1) {
      const newQty = cart[idx].qty + qty;
      cart[idx].qty = Math.min(newQty, stock);
    } else {
      cart.push({
        ...product,
        qty: Math.min(qty, stock),
      });
    }

    save(cart);
    _updateBadges();
  }

  function updateQty(id, qty) {
    let cart = getAll();
    if (qty <= 0) {
      cart = cart.filter((i) => i.id !== id);
    } else {
      const idx = cart.findIndex((i) => i.id === id);
      if (idx > -1) cart[idx].qty = qty;
    }
    save(cart);
    _updateBadges();
  }

  function remove(id) {
    save(getAll().filter((i) => i.id !== id));
    _updateBadges();
  }

  function clear() {
    localStorage.removeItem(KEY);
    _updateBadges();
  }

  function totalQty() {
    return getAll().reduce((s, i) => s + i.qty, 0);
  }

  function _updateBadges() {
    const count = totalQty();
    document.querySelectorAll(".cart-badge, #navCartCount").forEach((el) => {
      el.textContent = count;
      el.style.display = count > 0 ? "flex" : "none";
    });
  }

  document.addEventListener("DOMContentLoaded", _updateBadges);

  return { getAll, getItem, add, updateQty, remove, clear, totalQty };
})();

document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("addToCartModal")) {
    document.body.insertAdjacentHTML(
      "beforeend",
      `
        <!-- Add-to-Cart Modal -->
        <div class="modal fade" id="addToCartModal" tabindex="-1" aria-labelledby="addToCartModalLabel" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header border-0 pb-0">
                <h5 class="modal-title fw-bold" id="addToCartModalLabel">Add to Cart</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <div class="d-flex gap-3 align-items-center mb-3">
                  <img id="modalProductImg" src="" alt="" style="width:80px;height:80px;object-fit:cover;border-radius:8px;border:1px solid #eee;">
                  <div>
                    <p class="fw-semibold mb-0" id="modalProductName"></p>
                    <p class="text-danger fw-bold mb-0" id="modalProductPrice"></p>
                    <small id="modalProductStock"></small>
                  </div>
                </div>
                <label class="form-label fw-semibold">Quantity</label>
                <div class="d-flex align-items-center gap-3">
                  <div class="qty-control" style="border:1px solid #dee2e6;border-radius:6px;overflow:hidden;display:inline-flex;align-items:center;">
                    <button type="button" id="modalQtyDec"
                      style="width:36px;height:36px;background:#f8f9fa;border:none;font-size:1.1rem;cursor:pointer;">−</button>
                    <input type="number" id="modalQtyInput" value="1" min="1"
                      style="width:52px;height:36px;border:none;border-left:1px solid #dee2e6;border-right:1px solid #dee2e6;text-align:center;font-size:.95rem;font-weight:600;outline:none;">
                    <button type="button" id="modalQtyInc"
                      style="width:36px;height:36px;background:#f8f9fa;border:none;font-size:1.1rem;cursor:pointer;">+</button>
                  </div>
                  <span class="text-muted" id="modalMaxNote"></span>
                </div>
                <div id="modalOutOfStockMsg" class="alert alert-danger d-none mt-3 mb-0 py-2 px-3" role="alert">
                  <i class="fas fa-ban me-2"></i>This product is <strong>out of stock</strong> and cannot be added to the cart.
                </div>
              </div>
              <div class="modal-footer border-0 pt-0">
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-danger px-4" id="modalConfirmBtn">
                  <i class="fas fa-cart-plus me-2"></i>Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Success toast -->
        <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index:9999;">
          <div id="cartSuccessToast" class="toast align-items-center text-white bg-success border-0" role="alert">
            <div class="d-flex">
              <div class="toast-body" id="cartToastMsg">Added to cart!</div>
              <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
          </div>
        </div>
        `,
    );
  }

  document.querySelectorAll(".fa-cart-shopping").forEach((icon) => {
    const wrapper = icon.closest("a, .cart-nav-wrapper");
    if (!wrapper) {
      icon.style.cursor = "pointer";
      icon.addEventListener("click", () => {
        location.href = "../../pages/products/cart.html";
      });
    }
    const parent = icon.parentElement;
    if (!parent.querySelector(".cart-badge")) {
      parent.style.position = "relative";
      const badge = document.createElement("span");
      badge.className = "cart-badge";
      badge.id = "navCartCount";
      badge.style.cssText = `
        position:absolute;top:-8px;right:-8px;
        background:#db4444;color:#fff;font-size:10px;font-weight:700;
        width:18px;height:18px;border-radius:50%;
        display:none;align-items:center;justify-content:center;line-height:1;
      `;
      badge.textContent = "0";
      parent.appendChild(badge);
    }
  });

  let _currentProduct = null;

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".add-to-cart-btn, [data-add-to-cart]");
    console.log("prodcut add btn click", btn);
    if (!btn) return;

    const card = btn.parentElement?.parentElement;
    let product = null;

    if (card) {
      const nameEl = card.querySelector(".product-name")?.textContent;
      const priceEl = card.querySelector(
        '.price-new, .price, [class*="price"]',
      );
      const imgEl = card.querySelector("img");

      product = {
        id: btn.dataset.id || "product_" + Date.now(),
        name: nameEl ? nameEl.trim() : "Product",
        price: priceEl
          ? parseFloat(priceEl.textContent.replace(/[^0-9.]/g, "")) || 0
          : 0,
        stock: parseInt(btn.dataset.stock) || 0,
        images: imgEl ? [imgEl.src] : [],
        category: btn.dataset.category || "",
        sellerId: btn.dataset.sellerid || "",
      };
    }

    if (!product) return;

    _currentProduct = product;
    openModal(product);
  });

  function openModal(product) {
    const stock = parseInt(product.stock) || 0;
    const outOfStock = stock <= 0;

    document.getElementById("modalProductName").textContent = product.name;
    document.getElementById("modalProductPrice").textContent =
      `$${parseFloat(product.price).toFixed(2)}`;
    document.getElementById("modalProductImg").src =
      (product.images && product.images[0]) || "";
    document.getElementById("modalProductImg").alt = product.name;

    const stockEl = document.getElementById("modalProductStock");
    stockEl.textContent = outOfStock ? "Out of stock" : `In stock: ${stock}`;
    stockEl.className = outOfStock ? "text-danger fw-semibold" : "text-success";

    const qtyInput = document.getElementById("modalQtyInput");
    const decBtn = document.getElementById("modalQtyDec");
    const incBtn = document.getElementById("modalQtyInc");
    const confirmBtn = document.getElementById("modalConfirmBtn");
    const outMsg = document.getElementById("modalOutOfStockMsg");

    if (outOfStock) {
      qtyInput.value = 0;
      qtyInput.disabled = true;
      decBtn.disabled = true;
      incBtn.disabled = true;
      confirmBtn.disabled = true;
      confirmBtn.classList.add("disabled");
      outMsg.classList.remove("d-none");
      document.getElementById("modalMaxNote").textContent = "";
    } else {
      qtyInput.value = 1;
      qtyInput.max = stock;
      qtyInput.disabled = false;
      decBtn.disabled = false;
      incBtn.disabled = false;
      confirmBtn.disabled = false;
      confirmBtn.classList.remove("disabled");
      outMsg.classList.add("d-none");
      document.getElementById("modalMaxNote").textContent = `Max: ${stock}`;
    }

    new bootstrap.Modal(document.getElementById("addToCartModal")).show();
  }

  document.getElementById("modalQtyDec").addEventListener("click", () => {
    const inp = document.getElementById("modalQtyInput");
    const stock = parseInt(inp.max) || 0;
    if (stock <= 0) return;
    if (parseInt(inp.value) > 1) inp.value = parseInt(inp.value) - 1;
  });

  document.getElementById("modalQtyInc").addEventListener("click", () => {
    const inp = document.getElementById("modalQtyInput");
    const stock = parseInt(inp.max) || 0;
    if (stock <= 0) return;
    if (parseInt(inp.value) < stock) inp.value = parseInt(inp.value) + 1;
  });

  document.getElementById("modalConfirmBtn").addEventListener("click", () => {
    if (!_currentProduct) return;

    const stock = parseInt(_currentProduct.stock) || 0;
    if (stock <= 0) {
      console.warn(
        "[Cart] modalConfirmBtn — blocked, product is out of stock.",
      );
      return;
    }

    const qty = parseInt(document.getElementById("modalQtyInput").value) || 1;
    Cart.add(_currentProduct, qty);

    bootstrap.Modal.getInstance(
      document.getElementById("addToCartModal"),
    ).hide();

    const toastEl = document.getElementById("cartSuccessToast");
    document.getElementById("cartToastMsg").textContent =
      `"${_currentProduct.name}" added to cart!`;
    bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 2500 }).show();
    _currentProduct = null;
  });
});
