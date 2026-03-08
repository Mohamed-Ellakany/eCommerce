document.addEventListener("DOMContentLoaded", async function () {
  const productsContainer = document.getElementById("flashProductsTrack");

  if (!productsContainer) return;

  let allProducts = [];

  // ===============================
  // Fetch Products From JSON Server
  // ===============================

  try {
    allProducts = await DB.getProducts();
    displayProducts(allProducts);
  } catch (err) {
    console.error("Failed to load products", err);
  }

  // ===============================
  // Display Products
  // ===============================

  function displayProducts(products) {
    productsContainer.innerHTML = "";

    if (!products.length) {
      productsContainer.innerHTML = `<h4 class="text-center alert alert-danger w-100">No Products Found</h4>`;
      return;
    }

    products.forEach((product) => {
      productsContainer.innerHTML += `
      
      <div class="flash-product-card">

          <div class="product-img-wrap position-relative">
              
              <span class="discount-badge">-30%</span>

              <img src="${product.images[0]}" 
                   alt="${product.name}" 
                   class="w-100">

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
                  <span class="price-old">$${product.price + 40}</span>
              </div>

              <div class="d-flex align-items-center gap-1">

                  <div class="stars" style="color:#FFAD33;">
                      <i class="fas fa-star"></i>
                      <i class="fas fa-star"></i>
                      <i class="fas fa-star"></i>
                      <i class="fas fa-star"></i>
                      <i class="fas fa-star-half-alt"></i>
                  </div>

                  <span class="review-count">(75)</span>

              </div>

          </div>

      </div>

      `;
    });
  }

  // ===============================
  // Search Products
  // ===============================

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

  // ===============================
  // Add To Cart
  // ===============================

  document.addEventListener("click", function (e) {
    if (e.target.classList.contains("add-to-cart-btn")) {
      const productId = e.target.dataset.id;

      let cart = JSON.parse(localStorage.getItem("cart")) || [];

      const product = allProducts.find((p) => p.id == productId);

      if (!product) return;

      const exists = cart.find((item) => item.id == product.id);

      if (exists) {
        exists.qty += 1;
      } else {
        cart.push({
          ...product,
          qty: 1,
        });
      }

      localStorage.setItem("cart", JSON.stringify(cart));

    }
  });
});
