// $(".Pic").click(function(){
//     console.log($(this).text());
// })


const params = new URLSearchParams(window.location.search);

const productId = params.get("id");


async function getProductDetails(){

    let response = await fetch(`https://e-commerce-server-xi.vercel.app/products/${productId}`);

    let product = await response.json();

    displayProductDetails(product);

    getRelatedProducts(product.category);

}

getProductDetails();


async function getRelatedProducts(category){

    let response = await fetch(
        `https://e-commerce-server-xi.vercel.app/products?category=${category}`
    );

    let products = await response.json();

    displayRelatedProducts(products);

}






function displayProductDetails(_product){

  let productPictures=document.getElementsByClassName("productPictures")[0];
  for (let i = 0; i < _product.images.length; i++) {

    productPictures.innerHTML+=`
    <div class="Pic bg-light rounded d-flex justify-content-center align-items-center" >
                <img src="${_product.images[i]}" class="img-fluid" alt="${_product.name} picture" />
              </div>`;


    
}
                  


  let CurrentDisplayedPictures=document.getElementsByClassName("CurrentDisplayedPictures")[0];
  CurrentDisplayedPictures.innerHTML=`<img src="${_product.images[0]}" class="img-fluid" alt="${_product.name}" />`;

let pic=document.getElementsByClassName("Pic");
for (let i = 0; i < pic.length; i++) {
    pic[i].addEventListener("click",function(){
       
        CurrentDisplayedPictures.innerHTML=pic[i].innerHTML;
    })

  }

 let header=document.getElementById("header");
 header.innerText=_product.name;

 let p_price=document.getElementById("p_price");
 p_price.innerText=_product.price;


 
 let p_details=document.getElementById("p_details");
 
 for (let i = 0; i < _product.details.length; i++) {
  p_details.innerText+=_product.details[i];
  
 }









let colors = document.querySelectorAll(".color");

colors.forEach(color => {

color.addEventListener("click", function(){

colors.forEach(c => c.classList.remove("active"));

this.classList.add("active");

})

});



let sz=document.getElementsByClassName("sz");
    // for (let i = 0; i < sz.length; i++) {        
    //     sz[i].addEventListener("click",function(){

    //     })
    // }


let sizes = document.querySelectorAll(".sz");

sizes.forEach(size => {
  size.addEventListener("click", function(){

    sizes.forEach(s => s.classList.remove("active"));

    this.classList.add("active");

  });
});

let plus = document.querySelector(".plus");
let minus = document.querySelector(".minus");
let number = document.querySelector(".border-start");

let count = 1;

plus.addEventListener("click", () => {
  count++;
  number.textContent = count;
});

minus.addEventListener("click", () => {
  if (count > 1) {
    count--;
    number.textContent = count;
  }
});

let wishList=document.getElementById("wishList");
wishList.addEventListener("click",()=>{
wishList.classList.toggle("btn-danger");
});

const swiper = new Swiper(".relatedSwiper", {

  slidesPerView: 4,
  slidesPerGroup: 1,
  spaceBetween: 25,

  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },

  breakpoints: {

    0:{
      slidesPerView:1
    },

    576:{
      slidesPerView:2
    },

    768:{
      slidesPerView:3
    },

    992:{
      slidesPerView:4
    }

  }

});

}


let relatedProductsDiv = document.getElementById("relatedProducts");

function displayRelatedProducts(products){

relatedProductsDiv.innerHTML="";

products
.filter(p => p.id != productId)
.slice(0,4)
.forEach(product => {

relatedProductsDiv.innerHTML += `
<div
 class="flash-product-card flex-shrink-1 pb-4  flex-wrap  col-sm-6 col-md-4 col-lg-3 ">

  <div class="product-img-wrap position-relative">

    <span class="discount-badge">-40%</span>
<a href="productDetails.html?id=${product.id}"> 
    <img src="${product.images[0]}" 
         alt="${product.name}" 
         class="w-100"/>
</a>
    <div class="product-actions position-absolute d-flex flex-column gap-2">

      <button class="action-btn d-flex justify-content-center align-items-center border-0">
        <i class="fa-regular fa-heart"></i>
      </button>

      <button class="action-btn d-flex justify-content-center align-items-center border-0">
        <i class="fa-regular fa-eye"></i>
      </button>

    </div>

    <button class="add-to-cart-btn w-100">
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

</div>

`;

});





}