function logout() {
  localStorage.removeItem("shop_session");
  window.location.href = "../login.html";
  console.log(this);
}



window.onload=function () {
    let userData = localStorage.getItem("shop_session");
    if (userData) {
      userData = JSON.parse(userData);
      const profileLink = document.getElementById("profileLink");
      profileLink.textContent = "Profile";
      profileLink.href = "../Profile.html";
      const signUpLink = document.getElementById("signUp");
      signUpLink.textContent = "";
      const logoutBtn = document.getElementById("logout");
      logoutBtn.classList.remove("d-none");
      console.log(logout);
      logoutBtn.addEventListener("click", logout);
    }
}