
let allProducts=[];
async function getProducts(){

    let response = await fetch(
      "https://json-server-for-ecomerce-app-cst.vercel.app/products",
    );

    let data = await response.json();


    allProducts = data;
    

    displayProducts(allProducts);
}

getProducts();

for (let i = 0; i < allProducts.length; i++) {
    console.log(allProducts[i].images);
    
}

var ProductCatologDiv=document.getElementById("ProductCatolog");


function displayProducts(productList){
 ProductCatologDiv.innerHTML = "";
if(productList.length>0){
    for (let i = 0; i < productList.length; i++) {
    const inStock = (productList[i].stock || 0) > 0;

        ProductCatologDiv.innerHTML += `  
        <div 
        class="flash-product-card flex-shrink-0 pb-4  flex-wrap  col-sm-6 col-md-4 col-lg-3">

                    <div class="product-img-wrap position-relative ">
                        <span class="discount-badge">-35%</span>
                        <a href="../../pages/products/productDetails.html?id=${productList[i].id}">
                        <img src="${productList[i].images[0]}" alt="${productList[i].name}" class="w-100">
                        </a>
                         <div class="product-actions position-absolute d-flex flex-column gap-2">

                   <div class="product-actions position-absolute d-flex flex-column gap-2">
          <button class="wishlist-toggle-btn action-btn border-none d-flex justify-content-center align-items-center"
                  aria-label="Add to wishlist" title="Add to wishlist"
                  data-product-id="${productList[i].id}">
            <i class="fa-regular fa-heart"></i>
          </button>

              </div>

             <button class="add-to-cart-btn w-100" data-id="${productList[i].id}" ${!inStock ? "disabled" : ""}
               style="${!inStock ? "opacity:.5;cursor:not-allowed;" : ""}">
               ${inStock ? "Add To Cart" : "Out of Stock"}
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
  WL.initButtons();
        
        
    }
}else{
      ProductCatologDiv.innerHTML = 
        `<h4 class="text-center alert alert-danger ">No Products Found</h4>`;
}
}

displayProducts(allProducts);

// displayProducts(allProducts);

var SearchInput=document.getElementById("SearchInput");
SearchInput.addEventListener("keyup",searchByName);


function searchByName(){ 
   
    var SearchValue=SearchInput.value.toLowerCase();
    let filteredProducts=allProducts.filter(product=>product.name.toLowerCase().includes(SearchValue));
    displayProducts(filteredProducts);
}
