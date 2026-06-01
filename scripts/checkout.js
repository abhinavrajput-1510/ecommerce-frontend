document.addEventListener("DOMContentLoaded", () => {
  if (!localStorage.getItem("currentUser")) {
    window.location.href = "auth.html";
    return;
  }

  const hamburgerMenu = document.querySelector(".hamburger-menu");
  const mainNav = document.querySelector(".main-nav");
  if (hamburgerMenu && mainNav) {
    hamburgerMenu.addEventListener("click", () => {
      mainNav.classList.toggle("open");
      hamburgerMenu.setAttribute(
        "aria-expanded",
        String(mainNav.classList.contains("open")),
      );
    });
  }

  const cartBadge = document.querySelector(".cart-badge");
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (cartBadge) {
    cartBadge.textContent = totalItems;
    cartBadge.style.display = totalItems > 0 ? "flex" : "none";
  }
});
