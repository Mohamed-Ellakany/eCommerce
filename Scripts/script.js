/* ═══════════════════════════════════════════
   script.js — Shared nav/auth logic
   Works from any page depth in the project
═══════════════════════════════════════════ */

/* ─────────────────────────────────────────
   Root path helper
   Calculates "../" repeats needed to get
   back to project root from any page
───────────────────────────────────────── */
function getRootPath() {
  const segments = window.location.pathname.split("/").filter(Boolean);
  const depth = segments.length - 1; // subtract 1 for the filename
  return depth > 0 ? "../".repeat(depth) : "";
}

/* ─────────────────────────────────────────
   Logout
───────────────────────────────────────── */
function logout() {
  localStorage.removeItem("shop_session");
  // ✅ Always lands on login regardless of current page
  window.location.href = getRootPath() + "pages/Auth/login.html";
}

/* ─────────────────────────────────────────
   Cart badge
───────────────────────────────────────── */
function updateNavBadge() {
  const count = Cart.totalQty();
  const badge = document.getElementById("navCartCount");
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? "flex" : "none";
  }
}

/* ─────────────────────────────────────────
   On load — auth state + nav setup
───────────────────────────────────────── */
window.onload = async function () {
  const root     = getRootPath();
  const userData = localStorage.getItem("shop_session");

  if (userData) {
    const user = JSON.parse(userData);

    // Profile link
    const profileLink = document.getElementById("profileLink");
    if (profileLink) {
      profileLink.textContent = "Profile";
      profileLink.href = root + "pages/landpage/Profile.html";
    }

    // Hide Sign Up
    const signUpLink = document.getElementById("signUp");
    if (signUpLink) signUpLink.textContent = "";

    // Show logout button
    const logoutBtn = document.getElementById("logout");
    if (logoutBtn) {
      logoutBtn.classList.remove("d-none");
      // Use { once: true } so listener never fires twice on re-renders
      logoutBtn.addEventListener("click", logout, { once: true });
    }
  }

  updateNavBadge();

  // Wishlist badge (WL may not be loaded on every page)
  if (typeof WL !== "undefined") {
    await WL.updateBadge();
  }
};