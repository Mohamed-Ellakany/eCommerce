const BASE_URL = 'http://localhost:3000';

// ── AUTH CHECK ─────────────────────────────────────────────────
const session = DB.getSession();
if (!session || (session.role !== 'seller' && session.role !== 'admin')) {
    window.location.href = 'index.html';
}
const SELLER_ID = session.id;

// ── MODAL INSTANCES ────────────────────────────────────────────
const productModal = new bootstrap.Modal(document.getElementById('productModal'));
const editModal    = new bootstrap.Modal(document.getElementById('editmodal'));
const deleteModal  = new bootstrap.Modal(document.getElementById('deleteModal'));

let currentProductId = null;

// ── RENDER ─────────────────────────────────────────────────────
async function renderProducts() {
    const tbody = document.getElementById('products-tbody');
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">Loading...</td></tr>`;

    const res         = await fetch(`${BASE_URL}/products`);
    const allProducts = await res.json();
    const products    = allProducts.filter(p => p.sellerId === SELLER_ID);

    if (products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">No products yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = products.map(p => `
        <tr>
            <td class="py-3">
                <div class="product-img-wrap">
                    <img src="${p.images && p.images[0] ? p.images[0] : 'Imgs/prod1.png'}"
                         class="product-card"
                         data-id="${p.id}"
                         alt="${p.name}"
                         style="height:180px; object-fit:contain; cursor:pointer;">
                </div>
            </td>
            <td class="align-middle">${p.name}</td>
            <td class="align-middle">$${p.price}</td>
            <td class="align-middle">${p.stock}</td>
        </tr>
    `).join('');

    document.querySelectorAll('.product-card').forEach(img => {
        img.addEventListener('click', async function() {
            currentProductId = img.getAttribute('data-id');

            const res     = await fetch(`${BASE_URL}/products/${currentProductId}`);
            const product = await res.json();

            document.getElementById('modal-product-name').textContent      = product.name;
            document.getElementById('modal-product-price').textContent     = product.price;
            document.getElementById('modal-product-stock').textContent     = product.stock;
            document.getElementById('modal-product-description').textContent =
                Array.isArray(product.details) ? product.details.join(', ') : product.details || '';
            document.getElementById('modal-product-img').src =
                product.images && product.images[0] ? product.images[0] : 'Imgs/prod1.png';

            productModal.show();
        });
    });
document.getElementById('product-count').textContent = products.length;
}


function renderFilteredProducts(products) {
    const tbody = document.getElementById('products-tbody');

    if (products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">No products found.</td></tr>`;
        document.getElementById('product-count').textContent = 0;
        return;
    }

    tbody.innerHTML = products.map(p => `
        <tr>
            <td class="py-3">
                <div class="product-img-wrap">
                    <img src="${p.images && p.images[0] ? p.images[0] : 'Imgs/prod1.png'}"
                         class="product-card"
                         data-id="${p.id}"
                         alt="${p.name}"
                         style="height:180px; object-fit:contain; cursor:pointer;">
                </div>
            </td>
            <td class="align-middle">${p.name}</td>
            <td class="align-middle">$${p.price}</td>
            <td class="align-middle">${p.stock}</td>
        </tr>
    `).join('');

    document.getElementById('product-count').textContent = products.length;

    document.querySelectorAll('.product-card').forEach(img => {
        img.addEventListener('click', async function() {
            currentProductId = img.getAttribute('data-id');
            const res     = await fetch(`${BASE_URL}/products/${currentProductId}`);
            const product = await res.json();

            document.getElementById('modal-product-name').textContent        = product.name;
            document.getElementById('modal-product-price').textContent       = product.price;
            document.getElementById('modal-product-stock').textContent       = product.stock;
            document.getElementById('modal-product-description').textContent =
                Array.isArray(product.details) ? product.details.join(', ') : product.details || '';
            document.getElementById('modal-product-img').src =
                product.images && product.images[0] ? product.images[0] : 'Imgs/prod1.png';

            productModal.show();
        });
    });
}

