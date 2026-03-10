document.addEventListener("DOMContentLoaded", async function () {
  const session = DB.getSession();
  if (!session || session.role !== "admin") {
    window.location.href = "../../index.html";
  }

  function logout() {
    localStorage.removeItem("shop_session");
    window.location.href = "../../login.html";
    console.log(this);
  }

  const usersContainer = document.getElementById("users");
  const searchInput = document.querySelector("input[type='text']");
  const searchBtn = document.querySelector(".btn-outline-secondary");
  const userName = document.getElementById("user-name");
  userName.textContent = session.name;
  // ── Delete modal elements ─────────────────────────────────────
  const deleteModal = new bootstrap.Modal(
    document.getElementById("deleteModal"),
  );
  const deleteUserName = document.getElementById("deleteUserName");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

  // Holds the id of the user currently pending deletion
  let pendingDeleteId = null;

  let users = [];

  // ── Load users from API ──────────────────────────────────────
  try {
    users = await DB.getUsers();
  } catch (err) {
    console.error("Failed to load users:", err);
    usersContainer.innerHTML = `<p class="text-danger">⚠ Could not load users. Make sure JSON Server is running.</p>`;
    return;
  }

  // ── Stats ────────────────────────────────────────────────────
  function updateStats(list) {
    document.getElementById("total-users").textContent = list.length;
    document.getElementById("total-admins").textContent = list.filter(
      (u) => u.role === "admin",
    ).length;
    document.getElementById("total-sellers").textContent = list.filter(
      (u) => u.role === "seller",
    ).length;
    document.getElementById("total-customers").textContent = list.filter(
      (u) => u.role === "customer",
    ).length;
  }

  // ── Render ───────────────────────────────────────────────────
  function renderUsers(filteredUsers) {
    usersContainer.innerHTML = "";

    if (filteredUsers.length === 0) {
      usersContainer.innerHTML = `<p class="text-muted">No users found.</p>`;
      return;
    }

    filteredUsers.forEach((user) => {
      usersContainer.innerHTML += `
        <div class="col-12 col-sm-6 col-lg-3">
          <div class="card h-100 shadow-sm">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">${user.name}</h5>
              <p class="card-text mb-1"><strong>Email:</strong> ${user.email}</p>
              <p class="card-text mb-1"><strong>Role:</strong> ${user.role}</p>
              <p class="card-text"><strong>Address:</strong> ${user.address}</p>
              <div class="mt-auto d-flex justify-content-between">
                <button class="btn btn-primary btn-sm" onclick="editUser('${user.id}')">Edit</button>
                <button class="btn btn-danger  btn-sm" onclick="deleteUser('${user.id}', '${user.name.replace(/'/g, "\\'")}')">Delete</button>
              </div>
            </div>
          </div>
        </div>
      `;
    });
  }

  // ── Search ───────────────────────────────────────────────────
  function handleSearch() {
    const query = searchInput.value.trim().toLowerCase();
    const filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query),
    );
    updateStats(filtered);
    renderUsers(filtered);
  }

  searchBtn.addEventListener("click", handleSearch);
  searchInput.addEventListener("input", handleSearch);
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSearch();
  });

  // ── Delete — open modal ──────────────────────────────────────
  window.deleteUser = function (id, name) {
    pendingDeleteId = id;
    deleteUserName.textContent = name; // show the user's name in the modal body
    deleteModal.show();
  };

  // ── Confirm delete button inside modal ───────────────────────
  confirmDeleteBtn.addEventListener("click", async function () {
    if (!pendingDeleteId) return;

    // Loading state while the API request runs
    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm me-2"></span>Deleting…';

    try {
      await DB.deleteUser(pendingDeleteId);
      users = users.filter((u) => u.id !== pendingDeleteId);
      handleSearch(); // re-render cards + stats
      deleteModal.hide();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("⚠ Could not delete user. Please try again.");
    } finally {
      // Always reset regardless of success / failure
      confirmDeleteBtn.disabled = false;
      confirmDeleteBtn.innerHTML = "Yes, Delete";
      pendingDeleteId = null;
    }
  });

  // Also clear pendingDeleteId if modal is closed without confirming
  document
    .getElementById("deleteModal")
    .addEventListener("hidden.bs.modal", () => {
      pendingDeleteId = null;
    });

  // ── Edit ─────────────────────────────────────────────────────
  window.editUser = function (id) {
    window.location.href = `updateuser.html?id=${id}`;
  };
  document.getElementById("logout-btn").addEventListener("click", logout);

  // Initial render
  updateStats(users);
  renderUsers(users);
});
