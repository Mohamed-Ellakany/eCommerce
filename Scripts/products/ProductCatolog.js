/* ============================
   Global Variables
============================ */

let allProducts = [];

let currentCategory = "all";
let currentSearch = "";

let currentPage = 1;
let productsPerPage = 5;

var ProductCatologDiv = document.getElementById("ProductCatolog");

let SearchInput = document.getElementById("SearchInput");
let filtersButtons = document.querySelectorAll(".filter-btn");


/* ============================
   Fetch Products
============================ */

async function getProducts() {

  const response = await fetch(
    "https://json-server-for-ecomerce-app-cst.vercel.app/products"
  );

  const data = await response.json();

  allProducts = data;

  let params = new URLSearchParams(window.location.search);
  let categoryFromURL = params.get("category");

  if (categoryFromURL) {
    currentCategory = categoryFromURL.toLowerCase();
  }

  applyFilters();
}

getProducts();


/* ============================
   Display Products
============================ */

function displayProducts(productList) {

  ProductCatologDiv.innerHTML = "";

  if (productList.length === 0) {

    ProductCatologDiv.innerHTML =
      `<h4 class="text-center alert alert-danger">No Products Found</h4>`;

    return;
  }

  productList.forEach(product => {

    ProductCatologDiv.innerHTML += `
    
<div class="flash-product-card flex-shrink-0 pb-4 flex-wrap col-sm-6 col-md-4 col-lg-3">

  <div class="product-img-wrap position-relative">

    <span class="discount-badge">-35%</span>

    <a href="../../pages/products/productDetails.html?id=${product.id}">
      <img src="${product.images[0]}" alt="${product.name}" class="w-100">
    </a>

    <div class="product-actions position-absolute d-flex flex-column gap-2">

      <button class="wishlist-toggle-btn action-btn border-none d-flex justify-content-center align-items-center"
              aria-label="Add to wishlist"
              title="Add to wishlist"
              data-product-id="${product.id}">
        <i class="fa-regular fa-heart"></i>
      </button>

    </div>
    <div class="pt-2">
      <p class="product-name mb-1">${productList[i].name}</p>
      <div class="d-flex gap-2 align-items-center mb-1">
        <span class="price-new">$${productList[i].price}</span>
        <span class="price-old">$1160</span>
      </div>
      <div class="d-flex align-items-center gap-1">
        <div class="stars" style="color:#FFAD33;">
          <i class="fas fa-star"></i><i class="fas fa-star"></i>
          <i class="fas fa-star"></i><i class="fas fa-star"></i>
          <i class="fas fa-star-half-alt"></i>
        </div>
        <span class="review-count">(${productList[i].stock})</span>
      </div>

      <span class="review-count">(75)</span>

    </div>

  </div>

</div>

`;

  });

  WL.initButtons();
}


/* ============================
   Filters + Pagination
============================ */

function applyFilters() {

  let filtered = allProducts;

  /* Remove Out Of Stock */

  filtered = filtered.filter(p => (p.stock || 0) > 0);

  /* Category Filter */

  if (currentCategory !== "all") {

    filtered = filtered.filter(
      p => p.category.toLowerCase() === currentCategory
    );

  }

  /* Search Filter */

  if (currentSearch !== "") {

    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(currentSearch)
    );

  }

  /* Pagination */

  const start = (currentPage - 1) * productsPerPage;
  const end = start + productsPerPage;

  const paginatedProducts = filtered.slice(start, end);

  displayProducts(paginatedProducts);

  renderPagination(filtered.length);

}


/* ============================
   Pagination
============================ */

function renderPagination(totalProducts) {

  const paginationDiv = document.getElementById("pagination");

  if (!paginationDiv) return;

  paginationDiv.innerHTML = "";

  const totalPages = Math.ceil(totalProducts / productsPerPage);


  /* PREV BUTTON */

  const prevBtn = document.createElement("button");

  prevBtn.innerText = "Prev";

  prevBtn.className = "btn btn-outline-dark m-1";

  prevBtn.disabled = currentPage === 1;

  prevBtn.addEventListener("click", () => {

    currentPage--;

    applyFilters();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  });

  paginationDiv.appendChild(prevBtn);


  /* PAGE NUMBERS */

  for (let i = 1; i <= totalPages; i++) {

    const btn = document.createElement("button");

    btn.innerText = i;

    btn.className = "btn btn-outline-dark m-1";

    if (i === currentPage) {
      btn.classList.add("active");
    }

    btn.addEventListener("click", () => {

      currentPage = i;

      applyFilters();

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

    });

    paginationDiv.appendChild(btn);
  }


  /* NEXT BUTTON */

  const nextBtn = document.createElement("button");

  nextBtn.innerText = "Next";

  nextBtn.className = "btn btn-outline-dark m-1";

  nextBtn.disabled = currentPage === totalPages;

  nextBtn.addEventListener("click", () => {

    currentPage++;

    applyFilters();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  });

  paginationDiv.appendChild(nextBtn);

}


/* ============================
   Category Filter
============================ */

filtersButtons.forEach(btn => {

  btn.addEventListener("click", function () {

    filtersButtons.forEach(b => b.classList.remove("active"));

    this.classList.add("active");

    currentCategory = this.dataset.category.toLowerCase();

    currentPage = 1;

    applyFilters();

  });

});


/* ============================
   Search
============================ */

SearchInput.addEventListener("keyup", function () {

  currentSearch = this.value.toLowerCase();

  currentPage = 1;

  applyFilters();

});