document.addEventListener("DOMContentLoaded", async function () {
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

  let users = [];
  try {
    users = await DB.getUsers();
  } catch (err) {
    console.error("Failed to load users:", err);
    return;
  }

  const admins = users.filter((u) => u.role === "admin");
  const sellers = users.filter((u) => u.role === "seller");
  const customers = users.filter((u) => u.role === "customer");

  document.getElementById("kpi-total").textContent = users.length;
  document.getElementById("kpi-admins").textContent = admins.length;
  document.getElementById("kpi-sellers").textContent = sellers.length;
  document.getElementById("kpi-customers").textContent = customers.length;

  Chart.defaults.color = "#6c757d";
  Chart.defaults.font.family = "inherit";
  Chart.defaults.plugins.legend.labels.boxWidth = 12;
  Chart.defaults.plugins.legend.labels.padding = 14;

  const COLORS = {
    admin: "#7c3aed",
    seller: "#059669",
    customer: "#2563eb",
    line: "#dc3545",
    cum: "#0d6efd",
  };

  const monthCounts = {};
  users.forEach((u, idx) => {
    let date = u.createdAt
      ? new Date(u.createdAt)
      : (() => {
          const d = new Date();
          d.setMonth(d.getMonth() - (idx % 6));
          return d;
        })();
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthCounts[key] = (monthCounts[key] || 0) + 1;
  });
  const sortedMonths = Object.keys(monthCounts).sort();
  const monthLabels = sortedMonths.map((k) => {
    const [y, m] = k.split("-");
    return new Date(+y, +m - 1).toLocaleString("default", {
      month: "short",
      year: "2-digit",
    });
  });
  const monthData = sortedMonths.map((k) => monthCounts[k]);
  const cumData = monthData.reduce((acc, v, i) => {
    acc.push((acc[i - 1] || 0) + v);
    return acc;
  }, []);

  new Chart(document.getElementById("chart-timeline"), {
    type: "line",
    data: {
      labels: monthLabels,
      datasets: [
        {
          label: "New Users",
          data: monthData,
          borderColor: COLORS.line,
          backgroundColor: "rgba(220,53,69,.08)",
          fill: true,
          tension: 0.4,
          pointBackgroundColor: COLORS.line,
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2,
          yAxisID: "y",
        },
        {
          label: "Total (Cumulative)",
          data: cumData,
          borderColor: COLORS.cum,
          backgroundColor: "rgba(13,110,253,.06)",
          fill: true,
          tension: 0.4,
          pointBackgroundColor: COLORS.cum,
          pointRadius: 3,
          borderWidth: 1.5,
          borderDash: [5, 3],
          yAxisID: "y2",
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { mode: "index", intersect: false },
      plugins: { legend: { position: "bottom" } },
      scales: {
        x: { grid: { color: "rgba(0,0,0,.05)" } },
        y: {
          grid: { color: "rgba(0,0,0,.05)" },
          position: "left",
          ticks: { stepSize: 1 },
        },
        y2: {
          grid: { display: false },
          position: "right",
          ticks: { stepSize: 1 },
        },
      },
    },
  });

  new Chart(document.getElementById("chart-donut"), {
    type: "doughnut",
    data: {
      labels: ["Admins", "Sellers", "Customers"],
      datasets: [
        {
          data: [admins.length, sellers.length, customers.length],
          backgroundColor: [COLORS.admin, COLORS.seller, COLORS.customer],
          borderWidth: 2,
          hoverOffset: 6,
        },
      ],
    },
    options: {
      responsive: true,
      cutout: "65%",
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label: (ctx) =>
              ` ${ctx.label}: ${ctx.parsed} (${Math.round((ctx.parsed / users.length) * 100)}%)`,
          },
        },
      },
    },
  });

  new Chart(document.getElementById("chart-bar"), {
    type: "bar",
    data: {
      labels: ["Admins", "Sellers", "Customers"],
      datasets: [
        {
          label: "Users",
          data: [admins.length, sellers.length, customers.length],
          backgroundColor: [
            "rgba(124,58,237,.7)",
            "rgba(5,150,105,.7)",
            "rgba(37,99,235,.7)",
          ],
          borderColor: [COLORS.admin, COLORS.seller, COLORS.customer],
          borderWidth: 1.5,
          borderRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      indexAxis: "y",
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: "rgba(0,0,0,.05)" }, ticks: { stepSize: 1 } },
        y: { grid: { display: false } },
      },
    },
  });

  new Chart(document.getElementById("chart-polar"), {
    type: "polarArea",
    data: {
      labels: ["Admins", "Sellers", "Customers"],
      datasets: [
        {
          data: [admins.length, sellers.length, customers.length],
          backgroundColor: [
            "rgba(124,58,237,.55)",
            "rgba(5,150,105,.55)",
            "rgba(37,99,235,.55)",
          ],
          borderColor: [COLORS.admin, COLORS.seller, COLORS.customer],
          borderWidth: 1.5,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } },
      scales: {
        r: {
          grid: { color: "rgba(0,0,0,.06)" },
          ticks: { display: false },
        },
      },
    },
  });

  const tbody = document.getElementById("recent-users-tbody");
  const sorted = [...users]
    .sort((a, b) =>
      a.createdAt && b.createdAt
        ? new Date(b.createdAt) - new Date(a.createdAt)
        : 0,
    )
    .slice(0, 10);

  if (!sorted.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No users found.</td></tr>`;
    return;
  }

  tbody.innerHTML = sorted
    .map((u, i) => {
      const joined = u.createdAt
        ? new Date(u.createdAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "—";
      return `
      <tr>
        <td class="text-muted small">${i + 1}</td>
        <td><strong>${esc(u.name)}</strong></td>
        <td class="text-muted small">${esc(u.email)}</td>
        <td><span class="role-badge role-${u.role}">${u.role}</span></td>
        <td class="text-muted small">${joined}</td>
      </tr>`;
    })
    .join("");

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
});
