const params = new URLSearchParams(window.location.search);

const productId = params.get("id");
let _currentProduct = null;

async function getProductDetails() {
  let response = await fetch(
    `https://json-server-for-ecomerce-app-cst.vercel.app/products/${productId}`,
  );

  let product = await response.json();

  _currentProduct = product;

  displayProductDetails(product);

  getRelatedProducts(product.category);
  await WL.initButtons(document.querySelector(".productDetails"));
}

getProductDetails();

async function getRelatedProducts(category) {
  let response = await fetch(
    `https://json-server-for-ecomerce-app-cst.vercel.app/products?category=${category}`,
  );

  let products = await response.json();

  displayRelatedProducts(products);
}

function displayProductDetails(_product) {
  document.getElementById("productName").textContent = _product.name;

  let productPictures = document.getElementsByClassName("productPictures")[0];
  for (let i = 0; i < _product.images.length; i++) {
    productPictures.innerHTML += `
    <div class="Pic bg-light rounded d-flex justify-content-center align-items-center" >
                <img src="${_product.images[i]}" class="img-fluid" alt="${_product.name} picture" />
              </div>`;
  }

  let CurrentDisplayedPictures = document.getElementsByClassName(
    "CurrentDisplayedPictures",
  )[0];
  CurrentDisplayedPictures.innerHTML = `<img src="${_product.images[0]}" class="img-fluid" alt="${_product.name}" />`;

  let pic = document.getElementsByClassName("Pic");
  for (let i = 0; i < pic.length; i++) {
    pic[i].addEventListener("click", function () {
      CurrentDisplayedPictures.innerHTML = pic[i].innerHTML;
    });
  }

  let header = document.getElementById("header");
  header.innerText = _product.name;

  let p_price = document.getElementById("p_price");
  p_price.innerText = _product.price;

  let p_details = document.getElementById("p_details");

  for (let i = 0; i < _product.details.length; i++) {
    p_details.innerText += _product.details[i];
  }

  const wishlistBtn = document.querySelector(
    ".productDetails .wishlist-toggle-btn",
  );
  if (wishlistBtn) {
    wishlistBtn.setAttribute("data-product-id", _product.id);
  }

  document.querySelectorAll(".color").forEach((color) => {
    color.addEventListener("click", function () {
      document
        .querySelectorAll(".color")
        .forEach((c) => c.classList.remove("active"));
      this.classList.add("active");
    });
  });

  let sz = document.getElementsByClassName("sz");

  let sizes = document.querySelectorAll(".sz");

  sizes.forEach((size) => {
    size.addEventListener("click", function () {
      sizes.forEach((s) => s.classList.remove("active"));

      this.classList.add("active");
    });
  });

  let sizeDiv = document.getElementById("SizeDiv");
  if (_product.category != "Electronics") {
    sizeDiv.innerHTML = ` <span class="me-3 fw-bold">Size:</span>

                <button class="sz size-btn btn btn-outline-danger btn-sm me-2">
                  XS
                </button>
                <button class="sz size-btn btn btn-outline-danger btn-sm me-2">
                  S
                </button>
                <button class="sz size-btn btn btn-outline-danger btn-sm me-2">
                  M
                </button>
                <button class="sz size-btn btn btn-outline-danger btn-sm me-2">
                  L
                </button>
                <button class="sz size-btn btn btn-outline-danger btn-sm">
                  XL
                </button>`;
  }

  let plus = document.querySelector(".plus");
  let number = document.querySelector(".border-start");

  let count = 1;

  plus.addEventListener("click", () => {
    if (_product.stock == 0) {
      number.textContent = 0;
      plus.setAttribute("disabled", "true");
    } else if (count >= _product.stock) {
      plus.setAttribute("disabled", "true");
    } else {
      count++;
      number.textContent = count;
    }
  });
  let minus = document.querySelector(".minus");

  minus.addEventListener("click", () => {
    if (count > 1) {
      count--;
      number.textContent = count;
      if (count < _product.stock) {
        plus.removeAttribute("disabled");
      }
    }
  });

  const buyNowBtn = document.querySelector(
    ".btn.btn-danger.px-4, .btn.btn-danger.px-lg-5",
  );
  document.querySelectorAll(".productDetails .btn-danger").forEach((btn) => {
    if (btn.textContent.trim() === "Buy Now") {
      btn.addEventListener("click", () => {
        if (!_currentProduct) return;
        Cart.add(_currentProduct, count);
        window.location.href = "../../pages/products/cart.html";
      });
    }
  });
}

const swiper = new Swiper(".relatedSwiper", {
  slidesPerView: 4,
  slidesPerGroup: 1,
  spaceBetween: 25,

  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },

  breakpoints: {
    0: {
      slidesPerView: 1,
    },

    576: {
      slidesPerView: 2,
    },

    768: {
      slidesPerView: 3,
    },

    992: {
      slidesPerView: 4,
    },
  },
});

let relatedProductsDiv = document.getElementById("relatedProducts");

function displayRelatedProducts(products) {
  relatedProductsDiv.innerHTML = "";

  products
    .filter((p) => p.id != productId)
    .slice(0, 4)
    .forEach((product) => {
      if (product.stock == 0) return;
      relatedProductsDiv.innerHTML += `
<div class="flash-product-card flex-shrink-1 pb-4 flex-wrap col-sm-6 col-md-4 col-lg-3">

  <div class="product-img-wrap position-relative">
    <span class="discount-badge">-40%</span>

    <a href="../../pages/products/productDetails.html?id=${product.id}"> 
      <img src="${product.images[0]}" alt="${product.name}" class="w-100"/>
    </a>

    <div class="product-actions position-absolute d-flex flex-column gap-2">
      <button class="wishlist-toggle-btn action-btn border-none d-flex justify-content-center align-items-center"
              aria-label="Add to wishlist" title="Add to wishlist"
              data-product-id="${product.id}">
        <i class="fa-regular fa-heart"></i>
      </button>
    </div>

    <button class="add-to-cart-btn w-100" data-id="${product.id}">
      Add To Cart
    </button>

  </div>

  <div class="pt-2">
    <p class="product-name mb-1">${product.name}</p>

    <div class="d-flex gap-2 align-items-center mb-1">
      <span class="price-new">$${product.price}</span>
      <span class="price-old">$160</span>
    </div>

    <div class="d-flex align-items-center gap-1">
      <div class="stars" style="color:#ffad33">
        <i class="fas fa-star"></i>
        <i class="fas fa-star"></i>
        <i class="fas fa-star"></i>
        <i class="fas fa-star"></i>
        <i class="fas fa-star"></i>
      </div>
      <span class="review-count">(88)</span>
    </div>
  </div>

</div>`;

      WL.initButtons(relatedProductsDiv);
    });
}
