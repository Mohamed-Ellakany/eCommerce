// Scripts/seller-dashboard.js
const session = DB.getSession();

if (!session || (session.role !== 'seller' && session.role !== 'admin')) {
    window.location.href = 'index.html';
}

const SELLER_ID = session.id;

function getProducts() { 
    return JSON.parse(localStorage.getItem('products') || '[]'); 
}

function saveProducts(arr) { 
    localStorage.setItem('products', JSON.stringify(arr)); 
}

const productModal = new bootstrap.Modal(document.getElementById('productModal'));
const editModal = new bootstrap.Modal(document.getElementById('editmodal'));
const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));

let currentProductId = null;

function renderProducts() {
    const tbody = document.getElementById('products-tbody');
    const products = getProducts().filter(p => p.sellerId === SELLER_ID);

    if (products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-muted py-4">No products yet.</td></tr>`;
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

    // Add click events
    document.querySelectorAll('.product-card').forEach(img => {
        img.addEventListener('click', function() {
            currentProductId = parseInt(img.getAttribute('data-id'));
            const product = getProducts().find(p => p.id === currentProductId);

            document.getElementById('modal-product-name').textContent = product.name;
            document.getElementById('modal-product-price').textContent = product.price;
            document.getElementById('modal-product-stock').textContent = product.stock;
            
            // Handle Details as array
            const detailsText = Array.isArray(product.Details) ? product.Details.join(', ') : product.Details || '';
            document.getElementById('modal-product-description').textContent = detailsText;
            
            // Handle images as array
            const productImage = product.images && product.images[0] ? product.images[0] : 'Imgs/prod1.png';
            document.getElementById('modal-product-img').src = productImage;

            productModal.show();
        });
    });
}

// Make sure DOM is loaded before adding event listeners
document.addEventListener('DOMContentLoaded', function() {
    
    document.getElementById('btn-add-product').addEventListener('click', function() {
        currentProductId = null;
        document.getElementById('edit-modal-title').textContent = 'Add New Product';
        document.getElementById('product-name').value = '';
        document.getElementById('product-category').value = '';  // Added category field
        document.getElementById('price').value = '';
        document.getElementById('stock').value = '';
        document.getElementById('description').value = '';
        document.getElementById('image-url').value = '';
        document.getElementById('form-error').classList.add('d-none');
        editModal.show();
    });

    document.getElementById('btn-edit').addEventListener('click', function() {
        productModal.hide();
        const product = getProducts().find(p => p.id === currentProductId);
        if (!product) return;

        document.getElementById('edit-modal-title').textContent = 'Edit Product';
        document.getElementById('product-name').value = product.name || '';
        document.getElementById('product-category').value = product.category || '';  // Added category
        document.getElementById('price').value = product.price || '';
        document.getElementById('stock').value = product.stock || '';
        
        // Handle Details as array
        const detailsText = Array.isArray(product.Details) ? product.Details.join(', ') : product.Details || '';
        document.getElementById('description').value = detailsText;
        
        // Handle images as array
        const imageUrl = product.images && product.images[0] ? product.images[0] : '';
        document.getElementById('image-url').value = imageUrl;
        
        document.getElementById('form-error').classList.add('d-none');
        editModal.show();
    });

    document.getElementById('btn-save').addEventListener('click', function() {
        const name = document.getElementById('product-name').value.trim();
        const category = document.getElementById('product-category').value.trim();  // Get category
        const price = document.getElementById('price').value.trim();
        const stock = document.getElementById('stock').value.trim();
        const description = document.getElementById('description').value.trim();
        const imageUrl = document.getElementById('image-url').value.trim();
        const errorBox = document.getElementById('form-error');

        // Validation
        if (!name || !category || !price || !stock) {  // Added category validation
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
            errorBox.textContent = 'Stock must be a valid number.';
            errorBox.classList.remove('d-none');
            return;
        }

        errorBox.classList.add('d-none');

        const products = getProducts();
        
        // Split description by commas to create array (as per your schema)
        const detailsArray = description ? description.split(',').map(item => item.trim()) : [];
        
        // Create images array
        const imagesArray = imageUrl ? [imageUrl] : ['Imgs/prod1.png'];

        if (currentProductId === null) {
            // Add new product - following your db.json structure
            const newProduct = {
                id: Date.now(),
                name: name,
                category: category,
                price: Number(price),
                stock: Number(stock),
                images: imagesArray,
                Details: detailsArray,
                sellerId: SELLER_ID
            };
            products.push(newProduct);
        } else {
            // Edit existing product
            const index = products.findIndex(p => p.id === currentProductId);
            if (index !== -1) {
                products[index].name = name;
                products[index].category = category;
                products[index].price = Number(price);
                products[index].stock = Number(stock);
                products[index].Details = detailsArray;
                if (imageUrl) {
                    products[index].images = [imageUrl];
                }
            }
        }

        saveProducts(products);
        editModal.hide();
        renderProducts();
    });

    document.getElementById('btn-delete').addEventListener('click', function() {
        productModal.hide();
        const product = getProducts().find(p => p.id === currentProductId);
        if (!product) return;
        document.getElementById('delete-product-name').textContent = product.name;
        deleteModal.show();
    });

    document.getElementById('btn-confirm-delete').addEventListener('click', function() {
        const products = getProducts().filter(p => p.id !== currentProductId);
        saveProducts(products);
        deleteModal.hide();
        renderProducts();
    });

    // Initial render
    renderProducts();
});