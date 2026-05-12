const hamburgerMenu = document.querySelector(".hamburger-menu");
const mainNav = document.querySelector(".main-nav");

if (hamburgerMenu && mainNav) {
  hamburgerMenu.addEventListener("click", () => {
    mainNav.classList.toggle("open");
    const expanded = mainNav.classList.contains("open");
    hamburgerMenu.setAttribute("aria-expanded", expanded);
  });
}

console.log("E-Commerce Website Loaded");
