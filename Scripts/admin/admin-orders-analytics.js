// ══════════════════════════════════════════════════════════════════
//  admin-orders-analytics.js — Orders analytics (light/bootstrap theme)
// ══════════════════════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", async function () {

  // ── Auth guard ────────────────────────────────────────────────
  const session = DB.getSession();
  if (!session || session.role !== "admin") {
    window.location.href = "../../index.html";
    return;
  }
  document.getElementById("user-name").textContent = session.name;
  document.getElementById("logout-btn").addEventListener("click", (e) => {
    e.preventDefault();
    DB.clearSession();
    window.location.href = "../../pages/Auth/login.html";
  });

  // ── Load orders ───────────────────────────────────────────────
  let orders = [];
  try {
    orders = await DB.getOrders();
  } catch (err) {
    console.error("Failed to load orders:", err);
    return;
  }

  if (!orders.length) {
    document.querySelector(".content").innerHTML +=
      `<div class="alert alert-info w-100">No orders found yet.</div>`;
    return;
  }

  // ── Chart.js light defaults ───────────────────────────────────
  Chart.defaults.color             = "#6c757d";
  Chart.defaults.font.family       = "inherit";
  Chart.defaults.plugins.legend.labels.boxWidth = 12;
  Chart.defaults.plugins.legend.labels.padding  = 14;

  // ── Palette aligned with Bootstrap + admin-dashboard colors ──
  const STATUS_COLORS = {
    pending:    "#d97706",
    processing: "#2563eb",
    shipped:    "#7c3aed",
    delivered:  "#059669",
    cancelled:  "#dc2626",
  };
  const STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

  // ── Derived data ──────────────────────────────────────────────
  const allSuborders = orders.flatMap(o => o.suborders || []);

  const statusCount = {};
  STATUSES.forEach(s => statusCount[s] = 0);
  orders.forEach(o => {
    const s = (o.status || "pending").toLowerCase();
    statusCount[s] = (statusCount[s] || 0) + 1;
  });

  const deliveredRevenue = orders
    .filter(o => o.status === "delivered")
    .reduce((sum, o) => sum + parseFloat(o.totalPrice || 0), 0);
  const totalAllRev = orders.reduce((sum, o) => sum + parseFloat(o.totalPrice || 0), 0);
  const aov = orders.length ? totalAllRev / orders.length : 0;

  // ── KPI ───────────────────────────────────────────────────────
  document.getElementById("kpi-orders").textContent    = orders.length;
  document.getElementById("kpi-revenue").textContent   = fmtMoney(deliveredRevenue);
  document.getElementById("kpi-aov").textContent       = fmtMoney(aov);
  document.getElementById("kpi-delivered").textContent = statusCount.delivered || 0;
  document.getElementById("kpi-cancelled").textContent = statusCount.cancelled || 0;

  // ── 1. Revenue + Orders timeline ─────────────────────────────
  const monthRevenue = {}, monthCount = {};
  orders.forEach(o => {
    const key = monthKey(parseDate(o.date));
    monthRevenue[key] = (monthRevenue[key] || 0) + parseFloat(o.totalPrice || 0);
    monthCount[key]   = (monthCount[key]   || 0) + 1;
  });
  const sortedM  = Object.keys(monthRevenue).sort();
  const mLabels  = sortedM.map(prettyMonth);
  const mRev     = sortedM.map(k => +monthRevenue[k].toFixed(2));
  const mCount   = sortedM.map(k => monthCount[k]);

  new Chart(document.getElementById("chart-timeline"), {
    type: "line",
    data: {
      labels: mLabels,
      datasets: [
        {
          label: "Revenue ($)",
          data: mRev,
          borderColor: "#2563eb",
          backgroundColor: "rgba(37,99,235,.08)",
          fill: true, tension: .4,
          pointBackgroundColor: "#2563eb",
          pointRadius: 4, pointHoverRadius: 6, borderWidth: 2,
          yAxisID: "yRev",
        },
        {
          label: "Order Count",
          data: mCount,
          borderColor: "#dc2626",
          backgroundColor: "rgba(220,38,38,.06)",
          fill: true, tension: .4,
          pointBackgroundColor: "#dc2626",
          pointRadius: 3, borderWidth: 1.5,
          borderDash: [5,3],
          yAxisID: "yCount",
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { mode:"index", intersect:false },
      plugins: { legend: { position:"bottom" } },
      scales: {
        x:      { grid: { color:"rgba(0,0,0,.05)" } },
        yRev:   { position:"left",  grid: { color:"rgba(0,0,0,.05)" }, ticks: { callback: v => "$"+v } },
        yCount: { position:"right", grid: { display:false }, ticks: { stepSize:1 } },
      },
    },
  });

  // ── 2. Status donut ───────────────────────────────────────────
  new Chart(document.getElementById("chart-status-donut"), {
    type: "doughnut",
    data: {
      labels: STATUSES.map(cap),
      datasets: [{
        data: STATUSES.map(s => statusCount[s] || 0),
        backgroundColor: STATUSES.map(s => STATUS_COLORS[s]),
        borderWidth: 2,
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      cutout: "65%",
      plugins: {
        legend: { position:"bottom" },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.parsed} (${Math.round(ctx.parsed/orders.length*100)}%)`,
          },
        },
      },
    },
  });

  // ── 3. Status horizontal bar ──────────────────────────────────
  new Chart(document.getElementById("chart-status-bar"), {
    type: "bar",
    data: {
      labels: STATUSES.map(cap),
      datasets: [{
        label: "Orders",
        data: STATUSES.map(s => statusCount[s] || 0),
        backgroundColor: STATUSES.map(s => STATUS_COLORS[s] + "bb"),
        borderColor: STATUSES.map(s => STATUS_COLORS[s]),
        borderWidth: 1.5,
        borderRadius: 5,
      }],
    },
    options: {
      responsive: true,
      indexAxis: "y",
      plugins: { legend: { display:false } },
      scales: {
        x: { grid: { color:"rgba(0,0,0,.05)" }, ticks: { stepSize:1 } },
        y: { grid: { display:false } },
      },
    },
  });

  // ── 4. Payment methods donut ──────────────────────────────────
  const payCount = {};
  orders.forEach(o => {
    const pm = o.paymentMethod || "Unknown";
    payCount[pm] = (payCount[pm] || 0) + 1;
  });
  const payLabels = Object.keys(payCount);
  const payPalette = ["#2563eb","#d97706","#059669","#7c3aed","#dc2626"];

  new Chart(document.getElementById("chart-payment"), {
    type: "doughnut",
    data: {
      labels: payLabels,
      datasets: [{
        data: payLabels.map(k => payCount[k]),
        backgroundColor: payPalette.slice(0, payLabels.length),
        borderWidth: 2,
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      cutout: "55%",
      plugins: {
        legend: { position:"bottom" },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed} orders` } },
      },
    },
  });

  // ── 5. Revenue by status ──────────────────────────────────────
  const revByStatus = {};
  STATUSES.forEach(s => revByStatus[s] = 0);
  orders.forEach(o => {
    const s = (o.status || "pending").toLowerCase();
    if (revByStatus[s] !== undefined) revByStatus[s] += parseFloat(o.totalPrice || 0);
  });

  new Chart(document.getElementById("chart-revenue-status"), {
    type: "bar",
    data: {
      labels: STATUSES.map(cap),
      datasets: [{
        label: "Revenue ($)",
        data: STATUSES.map(s => +revByStatus[s].toFixed(2)),
        backgroundColor: STATUSES.map(s => STATUS_COLORS[s] + "99"),
        borderColor: STATUSES.map(s => STATUS_COLORS[s]),
        borderWidth: 1.5,
        borderRadius: 5,
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display:false } },
      scales: {
        x: { grid: { display:false } },
        y: { grid: { color:"rgba(0,0,0,.05)" }, ticks: { callback: v => "$"+v.toLocaleString() } },
      },
    },
  });

  // ── 6. Suborder pipeline (stacked bar by month) ───────────────
  const subMonthData = {};
  allSuborders.forEach(sub => {
    const key = monthKey(parseDate(sub.date));
    if (!subMonthData[key]) subMonthData[key] = {};
    const s = (sub.status || "pending").toLowerCase();
    subMonthData[key][s] = (subMonthData[key][s] || 0) + 1;
  });
  const subSorted = Object.keys(subMonthData).sort();

  new Chart(document.getElementById("chart-suborders"), {
    type: "bar",
    data: {
      labels: subSorted.map(prettyMonth),
      datasets: STATUSES.map(s => ({
        label: cap(s),
        data: subSorted.map(k => subMonthData[k]?.[s] || 0),
        backgroundColor: STATUS_COLORS[s] + "bb",
        borderColor: STATUS_COLORS[s],
        borderWidth: 1,
        borderRadius: 3,
      })),
    },
    options: {
      responsive: true,
      plugins: { legend: { position:"bottom" } },
      scales: {
        x: { stacked:true, grid: { display:false } },
        y: { stacked:true, grid: { color:"rgba(0,0,0,.05)" }, ticks: { stepSize:1 } },
      },
    },
  });

  // ── 7. Top sellers ────────────────────────────────────────────
  const sellerRev = {};
  allSuborders.forEach(sub => {
    const sid = sub.sellerId || "Unknown";
    sellerRev[sid] = (sellerRev[sid] || 0) + parseFloat(sub.subTotal || 0);
  });
  const topSellers = Object.entries(sellerRev).sort((a,b) => b[1]-a[1]).slice(0,8);
  const maxRev     = topSellers[0]?.[1] || 1;
  const container  = document.getElementById("top-sellers-list");

  container.innerHTML = topSellers.length
    ? topSellers.map(([id, rev], i) => `
        <div class="seller-row">
          <span class="text-muted small" style="min-width:20px">${i+1}</span>
          <span style="max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(id)}">${esc(id)}</span>
          <div class="seller-bar-wrap"><div class="seller-bar" style="width:${Math.round(rev/maxRev*100)}%"></div></div>
          <span class="seller-value">$${rev.toFixed(0)}</span>
        </div>`).join("")
    : `<p class="text-muted small">No suborder data.</p>`;

  // ── 8. Monthly revenue bar ────────────────────────────────────
  new Chart(document.getElementById("chart-monthly-bar"), {
    type: "bar",
    data: {
      labels: mLabels,
      datasets: [{
        label: "Revenue ($)",
        data: mRev,
        backgroundColor: mRev.map((v, _, arr) => {
          const ratio = v / Math.max(...arr, 1);
          return ratio > .8 ? "#05966999" : ratio > .5 ? "#2563eb99" : ratio > .2 ? "#d9770699" : "#dc262699";
        }),
        borderColor: mRev.map((v, _, arr) => {
          const ratio = v / Math.max(...arr, 1);
          return ratio > .8 ? "#059669" : ratio > .5 ? "#2563eb" : ratio > .2 ? "#d97706" : "#dc2626";
        }),
        borderWidth: 1.5,
        borderRadius: 5,
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display:false } },
      scales: {
        x: { grid: { display:false } },
        y: { grid: { color:"rgba(0,0,0,.05)" }, ticks: { callback: v => "$"+v.toLocaleString() } },
      },
    },
  });

  // ── Recent orders table ───────────────────────────────────────
  const tbody  = document.getElementById("recent-orders-tbody");
  const recent = [...orders]
    .sort((a,b) => parseDate(b.date) - parseDate(a.date))
    .slice(0, 12);

  tbody.innerHTML = recent.map((o, i) => {
    const date    = parseDate(o.date).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" });
    const status  = (o.status || "pending").toLowerCase();
    const shortId = String(o.id).slice(-8);
    return `
      <tr>
        <td class="text-muted small">${i+1}</td>
        <td class="text-muted small" title="${esc(o.id)}">…${esc(shortId)}</td>
        <td><strong>${esc(o.customer?.name || "—")}</strong></td>
        <td class="text-muted small">${date}</td>
        <td><span class="badge bg-light text-dark border small">${esc(o.paymentMethod||"—")}</span></td>
        <td class="fw-semibold text-success">$${parseFloat(o.totalPrice||0).toFixed(2)}</td>
        <td><span class="status-badge s-${status}">${status}</span></td>
        <td class="text-center text-muted small">${(o.suborders||[]).length}</td>
      </tr>`;
  }).join("");

  // ══════════════════════════════════════════════════════════════
  //  UTILITIES
  // ══════════════════════════════════════════════════════════════

  function parseDate(raw) {
    if (!raw) return new Date();
    const d = new Date(raw);
    return isNaN(d) ? new Date() : d;
  }
  function monthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}`;
  }
  function prettyMonth(key) {
    const [y, m] = key.split("-");
    return new Date(+y, +m-1).toLocaleString("default", { month:"short", year:"2-digit" });
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function fmtMoney(v) { return v >= 1000 ? "$"+(v/1000).toFixed(1)+"k" : "$"+v.toFixed(0); }
  function esc(s) {
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }
});