// ── DOM READY ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {

    // ADD
    document.getElementById('btn-add-product').addEventListener('click', function() {
        currentProductId = null;
        document.getElementById('edit-modal-title').textContent  = 'Add New Product';
        document.getElementById('product-name').value            = '';
        document.getElementById('product-category').value        = '';
        document.getElementById('price').value                   = '';
        document.getElementById('stock').value                   = '';
        document.getElementById('description').value             = '';
        document.getElementById('image-url').value               = '';
        document.getElementById('form-error').classList.add('d-none');
        editModal.show();
    });

    // EDIT
    document.getElementById('btn-edit').addEventListener('click', async function() {
        productModal.hide();

        const res     = await fetch(`${BASE_URL}/products/${currentProductId}`);
        const product = await res.json();

        document.getElementById('edit-modal-title').textContent = 'Edit Product';
        document.getElementById('product-name').value           = product.name     || '';
        document.getElementById('product-category').value       = product.category || '';
        document.getElementById('price').value                  = product.price    || '';
        document.getElementById('stock').value                  = product.stock    || '';
        document.getElementById('description').value            =
            Array.isArray(product.details) ? product.details.join(', ') : product.details || '';
        document.getElementById('image-url').value              =
            product.images && product.images[0] ? product.images[0] : '';
        document.getElementById('form-error').classList.add('d-none');

        editModal.show();
    });

    // SAVE
    document.getElementById('btn-save').addEventListener('click', async function() {
        const name        = document.getElementById('product-name').value.trim();
        const category    = document.getElementById('product-category').value.trim();
        const price       = document.getElementById('price').value.trim();
        const stock       = document.getElementById('stock').value.trim();
        const description = document.getElementById('description').value.trim();
        const imageUrl    = document.getElementById('image-url').value.trim();
        const errorBox    = document.getElementById('form-error');

        if (!name || !category || !price || !stock) {
            errorBox.textContent = 'Name, category, price and stock are required.';
            errorBox.classList.remove('d-none');
            return;
        }
        if (isNaN(price) || Number(price) <= 0) {
            errorBox.textContent = 'Price must be a positive number.';
            errorBox.classList.remove('d-none');
            return;
        }
        if (isNaN(stock) || Number(stock) < 0) {
            errorBox.textContent = 'Stock must be 0 or more.';
            errorBox.classList.remove('d-none');
            return;
        }
        errorBox.classList.add('d-none');

        const productData = {
            name:     name,
            category: category,
            price:    Number(price),
            stock:    Number(stock),
            details:  description ? description.split(',').map(d => d.trim()) : [],
            images:   imageUrl ? [imageUrl] : ['Imgs/prod1.png'],
            sellerId: SELLER_ID
        };

        if (currentProductId === null) {
            // POST — new product
            await fetch(`${BASE_URL}/products`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(productData)
            });
        } else {
            // PATCH — update existing
            await fetch(`${BASE_URL}/products/${currentProductId}`, {
                method:  'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(productData)
            });
        }

        editModal.hide();
        renderProducts();
    });

    // DELETE — show confirm
    document.getElementById('btn-delete').addEventListener('click', async function() {
        productModal.hide();
        const res     = await fetch(`${BASE_URL}/products/${currentProductId}`);
        const product = await res.json();
        document.getElementById('delete-product-name').textContent = product.name;
        deleteModal.show();
    });

    // CONFIRM DELETE
    document.getElementById('btn-confirm-delete').addEventListener('click', async function() {
        await fetch(`${BASE_URL}/products/${currentProductId}`, {
            method: 'DELETE'
        });
        deleteModal.hide();
        renderProducts();
    });

    // SEARCH
document.getElementById('btn-search').addEventListener('click', async function() {
    const query = document.getElementById('search-input').value.trim().toLowerCase();
    const res = await fetch(`${BASE_URL}/products`);
    const allProducts = await res.json();
    const filtered = allProducts.filter(p => 
        p.sellerId === SELLER_ID && 
        p.name.toLowerCase().includes(query)
    );
    renderFilteredProducts(filtered);
});

// Also search on Enter key
document.getElementById('search-input').addEventListener('keyup', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('btn-search').click();
    }
});

// Clear search when input is empty
document.getElementById('search-input').addEventListener('input', async function() {
    if (this.value.trim() === '') {
        renderProducts();
    }
});

    renderProducts();
});