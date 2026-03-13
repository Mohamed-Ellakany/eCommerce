let allProducts = [];
async function getProducts() {
  let response = await fetch(
    "https://json-server-for-ecomerce-app-cst.vercel.app/products",
  );

  let params = new URLSearchParams(window.location.search);
  let categoryFromURL = params.get("category");

  let data = await response.json();

  let filteredProducts;

  allProducts = data;

  if (categoryFromURL) {
    filteredProducts = allProducts.filter(
      (p) => p.category.toLowerCase() === categoryFromURL.toLocaleLowerCase(),
    );
  } else {
    filteredProducts = allProducts;
  }

  displayProducts(filteredProducts);
}

getProducts();

for (let i = 0; i < allProducts.length; i++) {
  console.log(allProducts[i].images);
}

var ProductCatologDiv = document.getElementById("ProductCatolog");

function displayProducts(productList) {
  ProductCatologDiv.innerHTML = "";
  if (productList.length > 0) {
    for (let i = 0; i < productList.length; i++) {
      ProductCatologDiv.innerHTML += `  
        <div 
        class="flash-product-card flex-shrink-0 pb-4   flex-wrap  col-sm-6 col-md-4 col-lg-3">

                    <div class="product-img-wrap position-relative ">
                        <span class="discount-badge">-35%</span>
                        <a href="../../pages/products/productDetails.html?id=${productList[i].id}">
                        <img src="${productList[i].images[0]}" alt="${productList[i].name}" class="w-100">
                        </a>
                        <div class="product-actions position-absolute d-flex flex-column gap-2">
                            <button class="action-btn" aria-label="Wishlist"><i
                                    class="fa-regular fa-heart"></i></button>
                            <button class="action-btn" aria-label="Quick view"><i
                                    class="fa-regular fa-eye"></i></button>
                        </div>
                        <button 
                class="add-to-cart-btn w-100"
                data-id="${productList[i].id}"
                data-stock="${productList[i].stock}"
                data-name="${productList[i].name}"
                data-price="${productList[i].price}"
                data-image="${productList[i].images[0]}"
                data-category="${productList[i].category}"
                data-sellerId="${productList[i].sellerId}"
                >
                Add To Cart
              </button>
                    </div>
                    <div class="pt-2 ">
                        <p class="product-name mb-1">${productList[i].name}</p>
                        <div class="d-flex gap-2 align-items-center mb-1">
                            <span class="price-new">$${productList[i].price}</span>
                            <span class="price-old">$1160</span>
                        </div>
                        <div class="d-flex align-items-center gap-1">
                            <div class="stars" style="color:#FFAD33;">
                                <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i
                                    class="fas fa-star"></i><i class="fas fa-star-half-alt"></i>
                            </div>
                            <span class="review-count">(75)</span>
                        </div>
                    </div>
                
                </a>`;
    }
  } else {
    ProductCatologDiv.innerHTML = `<h4 class="text-center alert alert-danger ">No Products Found</h4>`;
  }
}

// displayProducts(allProducts);

// displayProducts(allProducts);

let filtersButtons = document.querySelectorAll(".filter-btn");

filtersButtons.forEach((btn) => {
  btn.addEventListener("click", function () {
    filtersButtons.forEach((b) => b.classList.remove("active"));
    this.classList.add("active");

    currentCategory = this.dataset.category.toLowerCase();

    applyFilters();
  });
});

let SearchInput = document.getElementById("SearchInput");

SearchInput.addEventListener("keyup", function () {
  currentSearch = this.value.toLowerCase();

  applyFilters();
});

let currentCategory = "all";
let currentSearch = "";

function applyFilters() {
  let filtered = allProducts;

  // category filter
  if (currentCategory !== "all") {
    filtered = filtered.filter(
      (p) => p.category.toLowerCase() === currentCategory,
    );
  }

  // search filter
  if (currentSearch !== "") {
    filtered = filtered.filter((p) =>
      p.name.toLowerCase().includes(currentSearch),
    );
  }

  displayProducts(filtered);
  console.log("hello");
}

applyFilters();
