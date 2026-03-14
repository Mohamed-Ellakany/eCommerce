document.addEventListener("DOMContentLoaded", async function () {
  const session = DB.getSession();
  if (!session || session.role !== "admin") {
    window.location.href = "../../index.html";
  }

  function logout() {
    localStorage.removeItem("shop_session");
    window.location.href = "../../pages/Auth/login.html";
  }

  const usersContainer = document.getElementById("users");
  const searchInput = document.querySelector("input[type='text']");
  const searchBtn = document.querySelector(".btn-outline-secondary");
  const userName = document.getElementById("user-name");
  userName.textContent = session.name;

  const deleteModal = new bootstrap.Modal(
    document.getElementById("deleteModal"),
  );
  const deleteUserName = document.getElementById("deleteUserName");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

  let pendingDeleteId = null;

  let users = [];

  try {
    users = await DB.getUsers();
  } catch (err) {
    console.error("Failed to load users:", err);
    usersContainer.innerHTML = `<p class="text-danger">⚠ Could not load users. Make sure JSON Server is running.</p>`;
    return;
  }

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

  window.deleteUser = function (id, name) {
    pendingDeleteId = id;
    deleteUserName.textContent = name;
    deleteModal.show();
  };

  confirmDeleteBtn.addEventListener("click", async function () {
    if (!pendingDeleteId) return;

    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm me-2"></span>Deleting…';

    try {
      await DB.deleteUser(pendingDeleteId);
      users = users.filter((u) => u.id !== pendingDeleteId);
      handleSearch();
      deleteModal.hide();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("⚠ Could not delete user. Please try again.");
    } finally {
      confirmDeleteBtn.disabled = false;
      confirmDeleteBtn.innerHTML = "Yes, Delete";
      pendingDeleteId = null;
    }
  });

  document
    .getElementById("deleteModal")
    .addEventListener("hidden.bs.modal", () => {
      pendingDeleteId = null;
    });

  window.editUser = function (id) {
    window.location.href = `updateuser.html?id=${id}`;
  };
  document.getElementById("logout-btn").addEventListener("click", logout);

  updateStats(users);
  renderUsers(users);
});
