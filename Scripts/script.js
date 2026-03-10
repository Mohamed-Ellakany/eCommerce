function logout() {
  localStorage.removeItem("shop_session");
  window.location.href = "../pages/Auth/login.html";
}

function updateNavBadge() {
  const count = Cart.totalQty();
  const badge = document.getElementById("navCartCount");
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? "flex" : "none";
  }
}


window.onload=function () {
    let userData = localStorage.getItem("shop_session");
    if (userData) {
      userData = JSON.parse(userData);
      const profileLink = document.getElementById("profileLink");
      profileLink.textContent = "Profile";
      profileLink.href = "../pages/landpage/Profile.html";
      const signUpLink = document.getElementById("signUp");
      signUpLink.textContent = "";
      const logoutBtn = document.getElementById("logout");
      logoutBtn.classList.remove("d-none");
      console.log(logout);
      logoutBtn.addEventListener("click", logout);
    }
}