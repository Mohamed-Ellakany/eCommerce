const BASE_URL = "https://json-server-for-ecomerce-app-cst.vercel.app";

const session = DB.getSession();
if (!session || (session.role !== "seller" && session.role !== "admin")) {
  window.location.href = "../../index.html";
}
const SELLER_ID = session.id;

let productModal;
let editModal;
let deleteModal;

let currentProductId = null;

async function fetchWithDebug(url, options) {
  const response = await fetch(url, options);

  let responseData;
  try {
    responseData = await response.json();
  } catch (e) {}

  return { response, data: responseData };
}

async function renderProducts() {
  const tbody = document.getElementById("products-tbody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">Loading...</td></tr>`;

  try {
    const res = await fetch(`${BASE_URL}/products`);
    if (!res.ok) throw new Error("Failed to fetch products");

    const allProducts = await res.json();
    const products = allProducts.filter((p) => p.sellerId === SELLER_ID);

    if (products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No products yet.</td></tr>`;
      document.getElementById("product-count").textContent = 0;
      return;
    }

    tbody.innerHTML = products
      .map(
        (p) => `
      <tr>
        <td class="py-3">
          <div class="product-img-wrap">
            <img src="${p.images && p.images[0] ? p.images[0] : "Imgs/prod1.png"}"
                 class="product-card"
                 data-id="${p.id}"
                 alt="${p.name}"
                 style="height:80px; width:80px; object-fit:cover; cursor:pointer;">
          </div>
        </td>
        <td class="align-middle">${p.name}</td>
        <td class="align-middle">$${p.price}</td>
        <td class="align-middle">${p.stock}</td>
        <td class="align-middle">
          <button class="btn btn-sm btn-outline-primary me-2 view-product" data-id="${p.id}">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger delete-product" data-id="${p.id}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `,
      )
      .join("");

    document.getElementById("product-count").textContent = products.length;

    document.querySelectorAll(".view-product").forEach((btn) => {
      btn.addEventListener("click", async function (e) {
        e.stopPropagation();
        currentProductId = this.getAttribute("data-id");
        await viewProduct(currentProductId);
      });
    });

    document.querySelectorAll(".delete-product").forEach((btn) => {
      btn.addEventListener("click", async function (e) {
        e.stopPropagation();
        currentProductId = this.getAttribute("data-id");
        await confirmDelete(currentProductId);
      });
    });
  } catch (error) {
    console.error("Error loading products:", error);
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4">Error loading products. Please try again.</td></tr>`;
  }
}

function renderFilteredProducts(products) {
  const tbody = document.getElementById("products-tbody");

  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No products found.</td></tr>`;
    document.getElementById("product-count").textContent = 0;
    return;
  }

  tbody.innerHTML = products
    .map(
      (p) => `
    <tr>
      <td class="py-3">
        <div class="product-img-wrap">
          <img src="${p.images && p.images[0] ? p.images[0] : "Imgs/prod1.png"}"
               class="product-card"
               data-id="${p.id}"
               alt="${p.name}"
               style="height:80px; width:80px; object-fit:cover; cursor:pointer;">
        </div>
      </td>
      <td class="align-middle">${p.name}</td>
      <td class="align-middle">$${p.price}</td>
      <td class="align-middle">${p.stock}</td>
      <td class="align-middle">
        <button class="btn btn-sm btn-outline-primary me-2 view-product" data-id="${p.id}">
          <i class="fas fa-eye"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger delete-product" data-id="${p.id}">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `,
    )
    .join("");

  document.getElementById("product-count").textContent = products.length;

  document.querySelectorAll(".view-product").forEach((btn) => {
    btn.addEventListener("click", async function (e) {
      e.stopPropagation();
      currentProductId = this.getAttribute("data-id");
      await viewProduct(currentProductId);
    });
  });

  document.querySelectorAll(".delete-product").forEach((btn) => {
    btn.addEventListener("click", async function (e) {
      e.stopPropagation();
      currentProductId = this.getAttribute("data-id");
      await confirmDelete(currentProductId);
    });
  });
}

async function viewProduct(productId) {
  try {
    const res = await fetch(`${BASE_URL}/products/${productId}`);
    if (!res.ok) throw new Error("Product not found");

    const product = await res.json();

    document.getElementById("modal-product-name").textContent = product.name;
    document.getElementById("modal-product-price").textContent =
      `$${product.price}`;
    document.getElementById("modal-product-stock").textContent = product.stock;
    document.getElementById("modal-product-description").textContent =
      Array.isArray(product.details)
        ? product.details.join(", ")
        : product.details || "No description available";
    document.getElementById("modal-product-img").src =
      product.images && product.images[0]
        ? product.images[0]
        : "Imgs/prod1.png";

    productModal.show();
  } catch (error) {
    console.error("Error viewing product:", error);
    alert("Error loading product details");
  }
}

