const toggleBtn = document.getElementById("sidebarToggle");
const sidebarMenu = document.getElementById("sidebarMenu");
const closeBtn = document.getElementById("sidebarClose");

const overlay = document.createElement("div");
overlay.className = "sidebar-overlay";
document.body.appendChild(overlay);

toggleBtn?.addEventListener("click", () => {
  const isOpen = sidebarMenu.classList.toggle("open");
  toggleBtn.setAttribute("aria-expanded", isOpen);
  overlay.classList.toggle("active");

  document.body.style.overflow = isOpen ? "hidden" : "";
});

closeBtn?.addEventListener("click", () => {
  sidebarMenu.classList.remove("open");
  overlay.classList.remove("active");
  toggleBtn?.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
});

overlay.addEventListener("click", () => {
  sidebarMenu.classList.remove("open");
  overlay.classList.remove("active");
  toggleBtn?.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
});

document.querySelectorAll("aside ul li").forEach((li) => {
  li.addEventListener("click", () => {
    document
      .querySelectorAll("aside ul li")
      .forEach((el) => el.classList.remove("active"));
    li.classList.add("active");
  });
});

window.addEventListener("resize", () => {
  if (window.innerWidth >= 768) {
    sidebarMenu.classList.remove("open");
    overlay.classList.remove("active");
    document.body.style.overflow = "";
  }
});
