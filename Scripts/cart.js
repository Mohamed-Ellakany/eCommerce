/**
 * cart.js  –  shared cart utility
 * Storage key: user_cart  (localStorage)
 *
 * Product schema expected:
 * { id, name, category, price, stock, images: [...], sellerId }
 */

const Cart = (() => {
    const KEY = 'user_cart';

    /** @returns {Array} current cart items */
    function getAll() {
        try { return JSON.parse(localStorage.getItem(KEY)) || []; }
        catch { return []; }
    }

    function save(cart) {
        localStorage.setItem(KEY, JSON.stringify(cart));
    }

    /** Find one item by product id */
    function getItem(id) {
        return getAll().find(i => i.id === id) || null;
    }

    /**
     * Add a product to the cart.
     * @param {Object} product  – full product object
     * @param {number} qty      – quantity to add (default 1)
     */
    function add(product, qty = 1) {
        const cart = getAll();
        const idx  = cart.findIndex(i => i.id === product.id);
        if (idx > -1) {
            const newQty = cart[idx].qty + qty;
            cart[idx].qty = Math.min(newQty, product.stock);
        } else {
            cart.push({ ...product, qty: Math.min(qty, product.stock) });
        }
        save(cart);
        _updateBadges();
    }

    /** Set an item's quantity (removes it if qty <= 0) */
    function updateQty(id, qty) {
        let cart = getAll();
        if (qty <= 0) {
            cart = cart.filter(i => i.id !== id);
        } else {
            const idx = cart.findIndex(i => i.id === id);
            if (idx > -1) cart[idx].qty = qty;
        }
        save(cart);
        _updateBadges();
    }

    /** Remove item by id */
    function remove(id) {
        save(getAll().filter(i => i.id !== id));
        _updateBadges();
    }

    /** Empty the cart */
    function clear() {
        localStorage.removeItem(KEY);
        _updateBadges();
    }

    /** Total quantity across all items */
    function totalQty() {
        return getAll().reduce((s, i) => s + i.qty, 0);
    }

    /** Update all cart badges on the page */
    function _updateBadges() {
        const count = totalQty();
        document.querySelectorAll('.cart-badge, #navCartCount').forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? 'flex' : 'none';
        });
    }

    // Run on load to sync badge
    document.addEventListener('DOMContentLoaded', _updateBadges);

    return { getAll, getItem, add, updateQty, remove, clear, totalQty };
})();


/* ══════════════════════════════════════════════
   Add-to-Cart Modal  (injected once per page)
   Requires Bootstrap 5 JS to be loaded.
══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    // Inject modal HTML
    if (!document.getElementById('addToCartModal')) {
        document.body.insertAdjacentHTML('beforeend', `
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
                    <small class="text-muted" id="modalProductStock"></small>
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
        `);
    }

    // Inject navbar badge style + click handler for cart icons without href
    document.querySelectorAll('.fa-cart-shopping').forEach(icon => {
        const wrapper = icon.closest('a, .cart-nav-wrapper');
        if (!wrapper) {
            // Wrap icon
            icon.style.cursor = 'pointer';
            icon.addEventListener('click', () => { location.href = 'cart.html'; });
        }
        // Add badge if not already present
        const parent = icon.parentElement;
        if (!parent.querySelector('.cart-badge')) {
            parent.style.position = 'relative';
            const badge = document.createElement('span');
            badge.className = 'cart-badge';
            badge.id = 'navCartCount';
            badge.style.cssText = `
                position:absolute;top:-8px;right:-8px;
                background:#db4444;color:#fff;font-size:10px;font-weight:700;
                width:18px;height:18px;border-radius:50%;
                display:none;align-items:center;justify-content:center;line-height:1;
            `;
            badge.textContent = '0';
            parent.appendChild(badge);
        }
    });

    // ── Wire up Add-to-Cart buttons ──
    let _currentProduct = null;

    document.addEventListener('click', e => {
        const btn = e.target.closest('.add-to-cart-btn, [data-add-to-cart]');
        if (!btn) return;

        // Try to get product data from data attribute first
        let product = null;
        const raw = btn.dataset.product;
        if (raw) {
            try { product = JSON.parse(raw); } catch {}
        }

        // Fallback: scrape from card
        if (!product) {
            const card = btn.closest('.product-card, .card, [class*="product"]');
            if (card) {
                const nameEl  = card.querySelector('.product-name, .product-name-cell, [class*="name"]');
                const priceEl = card.querySelector('.price-new, .price, [class*="price"]');
                const imgEl   = card.querySelector('img');
                product = {
                    id:     card.dataset.productId || 'product_' + Date.now(),
                    name:   nameEl  ? nameEl.textContent.trim()  : 'Product',
                    price:  priceEl ? parseFloat(priceEl.textContent.replace(/[^0-9.]/g, '')) || 0 : 0,
                    stock:  parseInt(card.dataset.stock) || 10,
                    images: imgEl ? [imgEl.src] : ['https://via.placeholder.com/80'],
                    category: card.dataset.category || '',
                    sellerId: card.dataset.sellerId || ''
                };
            } else {
                // Ultimate fallback
                product = {
                    id: 'product_' + Date.now(),
                    name: 'Product',
                    price: 0,
                    stock: 10,
                    images: ['https://via.placeholder.com/80'],
                    category: '', sellerId: ''
                };
            }
        }

        _currentProduct = product;
        openModal(product);
    });

    function openModal(product) {
        const maxStock = product.stock || 1;
        document.getElementById('modalProductName').textContent  = product.name;
        document.getElementById('modalProductPrice').textContent = `$${parseFloat(product.price).toFixed(2)}`;
        document.getElementById('modalProductStock').textContent = `In stock: ${maxStock}`;
        document.getElementById('modalProductImg').src           = (product.images && product.images[0]) || 'https://via.placeholder.com/80';
        document.getElementById('modalProductImg').alt           = product.name;
        document.getElementById('modalQtyInput').value           = 1;
        document.getElementById('modalQtyInput').max             = maxStock;
        document.getElementById('modalMaxNote').textContent      = `Max: ${maxStock}`;

        const modal = new bootstrap.Modal(document.getElementById('addToCartModal'));
        modal.show();
    }

    // Qty controls inside modal
    document.getElementById('modalQtyDec').addEventListener('click', () => {
        const inp = document.getElementById('modalQtyInput');
        if (parseInt(inp.value) > 1) inp.value = parseInt(inp.value) - 1;
    });
    document.getElementById('modalQtyInc').addEventListener('click', () => {
        const inp = document.getElementById('modalQtyInput');
        const max = parseInt(inp.max) || 99;
        if (parseInt(inp.value) < max) inp.value = parseInt(inp.value) + 1;
    });

    // Confirm add
    document.getElementById('modalConfirmBtn').addEventListener('click', () => {
        if (!_currentProduct) return;
        const qty = parseInt(document.getElementById('modalQtyInput').value) || 1;
        Cart.add(_currentProduct, qty);

        bootstrap.Modal.getInstance(document.getElementById('addToCartModal')).hide();

        // Show toast
        const toastEl  = document.getElementById('cartSuccessToast');
        document.getElementById('cartToastMsg').textContent = `"${_currentProduct.name}" added to cart!`;
        bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 2500 }).show();

        _currentProduct = null;
    });
});