async function confirmDelete(productId) {
  try {
    const res = await fetch(`${BASE_URL}/products/${productId}`);
    if (!res.ok) throw new Error("Product not found");

    const product = await res.json();
    document.getElementById("delete-product-name").textContent = product.name;
    deleteModal.show();
  } catch (error) {
    console.error("Error loading product for delete:", error);
    alert("Error loading product details");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const productModalElement = document.getElementById("productModal");
  const editModalElement = document.getElementById("editmodal");
  const deleteModalElement = document.getElementById("deleteModal");

  if (productModalElement)
    productModal = new bootstrap.Modal(productModalElement);
  if (editModalElement) editModal = new bootstrap.Modal(editModalElement);
  if (deleteModalElement) deleteModal = new bootstrap.Modal(deleteModalElement);

  const userNameEl = document.getElementById("user-name");
  if (userNameEl) {
    userNameEl.textContent = session.name;
    userNameEl.href = "../../pages/landpage/Profile.html";
  }

  const homeBtn = document.getElementById("home-btn");
  if (homeBtn) {
    homeBtn.addEventListener("click", function () {
      window.location.href = "../../index.html";
    });
  }

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function (e) {
      e.preventDefault();
      DB.clearSession();
      window.location.href = "../../index.html";
    });
  }

  const addBtn = document.getElementById("btn-add-product");
  if (addBtn) {
    addBtn.addEventListener("click", function () {
      currentProductId = null;
      document.getElementById("edit-modal-title").textContent =
        "Add New Product";
      document.getElementById("product-name").value = "";
      document.getElementById("product-category").value = "";
      document.getElementById("price").value = "";
      document.getElementById("stock").value = "";
      document.getElementById("description").value = "";
      document.getElementById("image-url").value = "";
      document.getElementById("form-error").classList.add("d-none");
      editModal.show();
    });
  }

  const editBtn = document.getElementById("btn-edit");
  if (editBtn) {
    editBtn.addEventListener("click", async function () {
      productModal.hide();
      if (!currentProductId) return;

      try {
        const res = await fetch(`${BASE_URL}/products/${currentProductId}`);
        if (!res.ok) throw new Error("Product not found");

        const product = await res.json();

        document.getElementById("edit-modal-title").textContent =
          "Edit Product";
        document.getElementById("product-name").value = product.name || "";
        document.getElementById("product-category").value =
          product.category || "";
        document.getElementById("price").value = product.price || "";
        document.getElementById("stock").value = product.stock || "";
        document.getElementById("description").value = Array.isArray(
          product.details,
        )
          ? product.details.join(", ")
          : product.details || "";
        document.getElementById("image-url").value =
          product.images && product.images[0] ? product.images[0] : "";
        document.getElementById("form-error").classList.add("d-none");

        editModal.show();
      } catch (error) {
        console.error("Error loading product for edit:", error);
        alert("Error loading product details");
      }
    });
  }

  const saveBtn = document.getElementById("btn-save");
  if (saveBtn) {
    saveBtn.addEventListener("click", async function () {
      const name = document.getElementById("product-name").value.trim();
      const category = document.getElementById("product-category").value.trim();
      const price = document.getElementById("price").value.trim();
      const stock = document.getElementById("stock").value.trim();
      const description = document.getElementById("description").value.trim();
      const imageUrl = document.getElementById("image-url").value.trim();
      const errorBox = document.getElementById("form-error");

      if (!name || !category || !price || !stock) {
        errorBox.textContent = "Name, category, price and stock are required.";
        errorBox.classList.remove("d-none");
        return;
      }

      const priceNum = Number(price);
      if (isNaN(priceNum) || priceNum <= 0) {
        errorBox.textContent = "Price must be a positive number.";
        errorBox.classList.remove("d-none");
        return;
      }

      const stockNum = Number(stock);
      if (isNaN(stockNum) || stockNum < 0) {
        errorBox.textContent = "Stock must be 0 or more.";
        errorBox.classList.remove("d-none");
        return;
      }

      errorBox.classList.add("d-none");

      const productData = {
        name: name,
        category: category,
        price: priceNum,
        stock: stockNum,
        details: description ? description.split(",").map((d) => d.trim()) : [],
        images: imageUrl ? [imageUrl] : ["Imgs/prod1.png"],
        sellerId: SELLER_ID,
      };

      if (currentProductId !== null) {
        productData.id = currentProductId;
      }

      try {
        const url =
          currentProductId === null
            ? `${BASE_URL}/products`
            : `${BASE_URL}/products/${currentProductId}`;

        const method = currentProductId === null ? "POST" : "PATCH";

        const { response, data } = await fetchWithDebug(url, {
          method: method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData),
        });

        if (response.ok) {
          editModal.hide();
          await renderProducts();
        } else {
          const errorMessage =
            data?.message ||
            data?.error ||
            `Failed with status ${response.status}`;
          errorBox.textContent = `Error: ${errorMessage}`;
          errorBox.classList.remove("d-none");
        }
      } catch (error) {
        console.error("Error saving product:", error);
        errorBox.textContent =
          error.message || "Error saving product. Please try again.";
        errorBox.classList.remove("d-none");
      }
    });
  }

  const deleteBtn = document.getElementById("btn-delete");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", async function () {
      productModal.hide();
      if (!currentProductId) return;
      await confirmDelete(currentProductId);
    });
  }

  const confirmDeleteBtn = document.getElementById("btn-confirm-delete");
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", async function () {
      if (!currentProductId) return;

      try {
        const { response, data } = await fetchWithDebug(
          `${BASE_URL}/products/${currentProductId}`,
          { method: "DELETE" },
        );

        if (!response.ok) {
          throw new Error(data?.message || "Failed to delete product");
        }

        deleteModal.hide();
        await renderProducts();
      } catch (error) {
        console.error("Error deleting product:", error);
        alert(error.message || "Error deleting product. Please try again.");
      }
    });
  }

  const searchBtn = document.getElementById("btn-search");
  if (searchBtn) {
    searchBtn.addEventListener("click", async function () {
      const query = document
        .getElementById("search-input")
        .value.trim()
        .toLowerCase();
      const res = await fetch(`${BASE_URL}/products`);
      const allProducts = await res.json();
      const filtered = allProducts.filter(
        (p) => p.sellerId === SELLER_ID && p.name.toLowerCase().includes(query),
      );
      renderFilteredProducts(filtered);
    });
  }

  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("keyup", function (e) {
      if (e.key === "Enter") document.getElementById("btn-search").click();
    });

    searchInput.addEventListener("input", async function () {
      if (this.value.trim() === "") renderProducts();
    });
  }

  renderProducts();
});
