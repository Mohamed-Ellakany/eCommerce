
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


const targetDate = new Date();
targetDate.setDate(targetDate.getDate() + 3);

function updateCountdown() {
  const now = new Date();
  const diff = targetDate - now;
  if (diff <= 0) return;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  document.getElementById("flash-days").textContent = String(days).padStart(
    2,
    "0",
  );
  document.getElementById("flash-hours").textContent = String(hours).padStart(
    2,
    "0",
  );
  document.getElementById("flash-minutes").textContent = String(
    minutes,
  ).padStart(2, "0");
  document.getElementById("flash-seconds").textContent = String(
    seconds,
  ).padStart(2, "0");
}
updateCountdown();
setInterval(updateCountdown, 1000);

// ===== Slider Logic =====
function initializeSliders() {
    const sections = document.querySelectorAll('.flash-sales');
    
    sections.forEach((section, index) => {
        const track = section.querySelector('.flash-products');
        const prevBtn = section.querySelector('.flash-nav-btn:first-child');
        const nextBtn = section.querySelector('.flash-nav-btn:last-child');
        
        if (!track || !prevBtn || !nextBtn) return;
        
        const cardWidth = 270 + 16; 
        let currentIndex = 0;

        function getVisibleCount() {
            const wrapper = track.parentElement;
            return Math.floor(wrapper.offsetWidth / cardWidth);
        }

        function slideTo(index) {
            const cards = track.querySelectorAll(".flash-product-card");
            const maxIndex = Math.max(0, cards.length - getVisibleCount());
            currentIndex = Math.max(0, Math.min(index, maxIndex));
            track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
        }

        const newPrevBtn = prevBtn.cloneNode(true);
        const newNextBtn = nextBtn.cloneNode(true);
        
        prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
        nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
        
        newNextBtn.addEventListener("click", () => slideTo(currentIndex + 1));
        newPrevBtn.addEventListener("click", () => slideTo(currentIndex - 1));

        window.addEventListener("resize", () => slideTo(currentIndex));
        
        slideTo(0);
    });
}

document.addEventListener("DOMContentLoaded", initializeSliders);