(async () => {
  const session = DB.getSession();
  if (!session || session.role !== "admin") {
    alert("Access denied. Admins only.");
    window.location.href = "../../index.html";
    return;
  }

  const userNameEl = document.getElementById("user-name");
  if (userNameEl) userNameEl.textContent = session.name;

  document.getElementById("logout-btn")?.addEventListener("click", (e) => {
    e.preventDefault();
    DB.clearSession();
    window.location.href = "../../index.html";
  });

  if (!DB.updateOrder) {
    DB.updateOrder = async (id, changes) => {
      const res = await fetch(`${API_URL}/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      if (!res.ok) throw new Error(`updateOrder failed: ${res.status}`);
      return res.json();
    };
  }

  let allOrders = [];
  let activeFilter = "all";
  let searchTerm = "";

  async function loadOrders() {
    try {
      allOrders = await DB.getOrders();
      renderStats();
      renderCards();
    } catch (err) {
      console.error("[admin-orders] loadOrders error:", err);
      document.getElementById("orders-container").innerHTML = `
        <div class="col-12">
          <div class="alert alert-danger">Failed to load orders. Please try again.</div>
        </div>`;
    }
  }

  function renderStats() {
    document.getElementById("stat-total").textContent = allOrders.length;
    document.getElementById("stat-pending").textContent = allOrders.filter(
      (o) => o.status === "pending",
    ).length;
    document.getElementById("stat-shipped").textContent = allOrders.filter(
      (o) => o.status === "shipped",
    ).length;
    document.getElementById("stat-delivered").textContent = allOrders.filter(
      (o) => o.status === "delivered",
    ).length;
  }

  function getFiltered() {
    return allOrders.filter((order) => {
      const matchFilter =
        activeFilter === "all" || order.status === activeFilter;
      const q = searchTerm.toLowerCase();
      if (!q) return matchFilter;
      const matchSearch =
        order.id.toLowerCase().includes(q) ||
        (order.customer?.name || "").toLowerCase().includes(q) ||
        (order.suborders || []).some((sub) =>
          sub.products?.some((p) => p.name.toLowerCase().includes(q)),
        );
      return matchFilter && matchSearch;
    });
  }

  function renderCards() {
    const container = document.getElementById("orders-container");
    const filtered = getFiltered();

    if (!filtered.length) {
      container.innerHTML = `
        <div class="col-12">
          <div class="empty-state">
            <i class="fas fa-box-open"></i>
            <h5>No orders found</h5>
            <p>Try changing your filter or search term.</p>
          </div>
        </div>`;
      return;
    }

    container.innerHTML = filtered
      .map((order, idx) => buildOrderCard(order, idx))
      .join("");

    container.querySelectorAll(".btn-edit-overall").forEach((btn) => {
      btn.addEventListener("click", () =>
        openEditModal(btn.dataset.orderid, btn.dataset.status),
      );
    });
  }

  function buildOrderCard(order, idx) {
    const date = new Date(order.date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const badgeCls = `badge-status status-${order.status}`;
    const suborders = order.suborders || [];

    const subordersHtml = suborders
      .map((sub) => buildSuborderBlock(sub))
      .join("");

    return `
      <div class="col-12 col-xl-6" style="animation-delay:${idx * 0.06}s">
        <div class="order-card">

          <!-- Parent order header -->
          <div class="order-card-header">
            <div>
              <div class="order-id"><i class="fas fa-receipt me-2 opacity-50"></i>Order #${order.id}</div>
              <div class="order-date mt-1">
                ${date}
                &nbsp;·&nbsp;
                <i class="fas fa-credit-card me-1 opacity-50"></i>${order.paymentMethod || "N/A"}
              </div>
            </div>
            <div class="d-flex flex-column align-items-end gap-1">
              <span class="${badgeCls}">${order.status}</span>
              <div class="order-total">$${(order.totalPrice || 0).toFixed(2)}</div>
            </div>
          </div>

          <!-- Customer info -->
          <div class="px-3 pt-3">
            <div class="customer-strip">
              <span><i class="fas fa-user"></i>${order.customer?.name || "Unknown"}</span>
              <span><i class="fas fa-envelope"></i>${order.customer?.email || "—"}</span>
              <span><i class="fas fa-map-marker-alt"></i>${order.customer?.address || "—"}</span>
            </div>
          </div>

          <!-- Suborders -->
          <div class="px-3 pb-2">
            <div class="text-muted small fw-semibold mb-2">
              <i class="fas fa-layer-group me-1"></i>${suborders.length} Suborder${suborders.length !== 1 ? "s" : ""}
            </div>
            ${subordersHtml}
          </div>

          <!-- Footer: overall status button -->
          <div class="order-card-footer">
            <div class="text-muted small">
              Total: <strong class="text-dark">$${(order.totalPrice || 0).toFixed(2)}</strong>
            </div>
            <button
              class="btn btn-sm btn-primary btn-edit-overall"
              data-orderid="${order.id}"
              data-status="${order.status}"
            >
              <i class="fas fa-pen me-1"></i> Edit Overall Status
            </button>
          </div>

        </div>
      </div>`;
  }

  function buildSuborderBlock(sub) {
    const badgeCls = `badge-status status-${sub.status}`;
    const productsHtml = (sub.products || [])
      .map(
        (p) => `
      <div class="product-row">
        <img
          src="${p.image || "https://via.placeholder.com/48"}"
          alt="${p.name}"
          class="product-thumb"
          onerror="this.onerror=null;this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22 viewBox=%220 0 48 48%22%3E%3Crect width=%2248%22 height=%2248%22 fill=%22%23e2e8f0%22 rx=%226%22/%3E%3Ctext x=%2250%25%22 y=%2255%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2220%22%3E📦%3C/text%3E%3C/svg%3E'"
        />
        <div class="product-info">
          <div class="product-name">${p.name}</div>
          <div class="product-meta">Qty: ${p.quantity} &nbsp;·&nbsp; $${p.price.toFixed(2)} each</div>
        </div>
        <div class="fw-semibold text-nowrap text-success">$${(p.price * p.quantity).toFixed(2)}</div>
      </div>`,
      )
      .join("");

    return `
      <div class="suborder-block">
        <div class="suborder-header">
          <div>
            <div class="suborder-id"><i class="fas fa-store me-1 opacity-60"></i>Sub #${sub.id}</div>
            <div class="suborder-seller">Seller ID: ${sub.sellerId}</div>
          </div>
          <span class="${badgeCls}">${sub.status}</span>
        </div>
        ${productsHtml}
        <div class="suborder-subtotal">Subtotal: $${(sub.subTotal || 0).toFixed(2)}</div>
      </div>`;
  }

  let _editOrderId = null;

  function openEditModal(orderId, currentStatus) {
    _editOrderId = orderId;
    document.getElementById("modal-order-id").textContent = orderId;
    document.getElementById("status-select").value = currentStatus;
    new bootstrap.Modal(document.getElementById("editStatusModal")).show();
  }

  document
    .getElementById("btn-save-status")
    .addEventListener("click", async () => {
      const newStatus = document.getElementById("status-select").value;
      const saveBtn = document.getElementById("btn-save-status");

      saveBtn.disabled = true;
      saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Saving…`;

      try {
        const parentOrder = await DB.getOrderById(_editOrderId);
        if (!parentOrder) throw new Error("Order not found");

        const updatedSuborders = (parentOrder.suborders || []).map((sub) => ({
          ...sub,
          status: newStatus,
        }));

        await DB.updateOrder(_editOrderId, {
          status: newStatus,
          suborders: updatedSuborders,
        });

        const localOrder = allOrders.find((o) => o.id === _editOrderId);
        if (localOrder) {
          localOrder.status = newStatus;
          localOrder.suborders = updatedSuborders;
        }

        renderStats();
        renderCards();

        bootstrap.Modal.getInstance(
          document.getElementById("editStatusModal"),
        ).hide();
      } catch (err) {
        console.error("[admin-orders] save status error:", err);
        alert("Failed to update status. Please try again.");
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<i class="fas fa-save me-1"></i> Save`;
      }
    });

  document.getElementById("filter-chips").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    document
      .querySelectorAll(".chip")
      .forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    activeFilter = chip.dataset.status;
    renderCards();
  });

  document.getElementById("search-input").addEventListener("input", (e) => {
    searchTerm = e.target.value.trim();
    renderCards();
  });

  await loadOrders();
})();
