// ══════════════════════════════════════════════════════════════════
//  seller-analytics.js
//  Fetches orders, extracts this seller's suborders, draws 4 charts
// ══════════════════════════════════════════════════════════════════

const BASE_URL = "https://e-commerce-server-xi.vercel.app";

(async () => {

  // ── 1. Auth guard ──────────────────────────────────────────────
  const session = DB.getSession();
  if (!session || (session.role !== "seller" && session.role !== "admin")) {
    window.location.href = "../../index.html";
    return;
  }
  const SELLER_ID = String(session.id);

  // ── 2. Navbar ──────────────────────────────────────────────────
  const userNameEl = document.getElementById("user-name");
  if (userNameEl) userNameEl.textContent = session.name;

  document.getElementById("logout-btn")?.addEventListener("click", (e) => {
    e.preventDefault();
    DB.clearSession();
    window.location.href = "../../index.html";
  });

  // ── 3. Fetch all orders, extract this seller's suborders ───────
  const res = await fetch(`${BASE_URL}/orders`);
  const allOrders = await res.json();

  // Go through every order → every suborder → keep only this seller's
  const mySuborders = [];
  allOrders.forEach(order => {
    if (!Array.isArray(order.suborders)) return;
    order.suborders.forEach(sub => {
      if (String(sub.sellerId) === SELLER_ID) {
        mySuborders.push({
          ...sub,
          _orderDate: order.date,
          _paymentMethod: order.paymentMethod
        });
      }
    });
  });

  // ── 4. Summary stats ───────────────────────────────────────────
  // Total orders
  document.getElementById("stat-total-orders").textContent = mySuborders.length;

  // Total revenue — sum of all subTotals
  const totalRevenue = mySuborders.reduce((sum, s) => sum + (s.subTotal || 0), 0);
  document.getElementById("stat-total-revenue").textContent = `$${totalRevenue.toFixed(2)}`;

  // Total products sold — sum all quantities across all suborders
  const totalProductsSold = mySuborders.reduce((sum, s) => {
    return sum + s.products.reduce((pSum, p) => pSum + p.quantity, 0);
  }, 0);
  document.getElementById("stat-total-products").textContent = totalProductsSold;

  // Cities reached — unique cities count
  const citiesSet = new Set(
    mySuborders.map(s => {
      const parts = (s.customer?.address || "").split(",");
      return parts[parts.length - 1].trim();
    }).filter(c => c)
  );
  document.getElementById("stat-total-cities").textContent = citiesSet.size;

  // ── 5. Chart 1 — Revenue by Month ─────────────────────────────
  // Build an object like { "Jan 2024": 1500, "Feb 2024": 800 }
  const revenueByMonth = {};
  mySuborders.forEach(sub => {
    const date = new Date(sub._orderDate || sub.date);
    const key = date.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
    revenueByMonth[key] = (revenueByMonth[key] || 0) + (sub.subTotal || 0);
  });

  new Chart(document.getElementById("chart-revenue"), {
    type: "line",
    data: {
      labels: Object.keys(revenueByMonth),
      datasets: [{
        label: "Revenue ($)",
        data: Object.values(revenueByMonth),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59,130,246,0.1)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#3b82f6"
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { callback: v => `$${v}` } }
      }
    }
  });

  // ── 6. Chart 2 — Payment Methods ──────────────────────────────
  // Count how many suborders used each payment method
  const paymentCounts = {};
  mySuborders.forEach(sub => {
    const method = sub._paymentMethod || sub.paymentMethod || "Unknown";
    // Simplify the label — "Visa ending in 4242" → "Visa"
    const label = method.split(" ")[0];
    paymentCounts[label] = (paymentCounts[label] || 0) + 1;
  });

  new Chart(document.getElementById("chart-payment"), {
    type: "doughnut",
    data: {
      labels: Object.keys(paymentCounts),
      datasets: [{
        data: Object.values(paymentCounts),
        backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } }
    }
  });

  // ── 7. Chart 3 — Best Selling Products ────────────────────────
  // Sum quantity per product name across all suborders
  const productSales = {};
  mySuborders.forEach(sub => {
    sub.products.forEach(p => {
      productSales[p.name] = (productSales[p.name] || 0) + p.quantity;
    });
  });

  // Sort by quantity descending, take top 6
  const sortedProducts = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  new Chart(document.getElementById("chart-products"), {
    type: "bar",
    data: {
      labels: sortedProducts.map(p => p[0]),
      datasets: [{
        label: "Units Sold",
        data: sortedProducts.map(p => p[1]),
        backgroundColor: ["#3b82f6","#10b981","#f59e0b","#8b5cf6","#ef4444","#06b6d4"]
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });

  // ── 8. Chart 4 — Orders by City ───────────────────────────────
  // Extract city = last part after last comma in address
  const cityCounts = {};
  mySuborders.forEach(sub => {
    const parts = (sub.customer?.address || "").split(",");
    const city = parts[parts.length - 1].trim();
    if (city) cityCounts[city] = (cityCounts[city] || 0) + 1;
  });

  new Chart(document.getElementById("chart-cities"), {
    type: "bar",
    data: {
      labels: Object.keys(cityCounts),
      datasets: [{
        label: "Orders",
        data: Object.values(cityCounts),
        backgroundColor: "#8b5cf6"
      }]
    },
    options: {
      responsive: true,
      indexAxis: "y", // horizontal bar — easier to read city names
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } }
    }
  });

})();