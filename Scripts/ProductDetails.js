// $(".Pic").click(function(){
//     console.log($(this).text());
// })

let pic=document.getElementsByClassName("Pic");
let currentDisplayedPic=document.getElementsByClassName("CurrentDisplayedPictures")[0];
for (let i = 0; i < pic.length; i++) {
    pic[i].addEventListener("click",function(){
       
        currentDisplayedPic.innerHTML=pic[i].innerHTML;
    })
    
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