document.addEventListener("DOMContentLoaded", function () {
  const users = JSON.parse(localStorage.getItem("shop_users")) || [];
  const usersContainer = document.getElementById("users");
  const searchInput = document.querySelector("input[type='text']");
  const searchBtn = document.querySelector(".btn-outline-secondary");

  // ✅ Update Stats
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
                <button class="btn btn-primary btn-sm">Edit</button>
                <button class="btn btn-danger btn-sm">Delete</button>
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
    // ✅ Update stats to reflect search results
    updateStats(filtered);
    renderUsers(filtered);
  }

  searchBtn.addEventListener("click", handleSearch);
  searchInput.addEventListener("input", handleSearch);
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSearch();
  });

  // Initial render
  updateStats(users);
  renderUsers(users);
});
