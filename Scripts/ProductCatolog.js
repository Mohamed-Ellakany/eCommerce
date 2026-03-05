document.addEventListener("DOMContentLoaded", async () => {
  const productsContainer = document.getElementById("ProductCatolog");
  console.log("Products container:", productsContainer);
  if (!productsContainer) return;

  let allProducts = [];

  // =========================
  // GET PRODUCTS FROM API
  // =========================

  try {
    const res = await fetch("http://localhost:3000/products");
    allProducts = await res.json();

    displayProducts(allProducts);
  } catch (error) {
    console.error("Error loading products:", error);
  }

  // =========================
  // DISPLAY PRODUCTS
  // =========================

  function displayProducts(products) {
    productsContainer.innerHTML = "";

    if (!products.length) {
      productsContainer.innerHTML = `<h4 class="text-center alert alert-danger w-100">No Products Found</h4>`;
      return;
    }

    products.forEach((product) => {
      productsContainer.innerHTML += `
      
      <div 
  class="flash-product-card"
  data-product-id="${product.id}"
  data-stock="${product.stock}"
  data-category="${product.category}"
  data-seller-id="${product.sellerId}"
>

          <div class="product-img-wrap position-relative">

              <span class="discount-badge">-30%</span>

              <img 
                src="${product.images[0]}" 
                alt="${product.name}" 
                class="w-100"
                onerror="this.src='Imgs/prod1.png'"
              >

              <div class="product-actions position-absolute d-flex flex-column gap-2">

                  <button class="action-btn">
                      <i class="fa-regular fa-heart"></i>
                  </button>

                  <button class="action-btn">
                      <i class="fa-regular fa-eye"></i>
                  </button>

              </div>

              <button 
                class="add-to-cart-btn w-100"
                data-id="${product.id}">
                Add To Cart
              </button>

          </div>

          <div class="pt-2">

              <p class="product-name mb-1">${product.name}</p>

              <div class="d-flex gap-2 align-items-center mb-1">

                  <span class="price-new">$${product.price}</span>
                  <span class="price-old">$${(product.price + 100).toFixed(2)}</span>

              </div>

              <div class="d-flex align-items-center gap-1">

                  <div class="stars" style="color:#FFAD33;">
                      <i class="fas fa-star"></i>
                      <i class="fas fa-star"></i>
                      <i class="fas fa-star"></i>
                      <i class="fas fa-star"></i>
                      <i class="fas fa-star-half-alt"></i>
                  </div>

                  <span class="review-count">(${product.stock})</span>

              </div>

          </div>

      </div>

      `;
    });
  }

  // =========================
  // SEARCH
  // =========================

  const searchInput = document.querySelector("input[type='search']");
  if (searchInput) {
    searchInput.addEventListener("keyup", function () {
      const value = this.value.toLowerCase();

      const filtered = allProducts.filter((product) =>
        product.name.toLowerCase().includes(value),
      );

      displayProducts(filtered);
    });
  }
});
