// ══════════════════════════════════════════════════════════════════
//  seller-orders.js
//  Displays only the suborders that belong to the logged-in seller.
//  Allows updating the status of each suborder.
// ══════════════════════════════════════════════════════════════════

(async () => {
  // ── 1. Auth guard ──────────────────────────────────────────────
  const session = DB.getSession();
  if (!session || session.role !== "seller") {
    alert("Access denied. Please log in as a seller.");
    window.location.href = "../../index.html";
    return;
  }

  // ── 2. Populate navbar username & logout ───────────────────────
  const userNameEl = document.getElementById("user-name");
  if (userNameEl) userNameEl.textContent = session.name;

  document.getElementById("logout-btn")?.addEventListener("click", (e) => {
    e.preventDefault();
    DB.clearSession();
    window.location.href = "../../index.html";
  });

  // ── 3. State ───────────────────────────────────────────────────
  let allSuborders = []; // flat list of this seller's suborders
  let activeFilter = "all";
  let searchTerm = "";

  // We need to track which parent order each suborder belongs to
  // so we can PATCH the right place. We'll store parentOrderId on each suborder.

  // ── 4. Fetch & flatten ─────────────────────────────────────────
  async function loadOrders() {
    try {
      const orders = await DB.getOrders(); // all orders
      allSuborders = [];

      orders.forEach((order) => {
        if (!Array.isArray(order.suborders)) return;
        order.suborders.forEach((sub) => {
          if (String(sub.sellerId) === String(session.id)) {
            // attach parent info for display
            allSuborders.push({
              ...sub,
              _parentOrderId: order.id,
              _orderDate: order.date,
              _paymentMethod: order.paymentMethod,
            });
          }
        });
      });

      renderStats();
      renderCards();
    } catch (err) {
      console.error("[seller-orders] loadOrders error:", err);
      document.getElementById("orders-container").innerHTML = `
        <div class="col-12">
          <div class="alert alert-danger">Failed to load orders. Please try again.</div>
        </div>`;
    }
  }

  // ── 5. Stats ───────────────────────────────────────────────────
  function renderStats() {
    document.getElementById("stat-total").textContent = allSuborders.length;
    document.getElementById("stat-pending").textContent = allSuborders.filter(
      (s) => s.status === "pending",
    ).length;
    document.getElementById("stat-shipped").textContent = allSuborders.filter(
      (s) => s.status === "shipped",
    ).length;
    document.getElementById("stat-delivered").textContent = allSuborders.filter(
      (s) => s.status === "delivered",
    ).length;
  }

  // ── 6. Filter + search ─────────────────────────────────────────
  function getFiltered() {
    return allSuborders.filter((sub) => {
      const matchFilter = activeFilter === "all" || sub.status === activeFilter;
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !q ||
        sub.id.toLowerCase().includes(q) ||
        (sub.customer?.name || "").toLowerCase().includes(q) ||
        sub.products.some((p) => p.name.toLowerCase().includes(q));
      return matchFilter && matchSearch;
    });
  }

  // ── 7. Render cards ────────────────────────────────────────────
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
      .map((sub, idx) => buildCard(sub, idx))
      .join("");

    // bind edit-status buttons
    container.querySelectorAll(".btn-edit-status").forEach((btn) => {
      btn.addEventListener("click", () =>
        openEditModal(
          btn.dataset.subid,
          btn.dataset.parentid,
          btn.dataset.status,
        ),
      );
    });
  }

  // ── 8. Build a single card ─────────────────────────────────────
  function buildCard(sub, idx) {
    const date = new Date(sub._orderDate || sub.date).toLocaleDateString(
      "en-GB",
      { day: "2-digit", month: "short", year: "numeric" },
    );
    const badgeCls = `badge-status status-${sub.status}`;

    const productsHtml = (sub.products || [])
      .map(
        (p) => `
      <div class="product-row">
        <img
          src="${p.image || "https://via.placeholder.com/52"}"
          alt="${p.name}"
          class="product-thumb"
          onerror="this.src='https://via.placeholder.com/52'"
        />
        <div class="product-info">
          <div class="product-name">${p.name}</div>
          <div class="product-meta">Qty: ${p.quantity} &nbsp;·&nbsp; $${(p.price * p.quantity).toFixed(2)}</div>
        </div>
        <div class="fw-semibold text-nowrap">$${p.price.toFixed(2)}</div>
      </div>`,
      )
      .join("");

    return `
      <div class="col-12 col-md-6 col-xl-4" style="animation-delay:${idx * 0.05}s">
        <div class="order-card">

          <div class="order-card-header">
            <div>
              <div class="order-id"># ${sub.id}</div>
              <div class="order-date">${date} &nbsp;·&nbsp; ${sub._paymentMethod || "N/A"}</div>
            </div>
            <span class="${badgeCls}">${sub.status}</span>
          </div>

          <div class="order-card-body">
            <div class="customer-strip">
              <span><i class="fas fa-user"></i>${sub.customer?.name || "Unknown"}</span>
              <span><i class="fas fa-map-marker-alt"></i>${sub.customer?.address || "—"}</span>
            </div>
            ${productsHtml}
          </div>

          <div class="order-card-footer">
            <div class="subtotal">Subtotal: <span>$${(sub.subTotal || 0).toFixed(2)}</span></div>
            <button
              class="btn btn-sm btn-outline-primary btn-edit-status"
              data-subid="${sub.id}"
              data-parentid="${sub._parentOrderId}"
              data-status="${sub.status}"
            >
              <i class="fas fa-pencil-alt me-1"></i> Edit Status
            </button>
          </div>

        </div>
      </div>`;
  }

  // ── 9. Edit status modal ───────────────────────────────────────
  let _editSubId = null;
  let _editParentId = null;

  function openEditModal(subId, parentId, currentStatus) {
    _editSubId = subId;
    _editParentId = parentId;
    document.getElementById("modal-order-id").textContent = subId;
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
        // 1. Fetch the fresh parent order
        const parentOrder = await DB.getOrderById(_editParentId);
        if (!parentOrder) throw new Error("Parent order not found");

        // 2. Update the target suborder's status
        const updatedSuborders = parentOrder.suborders.map((sub) =>
          sub.id === _editSubId ? { ...sub, status: newStatus } : sub,
        );

        // 3. Determine the parent order's new status:
        //    - If ALL suborders share the same status → parent = that status
        //    - Otherwise → parent = "pending"
        const allStatuses = updatedSuborders.map((s) => s.status);
        const uniqueStatuses = [...new Set(allStatuses)];
        const parentStatus =
          uniqueStatuses.length === 1 ? uniqueStatuses[0] : "pending";

        // 4. Persist both changes in one PATCH
        await DB.updateOrder(_editParentId, {
          suborders: updatedSuborders,
          status: parentStatus,
        });

        // 5. Sync local state
        const target = allSuborders.find((s) => s.id === _editSubId);
        if (target) target.status = newStatus;

        renderStats();
        renderCards();

        bootstrap.Modal.getInstance(
          document.getElementById("editStatusModal"),
        ).hide();
      } catch (err) {
        console.error("[seller-orders] save status error:", err);
        alert("Failed to update status. Please try again.");
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<i class="fas fa-save me-1"></i> Save`;
      }
    });

  // ── 10. Filter chips ───────────────────────────────────────────
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

  // ── 11. Search ────────────────────────────────────────────────
  document.getElementById("search-input").addEventListener("input", (e) => {
    searchTerm = e.target.value.trim();
    renderCards();
  });

  // ── 12. Bootstrap guard: add updateOrder to DB if missing ─────
  //  DB.js doesn't expose updateOrder by name — it uses updateProduct etc.
  //  We'll patch it here so seller-orders works without touching DB.js.
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

  // ── 13. Init ──────────────────────────────────────────────────
  await loadOrders();
})();
