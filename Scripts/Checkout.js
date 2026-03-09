// ══════════════════════════════════════════════════════════════════
//  Checkout.js  —  Cart rendering + Order placement
//  Depends on: db.js + cart.js  (both must be loaded first)
//
//  Cart source: Cart.getAll() from cart.js  (localStorage key: "user_cart")
//  Cart item shape: { id, name, price, qty, images: [...], stock, category, sellerId }
//
//  Order shape:
//  {
//    id:       string (timestamp),
//    userId:   string,
//    items:    [{ productId, quantity }],
//    total:    number,
//    status:   "pending"
//  }
// ══════════════════════════════════════════════════════════════════


(function guardAuth() {
  const session = DB.getSession();
  if (!session) {
    window.location.href = "../login.html";
  }
})();

// ── Helpers ───────────────────────────────────────────────────────



function formatUSD(n) {
  return "$" + Number(n).toLocaleString("en-US");
}

function toNum(v) {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

// images is an array in cart.js: { images: ["url1", "url2"] }
function resolveImage(images, name) {
  const src = Array.isArray(images) ? images[0] : images;
  if (!src) return `<div class="item-placeholder">📦</div>`;
  const isUrl = src.startsWith("http") || src.startsWith("/") || src.startsWith("data:");
  return isUrl
    ? `<img src="${src}" alt="${name}" />`
    : `<div class="item-placeholder">${src}</div>`;
}


// ── Render cart using Cart.getAll() ──────────────────────────────

function renderCart() {
  // Cart.getAll() from cart.js — reads localStorage "user_cart"
  const cart = Cart.getAll();
  console.log("[Checkout] renderCart — cart from Cart.getAll():", cart);

  const container = document.getElementById("cart-items");

  if (!cart.length) {
    container.innerHTML = `<div class="empty-note">Your cart is empty.</div>`;
    document.getElementById("subtotal").textContent = "$0";
    document.getElementById("total").textContent = "$0";
    console.log("[Checkout] renderCart — cart is empty.");
    return;
  }

  let html = "";
  let subtotal = 0;

  cart.forEach(item => {
    const price = toNum(item.price);
    const qty = toNum(item.qty) || 1;
    const lineTotal = price * qty;
    subtotal += lineTotal;

    console.log(`[Checkout] renderCart — "${item.name}": $${price} × ${qty} = $${lineTotal}`);

    html += `
      <div class="cart-item">
        ${resolveImage(item.images, item.name)}
        <div class="item-name">
          ${item.name}
          ${qty > 1 ? `<div class="item-qty">Qty: ${qty}</div>` : ""}
        </div>
        <div class="item-price">${formatUSD(lineTotal)}</div>
      </div>`;
  });

  container.innerHTML = html;
  document.getElementById("subtotal").textContent = formatUSD(subtotal);
  document.getElementById("total").textContent = formatUSD(subtotal);
  console.log("[Checkout] renderCart — subtotal:", formatUSD(subtotal));
}


// ── Payment method toggle ─────────────────────────────────────────

function selectPayment(method) {
  document.getElementById("opt-bank").classList.toggle("active", method === "bank");
  document.getElementById("opt-cod").classList.toggle("active", method === "cod");
  document.getElementById("radio-bank").checked = (method === "bank");
  document.getElementById("radio-cod").checked = (method === "cod");
  console.log("[Checkout] selectPayment:", method);
}


// ── Validate form ─────────────────────────────────────────────────

function getFormData() {
  const fields = [
    { id: "firstName", label: "First Name" },
    { id: "streetAddress", label: "Street Address" },
    { id: "city", label: "Town / City" },
    { id: "phone", label: "Phone Number" },
    { id: "email", label: "Email Address" },
  ];

  const data = {};
  for (const field of fields) {
    const el = document.getElementById(field.id);
    const value = el ? el.value.trim() : "";
    if (!value) {
      console.warn("[Checkout] getFormData — missing:", field.label);
      alert(`Please fill in: ${field.label}`);
      el && el.focus();
      return null;
    }
    data[field.id] = value;
  }

  const apt = document.getElementById("apartment");
  data.apartment = apt ? apt.value.trim() : "";

  console.log("[Checkout] getFormData:", data);
  return data;
}


// ── Update product stock ──────────────────────────────────────────

async function updateStock(cart) {
  console.log("[Checkout] updateStock — start:", cart);

  const results = await Promise.allSettled(
    cart.map(async (item) => {
      // cart.js uses item.id as the product id
      const product = await DB.getProductById(item.id);
      if (!product) {
        console.warn(`[Checkout] updateStock — product "${item.id}" not found, skipping.`);
        return;
      }
      const currentStock = toNum(product.stock);
      const orderedQty = toNum(item.qty) || 1;
      const newStock = Math.max(0, currentStock - orderedQty);

      await DB.updateProduct(item.id, { stock: newStock });
      console.log(`[Checkout] updateStock — ✅ "${item.name}": stock ${currentStock} → ${newStock}`);
    })
  );

  results.forEach((r, i) => {
    if (r.status === "rejected")
      console.warn(`[Checkout] updateStock — ❌ item[${i}]:`, r.reason);
  });
}


// ── Place Order ───────────────────────────────────────────────────

async function placeOrder() {
  console.log("[Checkout] placeOrder — triggered.");

  // 1. Session check
  const session = DB.getSession();
  if (!session) {
    alert("Please log in to place an order.");
    window.location.href = "login.html";
    return;
  }

  // 2. Validate form
  const formData = getFormData();
  if (!formData) return;
  console.log("[Checkout] placeOrder — form:", formData);

  // 3. Payment method
  const paymentEl = document.querySelector('input[name="payment"]:checked');
  const payment = paymentEl ? paymentEl.value : "cod";
  console.log("[Checkout] placeOrder — payment:", payment);

  // 4. Cart from Cart.getAll()
  const cart = Cart.getAll();
  if (!cart.length) {
    alert("Your cart is empty. Please add items before placing an order.");
    console.warn("[Checkout] placeOrder — empty cart, blocked.");
    return;
  }
  console.log("[Checkout] placeOrder — cart:", cart);

  // 5. Calculate total — same logic as renderCart
  const total = cart.reduce((sum, item) => {
    const lineTotal = toNum(item.price) * (toNum(item.qty) || 1);
    console.log(`[Checkout] placeOrder — "${item.name}": $${item.price} × ${item.qty} = $${lineTotal}`);
    return sum + lineTotal;
  }, 0);
  console.log("[Checkout] placeOrder — total:", formatUSD(total));

  // 6. Build order — map cart items to { productId, quantity }
  const orderData = {
    userId: session.id,
    items: cart.map(item => ({
      productId: item.id,          // cart.js stores product id as item.id
      quantity: toNum(item.qty) || 1,
    })),
    total,
    status: "pending",
    payment,
    customer: {
      name: formData.firstName,
      email: formData.email,
      phone: formData.phone,
      address: [formData.streetAddress, formData.apartment, formData.city]
        .filter(Boolean).join(", "),
    },
  };
  console.log("[Checkout] placeOrder — orderData:", orderData);

  // 7. Disable button
  const btn = document.querySelector(".btn-place");
  btn.disabled = true;
  btn.textContent = "Placing Order…";

  // 8. POST order via DB
  try {
    const saved = await DB.placeOrder(orderData);
    console.log("[Checkout] placeOrder — ✅ order saved:", saved);
    await onOrderSuccess(saved.id, payment, cart);

  } catch (err) {
    console.error("[Checkout] placeOrder — ❌ failed:", err.message);
    alert("Something went wrong. Please try again.");
    btn.disabled = false;
    btn.textContent = "Place Order";
  }
}


// ── After successful order ────────────────────────────────────────

async function onOrderSuccess(orderId, payment, cart) {
  // 1. Update stock for each product
  try {
    await updateStock(cart);
  } catch (err) {
    console.warn("[Checkout] onOrderSuccess — stock update error:", err.message);
  }

  // 2. Clear cart using Cart.clear() from cart.js
  Cart.clear();
  console.log("[Checkout] onOrderSuccess — cart cleared via Cart.clear().");

  // 3. Done
  alert(
    `✅ Order placed successfully!\n` +
    `Order ID: ${orderId}\n` +
    `Payment: ${payment === "cod" ? "Cash on Delivery" : "Bank Transfer"}`
  );
  window.location.href = "index.html";
}


// ── Init ──────────────────────────────────────────────────────────
renderCart();