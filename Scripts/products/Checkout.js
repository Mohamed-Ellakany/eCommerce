(function guardAuth() {
  const session = DB.getSession();
  if (!session) {
    window.location.href = "../../pages/Auth/login.html";
  }
})();

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

function resolveImage(images, name) {
  const src = Array.isArray(images) ? images[0] : images;
  if (!src) return `<div class="item-placeholder">📦</div>`;
  const isUrl =
    src.startsWith("http") || src.startsWith("/") || src.startsWith("data:");
  return isUrl
    ? `<img src="${src}" alt="${name}" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'item-placeholder\\'>📦</div>'" />`
    : `<div class="item-placeholder">${src}</div>`;
}

function renderCart() {
  const cart = Cart.getAll();

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

function buildSuborders(cart, orderId, customerInfo, paymentMethod, date) {
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

async function updateStock(cart) {
  const results = await Promise.allSettled(
    cart.map(async (item) => {
      const productId = item.productId || item.id;
      const qty = toNum(item.qty) || 1;

      const product = await DB.getProductById(productId);

      if (!product) {
        console.warn(
          `[Checkout] updateStock — ❌ product "${productId}" not found in DB. Skipping.`,
        );
        return;
      }

      const currentStock = toNum(product.stock);
      const newStock = Math.max(0, currentStock - qty);

      await DB.updateProduct(productId, { stock: newStock });
    }),
  );

  results.forEach((r, i) => {
    if (r.status === "rejected")
      console.error(`[Checkout] updateStock — ❌ item[${i}] threw:`, r.reason);
  });
}

async function placeOrder() {
  const session = DB.getSession();
  if (!session) {
    alert("Please log in to place an order.");
    window.location.href = "../../pages/Auth/login.html";
    return;
  }

  const formData = getFormData();
  if (!formData) return;

  const paymentEl = document.querySelector('input[name="payment"]:checked');
  const paymentValue = paymentEl ? paymentEl.value : "cod";
  const paymentMethod =
    paymentValue === "cod" ? "Cash on Delivery" : "Bank Transfer";

  const cart = Cart.getAll();
  if (!cart.length) {
    alert("Your cart is empty. Please add items before placing an order.");
    return;
  }

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

  const totalPrice =
    Math.round(
      cart.reduce(
        (sum, item) => sum + toNum(item.price) * (toNum(item.qty) || 1),
        0,
      ) * 100,
    ) / 100;

  const suborders = buildSuborders(
    cart,
    orderId,
    customerInfo,
    paymentMethod,
    date,
  );

  const orderData = {
    id: orderId,
    date,
    customer: customerInfo,
    paymentMethod,
    totalPrice,
    status: "pending",
    suborders,
  };

  const btn = document.querySelector(".btn-place");
  btn.disabled = true;
  btn.textContent = "Placing Order…";

  try {
    const saved = await DB.placeOrder(orderData);
    await onOrderSuccess(saved.id, paymentMethod, cart);
  } catch (err) {
    console.error("[Checkout] placeOrder — ❌ failed:", err.message);
    alert("Something went wrong. Please try again.");
    btn.disabled = false;
    btn.textContent = "Place Order";
  }
}

async function onOrderSuccess(orderId, paymentMethod, cart) {
  try {
    await updateStock(cart);
  } catch (err) {
    console.warn(
      "[Checkout] onOrderSuccess — stock update error:",
      err.message,
    );
  }

  Cart.clear();

  alert(
    `✅ Order placed successfully!\n` +
      `Order ID: ${orderId}\n` +
      `Payment: ${paymentMethod}`,
  );
  window.location.href = "../../index.html";
}

renderCart();
