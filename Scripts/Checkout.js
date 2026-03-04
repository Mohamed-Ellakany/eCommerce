
  const DEMO_CART = [
    { name: "LCD Monitor", price: 650, qty: 1, image: "🖥️" },
    { name: "H1 Gamepad",  price: 1100, qty: 1, image: "🎮" }
  ];

  function getCart() {
    try {
      const raw = localStorage.getItem("cart");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch(e) {}
    return DEMO_CART; 
  }

  function formatUSD(n) {
    return "$" + Number(n).toLocaleString("en-US");
  }

  function renderCart() {
    const cart = getCart();
    const container = document.getElementById("cart-items");

    if (!cart.length) {
      container.innerHTML = `<div class="empty-note">Your cart is empty.</div>`;
      document.getElementById("subtotal").textContent = "$0";
      document.getElementById("total").textContent    = "$0";
      return;
    }

    let html = "";
    let subtotal = 0;

    cart.forEach(item => {
      const lineTotal = (item.price || 0) * (item.qty || 1);
      subtotal += lineTotal;

      const imgMarkup = item.image
        ? (item.image.startsWith("http") || item.image.startsWith("/") || item.image.startsWith("data:")
            ? `<img src="${item.image}" alt="${item.name}"/>`
            : `<div class="item-placeholder">${item.image}</div>`)
        : `<div class="item-placeholder">📦</div>`;

      html += `
        <div class="cart-item">
          ${imgMarkup}
          <div class="item-name">
            ${item.name}
            ${item.qty > 1 ? `<div class="item-qty">${item.qty}</div>` : ""}
          </div>
          <div class="item-price">${formatUSD(lineTotal)}</div>
        </div>`;
    });

    container.innerHTML = html;
    document.getElementById("subtotal").textContent = formatUSD(subtotal);
    document.getElementById("total").textContent    = formatUSD(subtotal);
  }

  function selectPayment(method) {
    document.getElementById("opt-bank").classList.toggle("active", method === "bank");
    document.getElementById("opt-cod").classList.toggle("active",  method === "cod");
    document.getElementById("radio-bank").checked = (method === "bank");
    document.getElementById("radio-cod").checked  = (method === "cod");
  }

 

  function placeOrder() {
    const required = ["firstName","streetAddress","city","phone","email"];
    const labels   = ["First Name","Street Address","Town/City","Phone Number","Email Address"];
    for (let i = 0; i < required.length; i++) {
      if (!document.getElementById(required[i]).value.trim()) {
        alert(`Please fill in: ${labels[i]}`);
        document.getElementById(required[i]).focus();
        return;
      }
    }

    const payment = document.querySelector('input[name="payment"]:checked').value;
    alert(`✅ Order placed!\nPayment: ${payment === "cod" ? "Cash on Delivery" : "Bank Transfer"}`);
  }

  renderCart();