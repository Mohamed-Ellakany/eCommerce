// ══════════════════════════════════════════════════════════════════
//  Checkout.js  —  Cart rendering + Order placement
//  Depends on: DB.js + cart.js  (both must be loaded first)
//
//  Cart item shape (from cart.js):
//    { id, name, price, qty, images: [...], stock, category, sellerId }
//
//  New Order shape:
//  {
//    id          : string (timestamp),
//    date        : ISO string,
//    customer    : { userId, name, email, address },
//    paymentMethod: string,
//    totalPrice  : number,
//    status      : "pending",
//    suborders   : [
//      {
//        id          : string  ("<orderId>-<sellerId>"),
//        parentOrderId: string,
//        sellerId    : string,
//        date        : ISO string,
//        customer    : { userId, name, email, address },
//        products    : [{ productId, name, price, quantity, image }],
//        paymentMethod: string,
//        subTotal    : number,
//        status      : "pending"
//      }
//    ]
//  }
// ══════════════════════════════════════════════════════════════════

// ── Auth guard ────────────────────────────────────────────────────
(function guardAuth() {
  const session = DB.getSession();
  if (!session) {
    window.location.href = "../../pages/Auth/login.html";
  }
})();

// ── Helpers ───────────────────────────────────────────────────────

function formatUSD(n) {
  return (
    "$" +
    Number(n).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function toNum(v) {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

// Resolves first image from array or string; returns <img> or placeholder div
function resolveImage(images, name) {
  const src = Array.isArray(images) ? images[0] : images;
  if (!src) return `<div class="item-placeholder">📦</div>`;
  const isUrl =
    src.startsWith("http") || src.startsWith("/") || src.startsWith("data:");
  return isUrl
    ? `<img src="${src}" alt="${name}" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'item-placeholder\\'>📦</div>'" />`
    : `<div class="item-placeholder">${src}</div>`;
}

// ── Render cart ───────────────────────────────────────────────────

function renderCart() {
  const cart = Cart.getAll();
  console.log("[Checkout] renderCart — cart:", cart);

  const container = document.getElementById("cart-items");

  if (!cart.length) {
    container.innerHTML = `<div class="empty-note">Your cart is empty.</div>`;
    document.getElementById("subtotal").textContent = "$0.00";
    document.getElementById("total").textContent = "$0.00";
    return;
  }

  let html = "";
  let subtotal = 0;

  cart.forEach((item) => {
    const price = toNum(item.price);
    const qty = toNum(item.qty) || 1;
    const lineTotal = price * qty;
    subtotal += lineTotal;

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
}

// ── Payment toggle ────────────────────────────────────────────────

function selectPayment(method) {
  document
    .getElementById("opt-bank")
    .classList.toggle("active", method === "bank");
  document
    .getElementById("opt-cod")
    .classList.toggle("active", method === "cod");
  document.getElementById("radio-bank").checked = method === "bank";
  document.getElementById("radio-cod").checked = method === "cod";
}

// ── Form validation ───────────────────────────────────────────────

function getFormData() {
  const required = [
    { id: "firstName", label: "First Name" },
    { id: "streetAddress", label: "Street Address" },
    { id: "city", label: "Town / City" },
    { id: "phone", label: "Phone Number" },
    { id: "email", label: "Email Address" },
  ];

  const data = {};
  for (const field of required) {
    const el = document.getElementById(field.id);
    const value = el ? el.value.trim() : "";
    if (!value) {
      alert(`Please fill in: ${field.label}`);
      el && el.focus();
      return null;
    }
    data[field.id] = value;
  }

  const apt = document.getElementById("apartment");
  data.apartment = apt ? apt.value.trim() : "";
  return data;
}

// ── Build suborders by grouping cart items per sellerId ───────────

function buildSuborders(cart, orderId, customerInfo, paymentMethod, date) {
  // Group items by sellerId
  const sellerMap = {};

  cart.forEach((item) => {
    const sellerId = String(item.sellerId || "unknown");
    if (!sellerMap[sellerId]) sellerMap[sellerId] = [];
    sellerMap[sellerId].push(item);
  });

  return Object.entries(sellerMap).map(([sellerId, items]) => {
    const products = items.map((item) => ({
      productId: item.id,
      name: item.name,
      price: toNum(item.price),
      quantity: toNum(item.qty) || 1,
      image: Array.isArray(item.images)
        ? item.images[0] || ""
        : item.images || "",
    }));

    const subTotal = products.reduce((sum, p) => sum + p.price * p.quantity, 0);

    return {
      id: `${orderId}-${sellerId}`,
      parentOrderId: orderId,
      sellerId,
      date,
      customer: customerInfo,
      products,
      paymentMethod,
      subTotal: Math.round(subTotal * 100) / 100,
      status: "pending",
    };
  });
}

// ── Stock update ──────────────────────────────────────────────────

async function updateStock(cart) {
  console.log("[Checkout] updateStock — cart items received:", cart);

  const results = await Promise.allSettled(
    cart.map(async (item) => {
      // cart.js may store the product id as item.id or item.productId
      const productId = item.productId || item.id;
      const qty = toNum(item.qty) || 1;

      console.log(
        `[Checkout] updateStock — looking up product id: "${productId}" for "${item.name}"`,
      );

      const product = await DB.getProductById(productId);

      if (!product) {
        console.warn(
          `[Checkout] updateStock — ❌ product "${productId}" not found in DB. Skipping.`,
        );
        return;
      }

      const currentStock = toNum(product.stock);
      const newStock = Math.max(0, currentStock - qty);

      console.log(
        `[Checkout] updateStock — PATCHING "${item.name}" (id: ${productId}): stock ${currentStock} → ${newStock}`,
      );

      await DB.updateProduct(productId, { stock: newStock });

      console.log(
        `[Checkout] updateStock — ✅ "${item.name}" stock updated to ${newStock}`,
      );
    }),
  );

  results.forEach((r, i) => {
    if (r.status === "rejected")
      console.error(`[Checkout] updateStock — ❌ item[${i}] threw:`, r.reason);
  });

  console.log("[Checkout] updateStock — done.");
}

// ── Place Order ───────────────────────────────────────────────────

async function placeOrder() {
  // 1. Session
  const session = DB.getSession();
  if (!session) {
    alert("Please log in to place an order.");
    window.location.href = "../../pages/Auth/login.html";
    return;
  }

  // 2. Validate form
  const formData = getFormData();
  if (!formData) return;

  // 3. Payment method
  const paymentEl = document.querySelector('input[name="payment"]:checked');
  const paymentValue = paymentEl ? paymentEl.value : "cod";
  const paymentMethod =
    paymentValue === "cod" ? "Cash on Delivery" : "Bank Transfer";

  // 4. Cart
  const cart = Cart.getAll();
  if (!cart.length) {
    alert("Your cart is empty. Please add items before placing an order.");
    return;
  }

  // 5. Build shared data
  const orderId = Date.now().toString();
  const date = new Date().toISOString();

  const address = [formData.streetAddress, formData.apartment, formData.city]
    .filter(Boolean)
    .join(", ");

  const customerInfo = {
    userId: session.id,
    name: formData.firstName,
    email: formData.email,
    address,
  };

  // 6. Total price
  const totalPrice =
    Math.round(
      cart.reduce(
        (sum, item) => sum + toNum(item.price) * (toNum(item.qty) || 1),
        0,
      ) * 100,
    ) / 100;

  // 7. Build suborders (grouped by sellerId)
  const suborders = buildSuborders(
    cart,
    orderId,
    customerInfo,
    paymentMethod,
    date,
  );

  // 8. Assemble full order matching DB shape
  const orderData = {
    id: orderId,
    date,
    customer: customerInfo,
    paymentMethod,
    totalPrice,
    status: "pending",
    suborders,
  };

  console.log(
    "[Checkout] placeOrder — orderData:",
    JSON.stringify(orderData, null, 2),
  );

  // 9. Disable button
  const btn = document.querySelector(".btn-place");
  btn.disabled = true;
  btn.textContent = "Placing Order…";

  try {
    const saved = await DB.placeOrder(orderData);
    console.log("[Checkout] placeOrder — ✅ saved:", saved);
    await onOrderSuccess(saved.id, paymentMethod, cart);
  } catch (err) {
    console.error("[Checkout] placeOrder — ❌ failed:", err.message);
    alert("Something went wrong. Please try again.");
    btn.disabled = false;
    btn.textContent = "Place Order";
  }
}

// ── Post-order success ────────────────────────────────────────────

async function onOrderSuccess(orderId, paymentMethod, cart) {
  console.log("[Checkout] onOrderSuccess — cart passed to stock update:", cart);

  try {
    await updateStock(cart);
    console.log("[Checkout] onOrderSuccess — ✅ stock update complete.");
  } catch (err) {
    console.warn(
      "[Checkout] onOrderSuccess — stock update error:",
      err.message,
    );
  }

  Cart.clear();
  console.log("[Checkout] onOrderSuccess — cart cleared.");

  alert(
    `✅ Order placed successfully!\n` +
      `Order ID: ${orderId}\n` +
      `Payment: ${paymentMethod}`,
  );
  window.location.href = "../../index.html";
}

// ── Init ──────────────────────────────────────────────────────────
renderCart();
