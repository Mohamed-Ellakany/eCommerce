let mySession = DB.getSession();
if (mySession?.role == "admin") {
  const tabsOfDashboard = document.querySelectorAll(".nav-item");
  tabsOfDashboard[1].classList.add("d-none");
  tabsOfDashboard[2].classList.add("d-none");
}
